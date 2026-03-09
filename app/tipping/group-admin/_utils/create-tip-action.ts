'use server'

import { verifyIsAdmin, verifySession } from '@/lib/dal'
import {
  getCurrentGroup,
  getGroupMembership,
  getGroupMembershipByMemberId,
} from '@/lib/utils/groups'
import { ServerResponse } from '@/types'
import { db } from '@/db'
import { Database } from '@/db/types'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import { AdminTipSchema, formSchema } from './schema'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { eq } from 'drizzle-orm'
import { RacePredictionField } from '@/constants'
import { getTipTypeFromPosition } from '@/lib/utils/prediction-fields'
import * as Sentry from '@sentry/nextjs'

export async function createTip(data: AdminTipSchema): Promise<ServerResponse> {
  const result = await verifyRequest(data)
  if (!result.ok) {
    return result
  }
  const { group, parsed } = result
  const groupMembership = await getGroupMembershipByMemberId({
    groupId: group.id,
    memberId: data.memberId,
  })
  if (!groupMembership) {
    return {
      ok: false,
      message: 'User is not a member of the group',
    }
  }
  const prediction = await getPrediction({
    groupId: group.id,
    raceId: data.raceId,
    memberId: groupMembership.id,
  })
  if (await doesTipAlreadyExist({ position: data.position, prediction })) {
    return {
      ok: false,
      message:
        'A tip for this race and position already exists for the selected user. Please edit the existing tip instead.',
    }
  }
  try {
    await createPredictionEntryAndPredictionIfRequired({
      predictionIdInput: prediction?.id,
      data: parsed.data,
      groupId: group.id,
      memberId: groupMembership.id,
    })
    revalidateTag(CacheTag.Predictions)
    return {
      ok: true,
      message: 'Saved prediction',
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'admin-create-tip',
        context: 'server-action',
      },
      extra: {
        memberId: data.memberId,
        groupId: group.id,
        raceId: data.raceId,
      },
    })
    return {
      ok: false,
      message: (error as Error)?.message || 'Something went wrong ',
    }
  }

  async function createPredictionEntryAndPredictionIfRequired({
    predictionIdInput,
    data,
    groupId,
    memberId,
  }: {
    predictionIdInput: Database.PredictionId | undefined
    data: AdminTipSchema
    groupId: Database.GroupId
    memberId: Database.GroupMember['id']
  }) {
    const { raceId, position } = data

    const predictionId = predictionIdInput ?? (await createPrediction()).id
    await createPredictionEntry(predictionId)

    async function createPredictionEntry(predictionId: Database.PredictionId) {
      const valueObject = getValueObject(data)

      await db.insert(predictionEntriesTable).values({
        predictionId,
        position,
        overwriteTo: getOverwrite(data.overwriteTo),
        ...valueObject,
      })
    }

    async function createPrediction() {
      const [inserted] = await db
        .insert(predictionsTable)
        .values({
          memberId,
          groupId,
          isForChampionship: false,
          raceId,
        })
        .returning()
      return inserted
    }
  }

  async function doesTipAlreadyExist({
    position,
    prediction,
  }: {
    prediction: Database.Prediction | undefined
    position: RacePredictionField
  }) {
    // const prediction = await getPrediction(group.id)
    return prediction && (await hasPredictionEntry(prediction.id))

    async function hasPredictionEntry(predictionId: Database.Prediction['id']) {
      return !!(await db.query.predictionEntriesTable.findFirst({
        where(table, { and, eq }) {
          return and(
            eq(table.predictionId, predictionId),
            eq(table.position, position),
          )
        },
      }))
    }
  }
}

async function verifyRequest(data: AdminTipSchema) {
  const { userId: adminUserId } = await verifySession()
  const group = await getCurrentGroup(adminUserId)
  if (!group) {
    return {
      ok: false,
      message: 'No group selected',
    } as const
  }
  const isAdmin = await verifyIsAdmin(group?.id)
  if (!isAdmin) {
    return {
      ok: false,
      message: 'Only admins can create a new tip',
    } as const
  }

  const parsed = formSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.message,
    } as const
  }

  const { memberId: memberId } = parsed.data

  const isTargetUserMember = await getUserIsMemberOfGroup(group.id)
  if (!isTargetUserMember) {
    return {
      ok: false,
      message: 'Target user is not a member of the group',
    } as const
  }

  return {
    ok: true,
    group,
    message: '',
    parsed,
    memberId,
  }

  async function getUserIsMemberOfGroup(groupId: Database.Group['id']) {
    console.log({ groupId, memberId: memberId })
    return !!(await db.query.groupMembersTable.findFirst({
      columns: {
        id: true,
      },
      where(groupMember, { and, eq }) {
        return and(
          eq(groupMember.id, memberId),
          eq(groupMember.groupId, groupId),
        )
      },
    }))
  }
}

export async function updateTip(
  predictionEntryId: Database.PredictionEntryId,
  data: AdminTipSchema,
): Promise<ServerResponse> {
  const result = await verifyRequest(data)
  if (!result.ok) {
    return result
  }
  try {
    await updatePrediction()
    revalidateTag(CacheTag.Predictions)
    return {
      ok: true,
      message: 'Updated prediction',
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'admin-update-tip',
        context: 'server-action',
      },
      extra: {
        predictionEntryId,
      },
    })
    return {
      ok: false,
      message: (error as Error)?.message || 'Something went wrong ',
    }
  }

  async function updatePrediction() {
    await db
      .update(predictionEntriesTable)
      .set({
        ...getValueObject(data),
        overwriteTo: getOverwrite(data.overwriteTo),
      })
      .where(eq(predictionEntriesTable.id, predictionEntryId))
  }
}

function getValueObject(data: AdminTipSchema) {
  const isForDriver = getTipTypeFromPosition(data.position) === 'driver'
  return isForDriver
    ? {
        driverId: data.valueId,
      }
    : { constructorId: data.valueId }
}

async function getPrediction({
  groupId,
  memberId,
  raceId,
}: {
  raceId: Database.RaceId
  memberId: Database.GroupMember['id']
  groupId: Database.GroupId
}) {
  return await db.query.predictionsTable.findFirst({
    where(table, { and, eq }) {
      return and(
        eq(table.groupId, groupId),
        eq(table.raceId, raceId),
        eq(table.memberId, memberId),
      )
    },
  })
}

function getOverwrite(overwrite: AdminTipSchema['overwriteTo']) {
  if (!overwrite) {
    return null
  }
  if (overwrite === 'normal') {
    return null
  }
  return overwrite
}

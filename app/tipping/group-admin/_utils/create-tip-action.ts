'use server'

import { verifyIsAdmin, verifySession } from '@/lib/dal'
import { getCurrentGroup } from '@/lib/utils/groups'
import { ServerResponse } from '@/types'
import { db } from '@/db'
import { Database } from '@/db/types'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import { Schema, formSchema } from './schema'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { eq } from 'drizzle-orm'
import { RacePredictionField } from '@/constants'

export async function createTip(data: Schema): Promise<ServerResponse> {
  const result = await verifyRequest(data)
  if (!result.ok) {
    return result
  }
  const { group, parsed } = result
  const prediction = await getPrediction({
    groupId: group.id,
    raceId: data.raceId,
    userId: data.userId,
  })
  if (await doesTipAlreadyExist({ position: data.position, prediction })) {
    return {
      ok: false,
      message:
        'A tip for this race and position already exists for the selected user. Please edit the existing tip instead.',
    }
  }
  try {
    await createPredictionEntryAndPredictionIfRequired(
      prediction?.id,
      parsed.data,
      group.id,
    )
    revalidateTag(CacheTag.Predictions)
    return {
      ok: true,
      message: 'Saved prediction',
    }
  } catch (error) {
    return {
      ok: false,
      message: (error as Error)?.message || 'Something went wrong ',
    }
  }

  async function createPredictionEntryAndPredictionIfRequired(
    predictionIdInput: Database.PredictionId | undefined,
    data: Schema,
    groupId: Database.GroupId,
  ) {
    const { userId, raceId, position, valueId } = data

    const predictionId = predictionIdInput ?? (await createPrediction()).id
    await createPredictionEntry(predictionId)

    async function createPredictionEntry(predictionId: Database.PredictionId) {
      const valueObject = getValueObject(data)

      await db.insert(predictionEntriesTable).values({
        predictionId,
        position,
        ...valueObject,
      })
    }

    async function createPrediction() {
      const [inserted] = await db
        .insert(predictionsTable)
        .values({
          userId,
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

async function verifyRequest(data: Schema) {
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

  const { userId } = parsed.data

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
    userId,
  }

  async function getUserIsMemberOfGroup(groupId: Database.Group['id']) {
    return !!(await db.query.groupMembersTable.findFirst({
      columns: {
        id: true,
      },
      where(table, { and, eq }) {
        return and(eq(table.userId, userId), eq(table.groupId, groupId))
      },
    }))
  }
}

export async function updateTip(
  predictionEntryId: Database.PredictionEntryId,
  data: Schema,
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
      })
      .where(eq(predictionEntriesTable.id, predictionEntryId))
  }
}

function getValueObject(data: Schema) {
  const isForDriver = data.position !== 'constructorWithMostPoints'
  return isForDriver
    ? {
        driverId: data.valueId,
      }
    : { constructorId: data.valueId }
}

async function getPrediction({
  groupId,
  userId,
  raceId,
}: {
  raceId: Database.RaceId
  userId: Database.UserId
  groupId: Database.GroupId
}) {
  return await db.query.predictionsTable.findFirst({
    where(table, { and, eq }) {
      return and(
        eq(table.groupId, groupId),
        eq(table.raceId, raceId),
        eq(table.userId, userId),
      )
    },
  })
}

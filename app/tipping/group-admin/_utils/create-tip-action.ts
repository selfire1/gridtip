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

export async function createTip(data: Schema): Promise<ServerResponse> {
  const { userId: adminUserId } = await verifySession()
  const group = await getCurrentGroup(adminUserId)
  if (!group) {
    return {
      ok: false,
      message: 'No group selected',
    }
  }
  const isAdmin = await verifyIsAdmin(group?.id)
  if (!isAdmin) {
    return {
      ok: false,
      message: 'Only admins can create a new tip',
    }
  }

  const parsed = formSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.message,
    }
  }

  const { userId, raceId, position } = parsed.data

  const isTargetUserMember = await getUserIsMemberOfGroup(group.id)
  if (!isTargetUserMember) {
    return {
      ok: false,
      message: 'Target user is not a member of the group',
    }
  }

  const prediction = await getPrediction(group.id)
  revalidateTag(CacheTag.Predictions)

  if (prediction && (await hasPredictionEntry(prediction.id))) {
    return {
      ok: false,
      message: 'Tip already exists. Please edit instead.',
    }
  }

  try {
    await createPredictionEntry(prediction?.id, parsed.data, group.id)
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

  async function createPredictionEntry(
    predictionIdInput: Database.PredictionId | undefined,
    data: Schema,
    groupId: Database.GroupId,
  ) {
    const { userId, raceId, position, valueId } = data

    const predictionId = predictionIdInput ?? (await createPrediction()).id
    await createPredictionEntry(predictionId)

    async function createPredictionEntry(predictionId: Database.PredictionId) {
      const isForDriver = position !== 'constructorWithMostPoints'
      const valueObject = isForDriver
        ? {
            driverId: valueId,
          }
        : { constructorId: valueId }

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

  async function getPrediction(groupId: Database.Group['id']) {
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

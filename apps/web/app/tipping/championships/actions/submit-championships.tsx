'use server'

import { verifySession } from '@/lib/dal'
import { ChampionshipsTipData, ChampionshipsTipSchema } from './schema'
import {
  getCurrentGroup,
  getTargetGroupAndMembership,
} from '@/lib/utils/groups'
import { db } from '@/db'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import { and, eq } from 'drizzle-orm/sql'
import * as Sentry from '@sentry/nextjs'

export async function submitChampionship(input: ChampionshipsTipData) {
  const { userId } = await verifySession()

  const verification = ChampionshipsTipSchema.safeParse(input)
  if (!verification.success) {
    return {
      ok: false as const,
      message: 'Invalid form values',
    }
  }

  const data = verification.data

  try {
    const currentGroup = await getCurrentGroup(userId)
    if (!currentGroup) {
      return {
        ok: false as const,
        message: 'No group found',
      }
    }
    const { member, group } = await getTargetGroupAndMembership({
      userId,
      groupId: currentGroup?.id,
    })

    const existingPrediction = await db.query.predictionsTable.findFirst({
      where: (prediction, { eq, and }) =>
        and(
          eq(prediction.groupId, group.id),
          eq(prediction.memberId, member.id),
          eq(prediction.isForChampionship, true),
        ),
    })

    if (!existingPrediction) {
      await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(predictionsTable)
          .values({
            memberId: member.id,
            groupId: group.id,
            isForChampionship: true,
          })
          .returning()

        const result = await tx
          .insert(predictionEntriesTable)
          .values([
            {
              predictionId: created.id,
              position: 'championshipConstructor',
              constructorId: data.constructorChampion.id,
            },
            {
              predictionId: created.id,
              position: 'championshipDriver',
              driverId: data.driverChampion.id,
            },
          ])
          .returning()
      })

      return { ok: true as const, message: '' }
    }

    await db.transaction(async (tx) => {
      const result = await tx
        .update(predictionEntriesTable)
        .set({
          constructorId: data.constructorChampion.id,
        })
        .where(
          and(
            eq(predictionEntriesTable.predictionId, existingPrediction.id),
            eq(predictionEntriesTable.position, 'championshipConstructor'),
          ),
        )
        .returning()

      await tx
        .update(predictionEntriesTable)
        .set({
          driverId: data.driverChampion.id,
        })
        .where(
          and(
            eq(predictionEntriesTable.predictionId, existingPrediction.id),
            eq(predictionEntriesTable.position, 'championshipDriver'),
          ),
        )
    })
    return { ok: true as const, message: '' }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'submit-championships',
        context: 'server-action',
      },
      extra: {
        userId,
      },
    })
    console.error(error)
    return {
      ok: false as const,
      message: 'Error saving',
    }
  }
}

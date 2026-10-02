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
import { getFirstRace } from '@/lib/utils/races'
import { isAfterChampionshipDeadline } from '@/lib/utils/championship-deadline'
import { onConflictUpdateKeys } from '@/lib/utils/drizzle'
import { CURRENT_SEASON } from '@/constants'

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
    const firstRace = await getFirstRace()
    if (isAfterChampionshipDeadline(firstRace)) {
      return {
        ok: false as const,
        message: 'Championship tips are closed',
      }
    }

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
          eq(prediction.season, CURRENT_SEASON),
        ),
    })

    if (!existingPrediction) {
      await db.transaction(async (tx) => {
        await tx
          .insert(predictionsTable)
          .values({
            memberId: member.id,
            groupId: group.id,
            isForChampionship: true,
            season: CURRENT_SEASON,
          })
          .onConflictDoNothing()

        const prediction = await tx.query.predictionsTable.findFirst({
          where: (prediction, { eq, and }) =>
            and(
              eq(prediction.groupId, group.id),
              eq(prediction.memberId, member.id),
              eq(prediction.isForChampionship, true),
              eq(prediction.season, CURRENT_SEASON),
            ),
          columns: {
            id: true,
          },
        })
        if (!prediction) {
          throw new Error('Failed to create prediction')
        }

        await tx
          .insert(predictionEntriesTable)
          .values([
            {
              predictionId: prediction.id,
              position: 'championshipConstructor',
              constructorId: data.constructorChampion.id,
            },
            {
              predictionId: prediction.id,
              position: 'championshipDriver',
              driverId: data.driverChampion.id,
            },
          ])
          .onConflictDoUpdate({
            target: [
              predictionEntriesTable.predictionId,
              predictionEntriesTable.position,
            ],
            set: onConflictUpdateKeys(predictionEntriesTable, [
              'driverId',
              'constructorId',
            ]),
          })
      })

      return { ok: true as const, message: '' }
    }

    await db.transaction(async (tx) => {
      await tx
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

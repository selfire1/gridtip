import { db } from '@/db'
import type { RacePredictionField } from '@gridtip/shared/constants'
import { predictionsTable } from '@/db/schema/schema'
import { eq } from 'drizzle-orm'
import {
  getTipTypeFromPosition,
  isPredictionForRace,
} from '@/lib/utils/prediction-fields'

export async function getTips(info: {
  memberId: string
  groupId: string
  raceId: string
}) {
  const isForCurrentMember = eq(predictionsTable.memberId, info.memberId)
  const isForSuppliedGroup = eq(predictionsTable.groupId, info.groupId)
  const isForRace = eq(predictionsTable.raceId, info.raceId)

  const rawTips = await db.query.predictionEntriesTable.findMany({
    where: (table, { inArray, and }) =>
      inArray(
        table.predictionId,
        db
          .select({ id: predictionsTable.id })
          .from(predictionsTable)
          .where(and(isForCurrentMember, isForSuppliedGroup, isForRace)),
      ),
    with: {
      prediction: {
        columns: {
          raceId: true,
        },
      },
      driver: {
        columns: {
          constructorId: true,
          givenName: true,
          familyName: true,
          id: true,
        },
      },
      constructor: true,
    },
  })

  return rawTips.reduce(
    (acc, tip) => {
      const position = tip.position
      if (!isPredictionForRace(position)) {
        return acc
      }
      const savedTip =
        getTipTypeFromPosition(position) === 'driver'
          ? tip.driver
          : tip.constructor
      if (!savedTip) {
        return acc
      }
      acc[position] = savedTip
      return acc
    },
    {} as Record<RacePredictionField, { id: string }>,
  )
}

'use server'

import { verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { and, eq } from 'drizzle-orm'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import {
  CONSTRUCTOR_RACE_PREDICTION_FIELDS,
  DRIVER_RACE_PREDICTION_FIELDS,
} from '@gridtip/shared/constants'
import { CUTOFF_REFERENCE_KEY } from '@/constants'
import { Database as Db } from '@/db/types'
import { throwIfAnyNewFieldIsAfterCutoff } from '@/lib/utils/prediction-fields'
import { onConflictUpdateKeys } from '@/lib/utils/drizzle'
import { serverSubmitTipSchema } from './schema'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { getTargetGroupAndMembership } from '@/lib/utils/groups'
import { ServerResponse } from '@/types'

export async function submitChanges(input: Record<string, unknown>) {
  try {
    await submitChangesThrows(input)
    return {
      ok: true,
      message: '',
    } satisfies ServerResponse
  } catch (error) {
    return {
      ok: false,
      message: (error as Error).message,
    } satisfies ServerResponse
  }
}

async function submitChangesThrows(input: Record<string, unknown>) {
  type Schema = z.infer<typeof serverSubmitTipSchema>

  const { userId } = await verifySession()

  const parsed = validateInput()
  await throwIfSuppliedIdsAreInvalid(parsed)
  const { raceId, groupId, ...positions } = parsed

  if (!Object.values(positions ?? {}).length) {
    console.error('No tips supplied', positions, parsed)
    throw new Error('No tips supplied')
  }

  const { group: groupOfUser, member } = await getTargetGroupAndMembership({
    groupId,
    userId,
  })

  const { prediction, entries: existing } = await getExistingPredictions()
  const race = await getRaceFromId(raceId)
  if (!race) {
    throw new Error('Invalid race')
  }
  throwIfAnyNewFieldIsAfterCutoff(
    race,
    new Date(),
    parsed,
    groupOfUser,
    existing,
  )

  if (prediction) {
    await updatePredictionEntries(prediction.id, parsed)
    revalidateCache()
    return
  }
  await createPrediction(parsed)
  revalidateCache()

  async function createPrediction(body: Schema) {
    const [{ id: predictionId }] = await db
      .insert(predictionsTable)
      .values([
        {
          memberId: member.id,
          groupId,
          raceId,
        },
      ])
      .returning({ id: predictionsTable.id })

    const values = formatBodyToPredictionEntries(body, predictionId)

    const entries = await db
      .insert(predictionEntriesTable)
      .values(values)
      .returning()
    return entries
  }

  function revalidateCache() {
    revalidateTag(CacheTag.Predictions)
  }

  async function updatePredictionEntries(
    predictionId: Db.Prediction['id'],
    body: Schema,
  ) {
    const values = formatBodyToPredictionEntries(body, predictionId)
    await db
      .insert(predictionEntriesTable)
      .values(values)
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
  }

  function formatBodyToPredictionEntries(
    body: Schema,
    predictionId: Db.Prediction['id'],
  ): Db.InsertPredictionEntry[] {
    const driverPredictionEntries: Db.InsertPredictionEntry[] = [
      ...DRIVER_RACE_PREDICTION_FIELDS,
    ].reduce((acc, entry) => {
      const id = body[entry]?.id
      if (!id) {
        return acc
      }
      acc.push({ predictionId, position: entry, driverId: id })
      return acc
    }, [] as Db.InsertPredictionEntry[])

    const constructorPredictionEntries: Db.InsertPredictionEntry[] = [
      ...CONSTRUCTOR_RACE_PREDICTION_FIELDS,
    ].reduce((acc, entry) => {
      const id = body[entry]?.id
      if (!id) {
        return acc
      }
      acc.push({ predictionId, position: entry, constructorId: id })
      return acc
    }, [] as Db.InsertPredictionEntry[])

    const values: Db.InsertPredictionEntry[] = [
      ...driverPredictionEntries,
      ...constructorPredictionEntries,
    ]
    return values
  }

  async function getExistingPredictions() {
    const prediction = await db.query.predictionsTable.findFirst({
      where: and(
        eq(predictionsTable.memberId, member.id),
        eq(predictionsTable.raceId, raceId),
        eq(predictionsTable.groupId, groupId),
      ),
      columns: {
        id: true,
      },
    })
    if (!prediction?.id) {
      return { prediction, entries: [] }
    }
    const entries = await db.query.predictionEntriesTable.findMany({
      where: (tip, { eq }) => eq(tip.predictionId, prediction.id),
      columns: {
        position: true,
        driverId: true,
        constructorId: true,
      },
    })
    return { prediction, entries }
  }

  async function getRaceFromId(targetId: string) {
    const keysToGetCutoffInfo = [
      ...new Set(Object.values(CUTOFF_REFERENCE_KEY)),
    ]
    const keysToGetCutoffInfoAsObject = keysToGetCutoffInfo.reduce(
      (acc, key) => {
        acc[key] = true
        return acc
      },
      {} as Record<(typeof keysToGetCutoffInfo)[number], true>,
    )
    const targetRace = await db.query.racesTable.findFirst({
      where: (race, { eq }) => eq(race.id, targetId),
      columns: {
        id: true,
        sprintDate: true,
        ...keysToGetCutoffInfoAsObject,
      },
    })
    if (!targetRace) {
      throw new Error('Invalid race')
    }
    return targetRace
  }

  function validateInput() {
    const result = serverSubmitTipSchema.safeParse(input)
    if (!result.success) {
      throw new Error(z.prettifyError(result.error))
    }
    return result.data
  }

  async function throwIfSuppliedIdsAreInvalid(body: Schema) {
    const drivers = await db.query.driversTable.findMany({
      columns: {
        id: true,
        constructorId: true,
      },
    })
    const { constructorIds, driverIds } = drivers.reduce(
      (acc, el) => {
        acc.constructorIds.push(el.constructorId)
        acc.driverIds.push(el.id)
        return acc
      },
      {
        constructorIds: [] as Db.Constructor['id'][],
        driverIds: [] as Db.Driver['id'][],
      },
    )

    const driverKeys = DRIVER_RACE_PREDICTION_FIELDS
    const constructorKeys = CONSTRUCTOR_RACE_PREDICTION_FIELDS

    driverKeys.forEach((key) => {
      const givenId = body[key]?.id
      if (givenId && !driverIds.includes(givenId)) {
        throw new Error('Invalid driver')
      }
    })

    constructorKeys.forEach((key) => {
      const givenId = body[key]?.id
      if (givenId && !constructorIds.includes(givenId)) {
        throw new Error('Invalid constructor')
      }
    })
  }
}

'use server'

import { verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { and, eq } from 'drizzle-orm'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import {
  CONSTRUCTOR_RACE_PREDICTION_FIELDS,
  CUTOFF_REFERENCE_KEY,
  DRIVER_RACE_PREDICTION_FIELDS,
  RACE_PREDICTION_FIELDS,
  RacePredictionField,
} from '@/constants'
import { Database as Db } from '@/db/types'
import { isPositionAfterCutoff as getIsAfterCutoff } from '@/lib/utils/prediction-fields'
import { onConflictUpdateKeys } from '@/lib/utils/drizzle'
import { serverSubmitTipSchema as schema } from './schema'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'

export async function submitChanges(input: Record<string, unknown>) {
  type Schema = z.infer<typeof schema>

  const { userId } = await verifySession()

  const parsed = validateInput()
  await throwIfSuppliedIdsAreInvalid(parsed)
  const { raceId, groupId, ...positions } = parsed

  if (!Object.values(positions ?? {}).length) {
    console.error('No tips supplied', positions, parsed)
    throw new Error('No tips supplied')
  }

  const groupOfUser = await getTargetGroup()

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
          userId,
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
        eq(predictionsTable.userId, userId),
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

  function throwIfAnyNewFieldIsAfterCutoff(
    targetRace: Awaited<ReturnType<typeof getRaceFromId>>,
    timeOfSubmission: Date,
    body: Schema,
    group: Pick<Db.Group, 'cutoffInMinutes'>,
    existingEntries?: Pick<
      Db.PredictionEntry,
      'position' | 'driverId' | 'constructorId'
    >[],
  ) {
    function getIsPositionAfterCutoff(info: {
      position: RacePredictionField
      testDate: Date
    }) {
      return getIsAfterCutoff({
        race: targetRace,
        cutoff: group.cutoffInMinutes,
        ...info,
      })
    }

    const positionsPredicted = Object.keys(body).filter((key) =>
      RACE_PREDICTION_FIELDS.includes(key as RacePredictionField),
    ) as RacePredictionField[]
    const isNewPrediction = !existingEntries?.length
    const existingPredictionValuesMap = existingEntries?.reduce(
      (acc, entry) => {
        if (
          !RACE_PREDICTION_FIELDS.includes(
            entry.position as RacePredictionField,
          )
        ) {
          return acc
        }
        acc[entry.position as RacePredictionField] =
          entry.driverId || entry.constructorId
        return acc
      },
      {} as Record<
        RacePredictionField,
        Db.PredictionEntry['constructorId'] | Db.PredictionEntry['driverId']
      >,
    )

    for (const position of positionsPredicted) {
      const isPositionAfterCutoff = getIsPositionAfterCutoff({
        position,
        testDate: timeOfSubmission,
      })
      if (isNewPrediction && isPositionAfterCutoff) {
        console.warn('Is a new prediction and is after cutoff')
        throwError(position)
      }

      const wasPreviouslySaved = existingPredictionValuesMap?.[position]
      const isChanged =
        wasPreviouslySaved &&
        existingPredictionValuesMap[position] !== body[position]?.id
      if (isChanged && isPositionAfterCutoff) {
        console.warn('Has changed and is after cutoff', {
          existing: existingPredictionValuesMap,
          body,
        })
        throwError(position)
      }
    }
    function throwError(position: RacePredictionField) {
      throw new Error(`Cannot predict ${position} after cutoff`)
    }
  }

  async function getTargetGroup() {
    const memberGroup = await db.query.groupMembersTable.findFirst({
      where: (group, { eq, and }) =>
        and(
          // group is target group
          eq(group.groupId, groupId),
          // user is member
          eq(group.userId, userId),
        ),
      columns: { id: true },
      with: {
        group: {
          columns: {
            id: true,
            cutoffInMinutes: true,
          },
        },
      },
    })
    const group = memberGroup?.group
    if (!group) {
      console.error('no group', { input, groupId, userId })
      throw new Error('Invalid group')
    }
    return group
  }

  function validateInput() {
    const result = schema.safeParse(input)
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

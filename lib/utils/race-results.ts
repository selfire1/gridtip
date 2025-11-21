import { DriverOptionProps } from '@/components/driver-option'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import {
  groupsTable,
  predictionEntriesTable,
  predictionsTable,
  racesTable,
} from '@/db/schema/schema'
import { Database } from '@/db/types'
import { subMinutes } from 'date-fns'
import { and, eq, inArray, lt } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

async function uncachedGetOnlyRacesWithResults() {
  const resultsByRaceAndPosition = await getRaceIdToResultMap()
  const allRaces = await db.query.racesTable.findMany({
    columns: {
      id: true,
      round: true,
      raceName: true,
    },
  })
  return allRaces
    ?.filter((race) => resultsByRaceAndPosition?.has(race.id))
    ?.sort((a, b) => b.round - a.round)
}

type Position = number
export type ResultsMap = Map<
  /**
   * The id of the race
   */
  Database.Race['id'],
  {
    qualifying: Map<Position, DriverOptionProps>
    sprint: Map<Position, DriverOptionProps> | null
    gp: Map<Position, DriverOptionProps>
    allConstructorsPoints: Map<Database.Result['constructorId'], number>
    topConstructorsPoints: Map<Database.Result['constructorId'], number>
  }
>

async function uncachedGetRaceIdToResultMap(): Promise<ResultsMap | undefined> {
  const results = await getResults()
  if (!results?.length) {
    return
  }

  const resultsMap: ResultsMap = new Map()
  results.forEach((result) => {
    const isRaceInMap = resultsMap.has(result.raceId)
    const hasSprintResult = result.sprint

    if (!isRaceInMap) {
      resultsMap.set(result.raceId, {
        allConstructorsPoints: new Map<Database.Constructor['id'], number>(),
        topConstructorsPoints: new Map<Database.Constructor['id'], number>(),
        qualifying: new Map<number, DriverOptionProps>(),
        gp: new Map<number, DriverOptionProps>(),
        sprint: hasSprintResult ? new Map<number, DriverOptionProps>() : null,
      })
    }

    const raceMap = resultsMap.get(result.raceId)!
    if (result.driver) {
      raceMap.qualifying.set(result.grid ?? 0, result.driver)
    } else {
      console.warn('No driver for `grid`', result)
    }

    if (result.driver) {
      if (result.position && result.position > 0) {
        raceMap.gp.set(result.position, result.driver)
      }
    } else {
      console.warn('No driver for `position`', result)
    }

    if (result.sprint && result.sprint > 0) {
      if (!raceMap?.sprint) {
        raceMap.sprint = new Map<number, DriverOptionProps>()
      }

      if (result.driver) {
        raceMap.sprint.set(result.sprint, result.driver ?? {})
      } else {
        console.warn('No driver for `sprint`', result)
      }
    }

    const constructorsMap = raceMap!.allConstructorsPoints
    if (!constructorsMap.has(result.constructorId)) {
      constructorsMap.set(result.constructorId, 0)
    }
    const currentConstructorPoints =
      constructorsMap.get(result.constructorId)! + result.points
    constructorsMap.set(result.constructorId, currentConstructorPoints)

    const topConstructors = raceMap!.topConstructorsPoints

    const currentMaxPoints = Math.max(...constructorsMap.values())
    if (currentConstructorPoints >= currentMaxPoints) {
      topConstructors.set(result.constructorId, currentConstructorPoints)
      topConstructors.forEach((value, key) => {
        if (value < currentConstructorPoints) {
          topConstructors.delete(key)
        }
      })
    }
  })
  return resultsMap

  async function getResults() {
    const runQuery = async () =>
      await db.query.resultsTable.findMany({
        with: {
          driver: {
            columns: {
              id: true,
              constructorId: true,
              givenName: true,
              familyName: true,
            },
          },
          constructor: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      })

    return await unstable_cache(runQuery, [], {
      tags: [CacheTag.Results],
    })()
  }
}

async function uncachedGetPredictionsOfRacesAfterCutoff(groupId: string) {
  const idsOfRacesAfterCutoff = await getRacesThatAreAfterCutoff(groupId)
  const allPredictions = await getPredictionsOfRaces(
    groupId,
    idsOfRacesAfterCutoff,
  )
  return allPredictions
}

async function getPredictionsOfRaces(groupId: string, ids: string[]) {
  const predictionEntries = await db
    .select({
      id: predictionEntriesTable.id,
      userId: predictionsTable.userId,
      raceId: predictionsTable.raceId,
      position: predictionEntriesTable.position,
      driverId: predictionEntriesTable.driverId,
      constructorId: predictionEntriesTable.constructorId,
      overwriteTo: predictionEntriesTable.overwriteTo,
    })
    .from(predictionsTable)
    .leftJoin(
      predictionEntriesTable,
      eq(predictionsTable.id, predictionEntriesTable.predictionId),
    )
    .where(
      and(
        eq(predictionsTable.groupId, groupId),
        inArray(predictionsTable.raceId, ids),
      ),
    )
  return predictionEntries
}

async function getRacesThatAreAfterCutoff(groupId: string) {
  const group = await db.query.groupsTable.findFirst({
    where: eq(groupsTable.id, groupId),
    columns: {
      cutoffInMinutes: true,
    },
  })

  const cutoffInMinutes = group?.cutoffInMinutes
  if (cutoffInMinutes === undefined) {
    throw new Error('Group not found')
  }
  const currentDate = new Date()
  const currentDateWithCutoffAdjusted = subMinutes(currentDate, cutoffInMinutes)
  const raceIds = (
    await db.query.racesTable.findMany({
      where: lt(racesTable.qualifyingDate, currentDateWithCutoffAdjusted),
      columns: {
        id: true,
      },
    })
  ).map((race) => race.id)
  return raceIds
}

const getRaceIdToResultMap = cache(uncachedGetRaceIdToResultMap)
const getOnlyRacesWithResults = unstable_cache(
  cache(uncachedGetOnlyRacesWithResults),
  [],
  {
    tags: [CacheTag.Results],
  },
)
const getPredictionsOfRacesAfterCutoff = cache(
  uncachedGetPredictionsOfRacesAfterCutoff,
)

export type AllPredictions = Awaited<
  ReturnType<typeof uncachedGetAllPredictions>
>
async function uncachedGetAllPredictions(groupId: Database.Group['id']) {
  const predictionEntries = await db.query.predictionEntriesTable.findMany({
    where: inArray(
      predictionEntriesTable.predictionId,
      db
        .select({ id: predictionsTable.id })
        .from(predictionsTable)
        .where(eq(predictionsTable.groupId, groupId)),
    ),
    columns: {
      id: true,
      position: true,
      constructorId: true,
      driverId: true,
      overwriteTo: true,
      lastUpdatedBy: true,
    },
    with: {
      prediction: {
        columns: {
          raceId: true,
          createdAt: true,
        },
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
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
      constructor: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  })
  return predictionEntries
}

const createGetAllPredictions = (groupId: Database.Group['id']) =>
  unstable_cache(
    async () => await uncachedGetAllPredictions(groupId),
    [groupId],
    {
      tags: [CacheTag.Predictions],
    },
  )

export {
  getRaceIdToResultMap,
  getOnlyRacesWithResults,
  getPredictionsOfRacesAfterCutoff,
  createGetAllPredictions,
}

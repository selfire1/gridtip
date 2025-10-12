import { unstable_cache } from 'next/cache'
import { PREDICTION_FIELDS } from '@/constants'
import { db } from '@/db'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import {
  getOnlyRacesWithResults,
  getRaceIdToResultMap,
} from '@/lib/utils/race-results'
import { eq, inArray } from 'drizzle-orm'
import { CacheTag } from '@/constants/cache'
import PastRacesClient from './PastRacesClient'

export type RacesWithResults = Awaited<
  ReturnType<typeof getOnlyRacesWithResults>
>

export type RacePredictionMaps = ReturnType<typeof getResultsMaps>
export type Constructors = Awaited<ReturnType<typeof getConstructors>>

type RaceId = Database.Race['id']

export default async function PastRacesServer({
  groupId,
}: {
  groupId: string
}) {
  const CACHE_TTL = 60 * 20 // 20 minutes
  const getCachedInfo = unstable_cache(
    async () =>
      await Promise.all([
        getOnlyRacesWithResults(),
        getAllPredictions(groupId),
      ]),
    [groupId],
    { tags: [CacheTag.Results], revalidate: CACHE_TTL },
  )

  const constructors = await unstable_cache(() => getConstructors(), [], {
    tags: [CacheTag.Constructors],
  })()

  console.log('constructors', constructors) // FIXME: remove

  const [racesWithResults, allPredictionsWithUser] = await getCachedInfo()
  const results = await getRaceIdToResultMap()

  const resultsPerRaceMap = getResultsMaps(racesWithResults, {
    allPredictionsWithUser,
    results,
  })

  return (
    <PastRacesClient
      races={racesWithResults}
      maps={resultsPerRaceMap}
      constructors={constructors}
    />
  )
}

type Race = Awaited<ReturnType<typeof getOnlyRacesWithResults>>[number]
type AllPredictions = Awaited<ReturnType<typeof getAllPredictions>>
type Results = Awaited<ReturnType<typeof getRaceIdToResultMap>>

type GetTipsInfo = {
  forRace: Race
  allPredictionsWithUser: AllPredictions
  results: Results
}

function getConstructors() {
  return db.query.constructorsTable.findMany({
    columns: {
      id: true,
      name: true,
    },
  })
}

function getResultsMaps(
  races: RacesWithResults,
  info: Omit<GetTipsInfo, 'forRace'>,
) {
  return {
    grandPrix: createMap(getGpTips),
    constructors: createMap(getConstructorResults),
    qualifying: createMap(getQualifyingResults),
    sprint: createMap(getSprintResults),
  }

  function createMap<TFunction extends (info: GetTipsInfo) => any>(
    mapFunction: TFunction,
  ) {
    return races.reduce((map, race) => {
      const id = race.id
      const mapped = mapFunction({ ...info, forRace: race })
      map.set(id, mapped)
      return map
    }, new Map<RaceId, ReturnType<TFunction>>())
  }
}

function getGpTips({
  forRace: selectedRace,
  allPredictionsWithUser,
  results,
}: GetTipsInfo) {
  const predictionEntriesForThisRace = allPredictionsWithUser.filter(
    (entry) => entry.prediction.raceId === selectedRace.id,
  )
  const predictionsByUser = getPredictionsByUser(predictionEntriesForThisRace)
  if (!selectedRace) {
    return
  }
  const map = results?.get(selectedRace.id)?.gp
  if (!map) {
    return []
  }
  const sorted = [...map.entries()].sort(
    (a, b) => (a[0] || Infinity) - (b[0] || Infinity),
  )
  const [lastPlacePosition] = sorted.at(-1) ?? [1]
  return sorted.map(([place, driver]) => {
    const predictedP1By = predictionsByUser?.get(driver.id)?.get('p1')
    const predictedP10By = predictionsByUser?.get(driver.id)?.get('p10')
    const predictedLast = predictionsByUser?.get(driver.id)?.get('last')
    return {
      place,
      driver,
      predictedP1By,
      predictedP10By,
      predictedLast,
      didAnyonePredict: [predictedP1By, predictedP10By, predictedLast].some(
        (el) => el?.length,
      ),
      isP1Correct:
        place === 1 &&
        results.get(selectedRace.id)?.gp?.get(1)?.id === driver.id,
      isP10Correct:
        place === 10 &&
        results.get(selectedRace.id)?.gp?.get(10)?.id === driver.id,
      isLastCorrect:
        place === lastPlacePosition &&
        results.get(selectedRace.id)?.gp?.get(lastPlacePosition)?.id ===
          driver.id,
    }
  })
}

async function getAllPredictions(groupId: Database.Group['id']) {
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
    },
    with: {
      prediction: {
        columns: {
          raceId: true,
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

function getPredictionsByUser(currentRacePredictions: AllPredictions) {
  return currentRacePredictions?.reduce((driverMap, el) => {
    const {
      driverId,
      position,
      prediction: { user: rawUser },
    } = el
    const user = rawUser as Pick<Database.User, 'id' | 'name' | 'image'>
    if (!driverId) {
      return driverMap
    }
    if (!driverMap.has(driverId)) {
      driverMap.set(driverId, new Map([[position, [user]]]))
      return driverMap
    }
    const positionMap = driverMap.get(driverId)!
    const existing = positionMap.get(position)
    positionMap.set(position, [...(existing || []), user])
    return driverMap
  }, new Map<Database.Driver['id'], Map<(typeof PREDICTION_FIELDS)[number], Pick<Database.User, 'id' | 'name' | 'image'>[]>>())
}

function getQualifyingResults({
  forRace: selectedRace,
  allPredictionsWithUser,
  results,
}: GetTipsInfo) {
  const map = results?.get(selectedRace.id)?.qualifying
  if (!map) {
    return []
  }
  const predictionEntriesForThisRace = allPredictionsWithUser.filter(
    (entry) => entry.prediction.raceId === selectedRace.id,
  )
  const predictionsByUser = getPredictionsByUser(predictionEntriesForThisRace)

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([place, driver]) => {
      const predictedBy = predictionsByUser?.get(driver.id)?.get('pole')
      return {
        place,
        driver,
        predictedBy,
        isCorrect:
          place === 1 &&
          results?.get(selectedRace!.id)?.qualifying?.get(1)?.id === driver.id,
      }
    })
    .filter((el) => el.place === 1 || el.predictedBy?.length)
}

function getSprintResults({
  forRace: selectedRace,
  allPredictionsWithUser,
  results,
}: GetTipsInfo) {
  const map = results?.get(selectedRace.id)?.sprint
  if (!map) {
    return []
  }
  const predictionEntriesForThisRace = allPredictionsWithUser.filter(
    (entry) => entry.prediction.raceId === selectedRace.id,
  )
  const predictionsByUser = getPredictionsByUser(predictionEntriesForThisRace)

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([place, driver]) => {
      const predictedP1By = predictionsByUser?.get(driver.id)?.get('sprintP1')
      return {
        place,
        driver,
        predictedP1By,
        isP1Correct:
          place === 1 &&
          results?.get(selectedRace!.id)?.gp?.get(1)?.id === driver.id,
      }
    })
    .filter((el) => el.place === 1 || el.predictedP1By?.length)
}

function getConstructorResults({
  forRace: selectedRace,
  allPredictionsWithUser,
  results,
}: GetTipsInfo) {
  if (!selectedRace) {
    return
  }
  const map = results?.get(selectedRace.id)?.allConstructorsPoints
  const topConstructors = results?.get(selectedRace.id)?.topConstructorsPoints
  if (!map || !topConstructors) {
    return []
  }
  const currentRacePredictions = allPredictionsWithUser.filter(
    (entry) => entry.prediction.raceId === selectedRace.id,
  )
  return [...map.entries()]
    .map(([constructorId, points]) => {
      const predictedThisConstructor = currentRacePredictions
        ?.filter(
          (predictionEntry) =>
            predictionEntry.position === 'constructorWithMostPoints' &&
            constructorId === predictionEntry.constructorId,
        )
        .map((prediction) => prediction.prediction.user)
      return {
        points,
        constructorId,
        users: predictedThisConstructor,
        didAnyonePredict: predictedThisConstructor?.length,
        isCorrect: topConstructors.has(constructorId),
      }
    })
    .sort(
      (a, b) =>
        b.points - a.points || a.constructorId.localeCompare(b.constructorId),
    )
}

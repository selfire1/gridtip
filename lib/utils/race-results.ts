import { DriverOption } from '@/app/tipping/components/select-driver'
import { db } from '@/db'
import { Database } from '@/db/types'
import { cache } from 'react'

async function uncachedGetOnlyRacesWithResults() {
  const resultsByRaceAndPosition = await getRaceIdToResultMap()
  const allRaces = await db.query.racesTable.findMany({
    columns: {
      id: true,
      round: true,
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
    qualifying: Map<Position, DriverOption>
    sprint: Map<Position, DriverOption> | null
    gp: Map<Position, DriverOption>
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
        qualifying: new Map<number, DriverOption>(),
        gp: new Map<number, DriverOption>(),
        sprint: hasSprintResult ? new Map<number, DriverOption>() : null,
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
        raceMap.sprint = new Map<number, DriverOption>()
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
    return await db.query.resultsTable.findMany({
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
  }
}

const getRaceIdToResultMap = cache(uncachedGetRaceIdToResultMap)
const getOnlyRacesWithResults = cache(uncachedGetOnlyRacesWithResults)

export { getRaceIdToResultMap, getOnlyRacesWithResults }

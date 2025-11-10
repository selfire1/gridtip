import { CacheTag } from '@/constants/cache'
import { revalidateTag, unstable_cache } from 'next/cache'
import { NextRequest } from 'next/server'
import {
  areFieldsTheSame,
  createResponse,
  fetchJolpica,
  validateToken,
  wait,
} from '../../utils'
import { ResultsResponse, SprintResultsResponse } from '@/types/ergast'
import { db } from '@/db'
import { resultsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'

export const GET = async (_request: NextRequest) => {
  const validationResponse = await validateToken()
  if (!validationResponse.ok) {
    return validationResponse
  }

  type JolpicaResults = Database.InsertResult[]
  let jolpicaResults: JolpicaResults | undefined
  try {
    jolpicaResults = await getJolpicaResults()
  } catch (error) {
    return createResponse(
      500,
      'Failed to fetch results: ' + (error as Error).message,
    )
  }

  if (!jolpicaResults?.length) {
    return createResponse(404, 'No results found')
  }

  const isDifferent = await getIsThereDifferenceInResults(jolpicaResults)

  if (!isDifferent) {
    return createResponse(200, 'No update required')
  }

  const ids = await setResultsInDatabase(jolpicaResults)
  revalidateTag(CacheTag.Results)

  return createResponse(201, {
    updated: ids.length,
    received: jolpicaResults.length,
  })

  async function getIsThereDifferenceInResults(newItems: JolpicaResults) {
    const getStoredResults = unstable_cache(
      async () => await db.query.resultsTable.findMany(),
      [],
      {
        tags: [CacheTag.Results],
      },
    )
    const storedResults = await getStoredResults()

    if (storedResults.length !== newItems.length) {
      console.log('difference: true', storedResults.length, newItems.length)
      return true
    }

    const keysToCompare: (keyof Database.InsertResult)[] = [
      'raceId',
      'driverId',
      'sprint',
      'constructorId',
      'grid',
      'position',
      'points',
      'status',
    ] as const

    function getKey(result: Database.InsertResult) {
      return keysToCompare.map((key) => result[key]?.toString()).join('-')
    }

    const storedResultsMap = new Map(
      storedResults.map((result) => [getKey(result), result]),
    )

    const hasNoDifference = newItems.every((newRace) => {
      const newRaceKey = getKey(newRace)
      const storedRace = storedResultsMap.get(newRaceKey)!
      if (!storedResultsMap.has(newRaceKey)) {
        console.log('difference: true', 'no stored result', newRaceKey)
        // if no stored race, assume difference
        return false
      }
      if (
        areFieldsTheSame(keysToCompare, {
          newItem: newRace,
          storedItem: storedRace,
        })
      ) {
        return true
      }
      return false
    })
    return !hasNoDifference
  }

  async function getJolpicaResults() {
    const sprintResultsMap = await getSprintResultsMap()
    await waitToAvoidRateLimit()
    return await getResults(sprintResultsMap)

    type SprintResultsMap = Map<
      Database.Race['id'],
      Map<Database.Driver['id'], number | null>
    >
    async function getSprintResultsMap(): Promise<SprintResultsMap> {
      let offset = 0
      let total: null | number = null
      const limit = 100

      const sprintResultsMap = new Map() as SprintResultsMap

      while (total === null || offset < total) {
        const response = await fetchJolpica<SprintResultsResponse>(
          `/ergast/f1/2025/sprint/`,
          { params: { limit, offset } },
        )
        total = +response.MRData.total
        offset += limit

        const races = response.MRData.RaceTable?.Races
        if (!races?.length) {
          continue
        }
        for (const race of races) {
          const raceId = race.Circuit.circuitId
          const resultsMap = new Map()
          for (const result of race.SprintResults) {
            const driverId = result.Driver.driverId
            const position = result.position
            resultsMap.set(driverId, position)
          }
          sprintResultsMap.set(raceId, resultsMap)
        }
        await waitToAvoidRateLimit()
      }
      return sprintResultsMap
    }

    async function getResults(sprintResultsMap: SprintResultsMap) {
      let results: Database.InsertResult[] = []
      let offset = 0
      let total: null | number = null
      const limit = 100
      while (total === null || offset < total) {
        const response = await fetchJolpica<ResultsResponse>(
          `/ergast/f1/2025/results/`,
          { params: { limit, offset } },
        )
        total = +response.MRData.total
        offset += limit
        const races = response.MRData.RaceTable?.Races
        if (!races?.length) {
          continue
        }
        results.push(
          ...races.flatMap((race) => {
            return race.Results.map((result) => {
              if (!result.Constructor) {
                console.warn('No constructor', result)
                throw new Error('No Constructor found')
              }
              if (!result.status) {
                throw new Error('No Status found')
              }

              const raceId = race.Circuit.circuitId
              const driverId = result.Driver.driverId
              const sprintPosition = sprintResultsMap.get(raceId)?.get(driverId)

              const item: Database.InsertResult = {
                raceId,
                driverId,
                sprint: sprintPosition,
                constructorId: result.Constructor.constructorId,
                grid: result.grid ? +result.grid : null,
                position: isNaN(parseInt(result.positionText))
                  ? null
                  : +result.positionText,
                points: +result.points,
                status: result.status,
              }
              return item
            }).filter(Boolean)
          }),
        )

        await waitToAvoidRateLimit()
      }

      const withOverwrites = getResultsWithOverwrite(results)
      return withOverwrites

      function getResultsWithOverwrite(
        results: Database.InsertResult[],
      ): Database.InsertResult[] {
        const overwrites = getOverwrites()
        const overwritten = results.map((result) => {
          const raceId = result.raceId
          const driverId = result.driverId
          if (!driverId) {
            return result
          }
          const overwrite = overwrites.get(raceId)?.get(driverId)
          if (!overwrite) {
            return result
          }
          return overwrite
        })

        return overwritten

        function getOverwrites() {
          return new Map([
            [
              'villeneuve',
              new Map<string, Database.InsertResult>([
                [
                  'norris',
                  {
                    raceId: 'villeneuve',
                    driverId: 'norris',
                    constructorId: 'mclaren',
                    grid: 7,
                    position: null,
                    points: 0,
                    status: 'Retired',
                  },
                ],
              ]),
            ],
          ])
        }
      }
    }
  }
  async function waitToAvoidRateLimit(ms = 1000) {
    await wait(ms) // NOTE: to keep within API burst limit
  }

  async function setResultsInDatabase(results: JolpicaResults) {
    await db.delete(resultsTable) // we're being a bit lazy here and just dropping the whole table instead of checking which results actually changed. something to optimise later
    const returning = await db.insert(resultsTable).values(results).returning({
      id: resultsTable.id,
    })
    return returning
  }
}

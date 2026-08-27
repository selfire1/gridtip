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
import { driversTable, resultsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { sql } from 'drizzle-orm'
import * as Sentry from '@sentry/nextjs'
import { withRetry } from '@/lib/utils/with-retry'

export const GET = async (_request: NextRequest) => {
  const validationResponse = await validateToken()
  if (!validationResponse.ok) {
    return validationResponse
  }

  type JolpicaResults = {
    results: Database.InsertResult[]
    /**
     * The drivers named in the results. Kept alongside them because
     * `results.driver_id` references `drivers.id`.
     */
    drivers: Database.InsertDriver[]
  }
  let jolpicaResults: JolpicaResults | undefined
  try {
    jolpicaResults = await getJolpicaResults()
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'fetch-jolpica-results',
        context: 'api-route',
      },
    })
    return createResponse(
      500,
      'Failed to fetch results: ' + (error as Error).message,
    )
  }

  if (!jolpicaResults?.results.length) {
    return createResponse(404, 'No results found')
  }

  const isDifferent = await getIsThereDifferenceInResults(jolpicaResults.results)

  if (!isDifferent) {
    return createResponse(200, 'No update required')
  }

  const ids = await setResultsInDatabase(jolpicaResults)
  revalidateTag(CacheTag.Results)
  revalidateTag(CacheTag.Drivers)

  return createResponse(201, {
    updated: ids.length,
    received: jolpicaResults.results.length,
  })

  async function getIsThereDifferenceInResults(
    newItems: Database.InsertResult[],
  ) {
    const getStoredResults = unstable_cache(
      async () =>
        await withRetry(() => db.query.resultsTable.findMany(), {
          label: 'load stored results',
        }),
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
          `/ergast/f1/2026/sprint/`,
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

    async function getResults(
      sprintResultsMap: SprintResultsMap,
    ): Promise<JolpicaResults> {
      const results: Database.InsertResult[] = []
      // keyed by driver id so a driver who changed teams mid-season keeps the
      // constructor from their most recent result
      const driversById = new Map<Database.Driver['id'], Database.InsertDriver>()
      let offset = 0
      let total: null | number = null
      const limit = 100
      while (total === null || offset < total) {
        const response = await fetchJolpica<ResultsResponse>(
          `/ergast/f1/2026/results/`,
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

              driversById.set(driverId, {
                id: driverId,
                permanentNumber: result.Driver.permanentNumber,
                fullName:
                  result.Driver.givenName + ' ' + result.Driver.familyName,
                givenName: result.Driver.givenName,
                familyName: result.Driver.familyName,
                nationality: result.Driver.nationality,
                constructorId: result.Constructor.constructorId,
                lastUpdated: new Date(),
              })

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
      return { results: withOverwrites, drivers: [...driversById.values()] }

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

  async function setResultsInDatabase({ results, drivers }: JolpicaResults) {
    // we're being a bit lazy here and just dropping the whole table instead of
    // checking which results actually changed. something to optimise later.
    // the drivers are upserted first because results.driver_id references
    // drivers.id, and a mid-season line-up change reaches the results before
    // /api/drivers/update has picked the driver up. batching runs all three
    // statements in one transaction, so a rejected insert can't leave us with
    // an emptied results table (and makes the whole thing safe to retry).
    const [, , returning] = await withRetry(
      () =>
        db.batch([
          db
            .insert(driversTable)
            .values(drivers)
            .onConflictDoUpdate({
              target: driversTable.id,
              set: {
                permanentNumber: sql`excluded.permanent_number`,
                fullName: sql`excluded.full_name`,
                givenName: sql`excluded.given_name`,
                familyName: sql`excluded.family_name`,
                nationality: sql`excluded.nationality`,
                constructorId: sql`excluded.constructor_id`,
                lastUpdated: sql`excluded.last_updated`,
              },
            }),
          db.delete(resultsTable),
          db.insert(resultsTable).values(results).returning({
            id: resultsTable.id,
          }),
        ]),
      { label: 'replace results' },
    )
    return returning
  }
}

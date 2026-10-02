import { CacheTag } from '@/constants/cache'
import { CURRENT_SEASON } from '@/constants'
import { revalidateTag, unstable_cache } from 'next/cache'
import { NextRequest } from 'next/server'
import {
  areFieldsTheSame,
  createResponse,
  fetchJolpica,
  validateToken,
} from '../../utils'
import { RaceResponse } from '@/types/ergast'
import { db } from '@/db'
import { racesTable } from '@/db/schema/schema'
import { inArray, sql } from 'drizzle-orm'
import { Database } from '@/db/types'
import * as Sentry from '@sentry/nextjs'
import { withRetry } from '@/lib/utils/with-retry'
import { assignRaceIds, getRaceIdsToDelete } from '@/lib/utils/race-sync'

export const GET = async (_request: NextRequest) => {
  const validationResponse = await validateToken()
  if (!validationResponse.ok) {
    return validationResponse
  }

  type JolpicaRaces = Awaited<ReturnType<typeof getJolpicaRaces>>
  let jolpicaRaces: JolpicaRaces | undefined
  try {
    jolpicaRaces = await getJolpicaRaces()
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'fetch-jolpica-races',
        context: 'api-route',
      },
    })
    return createResponse(
      500,
      'Failed to fetch races: ' + (error as Error).message,
    )
  }

  if (!jolpicaRaces?.length) {
    return createResponse(404, 'No races found')
  }

  const storedRaces = await getStoredRaces()
  const races = assignRaceIds(jolpicaRaces, storedRaces)
  const idsToDelete = getRaceIdsToDelete(storedRaces, jolpicaRaces)

  const isDifferent =
    idsToDelete.length > 0 || getIsThereDifferenceInRaces(races)

  if (!isDifferent) {
    return createResponse(200, 'No update required')
  }

  const ids = await setRacesInDatabase(races)
  await deleteRacesFromDatabase(idsToDelete)
  revalidateTag(CacheTag.Races)

  return createResponse(201, {
    updated: ids.length,
    deleted: idsToDelete.length,
    received: jolpicaRaces.length,
  })

  async function getStoredRaces() {
    return await unstable_cache(
      async () =>
        await withRetry(
          () =>
            db.query.racesTable.findMany({
              where: (race, { eq }) => eq(race.season, CURRENT_SEASON),
            }),
          {
            label: 'load stored races',
          },
        ),
      [],
      {
        tags: [CacheTag.Races],
      },
    )()
  }

  function getIsThereDifferenceInRaces(newItems: Database.InsertRace[]) {
    const storedRacesMap = new Map(storedRaces.map((race) => [race.id, race]))

    const hasNoDifference = newItems.every((newRace) => {
      const storedRace = storedRacesMap.get(newRace.id)!
      if (!storedRacesMap.has(newRace.id)) {
        console.log('difference: true', 'no stored race', newRace.id)
        // if no stored race, assume difference
        return false
      }
      if (
        areFieldsTheSame(
          [
            'id',
            'country',
            'round',
            'circuitName',
            'raceName',
            'grandPrixDate',
            'qualifyingDate',
            'sprintDate',
            'sprintQualifyingDate',
            'locality',
          ],
          {
            newItem: newRace,
            storedItem: storedRace,
          },
        )
      ) {
        return true
      }
      return false
    })
    return !hasNoDifference
  }

  async function getJolpicaRaces() {
    const response = await fetchJolpica<RaceResponse>(
      `/ergast/f1/${CURRENT_SEASON}/races/`,
    )
    const races = response.MRData.RaceTable?.Races

    return races?.map((race) => {
      if (!race.Qualifying) {
        throw new Error('Qualifying not found')
      }
      const sprintDate = race?.Sprint?.date ? getDate(race.Sprint) : null
      const sprintQualifyingDate = race?.SprintQualifying
        ? getDate(race.SprintQualifying)
        : null
      const gpDate = getDate(race)
      const qualifyingDate = getDate(race.Qualifying)

      return {
        season: CURRENT_SEASON,
        circuitId: race.Circuit.circuitId,
        country: race.Circuit.Location.country,
        round: +race.round,
        circuitName: race.Circuit.circuitName,
        raceName: race.raceName,
        grandPrixDate: gpDate,
        qualifyingDate,
        sprintDate,
        sprintQualifyingDate,
        locality: race.Circuit.Location.locality,
        lastUpdated: new Date(),
      }
    })
    function getDate(data: { date: string; time?: string }) {
      return new Date(`${data.date}T${data.time ?? '00:00:00'}`)
    }
  }

  async function setRacesInDatabase(races: Database.InsertRace[]) {
    const returning = await withRetry(
      () =>
        db
          .insert(racesTable)
          .values(races)
          .onConflictDoUpdate({
            target: racesTable.id,
            set: {
              country: sql`excluded.country`,
              round: sql`excluded.round`,
              circuitName: sql`excluded.circuit_name`,
              raceName: sql`excluded.race_name`,
              grandPrixDate: sql`excluded.grand_prix_date`,
              qualifyingDate: sql`excluded.qualifying_date`,
              sprintDate: sql`excluded.sprint_date`,
              sprintQualifyingDate: sql`excluded.sprint_qualifying_date`,
              locality: sql`excluded.locality`,
              lastUpdated: sql`excluded.last_updated`,
            },
          })
          .returning({
            id: racesTable.id,
          }),
      { label: 'upsert races' },
    )
    return returning
  }

  async function deleteRacesFromDatabase(ids: Database.RaceId[]) {
    if (!ids.length) {
      return
    }
    await withRetry(
      () => db.delete(racesTable).where(inArray(racesTable.id, ids)),
      { label: 'delete races dropped from calendar' },
    )
  }
}

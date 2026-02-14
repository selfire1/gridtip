import { CacheTag } from '@/constants/cache'
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
import { sql } from 'drizzle-orm'
import { Database } from '@/db/types'
import * as Sentry from '@sentry/nextjs'

export const GET = async (_request: NextRequest) => {
  const validationResponse = await validateToken()
  if (!validationResponse.ok) {
    return validationResponse
  }

  type JolpicaRaces = Database.InsertRace[]
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

  const isDifferent = await getIsThereDifferenceInRaces(jolpicaRaces)

  if (!isDifferent) {
    return createResponse(200, 'No update required')
  }

  const ids = await setRacesInDatabase(jolpicaRaces)
  revalidateTag(CacheTag.Races)

  return createResponse(201, {
    updated: ids.length,
    received: jolpicaRaces.length,
  })

  async function getIsThereDifferenceInRaces(newItems: JolpicaRaces) {
    const getStoredRaces = unstable_cache(
      async () => await db.query.racesTable.findMany(),
      [],
      {
        tags: [CacheTag.Races],
      },
    )
    const storedRaces = await getStoredRaces()

    if (storedRaces.length !== newItems.length) {
      console.log('difference: true', storedRaces.length, newItems.length)
      return true
    }

    const storedRacesMap = new Map(storedRaces.map((race) => [race.id, race]))

    const hasNoDifference = newItems.every((newRace) => {
      if (!newRace.id) {
        console.log('difference: true', 'no id', newRace.raceName)

        // if no id, assume no difference
        return true
      }
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
    const response = await fetchJolpica<RaceResponse>('/ergast/f1/2026/races/')
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
        id: race.Circuit.circuitId,
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

  async function setRacesInDatabase(races: JolpicaRaces) {
    const returning = await db
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
      })
    return returning
  }
}

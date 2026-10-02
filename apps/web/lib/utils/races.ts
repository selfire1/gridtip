import { unstable_cache } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { CURRENT_SEASON } from '@/constants'
import { db } from '@/db'
import { Database } from '@/db/types'
import { getCountryFlag } from './country-flag'
import { getMostRecent } from './get-most-recent'
import { getIsSprint } from '@gridtip/shared/is-sprint'
import { selectNextRace } from './next-race'

export async function getNextRace() {
  const races = await getRaces()
  const nextRace = selectNextRace(races)

  return nextRace ? { id: nextRace.id } : undefined
}

export async function getRaceDetails(id: Database.RaceId) {
  return unstable_cache(
    async () => {
      const race = await db.query.racesTable.findFirst({
        where: (race, { eq }) => eq(race.id, id),
      })

      if (!race) {
        return undefined
      }

      return {
        ...race,
        image: getCountryFlag(race.country),
        isSprint: getIsSprint(race),
      }
    },
    [id],
    { tags: [CacheTag.Races] },
  )()
}

export async function getRaces() {
  return unstable_cache(
    async () => {
      const races = await db.query.racesTable.findMany({
        where: (race, { eq }) => eq(race.season, CURRENT_SEASON),
        columns: {
          id: true,
          locality: true,
          country: true,
          grandPrixDate: true,
          sprintQualifyingDate: true,
          qualifyingDate: true,
          round: true,
          raceName: true,
        },
      })

      return races.map((race) => ({
        ...race,
        image: getCountryFlag(race.country),
      }))
    },
    [],
    {
      tags: [CacheTag.Races],
    },
  )()
}

export async function getLastUpdatedRaces() {
  return unstable_cache(
    async () => {
      const races = await db.query.racesTable.findMany({
        columns: {
          lastUpdated: true,
        },
      })

      const lastUpdated = getMostRecent(races, 'lastUpdated')

      return lastUpdated
    },
    [],
    {
      tags: [CacheTag.Races],
    },
  )()
}

export async function getFirstRace() {
  function getRaceUncached() {
    return db.query.racesTable.findFirst({
      where: (race, { eq }) => eq(race.season, CURRENT_SEASON),
      orderBy: (race, { asc }) => asc(race.qualifyingDate),
      columns: {
        qualifyingDate: true,
      },
    })
  }

  return await unstable_cache(getRaceUncached, [], {
    tags: [CacheTag.Races],
  })()
}

import { unstable_cache } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { cache } from 'react'
import { Database } from '@/db/types'
import { getCountryFlag } from './country-flag'
import { getMostRecent } from './get-most-recent'
import { getIsSprint } from '@gridtip/shared/is-sprint'

export async function getNextRace() {
  const undeduplicated = unstable_cache(
    async () =>
      await db.query.racesTable.findFirst({
        orderBy: (race) => race.round,
        columns: {
          id: true,
        },
        where: (race, { gt }) => gt(race.grandPrixDate, new Date()),
      }),
    [],
    {
      tags: [CacheTag.Races],
    },
  )

  return await cache(undeduplicated)()
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

import { unstable_cache } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { cache } from 'react'

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

export async function getRaces() {
  return unstable_cache(
    async () =>
      await db.query.racesTable.findMany({
        columns: {
          id: true,
          locality: true,
          country: true,
          grandPrixDate: true,
          sprintQualifyingDate: true,
          qualifyingDate: true,
          round: true,
        },
      }),
    [],
    {
      tags: [CacheTag.Races],
    },
  )()
}

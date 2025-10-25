import { unstable_cache } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { cache } from 'react'

export async function getNextRace() {
  const undeduplicated = await unstable_cache(
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
      revalidate: 60 * 10,
    },
  )

  return cache(undeduplicated)()
}

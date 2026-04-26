import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { unstable_cache } from 'next/cache'
import { getMostRecent } from './get-most-recent'

export async function getDriverOptions() {
  return await unstable_cache(
    async () =>
      db.query.driversTable.findMany({
        columns: {
          id: true,
          constructorId: true,
          givenName: true,
          familyName: true,
          permanentNumber: true,
        },
        orderBy: (driver, { asc }) => asc(driver.familyName),
      }),
    [],
    {
      tags: [CacheTag.Drivers],
    },
  )()
}

export async function getLastUpdatedDrivers() {
  return unstable_cache(
    async () => {
      const drivers = await db.query.driversTable.findMany({
        columns: {
          lastUpdated: true,
        },
      })

      const lastUpdated = getMostRecent(drivers, 'lastUpdated')
      return lastUpdated
    },
    [],
    {
      tags: [CacheTag.Drivers],
    },
  )()
}

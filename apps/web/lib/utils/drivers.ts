import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { unstable_cache } from 'next/cache'

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

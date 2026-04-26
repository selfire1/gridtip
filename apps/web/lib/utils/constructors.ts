import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { unstable_cache } from 'next/cache'
import { getMostRecent } from './get-most-recent'

export async function getConstructors() {
  return await unstable_cache(() => getConstructors(), [], {
    tags: [CacheTag.Constructors],
  })()

  function getConstructors() {
    return db.query.constructorsTable.findMany({
      columns: {
        id: true,
        name: true,
      },
    })
  }
}

export async function getLastUpdatedConstructors() {
  return unstable_cache(
    async () => {
      const constructors = await db.query.constructorsTable.findMany({
        columns: {
          lastUpdated: true,
        },
      })

      const lastUpdated = getMostRecent(constructors, 'lastUpdated')
      return lastUpdated
    },
    [],
    {
      tags: [CacheTag.Constructors],
    },
  )()
}

export async function getConstructorOptions() {
  return unstable_cache(
    async () =>
      await db.query.constructorsTable.findMany({
        columns: {
          id: true,
          name: true,
        },
        orderBy: (constructor, { asc }) => asc(constructor.name),
      }),
    [],
    {
      tags: [CacheTag.Constructors],
    },
  )()
}

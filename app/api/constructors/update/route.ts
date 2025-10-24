import { CacheTag } from '@/constants/cache'
import { revalidateTag, unstable_cache } from 'next/cache'
import { NextRequest } from 'next/server'
import { createResponse, fetchJolpica, validateToken } from '../../utils'
import { ConstructorsResponse } from '@/types/ergast'
import { db } from '@/db'
import { constructorsTable } from '@/db/schema/schema'
import { sql } from 'drizzle-orm'

export const GET = async (_request: NextRequest) => {
  const validationResponse = await validateToken()
  if (!validationResponse.ok) {
    return validationResponse
  }

  type JolpicaConstructors =
    ConstructorsResponse['MRData']['ConstructorTable']['Constructors']

  const jolpicaConstructors = await getJolpicaConstructors()

  if (!jolpicaConstructors?.length) {
    return createResponse(404, 'No constructors found')
  }

  const isDifferent =
    await getIsThereDifferenceInConstructors(jolpicaConstructors)
  if (!isDifferent) {
    return createResponse(200, 'No update required')
  }

  const ids = await setConstructorsInDatabase(jolpicaConstructors)
  revalidateTag(CacheTag.Constructors)

  return createResponse(201, {
    updated: ids.length,
    received: jolpicaConstructors.length,
  })

  async function getIsThereDifferenceInConstructors(
    newConstructors: JolpicaConstructors,
  ) {
    const getStoredConstructors = unstable_cache(
      async () =>
        await db.query.constructorsTable.findMany({
          columns: {
            id: true,
            name: true,
            nationality: true,
          },
        }),
      [],
      {
        tags: [CacheTag.Constructors],
      },
    )
    const storedConstructors = await getStoredConstructors()

    if (storedConstructors.length !== newConstructors.length) {
      console.log(
        'difference: true',
        storedConstructors.length,
        newConstructors.length,
      )
      return true
    }

    const storedConstructorsMap = new Map(
      storedConstructors.map((constructor) => [constructor.id, constructor]),
    )

    const hasNoDifference = newConstructors.every((newConstructor) => {
      if (!newConstructor.constructorId) {
        // if no id, assume no difference
        return true
      }
      const storedConstructor = storedConstructorsMap.get(
        newConstructor.constructorId,
      )
      if (!storedConstructorsMap.has(newConstructor.constructorId)) {
        // if no stored constructor, assume difference
        return false
      }
      if (
        storedConstructor?.name === newConstructor.name ||
        storedConstructor?.nationality === newConstructor.nationality
      ) {
        // same values => no difference
        return true
      }
      return false
    })
    return !hasNoDifference
  }

  async function getJolpicaConstructors() {
    const response = await fetchJolpica<ConstructorsResponse>(
      '/ergast/f1/2025/constructors/',
    )
    return response.MRData.ConstructorTable.Constructors
  }

  async function setConstructorsInDatabase(constructors: JolpicaConstructors) {
    const returning = await db
      .insert(constructorsTable)
      .values(
        constructors.map((constructor) => {
          if (!constructor.constructorId) {
            throw new Error('No constructorId included')
          }
          return {
            id: constructor.constructorId,
            name: constructor.name,
            nationality: constructor.nationality ?? '',
            lastUpdated: new Date(),
          }
        }),
      )
      .onConflictDoUpdate({
        target: constructorsTable.id,
        set: {
          name: sql`excluded.name`,
          nationality: sql`excluded.nationality`,
          lastUpdated: sql`excluded.last_updated`,
        },
      })

      .returning({
        id: constructorsTable.id,
      })
    return returning
  }
}

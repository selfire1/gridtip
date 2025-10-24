import { CacheTag } from '@/constants/cache'
import { revalidateTag } from 'next/cache'
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

  const constructors = await getConstructors()
  if (!constructors?.length) {
    return createResponse(404, 'No constructors found')
  }

  const ids = await setConstructorsInDatabase(constructors)

  revalidateTag(CacheTag.Constructors)

  return createResponse(201, {
    updated: ids.length,
    received: constructors.length,
  })

  async function getConstructors() {
    const response = await fetchJolpica<ConstructorsResponse>(
      '/ergast/f1/2025/constructors/',
    )
    return response.MRData.ConstructorTable.Constructors
  }

  async function setConstructorsInDatabase(
    constructors: ConstructorsResponse['MRData']['ConstructorTable']['Constructors'],
  ) {
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

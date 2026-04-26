import { createResponse } from '@/app/api/utils'
import { getMaybeSession } from '@/lib/dal'
import { getRaces } from '@/lib/utils/races'
import { GetRaces } from '@gridtip/shared/api-types'
import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  const result = await getMaybeSession()
  if (!result) {
    return createResponse(401, 'Unauthorized')
  }
  try {
    const races = await getRaces()

    if (!races.length) {
      return createResponse(404, 'No races')
    }

    return createResponse(200, {
      races,
    } satisfies GetRaces)
  } catch (error) {
    return createResponse(500, (error as Error).message)
  }
}

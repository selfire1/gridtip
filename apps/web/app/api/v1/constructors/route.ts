import { createResponse } from '@/app/api/utils'
import { getMaybeSession } from '@/lib/dal'
import { getConstructorOptions } from '@/lib/utils/constructors'
import { GetConstructors } from '@gridtip/shared/api-types'
import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  const result = await getMaybeSession()
  if (!result) {
    return createResponse(401, 'Unauthorized')
  }
  try {
    const constructors = await getConstructorOptions()

    if (!constructors.length) {
      return createResponse(404, 'No races')
    }

    return createResponse(200, {
      constructors,
    } satisfies GetConstructors)
  } catch (error) {
    return createResponse(500, (error as Error).message)
  }
}

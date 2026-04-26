import { createResponse } from '@/app/api/utils'
import { getMaybeSession } from '@/lib/dal'
import { getDriverOptions } from '@/lib/utils/drivers'
import { GetDrivers } from '@gridtip/shared/api-types'
import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  const result = await getMaybeSession()
  if (!result) {
    return createResponse(401, 'Unauthorized')
  }
  try {
    const drivers = await getDriverOptions()

    if (!drivers.length) {
      return createResponse(404, 'No races')
    }

    return createResponse(200, {
      drivers,
    } satisfies GetDrivers)
  } catch (error) {
    return createResponse(500, (error as Error).message)
  }
}

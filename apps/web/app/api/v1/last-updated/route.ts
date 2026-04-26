import { getLastUpdatedRaces } from '@/lib/utils/races'
import { NextRequest } from 'next/server'
import { createResponse } from '../../utils'
import { getLastUpdatedConstructors } from '@/lib/utils/constructors'
import { getLastUpdatedDrivers } from '@/lib/utils/drivers'
import { GetLastUpdated } from '@gridtip/shared/api-types'

export async function GET(_request: NextRequest) {
  console.log('last updated hit')
  try {
    const [racesTimestamp, constructorsTimestamp, driversTimestamp] =
      await Promise.all([
        getLastUpdatedRaces(),
        getLastUpdatedConstructors(),
        getLastUpdatedDrivers(),
      ])

    return createResponse(200, {
      races: racesTimestamp.toString(),
      constructors: constructorsTimestamp.toString(),
      drivers: driversTimestamp.toString(),
    } satisfies GetLastUpdated)
  } catch (error) {
    return createResponse(500, (error as Error).message)
  }
}

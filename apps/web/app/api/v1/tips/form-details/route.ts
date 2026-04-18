import { createResponse } from '@/app/api/utils'
import { getMaybeSession } from '@/lib/dal'
import { getConstructorImage } from '@gridtip/shared/get-constructor-image'
import { getConstructorOptions, getDriverOptions } from '@/lib/utils/groups'
import { getNextRace, getRaceDetails } from '@/lib/utils/races'
import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  const result = await getMaybeSession()
  if (!result) {
    return createResponse(401, 'Unauthorized')
  }
  try {
    const nextRace = await getNextRace()
    if (!nextRace) {
      return createResponse(404, 'No next race')
    }
    const drivers = await getDriverOptions()
    const constructors = await getConstructorOptions()

    const race = await getRaceDetails(nextRace.id)
    return createResponse(200, {
      race,
      drivers,
      constructors: constructors.map((constructor) => ({
        ...constructor,
        image: getConstructorImage(constructor.id),
      })),
    })
  } catch (error) {
    return createResponse(500, (error as Error).message)
  }
}

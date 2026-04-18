import { createResponse } from '@/app/api/utils'
import { getMaybeSession } from '@/lib/dal'
import { getGroupsForUser } from '@/lib/utils/groups'
import { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  const result = await getMaybeSession()
  if (!result) {
    return createResponse(401, 'Unauthorized')
  }
  try {
    const groups = await getGroupsForUser(result.user.id)
    return createResponse(200, { groups })
  } catch (error) {
    return createResponse(500, (error as Error).message)
  }
}

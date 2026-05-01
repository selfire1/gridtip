import { createResponse } from '@/app/api/utils'
import { getMaybeSession } from '@/lib/dal'
import type { MeResponse } from '@gridtip/shared/api-types'

export async function GET() {
  const session = await getMaybeSession()
  if (!session) {
    return createResponse(401, 'Unauthorized')
  }

  const { user } = session
  const avatarUrl = user.profileImageUrl ?? user.image ?? null

  return createResponse(200, {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl,
  } satisfies MeResponse)
}

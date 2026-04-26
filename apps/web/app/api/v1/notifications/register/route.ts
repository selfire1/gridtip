import { createResponse } from '@/app/api/utils'
import { db } from '@/db'
import { userPushTokensTable } from '@/db/schema/schema'
import { getMaybeSession } from '@/lib/dal'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios']).default('ios'),
})

export async function POST(request: NextRequest) {
  const session = await getMaybeSession()
  if (!session) {
    return createResponse(401, 'Unauthorized')
  }

  let parsed
  try {
    parsed = bodySchema.parse(await request.json())
  } catch (error) {
    return createResponse(400, (error as Error).message)
  }

  await db
    .insert(userPushTokensTable)
    .values({
      userId: session.user.id,
      token: parsed.token,
      platform: parsed.platform,
    })
    .onConflictDoUpdate({
      target: userPushTokensTable.token,
      set: {
        userId: session.user.id,
        platform: parsed.platform,
        updatedAt: new Date(),
      },
    })

  return createResponse(200, 'ok')
}

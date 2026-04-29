import { createResponse } from '@/app/api/utils'
import { db } from '@/db'
import { user } from '@/db/schema/auth-schema'
import { getMaybeSession } from '@/lib/dal'
import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const session = await getMaybeSession()
  if (!session) {
    return createResponse(401, 'Unauthorized')
  }
  const row = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { enableNotifications: true },
  })
  return createResponse(200, {
    enableNotifications: row?.enableNotifications ?? null,
  })
}

const patchSchema = z.object({
  enableNotifications: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  const session = await getMaybeSession()
  if (!session) {
    return createResponse(401, 'Unauthorized')
  }
  let parsed
  try {
    parsed = patchSchema.parse(await request.json())
  } catch (error) {
    return createResponse(400, (error as Error).message)
  }
  await db
    .update(user)
    .set({ enableNotifications: parsed.enableNotifications })
    .where(eq(user.id, session.user.id))
  return createResponse(200, { enableNotifications: parsed.enableNotifications })
}

import { createResponse } from '@/app/api/utils'
import { db } from '@/db'
import { userPushTokensTable } from '@/db/schema/schema'
import { getMaybeSession } from '@/lib/dal'
import { eq } from 'drizzle-orm'
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

  await db.transaction(async (tx) => {
    const existing = await tx.query.userPushTokensTable.findFirst({
      where: eq(userPushTokensTable.token, parsed.token),
      columns: { id: true, userId: true },
    })

    // A token belongs to one user at a time. If a different user is
    // registering this token, treat it as a device handoff: drop the old
    // row before inserting the new one so we never silently rebind via
    // ON CONFLICT.
    if (existing && existing.userId !== session.user.id) {
      await tx
        .delete(userPushTokensTable)
        .where(eq(userPushTokensTable.id, existing.id))
    }

    await tx
      .insert(userPushTokensTable)
      .values({
        userId: session.user.id,
        token: parsed.token,
        platform: parsed.platform,
      })
      .onConflictDoUpdate({
        target: userPushTokensTable.token,
        set: {
          platform: parsed.platform,
          updatedAt: new Date(),
        },
      })
  })

  return createResponse(200, 'ok')
}

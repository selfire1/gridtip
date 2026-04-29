'use server'

import { db } from '@/db'
import { user } from '@/db/schema/auth-schema'
import { getMaybeSession } from '@/lib/dal'
import type { ServerResponse } from '@/types'
import { and, eq, isNull } from 'drizzle-orm'

export async function enableNotificationsIfUnset(): Promise<ServerResponse> {
  const session = await getMaybeSession()
  if (!session) {
    return { ok: false, message: 'Unauthorized' }
  }

  await db
    .update(user)
    .set({ enableNotifications: true })
    .where(
      and(eq(user.id, session.user.id), isNull(user.enableNotifications)),
    )

  return { ok: true, message: 'ok' }
}

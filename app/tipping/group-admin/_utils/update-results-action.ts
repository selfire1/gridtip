'use server'

import { CacheTag } from '@/constants/cache'
import { verifySession, verifyIsAdmin } from '@/lib/dal'
import { getCurrentGroup } from '@/lib/utils/groups'
import { revalidateTag } from 'next/cache'

export async function updateCache() {
  const { userId: adminUserId } = await verifySession()
  const group = await getCurrentGroup(adminUserId)
  if (!group) {
    return {
      ok: false,
      message: 'No group selected',
    } as const
  }
  const isAdmin = await verifyIsAdmin(group?.id)
  if (!isAdmin) {
    return {
      ok: false,
      message: 'Only admins can create a new tip',
    } as const
  }
  revalidateTag(CacheTag.Predictions)
  return { ok: true }
}

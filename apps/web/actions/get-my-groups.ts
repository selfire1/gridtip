'use server'

import { verifySession } from '@/lib/dal'
import { getGroupsForUser } from '@/lib/utils/groups'

export async function getMyGroups() {
  const { user } = await verifySession()
  return getGroupsForUser(user.id)
}

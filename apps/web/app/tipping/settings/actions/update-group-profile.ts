'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import type { Database } from '@/db/types'
import { verifySession } from '@/lib/dal'
import { UsernameSchema } from '@/lib/schemas/username'

export async function updateGroupMemberName(
  groupId: Database.GroupId,
  name: string,
) {
  const { userId } = await verifySession()

  const parsed = UsernameSchema.safeParse(name)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message }
  }

  await db
    .update(groupMembersTable)
    .set({ userName: parsed.data })
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId),
      ),
    )

  revalidateTag(CacheTag.MyGroupProfile)

  return { ok: true, message: 'Name updated' }
}

export async function removeImage(groupId: Database.GroupId) {
  const { userId } = await verifySession()

  await db
    .update(groupMembersTable)
    .set({ profileImage: null })
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId),
      ),
    )

  revalidateTag(CacheTag.MyGroupProfile)

  return { ok: true, message: 'Removed image' }
}

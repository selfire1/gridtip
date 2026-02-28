'use server'

import 'server-only'
import { eq } from 'drizzle-orm/sql'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { verifySession } from '@/lib/dal'

export async function setCurrentGroupMemberImageToDefaultImage(
  groupId: string,
) {
  const { user } = await verifySession()
  const groupMembership = await db.query.groupMembersTable.findFirst({
    where: (groupMembersTable, { and, eq }) =>
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, user.id),
      ),
    columns: { id: true },
    with: {
      group: { columns: { name: true } },
    },
  })
  if (!groupMembership) {
    throw new Error('Unauthorised')
  }

  await db
    .update(groupMembersTable)
    .set({
      profileImage: user.profileImageUrl,
    })
    .where(eq(groupMembersTable.id, groupMembership.id))

  revalidateTag(CacheTag.MyGroupProfile)
}

export async function revalidateGroupProfile() {
  revalidateTag(CacheTag.MyGroupProfile)
}

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { Database } from '@/db/types'
import { Profile } from '@/types'
import { verifySession } from '../dal'

export async function getGroupProfile(
  group: Pick<Database.Group, 'id'> | undefined,
) {
  const { userId } = await verifySession()
  async function getProfile() {
    if (!group?.id) {
      return
    }
    const groupMemberProfile = await db.query.groupMembersTable.findFirst({
      where(groupMembersTable, { eq, and }) {
        return and(
          eq(groupMembersTable.groupId, group.id),
          eq(groupMembersTable.userId, userId),
        )
      },
    })
    if (!groupMemberProfile) {
      return
    }

    return {
      image: groupMemberProfile?.profileImage || undefined,
      name: groupMemberProfile.userName,
    } satisfies Profile
  }

  const getProfileCached = unstable_cache(
    getProfile,
    [userId, group?.id ?? 'none'],
    {
      tags: [CacheTag.MyGroupProfile],
    },
  )

  const getProfileDedup = cache(getProfileCached)
  return await getProfileDedup()
}

import { Database } from '@/db/types'
import { verifySession } from '../dal'
import { db } from '@/db'
import { cache } from 'react'
import { Profile } from '@/types'
import { unstable_cache } from 'next/cache'
import { CacheTag } from '@/constants/cache'

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

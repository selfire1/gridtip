import { Database } from '@/db/types'
import { verifySession } from '../dal'
import { db } from '@/db'
import { unstable_cache } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { cache } from 'react'
import { Profile } from '@/types'

export async function getCurrentProfile(
  group?: Pick<Database.Group, 'id'>,
): Promise<Profile> {
  const { user, userId } = await verifySession()
  async function getProfile() {
    const defaultProfile = {
      image: user.profileImageUrl || user.image || undefined,
      name: user.name,
    }
    if (!group?.id) {
      return defaultProfile
    }
    const groupMemberProfile = await db.query.groupMembersTable.findFirst({
      where(groupMembersTable, { eq, and }) {
        return and(
          eq(groupMembersTable.groupId, group.id),
          eq(groupMembersTable.userId, userId),
        )
      },
    })

    return {
      image: groupMemberProfile?.profileImage || undefined,
      name: groupMemberProfile?.userName ?? '', // TODO: resolve
    }
  }

  // const getProfileCached = unstable_cache(
  //   getProfile,
  //   [userId, group?.id ?? 'none'],
  //   {
  //     tags: [CacheTag.UserProfile],
  //   },
  // ) FIXME: add cache back in

  const getProfileDedup = cache(getProfile)
  return await getProfileDedup()
}

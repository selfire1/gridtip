import { Database } from '@/db/types'
import { verifySession } from '../dal'
import { db } from '@/db'
import { cache } from 'react'
import { Profile } from '@/types'

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
      name: groupMemberProfile.userName, // TODO: resolve
    } satisfies Profile
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

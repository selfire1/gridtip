import 'server-only'
import { eq } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { GROUP_ID_COOKIE_NAME } from '@/constants'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { Database } from '@/db/types'

export {
  cachedGetGroupsForUser as getGroupsForUser,
  cachedGetCurrentGroup as getCurrentGroup,
}

const cachedGetGroupsForUser = cache(getGroupsForUser)
const cachedGetCurrentGroup = cache(getCurrentGroup)

async function getGroupsForUser(userId: string) {
  return db.query.groupMembersTable.findMany({
    columns: {
      joinedAt: true,
    },
    where: eq(groupMembersTable.userId, userId),
    with: {
      group: {
        columns: {
          id: true,
          name: true,
          iconName: true,
          championshipTipsRevalDate: true,
          constructorsChampionshipPoints: true,
          driversChampionshipPoints: true,
        },
      },
    },
  })
}

export async function getCurrentGroupId() {
  const cookieStore = await cookies()
  const cookieGroupId = cookieStore.get(GROUP_ID_COOKIE_NAME)?.value
  return cookieGroupId
}

async function getCurrentGroup(userId: string) {
  const cookieGroupId = await getCurrentGroupId()
  if (!cookieGroupId) {
    return
  }
  const userWithGroups = await getGroupsForUser(userId)
  return userWithGroups.find(({ group }) => group.id === cookieGroupId)?.group
}

export type GetGroupMembersData = Awaited<ReturnType<typeof getGroupMembers>>
export async function getGroupMembers(groupId: string) {
  return (
    await db.query.groupMembersTable.findMany({
      where: (member, { eq }) => eq(member.groupId, groupId),
      with: {
        user: {
          columns: {
            id: true,
          },
        },
      },
    })
  ).map((member) => {
    return {
      name: member.userName,
      id: member.id,
      profileImageUrl: member.profileImage,
      user: member.user,
    }
  })
}

export async function getGroupMembership({
  userId,
  groupId,
}: {
  userId: string
  groupId: string
}) {
  return await db.query.groupMembersTable.findFirst({
    where: (membership, { eq, and }) =>
      and(eq(membership.groupId, groupId), eq(membership.userId, userId)),
  })
}

export async function getGroupMembershipByMemberId({
  memberId,
  groupId,
}: {
  memberId: string
  groupId: string
}) {
  return await db.query.groupMembersTable.findFirst({
    where: (groupMemberTable, { eq, and }) =>
      and(
        eq(groupMemberTable.groupId, groupId),
        eq(groupMemberTable.id, memberId),
      ),
  })
}

export async function getTargetGroupAndMembership({
  groupId,
  userId,
}: {
  groupId: Database.GroupId
  userId: Database.UserId
}) {
  const membershipInfo = await db.query.groupMembersTable.findFirst({
    where: (group, { eq, and }) =>
      and(
        // group is target group
        eq(group.groupId, groupId),
        // user is member
        eq(group.userId, userId),
      ),
    columns: { id: true },
    with: {
      group: {
        columns: {
          id: true,
          cutoffInMinutes: true,
        },
      },
    },
  })
  if (!membershipInfo) {
    throw new Error('Not a member of group')
  }
  const { group, ...member } = membershipInfo
  return { group, member }
}

import 'server-only'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { eq } from 'drizzle-orm'
import { cache } from 'react'
import { GROUP_ID_COOKIE_NAME } from '@/constants'
import { cookies } from 'next/headers'

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
        },
      },
    },
  })
}

async function getCurrentGroup(userId: string) {
  const cookieStore = await cookies()
  const cookieGroupId = cookieStore.get(GROUP_ID_COOKIE_NAME)?.value
  if (!cookieGroupId) {
    return
  }

  const userWithGroups = await getGroupsForUser(userId)
  return userWithGroups.find(({ group }) => group.id === cookieGroupId)?.group
}

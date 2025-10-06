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

export function getDriverOptions() {
  return db.query.driversTable.findMany({
    columns: {
      id: true,
      constructorId: true,
      givenName: true,
      familyName: true,
    },
    orderBy: (driver, { asc }) => asc(driver.familyName),
  })
}

export function getConstructorOptions() {
  return db.query.constructorsTable.findMany({
    columns: {
      id: true,
      name: true,
    },
    orderBy: (constructor, { asc }) => asc(constructor.name),
  })
}

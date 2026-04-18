import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'
import { auth } from './auth'
import { redirect } from 'next/navigation'
import { QueryOrigin } from '@/constants'
import { Database } from '@/db/types'
import { MemberStatus } from '@/types'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { eq } from 'drizzle-orm'
import { Path } from './utils/path'

export type DalUser = Awaited<ReturnType<typeof verifySession>>['user']
export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user.id) {
    redirect(`${Path.Login}?origin=${QueryOrigin.NotAllowed}`)
  }

  return { isAuth: true, userId: session.user.id, user: session.user }
})

export const getMaybeSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  })
})

export const getMemberStatus = cache(
  async (
    group: Pick<Database.Group, 'adminUser'>,
    members: Pick<Database.GroupMember, 'userId'>[],
  ) => {
    const { userId } = await verifySession()

    if (group.adminUser === userId) {
      return MemberStatus.Admin
    }

    if (members.find((m) => m.userId === userId)) {
      return MemberStatus.Member
    }
  },
)

async function uncachedVerifyIsAdmin(groupId: Database.Group['id']) {
  const membership = await db.query.groupMembersTable.findMany({
    where: eq(groupMembersTable.groupId, groupId),
    columns: {
      userId: true,
    },
    with: {
      group: {
        columns: {
          adminUser: true,
        },
      },
    },
  })

  if (!membership?.length) {
    return {
      isAdmin: false,
      message: 'Not a member of the group',
    }
  }

  const status = await getMemberStatus(membership[0].group, membership)
  if (status !== MemberStatus.Admin) {
    return {
      isAdmin: false,
      message: 'Not an admin of the group',
    }
  }
  return {
    isAdmin: true,
  }
}
export const verifyIsAdmin = cache(uncachedVerifyIsAdmin)

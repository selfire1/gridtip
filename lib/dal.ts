import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'
import { auth } from './auth'
import { redirect } from 'next/navigation'
import { QueryOrigin } from '@/constants'
import { Database } from '@/db/types'
import { MemberStatus } from '@/types'

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user.id) {
    redirect(`/auth?origin=${QueryOrigin.NotAllowed}`)
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

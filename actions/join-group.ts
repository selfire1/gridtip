'use server'

import { GLOBAL_GROUP_ID } from '@/constants/group'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { verifySession } from '@/lib/dal'
import { setGroupCookie } from '@/lib/utils/group-cookie-server'
import z from 'zod'
import { JoinGroupData, JoinGroupSchema } from './join-group-schema'
import * as Sentry from '@sentry/nextjs'

export async function joinGlobalGroup({ userName }: { userName: string }) {
  return await joinGroup({ groupId: GLOBAL_GROUP_ID, userName })
}

export async function joinGroup(data: JoinGroupData) {
  const result = JoinGroupSchema.safeParse(data)
  if (!result.success) {
    console.warn('Invalid join group data', data)
    return {
      ok: false as const,
      message: 'Invalid group id',
    }
  }

  const { user } = await verifySession()

  const groupResult = await findGroup(data)
  if (!groupResult.ok) {
    return {
      ok: false as const,
      message: groupResult.message,
    }
  }
  const group = groupResult.data
  const members = await findMembers(data.groupId)

  const isAlreadyMember = members.some(
    ({ userId: memberUserId }) => memberUserId === user.id,
  )

  if (isAlreadyMember) {
    return {
      ok: false as const,
      message: 'You are already a member of this group',
    }
  }

  try {
    await joinGroup({
      userId: user.id,
      groupId: group.id,
      userName: data.userName,
    })
    await setGroupCookie(group.id)
    return {
      ok: true as const,
      message: 'Joined group',
      group,
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'join-group',
        context: 'server-action',
      },
      extra: {
        userId: user.id,
        groupId: group.id,
      },
    })
    return {
      ok: false as const,
      message: (error as Error)?.message,
    }
  }

  function joinGroup({
    userId,
    groupId,
    userName,
  }: {
    userId: Database.User['id']
    groupId: Database.Group['id']
    userName: Database.GroupMember['userName']
  }) {
    return db.insert(groupMembersTable).values({
      userId: userId,
      groupId: groupId,
      userName,
    })
  }

  function findMembers(groupId: string) {
    return db.query.groupMembersTable.findMany({
      columns: {
        userId: true,
      },
      where(fields, { eq }) {
        return eq(fields.groupId, groupId)
      },
    })
  }
}

const FindGroupSchema = JoinGroupSchema.pick({
  groupId: true,
})
export async function findGroup(data: z.infer<typeof FindGroupSchema>) {
  const result = FindGroupSchema.safeParse(data)
  if (!result.success) {
    console.warn('Invalid find group data', data)
    return {
      ok: false as const,
      message: 'Invalid group id',
      data: null,
    } as const
  }

  const group = await db.query.groupsTable.findFirst({
    columns: {
      id: true,
      name: true,
      iconName: true,
    },
    where(fields, { eq }) {
      return eq(fields.id, data.groupId)
    },
  })

  if (!group) {
    return {
      ok: false as const,
      message: 'Group not found',
      data: null,
    } as const
  }

  return {
    ok: true as const,
    message: '',
    data: group,
  } as const
}

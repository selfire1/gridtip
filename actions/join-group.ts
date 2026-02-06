'use server'

import { GLOBAL_GROUP_ID } from '@/constants/group'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { verifySession } from '@/lib/dal'
import { setGroupCookie } from '@/lib/utils/group-cookie-server'
import z from 'zod'

const schema = z.object({
  groupId: z.string(),
})

export async function joinGlobalGroup() {
  return await joinGroup({ groupId: GLOBAL_GROUP_ID })
}

export async function joinGroup(data: z.infer<typeof schema>) {
  const result = schema.safeParse(data)
  if (!result.success) {
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
    })
    await setGroupCookie(group.id)
    return {
      ok: true as const,
      message: 'Joined group',
      group,
    }
  } catch (error) {
    return {
      ok: false as const,
      message: (error as Error)?.message,
    }
  }

  function joinGroup({
    userId,
    groupId,
  }: {
    userId: Database.User['id']
    groupId: Database.Group['id']
  }) {
    return db.insert(groupMembersTable).values({
      userId: userId,
      groupId: groupId,
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

export async function findGroup(data: z.infer<typeof schema>) {
  const result = schema.safeParse(data)
  if (!result.success) {
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

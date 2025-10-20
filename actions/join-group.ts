'use server'

import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { verifySession } from '@/lib/dal'
import { setGroupCookie } from '@/lib/utils/group-cookie-server'
import z from 'zod'

const schema = z.object({
  groupId: z.string(),
})

export async function joinGroup(data: z.infer<typeof schema>) {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      ok: false,
      message: 'Invalid group id',
    }
  }

  const { user } = await verifySession()

  const group = await findGroup(data.groupId)
  const members = await findMembers(data.groupId)

  if (!group) {
    return {
      ok: false,
      message: 'Group not found',
    }
  }

  const isAlreadyMember = members.some(
    ({ userId: memberUserId }) => memberUserId === user.id,
  )

  if (isAlreadyMember) {
    return {
      ok: false,
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
      ok: true,
      message: 'Joined group',
      group,
    }
  } catch (error) {
    return {
      ok: false,
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

  function findGroup(groupId: string) {
    return db.query.groupsTable.findFirst({
      columns: {
        id: true,
        name: true,
      },
      where(fields, { eq }) {
        return eq(fields.id, groupId)
      },
    })
  }
}

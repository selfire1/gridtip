'use server'

import { verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupMembersTable, groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { schema } from '@/lib/schemas/create-group'

export async function createGroup(data: z.infer<typeof schema>) {
  const { user } = await verifySession()

  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      ok: false,
      error: z.prettifyError(result.error),
      message: 'Invalid data',
    }
  }

  let groupId = undefined as Database.Group['id'] | undefined
  try {
    const [group] = await db
      .insert(groupsTable)
      .values({
        name: data.name,
        iconName: data.icon,
        createdByUser: user.id,
      })
      .returning()
    groupId = group.id
  } catch (error) {
    return {
      ok: false,
      error: (error as Error)?.message,
      message: 'Could not create group',
    }
  }

  try {
    await db.insert(groupMembersTable).values({
      groupId: groupId,
      userId: user.id,
    })
  } catch (error) {
    return {
      ok: false,
      error: (error as Error)?.message,
      message: 'Could not join created group',
    }
  }

  console.log(data)
  return {
    ok: true,
  }
}

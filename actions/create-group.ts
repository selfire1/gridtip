'use server'

import { verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupMembersTable, groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { Schema, schema } from '@/lib/schemas/create-group'
import { setGroupCookie } from '@/lib/utils/group-cookie-server'

export async function createGroup(data: Schema) {
  const { user } = await verifySession()

  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      ok: false as const,
      error: z.prettifyError(result.error),
      message: 'Invalid data',
    }
  }

  let group = undefined as Database.Group | undefined
  try {
    const [createdGroup] = await db
      .insert(groupsTable)
      .values({
        name: data.name,
        iconName: data.icon,
        adminUser: user.id,
        cutoffInMinutes: data.cutoff,
      })
      .returning()
    group = createdGroup
  } catch (error) {
    return {
      ok: false as const,
      error: (error as Error)?.message,
      message: 'Could not create group',
    }
  }

  await setGroupCookie(group.id)

  try {
    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: user.id,
    })
  } catch (error) {
    return {
      ok: false as const,
      error: (error as Error)?.message,
      message: 'Could not join created group',
    }
  }

  return {
    ok: true as const,
    group,
  }
}

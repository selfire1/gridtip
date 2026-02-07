'use server'

import { verifyIsAdmin, verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupsTable } from '@/db/schema/schema'
import { CreateGroupData, CreateGroupSchema } from '@/lib/schemas/create-group'
import { Database } from '@/db/types'
import { eq } from 'drizzle-orm'

export async function editGroup(
  groupId: Database.Group['id'],
  data: CreateGroupData,
) {
  const _session = await verifySession()

  const { isAdmin, message } = await verifyIsAdmin(groupId)
  if (!isAdmin) {
    return {
      ok: false,
      message,
    }
  }

  const result = CreateGroupSchema.safeParse(data)
  if (!result.success) {
    return {
      ok: false,
      error: z.prettifyError(result.error),
      message: 'Invalid data',
    }
  }

  try {
    const [group] = await db
      .update(groupsTable)
      .set({
        name: data.name,
        iconName: data.icon,
        cutoffInMinutes: data.cutoff,
      })
      .where(eq(groupsTable.id, groupId))
      .returning()

    return {
      ok: true,
      group,
    }
  } catch (error) {
    return {
      ok: false,
      error: (error as Error)?.message,
      message: 'Could not update group',
    }
  }
}

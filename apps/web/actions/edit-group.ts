'use server'

import { verifyIsAdmin, verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { eq } from 'drizzle-orm'
import { EditGroupData, EditGroupSchema } from '@/lib/schemas/edit-group'
import * as Sentry from '@sentry/nextjs'

export async function editGroup(
  groupId: Database.Group['id'],
  data: EditGroupData,
) {
  const _session = await verifySession()

  const { isAdmin, message } = await verifyIsAdmin(groupId)
  if (!isAdmin) {
    return {
      ok: false,
      message,
    }
  }

  const result = EditGroupSchema.safeParse(data)
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
    Sentry.captureException(error, {
      tags: {
        operation: 'edit-group',
        context: 'server-action',
      },
      extra: {
        groupId,
      },
    })
    return {
      ok: false,
      error: (error as Error)?.message,
      message: 'Could not update group',
    }
  }
}

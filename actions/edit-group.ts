'use server'

import { getMemberStatus, verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupMembersTable, groupsTable } from '@/db/schema/schema'
import { Schema, schema } from '@/lib/schemas/create-group'
import { Database } from '@/db/types'
import { eq } from 'drizzle-orm'
import { MemberStatus } from '@/types'

export async function editGroup(groupId: Database.Group['id'], data: Schema) {
  const _session = await verifySession()

  const { ok: isAdmin, message } = await verifyIsAdmin()
  if (!isAdmin) {
    return {
      ok: false,
      message,
    }
  }

  const result = schema.safeParse(data)
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

  async function verifyIsAdmin() {
    const membership = await db.query.groupMembersTable.findMany({
      where: eq(groupMembersTable.groupId, groupId),
      columns: {
        userId: true,
      },
      with: {
        group: {
          columns: {
            createdByUser: true,
          },
        },
      },
    })

    if (!membership?.length) {
      return {
        ok: false,
        message: 'Not a member of the group',
      }
    }

    const status = await getMemberStatus(membership[0].group, membership)
    if (status !== MemberStatus.Admin) {
      return {
        ok: false,
        message: 'Not an admin of the group',
      }
    }
    return {
      ok: true,
    }
  }
}

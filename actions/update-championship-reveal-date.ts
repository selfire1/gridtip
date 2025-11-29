'use server'

import { verifyIsAdmin, verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { eq } from 'drizzle-orm'

const schema = z.object({
  championshipTipsRevalDate: z.date().nullable(),
})

type Schema = z.infer<typeof schema>

export async function updateChampionshipRevealDate(
  groupId: Database.Group['id'],
  data: Schema,
) {
  const _session = await verifySession()

  const { isAdmin, message } = await verifyIsAdmin(groupId)
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
      message: 'Invalid date',
    }
  }

  try {
    const [group] = await db
      .update(groupsTable)
      .set({
        championshipTipsRevalDate: data.championshipTipsRevalDate,
      })
      .where(eq(groupsTable.id, groupId))
      .returning()

    return {
      ok: true,
      group,
      message: 'Championship reveal date updated',
    }
  } catch (error) {
    return {
      ok: false,
      error: (error as Error)?.message,
      message: 'Could not update championship reveal date',
    }
  }
}

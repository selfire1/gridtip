'use server'

import { verifyIsAdmin, verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { eq } from 'drizzle-orm'
import * as Sentry from '@sentry/nextjs'
import {
  ChampionshipPointsData,
  ChampionshipPointsSchema,
} from './championship-schema'

export async function updateChampionshipPoints(
  groupId: Database.Group['id'],
  data: ChampionshipPointsData,
) {
  await verifySession()

  const { isAdmin, message } = await verifyIsAdmin(groupId)
  if (!isAdmin) {
    return {
      ok: false,
      message,
    }
  }

  const result = ChampionshipPointsSchema.safeParse(data)
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
        driversChampionshipPoints: data.driversPoints,
        constructorsChampionshipPoints: data.constructorPoints,
      })
      .where(eq(groupsTable.id, groupId))
      .returning()

    return {
      ok: true,
      group,
      message: 'Points updated',
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'update-championship-points',
        context: 'server-action',
      },
      extra: {
        groupId,
      },
    })
    return {
      ok: false,
      error: (error as Error)?.message,
      message: 'Could not update championship points',
    }
  }
}

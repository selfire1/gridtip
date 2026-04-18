'use server'

import { verifySession } from '@/lib/dal'
import z from 'zod'
import { db } from '@/db'
import { groupMembersTable, groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { CreateGroupData, CreateGroupSchema } from '@/lib/schemas/create-group'
import { setGroupCookie } from '@/lib/utils/group-cookie-server'
import * as Sentry from '@sentry/nextjs'

export async function createGroup(data: CreateGroupData) {
  const { user } = await verifySession()

  const result = CreateGroupSchema.safeParse(data)
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
    Sentry.captureException(error, {
      tags: {
        operation: 'create-group-insert',
        context: 'server-action',
      },
      extra: {
        userId: user.id,
        groupName: data.name,
      },
    })
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
      userName: data.userName,
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'create-group-member',
        context: 'server-action',
      },
      extra: {
        userId: user.id,
        groupId: group.id,
      },
    })
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

'use server'

import { captureException } from '@sentry/nextjs'
import { eq } from 'drizzle-orm/sql'
import { OnboardingState } from '@/app/(onboarding)/tipping/onboarding/_lib/onboarding-context'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { verifySession } from '@/lib/dal'
import { createGroup } from './create-group'
import { joinGlobalGroup, joinGroup } from './join-group'

export type Result = {
  icon?: string
  title: string
  description?: string
  ok: boolean
  data: null | unknown
}

export async function setCurrentGroupMemberImageToDefaultImage(
  groupId: string,
) {
  const { user } = await verifySession()
  const groupMembership = await db.query.groupMembersTable.findFirst({
    where: (groupMembersTable, { and, eq }) =>
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, user.id),
      ),
    columns: { id: true },
    with: {
      group: { columns: { name: true } },
    },
  })
  if (!groupMembership) {
    throw new Error('Unauthorised')
  }

  await db
    .update(groupMembersTable)
    .set({
      profileImage: user.profileImageUrl,
    })
    .where(eq(groupMembersTable.id, groupMembership.id))
}

export async function joinOrCreateGroup(
  input: (
    | {
        action: 'create'
        groupData?: OnboardingState['createGroupScreenData']
      }
    | {
        action: 'join'
        groupData?: { id: string | undefined; name: string | undefined }
      }
  ) & {
    userName: string
  },
) {
  if (input.action === 'create' && input.groupData) {
    const result = await createGroup({
      ...input.groupData,
      cutoff: 60,
      userName: input.userName,
    })
    if (!result.ok) {
      const log = {
        ok: false as const,
        title: `Did not create ${input.groupData.name || 'group'}`,
        description: result.message,
        data: null,
      } satisfies Result
      return log
    }
    return {
      ok: true as const,
      title: `Created ${input.groupData.name || 'your group'}`,
      description: 'Invite some friends!',
      data: { group: result.group },
    } satisfies Result
  }
  if (input.action === 'join' && input.groupData?.id) {
    const result = await joinGroup({
      groupId: input.groupData.id,
      userName: input.userName,
    })
    if (!result.ok) {
      return {
        ok: false as const,
        title: `Could not join ${input.groupData.name || 'group'}`,
        description: result.message,
        data: null,
      } satisfies Result
    }
    return {
      ok: true,
      title: `Joined ${input.groupData.name || 'group'}`,
      description: 'Start tipping!',
      data: {
        group: result.group,
      },
    } satisfies Result
  }
  return {
    ok: false as const,
    title: 'Could not join group',
    description: 'No group selected',
    data: null,
  } satisfies Result
}

export async function joinGlobalGroupWrapper(input: { profileName?: string }) {
  await verifySession()
  if (!input.profileName) {
    captureException('No username set for global group')
    return {
      ok: false as const,
      title: 'Could not join global group',
      description: 'No username set',
      data: null,
    } satisfies Result
  }

  const joinGlobalResult = await joinGlobalGroup({
    userName: input.profileName,
  })
  if (!joinGlobalResult.ok) {
    console.error(joinGlobalResult)
    return {
      ok: false,
      title: 'Could not join global group',
      description: 'Please try joining manually later',
      data: null,
    } satisfies Result
  }
  return {
    icon: joinGlobalResult.group.iconName,
    title: 'Joined Global Group',
    description: 'Good luck!',
    data: {
      group: joinGlobalResult.group,
    },
    ok: true as const,
  } satisfies Result
}

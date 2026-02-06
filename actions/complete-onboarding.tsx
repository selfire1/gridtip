'use server'

import { createGroup } from './create-group'
import { Schema as CreateGroupSchema } from '@/lib/schemas/create-group'
import { joinGlobalGroup, joinGroup } from './join-group'
import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { user as userTable } from '@/db/schema/auth-schema'
import { eq } from 'drizzle-orm/sql'
import { groupMembersTable } from '@/db/schema/schema'
import { uploadMaybeFile } from '@/lib/utils/uploadthing'
import { Database } from '@/db/types'
import { ProfileState } from '@/app/(onboarding)/tipping/onboarding/_components/screens/profile-screen'

export type Log = {
  icon?: string
  title: string
  description?: string
  ok: boolean
}

export async function joinOrCreateGroupAndUpdateProfileAction(
  input: (
    | {
        action: 'create'
        groupData?: CreateGroupSchema
      }
    | {
        action: 'join'
        groupData?: { id: string | undefined; name: string | undefined }
      }
  ) & {
    profileData: ProfileState | undefined
  },
) {
  await verifySession()

  const logs = [] as Log[]
  const { log: groupLog, group } = await joinOrCreateGroup()
  if (groupLog) {
    logs.push(groupLog)
  }
  if (!group?.id) {
    console.log('no group id')
    return logs
  }
  const profile = {
    name: input.profileData?.name,
    file: input.profileData?.imageFile,
  }
  console.log({
    group: input.groupData?.name ?? 'none',
    profile,
  })

  const profileResultLogs = await updateProfile(group, {
    name: input.profileData?.name,
    file: input.profileData?.imageFile,
  })

  return [...logs, ...profileResultLogs]

  async function joinOrCreateGroup() {
    if (input.action === 'create' && input.groupData) {
      const result = await createGroup(input.groupData)
      if (!result.ok) {
        const log = {
          ok: false as const,
          title: `Did not create ${input.groupData.name || 'group'}`,
          description: result.message,
        } satisfies Log
        return {
          log,
          group: null,
        }
      }
      return {
        log: {
          ok: true,
          title: `Created ${input.groupData.name || 'your group'}`,
          description: 'Invite some friends!',
        },
        group: result.group,
      }
    }
    if (input.action === 'join' && input.groupData?.id) {
      const result = await joinGroup({ groupId: input.groupData.id })
      if (!result.ok) {
        const log = {
          ok: false as const,
          title: `Could not join ${input.groupData.name || 'group'}`,
          description: result.message,
        }
        return { log, group: null }
      }
      return {
        log: {
          ok: true,
          title: `Joined ${input.groupData.name || 'group'}`,
          description: 'Start tipping!',
        },
        group: result.group,
      }
    }
    return { log: null, group: null }
  }
}

type ProcessGlobalGroupOnboardingInput = {
  shouldJoin: boolean
  profileName?: string
  profileImage?: File
}

export async function processGlobalGroupOnboardingAction(
  input: ProcessGlobalGroupOnboardingInput,
) {
  const logs = [] as Log[]
  if (!input.shouldJoin) {
    return logs
  }

  await verifySession()

  const joinGlobalResult = await joinGlobalGroup()
  if (!joinGlobalResult.ok) {
    logs.push({
      ok: false,
      title: 'Could not join global group',
      description: 'Please try joining manually later',
    })
    return logs
  }
  logs.push({
    icon: joinGlobalResult.group.iconName,
    title: 'Joined Global Group',
    description: 'Good luck!',
    ok: true,
  })
  if (!input.profileImage && !input.profileName) {
    return logs
  }

  const profileResultLogs = await updateProfile(joinGlobalResult.group, {
    name: input.profileName,
    file: input.profileImage,
  })

  console.log('Updated profile for global group')

  return [...logs, ...profileResultLogs]
}

export async function completeProfileOnboardingAction(input: {
  name?: string
  profileImage?: File
}) {
  const { userId } = await verifySession()
  const logs = [] as Log[]

  const imageResult = await uploadMaybeFile(input.profileImage)
  if (!imageResult.ok && input.profileImage) {
    logs.push({ ok: false, title: 'Could not update default image' })
  }

  await db
    .update(userTable)
    .set({
      profileImageUrl: imageResult.data?.ufsUrl || undefined,
      name: input.name || undefined,
      hasSeenOnboarding: true,
    })
    .where(eq(userTable.id, userId))

  console.log('Updated default profile and completed onboarding')

  return logs
}

async function updateProfile(
  group: Pick<Database.Group, 'name' | 'id'>,
  profile: { name?: string; file?: File },
) {
  const { userId } = await verifySession()
  const logs = [] as Log[]
  if (!profile.name && !profile.file) {
    console.log('no input')
    return logs
  }
  const imageResult = await uploadMaybeFile(profile.file)
  if (!imageResult.ok) {
    logs.push({
      ok: false,
      title: `${group.name}: Profile image error`,
      description: 'Could not upload profile image',
    })
  }

  const groupMembership = await db.query.groupMembersTable.findFirst({
    where(table, { eq, and }) {
      return and(eq(table.groupId, group.id), eq(table.userId, userId))
    },
    columns: { id: true },
  })
  if (!groupMembership) {
    logs.push({
      ok: false,
      title: 'Could not update group profile',
    })
    return logs
  }
  await db
    .update(groupMembersTable)
    .set({
      userName: profile.name || undefined,
      profileImage: imageResult.data?.ufsUrl || undefined,
    })
    .where(eq(groupMembersTable.id, groupMembership.id))

  console.log('Updated profile for group', group.id)
  return logs
}

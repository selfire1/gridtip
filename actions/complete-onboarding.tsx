'use server'

import { createGroup } from './create-group'
import { joinGlobalGroup, joinGroup } from './join-group'
import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { user as userTable } from '@/db/schema/auth-schema'
import { eq } from 'drizzle-orm/sql'
import { uploadMaybeFile } from '@/lib/utils/uploadthing'
import { ProfileState } from '@/app/(onboarding)/tipping/onboarding/_components/screens/profile-screen'
import { updateProfile } from './update-profile'
import { OnboardingState } from '@/app/(onboarding)/tipping/onboarding/_lib/onboarding-context'

export type Log = {
  icon?: string
  title: string
  description?: string
  ok: boolean
}

export async function joinOrCreateGroupAndUpdateImage(
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
    profileData: ProfileState | undefined
  },
) {
  const { user } = await verifySession()

  const logs = [] as Log[]
  const profile = {
    name: input.profileData?.name || user.name,
    file: input.profileData?.imageFile,
  }
  if (!profile.name) {
    logs.push({
      ok: false,
      title: 'Could not create group',
      description: 'No username provided',
    })
  }
  const { log: groupLog, group } = await joinOrCreateGroup({
    userName: profile.name,
  })
  if (groupLog) {
    logs.push(groupLog)
  }
  if (!group?.id) {
    console.log('no group id')
    return logs
  }
  console.log({
    group: input.groupData?.name ?? 'none',
    profile,
  })

  // TODO: this check here is not ideal. there is tight coupling. We need to find a better way to track this state reliably
  const hasUserNotRemovedDefaultImage = !!(
    input.profileData?.imagePreview && !input.profileData.imageFile
  )
  const profileResultLogs = await updateProfile(group, {
    file: input.profileData?.imageFile,
    useDefaultImage: hasUserNotRemovedDefaultImage,
  })

  return [...logs, ...profileResultLogs]

  async function joinOrCreateGroup({ userName }: { userName: string }) {
    if (input.action === 'create' && input.groupData) {
      const result = await createGroup({
        ...input.groupData,
        cutoff: 60,
        userName,
      })
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
      if (!input.profileData) {
        const log = {
          ok: false as const,
          title: `Could not join ${input.groupData.name || 'group'}`,
          description: 'No profile data',
        }
        return { log, group: null }
      }
      const result = await joinGroup({
        groupId: input.groupData.id,
        userName: input.profileData.name,
      })
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

export async function joinGlobalGroupIfDesiredAndUpdateImage(input: {
  shouldJoin: boolean
  profileName?: string
  profileImageFile?: File
  profileImagePreview: string | undefined
}) {
  const logs = [] as Log[]
  if (!input.shouldJoin) {
    return logs
  }

  await verifySession()
  if (!input.profileName) {
    console.log('no username for global group')
    logs.push({
      ok: false as const,
      title: 'Could not join global group',
      description: 'No username set',
    })
    return logs
  }

  const joinGlobalResult = await joinGlobalGroup({
    userName: input.profileName,
  })
  if (!joinGlobalResult.ok) {
    console.error(joinGlobalResult)
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
  if (!input.profileImageFile && !input.profileName) {
    return logs
  }

  const hasUserNotRemovedDefaultImage = !!(
    input.profileImagePreview && !input.profileImageFile
  )
  const profileResultLogs = await updateProfile(joinGlobalResult.group, {
    file: input.profileImageFile,
    useDefaultImage: hasUserNotRemovedDefaultImage,
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

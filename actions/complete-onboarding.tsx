'use server'

import { GroupAction } from '@/app/(standalone)/tipping/onboarding/_components/onboarding-client'
import { OnboardingState } from '@/app/(standalone)/tipping/onboarding/_lib/onboarding-context'
import { createGroup } from './create-group'
import { joinGlobalGroup, joinGroup } from './join-group'
import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { user as userTable } from '@/db/schema/auth-schema'
import { eq } from 'drizzle-orm/sql'
import { groupMembersTable } from '@/db/schema/schema'
import { uploadMaybeFile } from '@/lib/utils/uploadthing'

export type Log = {
  icon?: string
  title: string
  description?: string
  ok: boolean
}

export async function completeOnboardingAction(data: OnboardingState) {
  const { user } = await verifySession()
  const action = data.welcomeScreenSelectedGroupStep
  const log = [] as Log[]
  const actionResult = await processGroupAction(action, data)
  if (actionResult.log) {
    log.push(actionResult.log)
  }
  const globalResult = await processGlobalAction(data.globalGroupScreenData)
  if (globalResult.log) {
    log.push(globalResult.log)
  }
  const profileResult = await processProfile({
    default: data.profileDefaultData,
    group: getProfileInfoFromGroup(),
    global: globalResult.group
      ? {
          groupId: globalResult.group.id,
          imageFile: data.profileGlobalGroupData?.imageFile,
          name: data.profileGlobalGroupData?.name,
        }
      : undefined,
  })
  log.push(...profileResult)
  await db
    .update(userTable)
    .set({ hasSeenOnboarding: true })
    .where(eq(userTable.id, user.id))

  return log

  function getProfileInfoFromGroup() {
    if (actionResult.action === 'create' && actionResult.group) {
      const profile = data.profileCreateGroupData
      return {
        groupId: actionResult.group.id,
        imageFile: profile?.imageFile,
        name: profile?.name,
      }
    }
    if (actionResult.action === 'join' && actionResult.group) {
      const profile = data.profileJoinGroupData
      return {
        groupId: actionResult.group.id,
        imageFile: profile?.imageFile,
        name: profile?.name,
      }
    }
  }
}

type ProfileData = { groupId: string; imageFile?: File; name?: string }
async function processProfile({
  default: defaultProfile,
  group,
  global,
}: {
  default?: OnboardingState['profileDefaultData']
  group?: ProfileData
  global?: ProfileData
}) {
  const defaultLogPromise = updateDefaultProfile(defaultProfile)
  const profileLogs = (
    await Promise.all(
      [group, global].filter(Boolean).map((data) => {
        if (!data) {
          return null
        }
        return updateGroupMemberProfile(data)
      }),
    )
  )
    .flat()
    .filter(Boolean) as Log[]

  const defaultLog = await defaultLogPromise
  const logs = [...defaultLog, ...profileLogs]
  return logs
}

async function updateGroupMemberProfile(data: ProfileData) {
  const log = [] as Log[]
  const { userId } = await verifySession()

  const imageResult = await uploadMaybeFile(data?.imageFile)
  if (!imageResult.ok) {
    log.push({
      ok: false,
      title: 'Could not upload default profile image',
      description: imageResult.message,
    })
  }
  console.log('Uploded image for group', data.groupId)
  try {
    const groupMembership = await db.query.groupMembersTable.findFirst({
      where(table, { eq, and }) {
        return and(eq(table.groupId, data.groupId), eq(table.userId, userId))
      },
      columns: {
        id: true,
      },
    })
    if (!groupMembership) {
      console.warn('Could not find group membership')
      log.push({
        ok: false,
        title: 'Could not find update profile',
        description: 'Something went wrong joining this group.',
      })
    }
    await db.update(groupMembersTable).set({
      userName: data.name || undefined,
      profileImage: imageResult.data?.ufsUrl || undefined,
    })
    console.log('Updated profile for group', data.groupId)
  } catch (error) {
    console.warn(error)
    log.push({
      ok: false,
      title: 'Could not update group profile',
      description: (error as Error).message,
    })
  } finally {
    return log
  }
}

async function updateDefaultProfile(
  data: OnboardingState['profileDefaultData'],
) {
  const log = [] as Log[]
  const { userId } = await verifySession()

  const imageResult = await uploadMaybeFile(data?.imageFile)
  if (!imageResult.ok) {
    log.push({
      ok: false,
      title: 'Could not upload default profile image',
      description: imageResult.message,
    })
  }

  console.log('Uploded default profile image')

  try {
    await db
      .update(userTable)
      .set({
        profileImageUrl: imageResult?.data?.ufsUrl || undefined,
        name: data?.name || undefined,
      })
      .where(eq(userTable.id, userId))
    console.log('Updated default profile')
  } catch (error) {
    console.error(error)
    log.push({
      ok: false,
      title: 'Could not update default profile',
      description: (error as Error).message,
    })
  } finally {
    return log
  }
}

async function processGlobalAction(
  data: OnboardingState['globalGroupScreenData'],
) {
  if (!data?.isJoin) {
    return { log: undefined }
  }
  try {
    const result = await joinGlobalGroup()
    if (!result.ok) {
      throw new Error(result.message)
    }
    const log = {
      icon: result.group.iconName,
      title: 'Joined Global Group',
      description: 'Good luck!',
      ok: true as const,
    }
    return { log, group: result.group }
  } catch (error) {
    console.error(error)
    return {
      ok: false as const,
      title: 'Could not join Global Group',
      description: (error as Error).message ?? 'Something went wrong',
    }
  }
}

async function processGroupAction(
  action: GroupAction | undefined,
  data: OnboardingState,
) {
  if (action === 'create') {
    const result = await processCreate(data.createGroupScreenData)
    return {
      ...result,
      action: 'create' as const,
    }
  }
  if (action === 'join') {
    const result = await processJoin(data.joinGroupScreenData)
    return {
      ...result,
      action: 'join' as const,
    }
  }
  return {
    log: undefined,
    action: undefined,
  }
}

async function processJoin(group: OnboardingState['joinGroupScreenData']) {
  if (!group) {
    return { group: null, log: null }
  }
  try {
    const result = await joinGroup({ groupId: group.id })
    if (!result.ok) {
      throw new Error(result.message)
    }
    const log = {
      icon: result.group.iconName,
      title: `Joined ${result.group.name}`,
      description: 'Start tipping!',
      ok: true as const,
    }
    return { log, group: result.group }
  } catch (error) {
    console.error(error)
    const log = {
      title: `Could join ${group.name}`,
      description: (error as Error).message ?? 'Something went wrong',
      ok: false as const,
    }
    return { log, group: null }
  }
}

async function processCreate(
  groupData: OnboardingState['createGroupScreenData'],
) {
  if (!groupData) {
    return { log: undefined, group: undefined }
  }
  try {
    const result = await createGroup(groupData)
    if (!result.ok) {
      throw new Error(result.message)
    }
    const log = {
      icon: result.group.iconName,
      title: `Created ${result.group.name}`,
      description: 'Invite your friends!',
      ok: true as const,
    }
    return { log, group: result.group }
  } catch (error) {
    console.error(error)
    const log = {
      title: `Could not create group ${groupData.name}`,
      description: (error as Error).message ?? 'Something went wrong',
      ok: false as const,
    }
    return { log, group: undefined }
  }
}

'use client'

import { ProfileEditor } from '@/components/profile-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/db/types'
import { updateUserProfile } from '@/actions/update-user-profile'
import { updateGroupMemberProfile } from '@/actions/update-group-member-profile'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'
import { useRouter } from 'next/navigation'

type ProfileSettingsProps = {
  user: Pick<Database.User, 'name'> & {
    profileImageUrl?: string | null
  }
  groups: Array<{
    group: Pick<Database.Group, 'id' | 'name' | 'iconName'>
    memberProfile: {
      name: string
      image: string | null
    }
  }>
}

export function ProfileSettings({ user, groups }: ProfileSettingsProps) {
  const router = useRouter()

  async function handleUserProfileUpdate(data: {
    name: string
    imageFile: File | undefined
    imagePreview: string | undefined
  }) {
    posthog.capture(AnalyticsEvent.PROFILE_UPDATED, {
      profile_type: 'default',
    })

    const result = await updateUserProfile({
      name: data.name,
      imageFile: data.imageFile,
      clearImage: !data.imagePreview && !data.imageFile,
    })

    if (result.ok) {
      router.refresh()
    }

    return result
  }

  async function handleGroupProfileUpdate(
    groupId: string,
    data: {
      name: string
      imageFile: File | undefined
      imagePreview: string | undefined
    }
  ) {
    posthog.capture(AnalyticsEvent.PROFILE_UPDATED, {
      profile_type: 'group',
    })

    const result = await updateGroupMemberProfile({
      groupId,
      name: data.name,
      imageFile: data.imageFile,
      clearImage: !data.imagePreview && !data.imageFile,
    })

    if (result.ok) {
      router.refresh()
    }

    return result
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your profile settings. You can set a default profile and
            customize your profile for each group.
          </CardDescription>
        </CardHeader>
      </Card>

      <ProfileEditor
        title='Default Profile'
        description="This profile is used when you haven't set a custom profile for a group."
        initialName={user.name}
        initialImage={user.profileImageUrl || undefined}
        onSave={handleUserProfileUpdate}
      />

      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Group Profiles</CardTitle>
            <CardDescription>
              Customize your profile for each group you&apos;re a member of.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {groups.map(({ group, memberProfile }) => {
              const isGlobalGroup = group.name === 'Global Leaderboard'

              return (
                <ProfileEditor
                  key={group.id}
                  title={group.name}
                  description="This profile is visible to members of this group."
                  icon={group.iconName}
                  initialName={memberProfile.name}
                  initialImage={memberProfile.image || undefined}
                  isGlobalGroup={isGlobalGroup}
                  onSave={(data) => handleGroupProfileUpdate(group.id, data)}
                />
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

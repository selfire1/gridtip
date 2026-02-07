'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import React, { useMemo } from 'react'
import ScreenLayout from '../screen-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LucideEye } from 'lucide-react'
import { OnboardingState, useOnboarding } from '../../_lib/onboarding-context'
import { JoinGroupData } from '../join-group-form'
import { IconFromName } from '@/components/icon-from-name'
import ProfileFields from '@/components/profile-fields'

export type ProfileState = {
  name: string
  imagePreview: string | undefined
  imageFile: File | undefined
}

export default function ProfileScreen() {
  return (
    <ScreenLayout
      isInitialLoad={false}
      title='Your Profile'
      description={
        <p>
          Customise your details. Members of your group can see your profile
          picture and your name.
        </p>
      }
      content={<ProfileContent />}
    />
  )
}

function ProfileContent() {
  const { state, updateState } = useOnboarding()

  const group = useMemo(() => {
    const global = getGlobalGroup()
    const created = getCreatedGroup()
    const joined = getJoinedGroup()
    return { global, created, joined }

    function getJoinedGroup() {
      if (
        state.welcomeScreenSelectedGroupStep !== 'join' ||
        !state.joinGroupScreenData
      ) {
        return
      }
      return state.joinGroupScreenData satisfies JoinGroupData
    }

    function getCreatedGroup() {
      if (
        state.welcomeScreenSelectedGroupStep !== 'create' ||
        !state.createGroupScreenData
      ) {
        return
      }
      return {
        ...state.createGroupScreenData,
        iconName: state.createGroupScreenData.icon,
        id: 'to-create',
      } satisfies JoinGroupData
    }

    function getGlobalGroup() {
      if (!state.globalGroupScreenData?.isJoin) {
        return
      }
      return {
        name: 'Global Leaderboard',
        // @ts-expect-error special icon
        iconName: 'lucide:globe',
        id: 'global',
      } satisfies JoinGroupData
    }
  }, [state])

  return (
    <div className='w-full max-w-xl space-y-6'>
      {[group.global, group.joined, group.created].some(Boolean) && (
        <GroupCardWrapper>
          {group.global && (
            <div>
              <ProfileCard
                title={group.global.name}
                id={group.global.id}
                description="If a group doesn't have a custom profile set, it will display this profile."
                icon={group.global.iconName}
                {...createProps('profileGlobalGroupData')}
              />
            </div>
          )}
          {group.joined && (
            <ProfileCard
              title={group.joined.name}
              id={group.joined.id}
              icon={group.joined.iconName}
              description="If a group doesn't have a custom profile set, it will display this profile."
              {...createProps('profileJoinGroupData')}
            />
          )}
          {group.created && (
            <ProfileCard
              title={group.created.name}
              id={group.created.id}
              icon={group.created.iconName}
              description="If a group doesn't have a custom profile set, it will display this profile."
              {...createProps('profileCreateGroupData')}
            />
          )}
        </GroupCardWrapper>
      )}
      <ProfileCard
        title='Default Profile'
        description="If a group doesn't have a custom profile set, it will display this profile."
        {...createProps('profileDefaultData')}
      />
    </div>
  )

  function createProps(
    groupKey: keyof Pick<
      OnboardingState,
      | 'profileGlobalGroupData'
      | 'profileJoinGroupData'
      | 'profileCreateGroupData'
      | 'profileDefaultData'
    >,
  ) {
    return {
      name: state[groupKey]?.name ?? '',
      image: state[groupKey]?.imagePreview,

      onNameChange(name: string) {
        updateState({
          [groupKey]: {
            ...state[groupKey],
            name,
          },
        })
      },
      onImageChange(preview: string | undefined, file: File | undefined) {
        updateState({
          [groupKey]: {
            ...state[groupKey],
            imagePreview: preview,
            imageFile: file,
          },
        })
      },
    }
  }
}

function GroupCardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Groups</CardTitle>
        <CardDescription>
          Customise your profile for each group.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>{children}</CardContent>
    </Card>
  )
}

type ProfileCardProps = {
  id?: string
  title: string
  description: string | React.ReactNode
  icon?: string
  name: string
  image: string | undefined
  onNameChange: (name: string) => void
  onImageChange: (preview: string | undefined, file?: File) => void
}

function ProfileCard({
  title,
  description,
  id,
  icon,
  name,
  image,
  onNameChange,
  onImageChange,
}: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {icon && <IconFromName size={18} iconName={icon} />}
          {title}
        </CardTitle>
        <CardDescription>
          {id === 'global' ? (
            <Alert className='mt-2 bg-amber-50 dark:bg-amber-950'>
              <LucideEye />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                <p>
                  This is a <span className='font-medium'> public group</span>.
                  Make sure not to include any private information.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            description
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-8'>
        <ProfileFields
          {...{ id: title, onNameChange, onImageChange, name, image }}
        />
      </CardContent>
    </Card>
  )
}

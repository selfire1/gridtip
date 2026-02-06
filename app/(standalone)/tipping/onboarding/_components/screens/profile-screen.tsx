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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { LucideEye, LucideImageOff, LucideX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OnboardingState, useOnboarding } from '../../_lib/onboarding-context'
import { JoinGroupData } from '../join-group-form'
import { IconFromName } from '@/components/icon-from-name'
import { ALLOWED_TYPES } from '@/lib/utils/file-limits'
import { getFileDataURL } from '@/lib/utils/file-data-url'
import { getCompressedFile } from '@/lib/utils/compress-image'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

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
        // @ts-expect-error  special icon
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
              <pre>{JSON.stringify(state.profileGlobalGroupData, null, 2)}</pre>
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
  const [isProcessingImage, startTransition] = React.useTransition()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    startTransition(async () => {
      try {
        const compressedFile = await getCompressedFile(file)
        const dataUrl = await getFileDataURL(compressedFile)
        onImageChange(dataUrl, compressedFile)
      } catch (error) {
        console.error(error)
        const dataUrl = await getFileDataURL(file)
        onImageChange(dataUrl, file)
      }
    })
  }

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
        <Field>
          <FieldLabel htmlFor={`name-${title}`}>Name</FieldLabel>
          <Input
            autoComplete='name'
            id={`name-${title}`}
            name='name'
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </Field>
        <FieldSet>
          <FieldLegend>Image</FieldLegend>
          <FieldGroup className='flex sm:flex-row'>
            <Field className='sm:w-auto'>
              <span className='sr-only'>Image Preview</span>
              <div className='relative isolate !size-12'>
                <Avatar className={cn('size-12 border border-muted bg-muted')}>
                  <AvatarImage
                    className={cn(
                      isProcessingImage && 'opacity-0',
                      'transition-opacity',
                    )}
                    src={image}
                    alt=''
                  />
                </Avatar>
                {isProcessingImage && (
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <Spinner />
                  </div>
                )}

                {!image && !isProcessingImage ? (
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <LucideImageOff />
                  </div>
                ) : (
                  <Button
                    variant='ghost'
                    disabled={!image}
                    type='button'
                    className='absolute -top-2 -right-2 z-10 rounded-full bg-default shadow-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 hover:dark:bg-red-800 transition-colors'
                    size='icon-xs'
                    aria-label='Remove image'
                    title='Remove image'
                    onClick={() => onImageChange(undefined, undefined)}
                  >
                    <LucideX />
                  </Button>
                )}
              </div>
            </Field>
            <Field className='w-full'>
              <FieldLabel className='sr-only' htmlFor={`image-${title}`}>
                Replace Image
              </FieldLabel>
              <Input
                onChange={handleImageChange}
                disabled={isProcessingImage}
                id={`image-${title}`}
                accept={ALLOWED_TYPES.join(',')}
                name='image'
                type='file'
              />
              <FieldDescription>Select a picture to upload.</FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  )
}

'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import React from 'react'
import ScreenLayout from '../screen-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
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
import { getMyGroups } from '@/actions/get-my-groups'
import { IconFromName } from '@/components/icon-from-name'
import { Skeleton } from '@/components/ui/skeleton'
import { LucideEye, LucideImageOff, LucideX } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ProfileState = {
  name: string
  image: string | undefined
}

type GroupProfileState = {
  [groupId: string]: ProfileState
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
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [isFetching, startFetchTransition] = React.useTransition()

  const [groups, setGroups] =
    React.useState<Awaited<ReturnType<typeof getMyGroups>>>()
  React.useEffect(() => {
    if (!session?.user) {
      return
    }
    startFetchTransition(async () => {
      const groups = await getMyGroups()
      setGroups(groups)
    })
  }, [session])

  const [defaultProfile, setDefaultProfile] = React.useState<ProfileState>({
    name: '',
    image: undefined,
  })
  const [groupProfiles, setGroupProfiles] = React.useState<GroupProfileState>(
    {},
  )

  React.useEffect(() => {
    if (isSessionPending || !session) {
      return
    }
    setDefaultProfile({
      name: session.user.name,
      image: session.user.profileImageUrl || session.user.image || undefined,
    })
  }, [session, isSessionPending])

  const setDefaultName = (name: string) => {
    setDefaultProfile((prev) => ({ ...prev, name }))
  }

  const setDefaultImage = (image: string | undefined) => {
    setDefaultProfile((prev) => ({ ...prev, image }))
  }

  const setGroupName = (groupId: string, name: string) => {
    setGroupProfiles((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], name },
    }))
  }

  const setGroupImage = (groupId: string, image: string | undefined) => {
    setGroupProfiles((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], image },
    }))
  }

  return (
    <div className='w-full max-w-xl space-y-6'>
      <GroupCardWrapper />
      <ProfileCard
        title='Default Profile'
        description="If a group doesn't have a custom profile set, it will display this profile."
        name={defaultProfile.name}
        image={defaultProfile.image}
        onNameChange={setDefaultName}
        onImageChange={setDefaultImage}
      />
    </div>
  )

  function GroupCardWrapper() {
    if (!groups?.length) {
      return <div className='h-48'></div>
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>
            Customise your profile for each group.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {isFetching ? (
            <>
              <Skeleton className='h-32' />
              <Skeleton className='h-32' />
            </>
          ) : (
            <GroupCards />
          )}
        </CardContent>
      </Card>
    )
  }
  function GroupCards() {
    if (!groups?.length) {
      return (
        <p className='text-sm text-muted-foreground italic text-center'>
          No groups
        </p>
      )
    }
    return groups.map(({ group }) => (
      <ProfileCard
        key={group.id}
        id={group.id}
        title={group.name}
        description='This profile will be used only for this group.'
        icon={<IconFromName iconName={group.iconName} size={20} />}
        name={groupProfiles[group.id]?.name ?? defaultProfile.name}
        image={groupProfiles[group.id]?.image ?? defaultProfile.image}
        onNameChange={(name) => setGroupName(group.id, name)}
        onImageChange={(image) => setGroupImage(group.id, image)}
      />
    ))
  }
}

type ProfileCardProps = {
  id?: string
  title: string
  description: string | React.ReactNode
  icon?: React.ReactNode
  name: string
  image: string | undefined
  onNameChange: (name: string) => void
  onImageChange: (image: string | undefined) => void
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
  const [_, startTransition] = React.useTransition()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      startTransition(() => {
        onImageChange(reader.result as string)
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {icon}
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
              <div className='relative'>
                <Avatar className='size-12 border border-muted bg-muted'>
                  <AvatarImage src={image} alt='' />
                </Avatar>

                {!image ? (
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
                    onClick={() => onImageChange(undefined)}
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
                id={`image-${title}`}
                accept='image/*'
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

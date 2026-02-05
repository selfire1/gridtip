'use client'

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
  const [isPending, startTransition] = React.useTransition()

  const { data: session, isPending: isSessionPending } = authClient.useSession()

  const [groups, setGroups] =
    React.useState<Awaited<ReturnType<typeof getMyGroups>>>()
  React.useEffect(() => {
    if (!session?.user) {
      return
    }
    getMyGroups().then(setGroups)
  }, [session])

  const [profileState, setProfileState] = React.useState<{
    name: string
    image: string | undefined
  }>({
    name: '',
    image: undefined,
  })

  React.useEffect(() => {
    if (isSessionPending || !session) {
      return
    }
    setProfileState({
      name: session.user.name,
      image: session.user.profileImageUrl || session.user.image || undefined,
    })
  }, [session, isSessionPending])

  return (
    <div className='w-full max-w-xl'>
      <Card>
        <CardHeader>
          <CardTitle>Default Profile</CardTitle>
          <CardDescription>
            A group uses this profile for you, unless you specify one for that
            group.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-8'>
          <Field>
            <FieldLabel htmlFor='name'>Name</FieldLabel>
            <Input
              autoComplete='name'
              name='name'
              value={profileState.name}
              onChange={(e) =>
                setProfileState((prev) => ({
                  image: prev.image,
                  name: e.target.value,
                }))
              }
            ></Input>
          </Field>
          <FieldSet>
            <FieldLegend>Image</FieldLegend>
            <FieldGroup className='flex sm:flex-row'>
              <Field className='sm:w-auto'>
                <span className='sr-only'>Image Preview</span>
                <div>
                  <Avatar className='relative size-12 border border-muted-foreground'>
                    {' '}
                    <AvatarImage src={profileState.image} alt='' />
                  </Avatar>
                </div>
              </Field>
              <Field className='w-full'>
                <FieldLabel className='sr-only' htmlFor='image'>
                  Replace Image
                </FieldLabel>
                <Input onChange={handleImageChange} name='image' type='file' />
                <FieldDescription>Select a picture to upload.</FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
      <pre>{JSON.stringify(groups, null, 2)}</pre>
    </div>
  )

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      startTransition(() => {
        setProfileState((prev) => ({
          image: reader.result as string,
          name: prev.name,
        }))
      })
    }
    reader.readAsDataURL(file)
  }
}

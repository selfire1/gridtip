'use client'

import { captureException } from '@sentry/nextjs'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import React, { useTransition } from 'react'
import { toast } from 'sonner'
import { IconFromName } from '@/components/icon-from-name'
import ProfileFields from '@/components/profile-fields'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useSetGroupProfileImage } from '@/hooks/use-group-image'
import { authClient } from '@/lib/auth-client'
import {
  revalidateGroupProfile,
  setGroupMemberImageToDefaultImage,
} from '@/lib/image'
import { AnalyticsEvent } from '@/lib/posthog/events'
import { useUploadThing } from '@/lib/uploadthing'
import type { Profile } from '@/types'
import {
  removeImage,
  updateGroupMemberName,
} from '../actions/update-group-profile'

type GroupData = {
  id: string
  name: string
  iconName: string
  profile: Profile
}

type ProfilesProps = {
  defaultProfile: Profile
  groups: GroupData[]
}

export default function Profiles({ defaultProfile, groups }: ProfilesProps) {
  return (
    <div className='space-y-6'>
      {groups.length && (
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>
              Customise your profile for each group.
            </CardDescription>
          </CardHeader>
          <CardContent className='gap-6 grid is-grid-card-fit'>
            {groups.map((group) => (
              <GroupProfileCard
                key={group.id}
                group={group}
                defaultImage={defaultProfile.image}
              />
            ))}
          </CardContent>
        </Card>
      )}
      <DefaultProfileCard defaultProfile={defaultProfile} />
    </div>
  )
}

function GroupProfileCard({
  group,
  defaultImage,
}: {
  group: GroupData
  defaultImage: string | undefined
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { startUpload: startGroupImageUpload } = useSetGroupProfileImage()

  const [name, setName] = React.useState(group.profile.name)
  const [imagePreview, setImagePreview] = React.useState<string | undefined>(
    group.profile.image,
  )
  const [imageFile, setImageFile] = React.useState<File | undefined>(undefined)
  const [shouldUseDefault, setShouldUseDefault] = React.useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IconFromName size={18} iconName={group.iconName} />
          {group.name}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-8'>
        <ProfileFields
          id={group.id}
          name={name}
          image={imagePreview}
          onNameChange={setName}
          onImageChange={handleImageChange}
          imageSlot={
            defaultImage && (
              <Button
                size='sm'
                onClick={applyDefaultImage}
                variant='ghost'
                disabled={shouldUseDefault}
              >
                Use default image
              </Button>
            )
          }
        />

        <div className='flex items-center gap-4 justify-end'>
          <Button onClick={save} disabled={isPending}>
            {isPending && <Spinner />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  function handleImageChange(preview: string | undefined, file?: File) {
    setImagePreview(preview)
    setImageFile(file)
    setShouldUseDefault(false)
  }

  function applyDefaultImage() {
    setImagePreview(defaultImage)
    setImageFile(undefined)
    setShouldUseDefault(true)
  }

  function save() {
    startTransition(async () => {
      try {
        const nameResult = await updateGroupMemberName(group.id, name)
        if (!nameResult.ok) {
          toast.error(nameResult.message)
          return
        }

        await updateImage()

        posthog.capture(AnalyticsEvent.PROFILE_GROUP_UPDATED, {
          name_changed: name !== group.profile.name,
          image_changed: imagePreview !== group.profile.image,
          used_default_image: shouldUseDefault,
        })

        router.refresh()
        toast.success('Group profile updated')

        async function updateImage() {
          if (shouldUseDefault) {
            await setGroupMemberImageToDefaultImage(group.id)
            return
          }
          if (!imagePreview && !imageFile && group.profile.image) {
            console.log('removing image')
            await removeImage(group.id)
            return
          }
          if (!imageFile) {
            return
          }
          await startGroupImageUpload(group.id, {
            file: imageFile,
            useDefaultImage: false,
          })
        }
      } catch (error) {
        captureException(error)
        toast.error('Could not update group profile')
      }
    })
  }
}

function DefaultProfileCard({ defaultProfile }: { defaultProfile: Profile }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { startUpload: startUserImageUpload } = useUploadThing('setUserImage')

  const [name, setName] = React.useState(defaultProfile.name)
  const [imagePreview, setImagePreview] = React.useState<string | undefined>(
    defaultProfile.image,
  )
  const [imageFile, setImageFile] = React.useState<File | undefined>(undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Profile</CardTitle>
      </CardHeader>
      <CardContent className='space-y-8'>
        <ProfileFields
          id='default'
          name={name}
          image={imagePreview}
          onNameChange={setName}
          onImageChange={handleImageChange}
        />
        <Button onClick={save} disabled={isPending}>
          {isPending && <Spinner />}
          Save
        </Button>
      </CardContent>
    </Card>
  )

  function handleImageChange(preview: string | undefined, file?: File) {
    setImagePreview(preview)
    setImageFile(file)
  }

  function save() {
    startTransition(async () => {
      try {
        await authClient.updateUser({ name })

        await updateImage()
        await revalidateGroupProfile()

        posthog.capture(AnalyticsEvent.PROFILE_DEFAULT_UPDATED, {
          name_changed: name !== defaultProfile.name,
          image_changed: Boolean(imageFile),
        })

        router.refresh()
        toast.success('Default profile updated')

        async function updateImage() {
          const isRemoved = defaultProfile.image && !imagePreview
          if (isRemoved) {
            console.log('is removed')
            await authClient.updateUser({
              profileImageUrl: null,
              image: null,
            })
            return
          }

          if (!imageFile) {
            console.log('no image file, no change')
            return
          }
          console.log('uploading image')
          await startUserImageUpload([imageFile])
        }
      } catch (error) {
        captureException(error)
        toast.error('Could not update default profile')
      }
    })
  }
}

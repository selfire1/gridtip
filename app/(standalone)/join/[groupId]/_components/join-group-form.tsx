'use client'

import { joinGroup } from '@/actions/join-group'
import { JoinGroupSchema } from '@/actions/join-group-schema'
import { updateProfile } from '@/actions/update-profile'
import { ButtonText } from '@/components/button-text'
import ProfileFields from '@/components/profile-fields'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Database } from '@/db/types'
import type { DalUser } from '@/lib/dal'
import { getDefaultProfile } from '@/lib/utils/default-profile'
import { LucideChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'

export default function JoinGroupForm({
  groupId,
  user,
}: {
  groupId: Database.Group['id']
  user: DalUser
}) {
  const profile = getDefaultProfile(user)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [name, setName] = useState(profile.name)
  const [image, setImage] = useState<{ preview?: string; file?: File }>({
    preview: profile.image,
    file: undefined,
  })

  return (
    <Card className='shadow-none bg-muted/25'>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>
          This is how the other members will see you.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-8'>
        <ProfileFields
          id={groupId}
          {...{
            name,
            image: image.preview,
            onNameChange: setName,
            onImageChange: (preview, file) => setImage({ preview, file }),
          }}
        />
      </CardContent>
      <CardFooter className='mt-2'>
        <Button className='w-full' disabled={isPending} onClick={requestJoin}>
          <ButtonText
            isPending={isPending}
            pendingText='Joining…'
            label={
              <>
                Join Group
                <LucideChevronRight />
              </>
            }
          />
        </Button>
      </CardFooter>
    </Card>
  )

  async function requestJoin() {
    const validation = JoinGroupSchema.safeParse({
      groupId,
      userName: name,
    })
    if (!validation.success) {
      toast.error(validation.error.message)
      return
    }
    startTransition(async () => {
      const result = await joinGroup(validation.data)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      await updateProfile(result.group, {
        file: image.file,
        useDefaultImage: image.preview === user.profileImageUrl,
      })

      posthog.capture(AnalyticsEvent.GROUP_JOINED_VIA_LINK)

      router.push('/tipping')
      toast.success(
        <p>
          Joined{' '}
          {result.group?.name ? (
            <span className='font-medium'>{result.group?.name}</span>
          ) : (
            'group'
          )}
        </p>,
      )
    })
  }
}

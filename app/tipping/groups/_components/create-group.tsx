'use client'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LucideArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  CreateGroupData,
  CreateGroupDetailsOnlyData,
  CreateGroupSchema,
  validateGroupDetailSchema,
} from '@/lib/schemas/create-group'
import GroupFields, { GroupFieldsProps } from '@/components/group-fields'
import { IconName, SUPPORTED_ICON_NAMES } from '@/constants/icon-names'
import { Database } from '@/db/types'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'
import ProfileFields from '@/components/profile-fields'
import { getDefaultProfile } from '@/lib/utils/default-profile'
import { DalUser } from '@/lib/dal'
import { motion } from 'motion/react'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import z from 'zod'
import { ButtonText } from '@/components/button-text'
import { createGroup } from '@/actions/create-group'
import { updateProfile } from '@/actions/update-profile'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'
import * as Sentry from '@sentry/nextjs'

const ProfileSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(60, 'Too long'),
  imagePreview: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
})
type ProfileData = z.infer<typeof ProfileSchema>

export default function CreateGroup({ user }: { user: DalUser }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Group</CardTitle>
        <CardDescription>
          Start a new group to tip with your{' '}
          <span className='line-through'>rivals</span> friends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateGroupDialog user={user} />
      </CardContent>
    </Card>
  )
}

type GroupDetailsData = Omit<CreateGroupData, 'userName'>

function CreateGroupDialog({ user }: { user: DalUser }) {
  const [open, setOpen] = useState(false)
  const [groupDetails, setGroupDetails] = useState<GroupDetailsData>()
  const [activeSlide, setActiveSlide] = useState<'details' | 'profile'>(
    'details',
  )
  const router = useRouter()

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setGroupDetails(undefined)
        setActiveSlide('details')
      }, 400)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          Create new group
          <LucideArrowUpRight />
        </Button>
      </DialogTrigger>
      <DialogContent className='overflow-y-auto max-h-full'>
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>
            Start a new group to invite people to predict with you.
          </DialogDescription>
        </DialogHeader>
        {activeSlide === 'details' ? (
          <GroupDetailsPage
            isOpen={open}
            onSubmit={(values) => {
              setGroupDetails(values)
              setActiveSlide('profile')
            }}
          />
        ) : (
          <ProfileDetailsPage
            user={user}
            group={groupDetails!}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )

  async function handleSubmit(data: ProfileData) {
    const validation = CreateGroupSchema.safeParse({
      ...groupDetails,
      userName: data.name,
    })
    if (!validation.success) {
      toast.error('Invalid data. Please check fields.', {
        description: z.prettifyError(validation.error),
      })
      return
    }

    let group: Pick<Database.Group, 'name' | 'id'> | undefined = undefined
    try {
      const groupResult = await createGroup(validation.data)
      if (!groupResult.ok) {
        throw new Error(groupResult.message)
      }
      group = groupResult.group
      posthog.capture(AnalyticsEvent.GROUP_CREATED, {
        group_name_length: validation.data.name.length,
      })
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          operation: 'create-group-client',
          context: 'client-component',
        },
      })
      console.error(error)
      toast.error('Could not create group', {
        description: (error as Error)?.message,
      })
      return
    }
    try {
      if (!group) {
        throw new Error('Group not found')
      }

      const logs = await updateProfile(group, {
        file: data.imageFile,
        useDefaultImage: data.imagePreview === user.profileImageUrl,
      })
      const isNotOkay = logs.find((log) => !log.ok)
      if (isNotOkay) {
        throw new Error(isNotOkay.title)
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          operation: 'update-profile-after-group',
          context: 'client-component',
        },
      })
      console.error(error)
      toast.error('Could not update your profile', {
        description: (error as Error)?.message,
      })
      return
    }
    showSuccessToast(group!)
    setOpen(false)
    router.refresh()
  }
}

export function GroupDetailsPage({
  isOpen,
  onSubmit,
}: {
  isOpen: boolean
  onSubmit: (data: CreateGroupDetailsOnlyData) => void
}) {
  const [name, setName] = useState<string>('')
  const [cutoff, setCutoff] = useState<number>(0)
  const [selectedIcon, setSelectedIcon] = useState<IconName>(
    SUPPORTED_ICON_NAMES[0],
  )

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setName('')
        setSelectedIcon(SUPPORTED_ICON_NAMES[0])
        setFormErrors(undefined)
      }, 400)
    }
  }, [isOpen])

  const [formErrors, setFormErrors] = useState<GroupFieldsProps['errors']>()

  const formRef = useRef<HTMLFormElement>(null)
  return (
    <>
      <form
        ref={formRef}
        className='h-[30rem] overflow-y-auto'
        onSubmit={(e) => {
          console.log('submitted')
          e.preventDefault()
          handleSubmit()
        }}
      >
        <GroupFields
          name={{
            name: 'name',
            value: name,
            setValue: setName,
            description: 'The name is visible to people you invite.',
          }}
          icon={{
            name: 'icon',
            value: selectedIcon,
            setValue: setSelectedIcon,
            description: 'You can change the icon later.',
          }}
          cutoff={{
            name: 'cutoff',
            value: cutoff,
            setValue: setCutoff,
            description:
              'How many minutes before qualifying for the race starts should tipping be closed?',
          }}
          errors={formErrors}
        />
      </form>
      <Dots index={0} />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant='outline'>Cancel</Button>
        </DialogClose>
        <Button type='submit' onClick={() => formRef.current?.requestSubmit()}>
          Continue
          <Icon.Continue />
        </Button>
      </DialogFooter>
    </>
  )

  function handleSubmit() {
    setFormErrors(undefined)
    const values = { name, icon: selectedIcon, cutoff }
    const isOk = validateGroupDetailSchema(values, setFormErrors)
    if (!isOk) {
      return
    }
    onSubmit(values)
  }
}

function ProfileDetailsPage({
  user,
  group,
  onSubmit,
}: {
  user: DalUser
  group: Pick<Database.Group, 'name'>
  onSubmit: (data: ProfileData) => Promise<void>
}) {
  const profile = getDefaultProfile(user)
  const [name, setName] = useState(profile.name)
  const [image, setImage] = useState<{ preview?: string; file?: File }>({
    preview: profile.image,
    file: undefined,
  })

  const [isPending, startTransition] = useTransition()

  return (
    <>
      <motion.div
        className='h-[30rem] space-y-6 pt-4'
        initial={{
          x: 8,
          opacity: 0,
        }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ease: 'easeOut', duration: 0.2 }}
      >
        <FieldSet>
          <FieldLegend>Your Group Profile</FieldLegend>
          <FieldDescription>
            Customise your appearance in{' '}
            <span className='font-medium'>{group.name}</span>.
          </FieldDescription>
          <ProfileFields
            id='create'
            {...{
              name,
              image: image.preview,
              onNameChange: setName,
              onImageChange: (preview, file) => setImage({ preview, file }),
            }}
          />
        </FieldSet>
      </motion.div>
      <Dots index={1} />
      <DialogFooter>
        <DialogClose asChild>
          <Button disabled={isPending} variant='outline'>
            Cancel
          </Button>
        </DialogClose>
        <Button disabled={isPending} type='submit' onClick={handleSubmit}>
          <ButtonText
            label='Create Group'
            pendingText='Creating…'
            isPending={isPending}
          />
        </Button>
      </DialogFooter>
    </>
  )

  function handleSubmit() {
    console.log({ image })
    const validation = ProfileSchema.safeParse({
      name,
      imagePreview: image.preview,
      imageFile: image.file,
    })
    if (!validation.success) {
      toast.error('Invalid data. Please check fields.', {
        description: z.prettifyError(validation.error),
      })
      return
    }

    startTransition(async () => await onSubmit(validation.data))
  }
}

function Dots({ index }: { index: 0 | 1 }) {
  return (
    <div className='flex items-center gap-1.5 justify-center'>
      {[0, 1].map((i) => (
        <div
          key={i}
          className={cn(
            'size-2 rounded-full transition-colors',
            i === index ? 'bg-primary' : 'bg-primary/15',
          )}
        />
      ))}
    </div>
  )
}

function showSuccessToast(group: Pick<Database.Group, 'name' | 'id'>) {
  toast.success(
    <p>
      Created <span className='font-semibold'>{group.name}</span>
    </p>,

    {
      action: {
        label: 'Copy invite link',
        onClick: () => {
          navigator.clipboard.writeText(
            `${window.location.origin}/join/${group.id}`,
          )
        },
      },
    },
  )
}

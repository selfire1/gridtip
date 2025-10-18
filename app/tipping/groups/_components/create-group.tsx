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
import { FieldErrors } from '@/components/ui/field'
import { LucideArrowUpRight } from 'lucide-react'
import { IconName, SUPPORTED_ICON_NAMES } from '@/components/icon-from-name'
import { useEffect, useRef, useState, useTransition } from 'react'
import z from 'zod'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { schema, validateSchema } from '@/lib/schemas/create-group'
import { createGroup } from '@/actions/create-group'
import GroupFields, { GroupFieldsProps } from '@/components/group-fields'

export default function CreateGroup({ className }: { className?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create group</CardTitle>
        <CardDescription>
          Start a new group to tip with your{' '}
          <span className='line-through'>rivals</span> friends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateGroupDialog />
      </CardContent>
    </Card>
  )
}

function CreateGroupDialog() {
  const [open, setOpen] = useState(false)

  const [name, setName] = useState<string>('')
  const [cutoff, setCutoff] = useState<number>(0)
  const [selectedIcon, setSelectedIcon] = useState<IconName>(
    SUPPORTED_ICON_NAMES[0],
  )

  const [formErrors, setFormErrors] = useState<GroupFieldsProps['errors']>()

  const formRef = useRef<HTMLFormElement>(null)

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setName('')
        setSelectedIcon(SUPPORTED_ICON_NAMES[0])
        setFormErrors(undefined)
      }, 400)
    }
  }, [open])

  const router = useRouter()

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
        <form
          ref={formRef}
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
            }}
            errors={formErrors}
          />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button
            // isPending
            disabled={isPending}
            type='submit'
            onClick={() => formRef.current?.requestSubmit()}
          >
            {isPending ? <Spinner /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  function handleSubmit() {
    setFormErrors(undefined)

    const values = { name, icon: selectedIcon, cutoff }

    const isOk = validateSchema(values, setFormErrors)
    if (!isOk) {
      return
    }

    startTransition(async () => {
      const response = await createGroup(values)
      if (!response.ok) {
        toast.error(response.message, {
          description: response.error,
        })
        return
      }
      if (!response.group) {
        // this should be caught by earlier conditions
        return
      }
      setOpen(false)
      toast.success(
        <p>
          Created <span className='font-semibold'>{response.group.name}</span>
        </p>,

        {
          action: {
            label: 'Copy invite link',
            onClick: () => {
              navigator.clipboard.writeText(
                `${window.location.origin}/join/${response.group.id}`,
              )
            },
          },
        },
      )
      router.refresh()
    })
  }
}

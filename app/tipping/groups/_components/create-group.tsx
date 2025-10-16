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
import { schema } from '@/lib/schemas/create-group'
import { createGroup } from '@/actions/create-group'
import GroupFields from '@/components/group-fields'

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

  const [selectedIcon, setSelectedIcon] = useState<IconName>(
    SUPPORTED_ICON_NAMES[0],
  )

  const [formErrors, setFormErrors] = useState<{
    name: FieldErrors
    icon: FieldErrors
  }>()

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
            name={name}
            setName={setName}
            selectedIcon={selectedIcon}
            setIcon={setSelectedIcon}
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
    const result = schema.safeParse({ name, icon: selectedIcon })
    if (!result.success) {
      const errors = z.treeifyError(result.error)
      setFormErrors({
        name: errors.properties?.name?.errors?.map((e) => ({ message: e })),
        icon: errors.properties?.icon?.errors?.map((e) => ({ message: e })),
      })
      return
    }

    startTransition(async () => {
      const response = await createGroup({ name, icon: selectedIcon })
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

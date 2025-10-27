'use client'

import { useRef, useState, useTransition } from 'react'
import { MoreHorizontalIcon, LucideEdit2, LucideCog } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Database } from '@/db/types'
import { MemberStatus } from '@/types'
import GroupFields, { GroupFieldsProps } from '@/components/group-fields'
import { validateSchema } from '@/lib/schemas/create-group'
import { editGroup } from '@/actions/edit-group'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { IconName } from '@/constants/icon-names'
import Link from 'next/link'

type GroupProp = Pick<
  Database.Group,
  'id' | 'name' | 'iconName' | 'cutoffInMinutes'
>
export default function EditGroup({
  group,
  status,
}: {
  group: GroupProp
  status: MemberStatus
}) {
  const [showNewDialog, setShowNewDialog] = useState(false)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            aria-label='Open menu'
            size='sm'
            disabled={status !== MemberStatus.Admin}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-40' align='end'>
          <DropdownMenuItem onSelect={() => setShowNewDialog(true)}>
            <LucideEdit2 className='size-4' />
            Edit Group
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/tipping/settings-group'>
              <LucideCog className='size-4' />
              Group settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <EditGroupDialogContent
          {...{ group, close: () => setShowNewDialog(false) }}
        />
      </Dialog>
    </>
  )
}

function EditGroupDialogContent({
  group,
  close: dismiss,
}: {
  group: GroupProp
  close: () => void
}) {
  const router = useRouter()
  const [name, setName] = useState<string>(group.name)
  const [selectedIcon, setSelectedIcon] = useState<IconName>(group.iconName)
  const [cutoff, setCutoff] = useState(group.cutoffInMinutes)

  const [formErrors, setFormErrors] = useState<GroupFieldsProps['errors']>()

  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function resetState() {
    setName(group.name)
    setSelectedIcon(group.iconName)
    setCutoff(group.cutoffInMinutes)
    setFormErrors(undefined)
  }

  return (
    <DialogContent
      className='sm:max-w-[425px] overflow-y-auto max-h-full'
      onCloseAutoFocus={resetState}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onPointerDownOutside={(e) => e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>Edit group</DialogTitle>
        <DialogDescription>
          Update details for <span className='font-medium'>{group.name}</span>
        </DialogDescription>
      </DialogHeader>
      <form
        ref={formRef}
        onSubmit={(e) => {
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
          }}
          cutoff={{
            name: 'cutoff',
            value: cutoff,
            setValue: setCutoff,
            description: 'This applies immediately.',
          }}
          errors={formErrors}
        />
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant='outline'>Cancel</Button>
        </DialogClose>
        <Button
          type='submit'
          disabled={isPending}
          onClick={() => formRef.current?.requestSubmit()}
        >
          {isPending ? <Spinner /> : null}
          Update
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  async function handleSubmit() {
    setFormErrors(undefined)

    const values = { name, icon: selectedIcon, cutoff }
    const isOk = validateSchema(values, setFormErrors)
    if (!isOk) {
      return
    }

    startTransition(async () => {
      const response = await editGroup(group.id, values)
      if (!response.ok) {
        toast.error(response.message, {
          description: response.error,
        })
        return
      }
      dismiss()
      toast.success(
        <p>
          Updated{' '}
          <span className='font-semibold'>
            {response.group?.name ?? 'group'}
          </span>
        </p>,
      )
      router.refresh()
    })
  }
}

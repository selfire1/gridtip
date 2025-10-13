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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { LucideArrowUpRight } from 'lucide-react'
import {
  IconFromName,
  IconName,
  SUPPORTED_ICON_NAMES,
} from '@/components/icon-from-name'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
  return (
    <Dialog>
      <form>
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
          <GroupFields />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button type='submit'>Create</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

function GroupFields() {
  const [selectedIcon, setSelectedIcon] = useState<IconName>(
    SUPPORTED_ICON_NAMES[0],
  )

  return (
    <FieldSet>
      <Field>
        <FieldLabel htmlFor='name'>Name</FieldLabel>
        <Input id='name' autoComplete='off' />
        <FieldDescription>
          The name is visible to people you invite.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Icon</FieldLabel>
        <div
          className='flex flex-wrap gap-2 max-h-48 overflow-y-auto'
          style={{ ['--card-width' as string]: '3rem' }}
        >
          {SUPPORTED_ICON_NAMES.map((icon) => (
            <button
              type='button'
              onClick={(e) => {
                e.preventDefault()
                setSelectedIcon(icon)
              }}
              key={icon}
              className={cn(
                'p-2 border border-transparent hover:bg-secondary rounded-lg transition-all',
                icon === selectedIcon && 'border-default bg-background',
              )}
            >
              <IconFromName
                iconName={icon}
                className={cn(
                  'p-0.5 transition-transform size-6',
                  icon === selectedIcon && 'scale-120',
                )}
              />
            </button>
          ))}
        </div>
        <FieldDescription>You can change the icon later.</FieldDescription>
      </Field>
    </FieldSet>
  )
}

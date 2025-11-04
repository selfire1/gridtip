'use client'

import { PredictionRow } from '../_utils/rows'
import { LucideMoreHorizontal, LucidePen } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTipFormContext } from './edit-tip-context'
import CreateTipDialog from './create-tip-dialog'
import Button from '@/components/button'
import { Button as ShadButton } from '@/components/ui/button'

export default function RowAction({ row }: { row: PredictionRow }) {
  const context = useTipFormContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ShadButton variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <LucideMoreHorizontal className='h-4 w-4' />
        </ShadButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <CreateTipDialog
            {...context}
            defaultValues={{
              userId: row.user.id,
              raceId: row.race.id,
              position: row.position,
              valueId: row.value.id,
            }}
            button={
              <Button
                label='Edit tip'
                icon={LucidePen}
                variant='ghost'
                className='w-full text-start justify-start'
              />
            }
          />
        </DropdownMenuItem>
        <DropdownMenuItem disabled>TODO: Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

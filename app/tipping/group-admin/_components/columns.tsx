'use client'
import { Column, ColumnDef } from '@tanstack/react-table'
import { PredictionRow } from '../_utils/rows'
import DriverOption, { DriverOptionProps } from '@/components/driver-option'
import Constructor, { ConstructorProps } from '@/components/constructor'
import UserAvatar from '@/components/user-avatar'
import { getLabel } from '@/lib/utils/prediction-fields'
import RowAction from './row-action'
import { Button } from '@/components/ui/button'
import { LucideArrowDown, LucideArrowUp, LucideArrowUpDown } from 'lucide-react'
import { RACE_PREDICTION_FIELDS } from '@/constants'
import { Icon } from '@/components/icon'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const columns: ColumnDef<PredictionRow>[] = [
  {
    id: 'user',
    accessorKey: 'userName',
    header: ({ column }) => <SortHeader column={column} label='Name' />,
    cell({
      row: {
        original: {
          user: { name, id },
        },
      },
    }) {
      return (
        <div className='flex items-center gap-1'>
          <UserAvatar name={name} id={id} className='size-4' />
          <p>{name}</p>
        </div>
      )
    },
  },
  {
    id: 'race',
    sortingFn: 'datetime',
    accessorKey: 'raceDate',
    header: ({ column }) => <SortHeader column={column} label='Race' />,
    cell({ row }) {
      return row.original.race.label
    },
  },
  {
    accessorKey: 'value',
    header: 'Tip',
    cell({ row }) {
      const type = row.original.type
      if (type === 'driver') {
        const driver = row.original.value as DriverOptionProps
        return <DriverOption driver={driver} short />
      }
      return (
        <Constructor
          constructor={row.original.value as ConstructorProps}
          classNameImg='size-4'
        />
      )
    },
  },
  {
    accessorKey: 'position',
    id: 'position',
    // header: 'Position',
    header: ({ column }) => <SortHeader column={column} label='Position' />,
    sortingFn: (rowA, roB, columnId) => {
      const fields = RACE_PREDICTION_FIELDS
      return (
        fields.indexOf(roB.getValue(columnId)) -
        fields.indexOf(rowA.getValue(columnId))
      )
    },
    cell({
      row: {
        original: { position },
      },
    }) {
      return getLabel(position, { short: true })
    },
  },
  {
    accessorKey: 'overwrite',
    header: 'Overwrite',
    cell({
      row: {
        original: { overwrite },
      },
    }) {
      switch (overwrite) {
        case 'countAsCorrect':
          return (
            <Tooltip>
              <TooltipTrigger className='flex items-center'>
                <Icon.CorrectTip className='text-success' size={16} />
              </TooltipTrigger>
              <TooltipContent>Scored as correct</TooltipContent>
            </Tooltip>
          )
        case 'countAsIncorrect':
          return (
            <Tooltip>
              <TooltipTrigger className='flex items-center'>
                <Icon.IncorrectTip className='text-destructive' size={16} />
              </TooltipTrigger>
              <TooltipContent>Scored as incorrect</TooltipContent>
            </Tooltip>
          )

        default:
          return <p className='italic text-muted-foreground/50 text-xs'>None</p>
      }
    },
  },
  {
    accessorKey: 'created',
    sortingFn: 'datetime',
    header: ({ column }) => <SortHeader column={column} label='Created' />,
    cell({ row }) {
      const formatter = Intl.DateTimeFormat('en-AU', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
      if (!row.original.created) {
        return
      }
      try {
        return formatter.format(new Date(row.original.created))
      } catch (error) {
        console.log(error, row.original)
        return
      }
    },
  },
  {
    id: 'actions',
    cell({ row }) {
      return <RowAction row={row.original} />
    },
  },
]

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  label: string
}

function SortHeader<TData, TValue>({
  label,
  column,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const currentSort = column.getIsSorted()
  return (
    <Button
      variant='ghost'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      {currentSort === 'asc' ? (
        <LucideArrowUp className='ml-2 h-4 w-4' />
      ) : currentSort === 'desc' ? (
        <LucideArrowDown className='ml-2 h-4 w-4' />
      ) : (
        <LucideArrowUpDown className='ml-2 h-4 w-4' />
      )}
    </Button>
  )
}

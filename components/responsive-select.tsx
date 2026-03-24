'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronsUpDown } from 'lucide-react'
import { Button, ShadButtonProps } from './ui/button'
import { FormControl } from './ui/form'

export function ResponsiveSelect<TItem extends { id: string }>({
  items,
  value,
  onSelect,
  disabled,
  selectLabel,
  searchLabel,
  renderSelected,
  renderItem,
  filter,
}: {
  items: TItem[]
  selectLabel: string
  searchLabel: string
  value: { id: string } | undefined
  onSelect: (item: TItem | undefined) => void
  disabled?: boolean
  renderSelected: (item: TItem) => React.ReactNode
  filter?: (value: string, search: string) => number
  renderItem: (item: TItem, isSelected: boolean) => React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [selected, setSelected] = React.useState<TItem | undefined>(
    items.find((d) => d.id === value?.id),
  )
  React.useEffect(() => {
    setSelected(items.find((d) => d.id === value?.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const triggerButtonProps = {
    selectedItem: selected,
    renderSelected: renderSelected,
    emptyLabel: selectLabel,
    onClick: () => setOpen(true),
    disabled,
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TriggerButton {...triggerButtonProps} />
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0' align='start'>
          <ItemList setOpen={setOpen} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <TriggerButton {...triggerButtonProps} />
      <CommandDialog open={open} onOpenChange={setOpen}>
        <ItemList setOpen={setOpen} />
      </CommandDialog>
    </>
  )

  function ItemList({ setOpen }: { setOpen: (open: boolean) => void }) {
    return (
      <Command filter={filter}>
        <CommandInput placeholder={searchLabel} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={(value) => {
                  onSelect(items.find((item) => item.id === value) || undefined)
                  setOpen(false)
                }}
              >
                {renderItem(item, selected?.id === item.id)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    )
  }
}

function TriggerButton<TItem>({
  selectedItem: selected,
  renderSelected,
  emptyLabel,
  disabled,
  ...props
}: {
  selectedItem: TItem | undefined
  renderSelected(item: TItem): React.ReactNode
  emptyLabel: string
  disabled?: boolean
} & ShadButtonProps) {
  return (
    <FormControl>
      <Button
        type='button'
        variant='outline'
        className='justify-between flex'
        disabled={disabled}
        {...props}
      >
        {selected ? renderSelected(selected) : <EmptyState />}
        <ChevronsUpDown className='opacity-50' />
      </Button>
    </FormControl>
  )
  function EmptyState() {
    return <span>{emptyLabel}</span>
  }
}

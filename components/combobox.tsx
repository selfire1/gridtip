'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronsUpDown, LucideCheck } from 'lucide-react'
// import { FormControl } from '@/components/ui/form'

export function Combobox<
  TItem extends Record<string, unknown> & Record<'id', string>,
>({
  items,
  value,
  getSearchValue,
  onSelect,
  disabled,
  placeholder = 'Search…',
  renderItem,
  emptyText = 'Select',
}: {
  items: TItem[]
  value: string | undefined
  onSelect: (id: TItem['id'] | undefined) => void
  getSearchValue: (item: TItem) => string
  disabled?: boolean
  placeholder?: string
  renderItem: (item: TItem) => React.ReactNode
  emptyText?: string
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [selected, setSelected] = React.useState<TItem | undefined>(
    items.find((d) => d.id === value),
  )
  React.useEffect(() => {
    setSelected(items.find((d) => d.id === value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <TriggerButton type='popover' disabled={disabled} />
        <PopoverContent className='w-[300px] p-0' align='start'>
          <ItemList setOpen={setOpen} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <TriggerButton type='sheet' disabled={disabled} />
      <SheetContent side='bottom'>
        <SheetTitle className='sr-only'>Select Item</SheetTitle>
        <ItemList setOpen={setOpen} />
      </SheetContent>
    </Sheet>
  )

  function ItemList({ setOpen }: { setOpen: (open: boolean) => void }) {
    return (
      <Command>
        <CommandInput placeholder={placeholder} autoFocus={true} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={getSearchValue(item)}
                onSelect={(searchValue) => {
                  onSelect(
                    items.find((item) => getSearchValue(item) === searchValue)
                      ?.id || undefined,
                  )
                  setOpen(false)
                }}
              >
                <div className='flex items-center justify-between w-full'>
                  {renderItem(item)}
                  {value === item.id && <LucideCheck />}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    )
  }

  function TriggerButton({
    type,
    disabled,
  }: {
    type: 'sheet' | 'popover'
    disabled?: boolean
  }) {
    const Trigger = type === 'sheet' ? SheetTrigger : PopoverTrigger
    return (
      <Trigger asChild>
        <Button
          disabled={disabled}
          variant='outline'
          className='justify-between flex'
        >
          {selected ? renderItem(selected) : <EmptyState />}
          <ChevronsUpDown className='opacity-50' />
        </Button>
      </Trigger>
    )
    function EmptyState() {
      return <span>{emptyText}</span>
    }
  }
}

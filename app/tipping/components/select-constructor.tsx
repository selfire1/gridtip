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
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Database } from '@/db/types'
import { ChevronsUpDown, LucideCheck } from 'lucide-react'
import Image from 'next/image'
import { UseFormReturn } from 'react-hook-form'
import { FormControl } from '@/components/ui/form'

export type ConstructorOption = Pick<Database.Constructor, 'id' | 'name'>

export function SelectConstructor({
  constructors,
  value,
  onSelect,
  disabled,
}: {
  constructors: ConstructorOption[]
  value: { id: string } | undefined
  onSelect: (driver: ConstructorOption | undefined) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [selected, setSelected] = React.useState<ConstructorOption | undefined>(
    constructors.find((d) => d.id === value?.id),
  )
  React.useEffect(() => {
    setSelected(constructors.find((d) => d.id === value?.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <TriggerButton selected={selected} type='popover' disabled={disabled} />
        <PopoverContent className='w-[300px] p-0' align='start'>
          <ConstructorsList
            setOpen={setOpen}
            selected={selected}
            setSelected={setSelected}
            constructors={constructors}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <TriggerButton selected={selected} type='drawer' disabled={disabled} />
      <DrawerContent>
        <div className='mt-4 border-t'>
          <ConstructorsList
            setOpen={setOpen}
            selected={selected}
            setSelected={setSelected}
            constructors={constructors}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function TriggerButton({
  selected,
  type,
  disabled,
}: {
  selected: ConstructorOption | undefined
  type: 'drawer' | 'popover'
  disabled?: boolean
}) {
  const Trigger = type === 'drawer' ? DrawerTrigger : PopoverTrigger
  return (
    <Trigger asChild>
      <FormControl>
        <Button
          variant='outline'
          className='justify-between'
          disabled={disabled}
        >
          {selected ? (
            <Option constructor={selected} isSelected={false} />
          ) : (
            <EmptyState />
          )}
          <ChevronsUpDown className='opacity-50' />
        </Button>
      </FormControl>
    </Trigger>
  )
  function EmptyState() {
    return <span>Select constructor</span>
  }
}

function ConstructorsList({
  setOpen,
  setSelected: setSelected,
  selected,
  constructors: constructors,
}: {
  setOpen: (open: boolean) => void
  setSelected: (constructor: ConstructorOption | undefined) => void
  selected: ConstructorOption | undefined
  constructors: ConstructorOption[]
}) {
  return (
    <Command>
      <CommandInput placeholder='Search constructors…' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {constructors.map((constructor) => (
            <CommandItem
              key={constructor.id}
              value={constructor.id}
              onSelect={(value) => {
                setSelected(
                  constructors.find(
                    (constructor) => constructor.id === value,
                  ) || undefined,
                )
                setOpen(false)
              }}
            >
              <Option
                constructor={constructor}
                isSelected={selected?.id === constructor.id}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function Option({
  constructor: constructor,
  isSelected,
}: {
  constructor: ConstructorOption
  isSelected: boolean
}) {
  return (
    <div
      className={[
        'flex items-center gap-2 w-full',
        isSelected ? 'font-semibold' : '',
      ].join(' ')}
    >
      <Image
        width={24}
        height={24}
        alt=''
        src={`/img/constructors/${constructor.id}.avif`}
      />
      <span>{constructor.name}</span>
      {isSelected && <LucideCheck className='ml-auto' />}
    </div>
  )
}

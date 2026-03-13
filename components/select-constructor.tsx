'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { Button, ShadButtonProps } from '@/components/ui/button'
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
import { FormControl } from '@/components/ui/form'
import ConstructorOption, {
  type ConstructorProps,
} from '@/components/constructor'

export function SelectConstructor({
  constructors,
  value,
  onSelect,
  disabled,
}: {
  constructors: ConstructorProps[]
  value: { id: string } | undefined
  onSelect: (driver: ConstructorProps | undefined) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [selected, setSelected] = React.useState<ConstructorProps | undefined>(
    constructors.find((d) => d.id === value?.id),
  )
  React.useEffect(() => {
    setSelected(constructors.find((d) => d.id === value?.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TriggerButton onClick={() => setOpen(true)} disabled={disabled} />
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0' align='start'>
          <ConstructorsList setOpen={setOpen} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <TriggerButton onClick={() => setOpen(true)} disabled={disabled} />
      <CommandDialog open={open} onOpenChange={setOpen}>
        <ConstructorsList setOpen={setOpen} />
      </CommandDialog>
    </>
  )

  function ConstructorsList({ setOpen }: { setOpen: (open: boolean) => void }) {
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
                  onSelect(
                    constructors.find(
                      (constructor) => constructor.id === value,
                    ) || undefined,
                  )
                  setOpen(false)
                }}
              >
                <ConstructorOption
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
}

function TriggerButton({
  selected,
  disabled,
  ...props
}: {
  selected: ConstructorProps | undefined
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
        {selected ? (
          <ConstructorOption constructor={selected} isSelected={false} />
        ) : (
          <EmptyState />
        )}
        <ChevronsUpDown className='opacity-50' />
      </Button>
    </FormControl>
  )
  function EmptyState() {
    return <span>Select constructor</span>
  }
}

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
import { ChevronsUpDown } from 'lucide-react'
import { FormControl } from '@/components/ui/form'
import DriverOption, { DriverOptionProps } from '@/components/driver-option'
// import DriverOption from '@/components/driver-option'

export function SelectDriver({
  drivers,
  value,
  onSelect,
  disabled,
}: {
  drivers: DriverOptionProps[]
  value: { id: string } | undefined
  onSelect: (driver: DriverOptionProps | undefined) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [selected, setSelected] = React.useState<DriverOptionProps | undefined>(
    drivers.find((d) => d.id === value?.id),
  )
  React.useEffect(() => {
    setSelected(drivers.find((d) => d.id === value?.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <TriggerButton type='popover' disabled={disabled} />
        <PopoverContent className='w-[300px] p-0' align='start'>
          <DriverList setOpen={setOpen} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <TriggerButton type='sheet' disabled={disabled} />
      <SheetContent side='bottom'>
        <SheetTitle className='sr-only'>Select Driver</SheetTitle>
        <DriverList setOpen={setOpen} />
      </SheetContent>
    </Sheet>
  )

  function DriverList({ setOpen }: { setOpen: (open: boolean) => void }) {
    return (
      <Command>
        <CommandInput placeholder='Search drivers…' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {drivers.map((driver) => (
              <CommandItem
                key={driver.id}
                value={getName(driver)}
                onSelect={(name) => {
                  onSelect(
                    drivers.find((driver) => getName(driver) === name) ||
                      undefined,
                  )
                  setOpen(false)
                }}
              >
                <DriverOption
                  driver={driver}
                  isSelected={selected?.id === driver.id}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    )

    function getName(driver: DriverOptionProps) {
      return [driver.givenName, driver.familyName].join(' ')
    }
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
        <FormControl>
          <Button
            disabled={disabled}
            variant='outline'
            className='justify-between flex'
          >
            {selected ? (
              <DriverOption driver={selected} isSelected={false} />
            ) : (
              <EmptyState />
            )}
            <ChevronsUpDown className='opacity-50' />
          </Button>
        </FormControl>
      </Trigger>
    )
    function EmptyState() {
      return <span>Select driver</span>
    }
  }
}

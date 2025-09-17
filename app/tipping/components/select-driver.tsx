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
import { FormControl } from '@/components/ui/form'
import DriverLine from '@/components/driver-option'

export type DriverOption = Pick<
  Database.Driver,
  'constructorId' | 'givenName' | 'familyName' | 'id'
>

export function SelectDriver({
  drivers,
  value,
  onSelect,
  disabled,
}: {
  drivers: DriverOption[]
  value: { id: string } | undefined
  onSelect: (driver: DriverOption | undefined) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [selected, setSelected] = React.useState<DriverOption | undefined>(
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
    <Drawer open={open} onOpenChange={setOpen}>
      <TriggerButton type='drawer' disabled={disabled} />
      <DrawerContent>
        <div className='mt-4 border-t'>
          <DriverList setOpen={setOpen} />
        </div>
      </DrawerContent>
    </Drawer>
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

    function getName(driver: DriverOption) {
      return [driver.givenName, driver.familyName].join(' ')
    }
  }

  function TriggerButton({
    type,
    disabled,
  }: {
    type: 'drawer' | 'popover'
    disabled?: boolean
  }) {
    const Trigger = type === 'drawer' ? DrawerTrigger : PopoverTrigger
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

function DriverOption({
  driver,
  isSelected,
}: {
  driver: DriverOption
  isSelected: boolean
}) {
  return (
    <div
      className='flex items-stretch w-full gap-2 before:w-1 before:rounded-full before:bg-(--team-color)'
      style={getStyle()}
    >
      <p className={isSelected ? 'font-semibold' : ''}>
        <span className='text-muted-foreground'>{driver.givenName}</span>
        <span> </span>
        <span>{driver.familyName}</span>
      </p>
      {isSelected && <LucideCheck className='ml-auto' />}
    </div>
  )

  function getStyle() {
    if (!driver.constructorId) {
      return {}
    }
    return {
      ['--team-color' as string]: getConstructorCssVariable(
        driver.constructorId,
      ),
    }

    function getConstructorCssVariable(teamId: string, opacity = 1) {
      const variableName = `--clr-team-${teamId}`
      return `rgba(var(${variableName}), ${opacity})`
    }
  }
}

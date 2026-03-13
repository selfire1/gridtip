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
import DriverOption, { DriverOptionProps } from '@/components/driver-option'
import { TriggerButton } from './select-trigger-button'

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

    const triggerButtonProps = {
    selectedItem: selected,
    renderSelected: renderSelected,
    emptyLabel: 'Select driver',
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
          <DriverList setOpen={setOpen} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <TriggerButton {...triggerButtonProps} />
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DriverList setOpen={setOpen} />
      </CommandDialog>
    </>
  )

    function renderSelected(selected: DriverOptionProps) {
    return <DriverOption driver={selected} isSelected={false} />
  }


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

//   function TriggerButton({
//     disabled,
//     ...props
//   }: {
//     disabled?: boolean
//   } & ShadButtonProps) {
//     return (
//       <FormControl>
//         <Button
//           type='button'
//           disabled={disabled}
//           variant='outline'
//           className='justify-between flex'
//           {...props}
//         >
//           {selected ? (
//             <DriverOption driver={selected} isSelected={false} />
//           ) : (
//             <EmptyState />
//           )}
//           <ChevronsUpDown className='opacity-50' />
//         </Button>
//       </FormControl>
//     )
//     function EmptyState() {
//       return <span>Select driver</span>
//     }
//   }
// }

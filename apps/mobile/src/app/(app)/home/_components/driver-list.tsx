import { getWithoutDiacritics } from '@gridtip/shared/remove-diacritics'
import { Driver } from '@/types'
import { useMemo } from 'react'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Pressable, View } from 'react-native'
import { cn } from '@/lib/utils'
import { getConstructorColor } from '@/lib/constructor'
import { LucideCheck } from 'lucide-react-native'

export default function DriverList({
  query,
  drivers,
  selectedDriverId,
  onSelect,
}: {
  query: string
  drivers: Driver[]
  selectedDriverId: Driver['id'] | undefined
  onSelect: (id: Driver['id'] | undefined) => void
}) {
  const filteredDrivers = useMemo(() => {
    if (!query.trim()) {
      return drivers
    }

    return drivers.filter((driver) => {
      const name = [driver.givenName, driver.familyName].join(' ')
      const normalisedName = getWithoutDiacritics(name).toLowerCase()
      return normalisedName.includes(query.toLowerCase())
    })
  }, [query, drivers])
  if (!filteredDrivers.length) {
    return <Text className="text-center text-muted-foreground">No results</Text>
  }

  return (
    <View>
      {filteredDrivers.map((driver) => {
        const isSelected = driver.id === selectedDriverId
        return (
          <Pressable
            onPress={() => onSelect(driver.id)}
            className={cn('py-3 px-1 rounded-lg')}
            key={driver.id}
          >
            <DriverOption driver={driver} isSelected={isSelected} />
          </Pressable>
        )
      })}
    </View>
  )
}

export function DriverOption({
  driver,
  isSelected,
  className,
}: {
  driver: Driver
  isSelected: boolean
  className?: string
}) {
  return (
    <View className={cn('flex flex-row items-center gap-2', className)}>
      <View
        className="w-1 rounded-full h-[1.5rem]"
        style={{ backgroundColor: getConstructorColor(driver.constructorId).default }}
      />
      <Text>
        <Text className={cn('text-muted-foreground', isSelected && 'font-semibold')}>
          {driver.givenName}
        </Text>{' '}
        <Text className={cn(isSelected && 'font-semibold')}>{driver.familyName}</Text>
      </Text>
      {isSelected && <Icon className="ml-auto text-muted-foreground" as={LucideCheck} size={16} />}
    </View>
  )
}

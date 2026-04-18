import type { Constructor } from '@/types'
import { Image } from 'expo-image'
import { Text } from '@/components/ui/text'
import { useMemo } from 'react'
import { getWithoutDiacritics } from '@gridtip/shared/remove-diacritics'
import { Pressable, View } from 'react-native'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { LucideCheck } from 'lucide-react-native'
import { getConstructorImage } from '@/lib/shared'

export default function ConstructorList({
  query,
  constructors,
  selectedConstructorId,
  onSelect,
}: {
  query: string
  constructors: Constructor[]
  selectedConstructorId: Constructor['id'] | undefined
  onSelect: (id: Constructor['id'] | undefined) => void
}) {
  const filtered = useMemo(() => {
    if (!query.trim()) {
      return constructors
    }

    return constructors.filter((constructor) => {
      const normalisedName = getWithoutDiacritics(constructor.name).toLowerCase()
      return normalisedName.includes(query.toLowerCase())
    })
  }, [query, constructors])

  return (
    <View>
      {filtered.map((constructor) => {
        const isSelected = constructor.id === selectedConstructorId
        return (
          <Pressable
            onPress={() => onSelect(constructor.id)}
            className={cn('py-3 px-1 rounded-lg')}
            key={constructor.id}
          >
            <ConstructorOption constructor={constructor} isSelected={isSelected} />
          </Pressable>
        )
      })}
    </View>
  )
}

export function ConstructorOption({
  constructor,
  isSelected,
  className,
}: {
  constructor: Constructor
  isSelected: boolean
  className?: string
}) {
  return (
    <View className={cn('flex flex-row items-center gap-2', className)}>
      <Image
        source={getConstructorImage(constructor.id)}
        contentFit="contain"
        contentPosition="center"
        style={{
          width: 24,
          height: 24,
        }}
      />
      <Text>
        <Text className={cn(isSelected && 'font-semibold')}>{constructor.name}</Text>
      </Text>
      {isSelected && <Icon className="ml-auto text-muted-foreground" as={LucideCheck} size={16} />}
    </View>
  )
}

import { View, useColorScheme } from 'react-native'
import { Image } from 'expo-image'
import { Text } from '@/components/ui/text'
import { Race } from '@/types'
import { THEME } from '@/lib/theme'
import { dummyRaceMeta } from './dummy'

export function BlurredFlagHeader({ race }: { race: Race }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  const cardColor = THEME[scheme].card
  const cardSoft =
    scheme === 'dark' ? 'hsla(0, 0%, 3.9%, 0.6)' : 'hsla(0, 0%, 100%, 0.6)'

  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden relative">
      <View className="absolute inset-0" style={{ overflow: 'hidden' }}>
        <Image
          source={race.image}
          contentFit="cover"
          blurRadius={20}
          style={{
            width: '100%',
            height: '100%',
            transform: [{ scale: 1.4 }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            experimental_backgroundImage: `linear-gradient(135deg, ${cardSoft} 0%, ${cardColor} 100%)`,
          }}
        />
      </View>

      <View className="flex flex-row gap-4 items-center px-4 py-6">
        <View
          className="border-2 border-border"
          style={{
            width: 60,
            height: 60,
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          <Image
            source={race.image}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <View className="flex flex-col flex-1">
          <Text className="text-muted-foreground text-xs">
            Round {dummyRaceMeta.round} · {dummyRaceMeta.city}
          </Text>
          <Text className="text-2xl font-semibold" numberOfLines={1}>
            {race.raceName}
          </Text>
          <Text className="text-muted-foreground text-xs mt-1">
            Qualifying {dummyRaceMeta.qualifyingDate}
          </Text>
        </View>
      </View>
    </View>
  )
}

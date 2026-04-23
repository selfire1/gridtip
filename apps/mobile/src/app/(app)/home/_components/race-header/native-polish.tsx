import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { Clock, MapPin } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Race } from '@/types'
import { dummyRaceMeta } from './dummy'

export function NativePolishHeader({ race }: { race: Race }) {
  const progress = dummyRaceMeta.round / dummyRaceMeta.totalRounds

  return (
    <View className="bg-card border border-border rounded-2xl px-4 py-5 flex flex-col gap-4">
      <View className="flex flex-row items-start justify-between gap-3">
        <View className="flex flex-col flex-1 gap-2">
          <Text className="text-[11px] tracking-[0.15em] text-muted-foreground font-medium uppercase">
            Round {dummyRaceMeta.round} · {dummyRaceMeta.raceWindowLabel}
          </Text>
          <Text
            className="text-3xl font-semibold tracking-tight"
            numberOfLines={1}
          >
            {race.raceName}
          </Text>
          <View className="flex flex-row items-center gap-1.5">
            <Icon as={MapPin} size={13} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">
              {dummyRaceMeta.circuitName}
            </Text>
          </View>
        </View>

        <View className="relative" style={{ width: 56, height: 56 }}>
          <View
            className="border border-border rounded-xl items-center justify-center"
            style={{ width: 56, height: 56 }}
          >
            <Text className="text-[10px] tracking-[0.18em] text-destructive font-semibold">
              {dummyRaceMeta.monthLabel}
            </Text>
            <Text className="text-2xl font-bold leading-7">
              {dummyRaceMeta.dayLabel}
            </Text>
          </View>
          <View
            className="absolute border-2 border-card overflow-hidden"
            style={{
              width: 22,
              height: 22,
              borderRadius: 9999,
              top: -6,
              right: -6,
            }}
          >
            <Image
              source={race.image}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        </View>
      </View>

      <Pressable className="self-start">
        {({ pressed }) => (
          <View
            className="flex flex-row items-center gap-1.5 rounded-full border border-border px-3 py-1.5 bg-muted/40"
            style={{ opacity: pressed ? 0.7 : 1 }}
          >
            <Icon as={Clock} size={12} className="text-foreground" />
            <Text className="text-xs font-medium">
              {dummyRaceMeta.locksInLabel}
            </Text>
          </View>
        )}
      </Pressable>

      <View className="flex flex-col gap-1.5">
        <View
          className="bg-muted rounded-full overflow-hidden"
          style={{ height: 3 }}
        >
          <View
            className="bg-primary"
            style={{ width: `${progress * 100}%`, height: '100%' }}
          />
        </View>
        <View className="flex flex-row justify-between">
          <Text className="text-[11px] text-muted-foreground">Season</Text>
          <Text className="text-[11px] text-muted-foreground">
            {dummyRaceMeta.round} / {dummyRaceMeta.totalRounds}
          </Text>
        </View>
      </View>
    </View>
  )
}

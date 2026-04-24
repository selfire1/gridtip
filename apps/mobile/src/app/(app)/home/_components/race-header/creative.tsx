import { useEffect } from 'react'
import { View, useColorScheme } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/text'
import { Race } from '@/types'
import { THEME } from '@/lib/theme'
import { dummyRaceMeta } from './dummy'

function PulseDot({ className, size = 8 }: { className?: string; size?: number }) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, { duration: 700 }), -1, true)
  }, [opacity])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View
      className={className}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  )
}

export function CreativeHeader({ race }: { race: Race }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  const bg = THEME[scheme].background
  const bgFade = scheme === 'dark' ? 'hsla(0, 0%, 3.9%, 0)' : 'hsla(0, 0%, 100%, 0)'

  const enter = useSharedValue(0)
  useEffect(() => {
    enter.value = withTiming(1, { duration: 500 })
  }, [enter])
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 16 }],
  }))

  const { days, hours, minutes, seconds } = dummyRaceMeta.countdown
  const pad = (n: number) => n.toString().padStart(2, '0')
  const countdown = `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return (
    <Animated.View
      style={enterStyle}
      className="bg-background border border-border rounded-2xl overflow-hidden relative"
    >
      <View
        className="absolute"
        style={{
          top: -20,
          left: -20,
          right: -20,
          bottom: -20,
          opacity: 0.35,
          transform: [{ rotate: '-6deg' }],
        }}
      >
        <Image
          source={race.image}
          contentFit="cover"
          blurRadius={60}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <LinearGradient
        colors={[bgFade, bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <Text
        className="absolute font-black italic text-foreground"
        style={{
          fontSize: 96,
          lineHeight: 96,
          opacity: 0.07,
          left: -12,
          top: 24,
        }}
      >
        R{dummyRaceMeta.round.toString().padStart(2, '0')}
      </Text>

      <View className="flex flex-row justify-between items-start px-4 pt-4">
        <View>
          <Text className="text-[10px] tracking-[0.25em] text-muted-foreground font-medium">
            ROUND {dummyRaceMeta.round} / {dummyRaceMeta.totalRounds}
          </Text>
        </View>
        <View className="border border-border rounded-md px-2 py-1.5 bg-card/60">
          <View className="flex flex-row items-center gap-1.5">
            <PulseDot className="bg-destructive" size={6} />
            <Text className="text-[9px] tracking-[0.2em] text-muted-foreground font-medium">
              QUALI LOCK
            </Text>
          </View>
          <Text
            className="text-foreground font-semibold mt-0.5"
            style={{
              fontSize: 13,
              fontVariant: ['tabular-nums'],
              letterSpacing: 0.5,
            }}
          >
            {countdown}
          </Text>
        </View>
      </View>

      <View className="px-4 pt-8 pb-4">
        <Text
          className="font-black tracking-tight text-foreground"
          style={{ fontSize: 36, lineHeight: 38 }}
          numberOfLines={2}
        >
          {race.raceName.toUpperCase()}
        </Text>
        <Text className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
          {dummyRaceMeta.circuitName}
        </Text>
      </View>

      <View className="border-t border-border px-4 py-3 flex flex-row items-center justify-between">
        <View className="flex flex-row items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => {
            const isLive = i === 4
            return isLive ? (
              <PulseDot key={i} className="bg-destructive" size={10} />
            ) : (
              <View
                key={i}
                className="bg-muted"
                style={{ width: 10, height: 10, borderRadius: 2 }}
              />
            )
          })}
          <Text className="text-[10px] tracking-[0.2em] text-destructive font-semibold ml-2">
            TIPPING OPEN
          </Text>
        </View>
        <Text className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium">
          {dummyRaceMeta.raceWindowLabel}
        </Text>
      </View>
    </Animated.View>
  )
}

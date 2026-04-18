import { View } from 'react-native'
import { Image } from 'expo-image'
import { Text } from '@/components/ui/text'
import { Race } from '@/types'

export default function Header({ race }: { race: Race }) {
  return (
    <View className="bg-background border border-border flex flex-row gap-6 items-center px-4 py-8 border-b justify-start relative">
      <View
        className="border border-border"
        style={{
          flex: 1,
          maxWidth: 60,
          maxHeight: 60,
          minWidth: 60,
          minHeight: 60,
          overflow: 'hidden',
          borderRadius: '100%',
          borderWidth: 2,
        }}
      >
        <Image
          source={race.image}
          contentFit="cover"
          contentPosition="center"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>
      <View className="flex flex-col">
        <Text className="text-muted-foreground">Your tips for the</Text>
        <Text className="text-2xl font-medium">{race.raceName}</Text>
      </View>
    </View>
  )
}

import { Stack } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Race } from '@/types'
import { BlurredFlagHeader } from './_components/race-header/blurred-flag'
import { NativePolishHeader } from './_components/race-header/native-polish'
import { CreativeHeader } from './_components/race-header/creative'

const sampleRace: Race = {
  id: 'preview',
  country: 'Saudi Arabia',
  raceName: 'Saudi Arabian Grand Prix',
  image: 'https://www.flagcolorcodes.com/data/flag-of-saudi-arabia.png',
  isSprint: false,
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <View className="flex flex-col gap-2">
      <Text className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase font-medium">
        {label}
      </Text>
      {children}
    </View>
  )
}

export default function RaceHeaderPreviewScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Header designs', headerTitle: 'Header designs' }} />
      <ScrollView
        className="bg-background"
        contentContainerStyle={{ padding: 16, gap: 28, paddingBottom: 64 }}
      >
        <Section label="1 · Blurred flag + gradient">
          <BlurredFlagHeader race={sampleRace} />
        </Section>
        <Section label="2 · Native polish">
          <NativePolishHeader race={sampleRace} />
        </Section>
        <Section label="3 · Creative HUD">
          <CreativeHeader race={sampleRace} />
        </Section>
      </ScrollView>
    </>
  )
}

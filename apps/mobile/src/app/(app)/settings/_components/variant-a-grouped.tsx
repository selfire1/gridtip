import { Pressable, ScrollView, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useSession } from '@/lib/ctx'
import NotificationToggle from './notification-toggle'
import ProfileSummary from './profile-summary'
import GroupsList from './groups-list'

export default function VariantAGrouped() {
  const { signOut } = useSession()

  return (
    <ScrollView className="flex-1 bg-background">
      <Section label="Profile">
        <ProfileSummary />
      </Section>

      <Section label="Notifications">
        <NotificationToggle />
      </Section>

      <Section label="Groups">
        <GroupsList />
      </Section>

      <Section label="Account">
        <Pressable onPress={signOut} className="px-4 py-3 active:bg-accent">
          <Text className="text-base text-destructive font-medium">Sign out</Text>
        </Pressable>
      </Section>

      <View className="h-8" />
    </ScrollView>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mt-4">
      <Text
        variant="muted"
        className="text-xs uppercase tracking-wider px-5 mb-1.5"
      >
        {label}
      </Text>
      <View className="mx-4 rounded-xl bg-card border border-border overflow-hidden">
        {children}
      </View>
    </View>
  )
}

import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useSession } from '@/lib/ctx'
import { Redirect } from 'expo-router'
import { Text } from '@/components/ui/text'

export default function TabLayout() {
  const { session, isLoading } = useSession()

  if (isLoading) {
    return <Text>Loading…</Text>
  }
  if (!session) {
    return <Redirect href="/auth/sign-in" />
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="other">
        <NativeTabs.Trigger.Icon sf="link" md="settings" />
        <NativeTabs.Trigger.Label>Other</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

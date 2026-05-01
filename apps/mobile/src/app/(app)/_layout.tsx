import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useSession } from '@/lib/ctx'
import { Redirect, router, type Href } from 'expo-router'
import { Text } from '@/components/ui/text'
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { registerPushTokenIfGranted } from '@/lib/notifications'

export default function TabLayout() {
  const { session, isLoading } = useSession()
  const lastNotificationResponse = Notifications.useLastNotificationResponse()

  useEffect(() => {
    if (!session) return
    registerPushTokenIfGranted(session).catch((error) => {
      console.warn('push token registration failed', error)
    })
  }, [session])

  useEffect(() => {
    if (!session || !lastNotificationResponse) return
    if (lastNotificationResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
      return
    const url = lastNotificationResponse.notification.request.content.data?.url
    if (typeof url !== 'string') return
    router.push(url as Href)
  }, [session, lastNotificationResponse])

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

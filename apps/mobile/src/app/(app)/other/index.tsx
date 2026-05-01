import { Text } from '@/components/ui/text'
import { useSession } from '@/lib/ctx'
import { getWebUrl } from '@/lib/url'
import { getNotificationPreferences, setNotificationPreferences } from '@/lib/api'
import { requestPermissionAndRegisterPushToken } from '@/lib/notifications'
import { webRoutes, type WebRouteKey } from '@gridtip/shared/routes'
import { Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Notifications from 'expo-notifications'
import { Alert, Linking, Pressable, ScrollView, Switch, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type LinkItem = {
  title: string
  routeKey: WebRouteKey
}

const links: LinkItem[] = [
  { title: 'Leaderboard', routeKey: 'leaderboard' },
  { title: 'Championships', routeKey: 'championships' },
  { title: 'Groups', routeKey: 'groups' },
  { title: 'Rules & Scoring', routeKey: 'rules' },
  { title: 'Settings', routeKey: 'settings' },
  { title: 'Feedback', routeKey: 'feedback' },
  { title: 'Privacy', routeKey: 'privacy' },
]

export default function Other() {
  const { session, signOut } = useSession()

  function openLink(routeKey: WebRouteKey) {
    WebBrowser.openBrowserAsync(getWebUrl(webRoutes[routeKey]))
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Other' }} />
      <ScrollView>
        <View>
          {session ? <NotificationToggle /> : null}
          {links.map((link) => (
            <Pressable key={link.routeKey} onPress={() => openLink(link.routeKey)}>
              <Text>{link.title}</Text>
            </Pressable>
          ))}
          <Pressable onPress={signOut}>
            <Text>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  )
}

function NotificationToggle() {
  const { session } = useSession()
  const queryClient = useQueryClient()

  const prefsOpts = queryOptions({
    queryKey: ['notification-preferences', session],
    queryFn: () => getNotificationPreferences(session!),
    enabled: !!session,
  })

  const prefsQuery = useQuery(prefsOpts)

  const { mutate } = useMutation({
    mutationFn: (next: boolean) => setNotificationPreferences(session!, next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: prefsOpts.queryKey })
      const previous = queryClient.getQueryData(prefsOpts.queryKey)
      queryClient.setQueryData(prefsOpts.queryKey, { enableNotifications: next })
      return { previous }
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(prefsOpts.queryKey, context.previous)
      }
      Alert.alert('Could not save preference', 'Please try again later.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: prefsOpts.queryKey })
    },
  })

  const value = prefsQuery.data?.enableNotifications ?? false

  useFocusEffect(
    useCallback(() => {
      if (!session) return
      let cancelled = false
      ;(async () => {
        const { status } = await Notifications.getPermissionsAsync()
        if (cancelled) return
        const prefs = queryClient.getQueryData<{ enableNotifications: boolean }>(prefsOpts.queryKey)
        if (status !== 'granted' && prefs?.enableNotifications) {
          mutate(false)
        }
      })()
      return () => {
        cancelled = true
      }
    }, [session, queryClient, prefsOpts.queryKey, mutate]),
  )

  async function handleToggle(next: boolean) {
    if (!next) {
      mutate(false)
      return
    }

    const { status } = await Notifications.getPermissionsAsync()
    if (status === 'denied') {
      Alert.alert(
        'Notifications disabled',
        'To receive race reminders, enable notifications for GridTip in iOS Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      )
      return
    }

    try {
      const result = await requestPermissionAndRegisterPushToken(session!)
      if (result.ok) {
        mutate(true)
        return
      }
      if (result.status === 'denied') {
        return
      }
      Alert.alert('Cannot enable notifications', 'Please try again later.')
    } catch {
      Alert.alert('Cannot enable notifications', 'Please try again later.')
    }
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <Text>Race reminders</Text>
      <Switch value={value} onValueChange={handleToggle} disabled={prefsQuery.isLoading} />
    </View>
  )
}

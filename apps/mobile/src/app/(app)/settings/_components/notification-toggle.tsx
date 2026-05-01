import { Text } from '@/components/ui/text'
import { useSession } from '@/lib/ctx'
import { getNotificationPreferences, setNotificationPreferences } from '@/lib/api'
import { requestPermissionAndRegisterPushToken } from '@/lib/notifications'
import * as Notifications from 'expo-notifications'
import { Alert, Linking, Switch, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function NotificationToggle() {
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
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-1 pr-3">
        <Text className="text-base">Race reminders</Text>
        <Text variant="muted" className="text-xs mt-0.5">
          Notify me before qualifying and the race
        </Text>
      </View>
      <Switch value={value} onValueChange={handleToggle} disabled={prefsQuery.isLoading} />
    </View>
  )
}

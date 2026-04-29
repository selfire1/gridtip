import { Text } from '@/components/ui/text'
import { useSession } from '@/lib/ctx'
import { getWebUrl } from '@/lib/url'
import {
  getNotificationPreferences,
  setNotificationPreferences,
} from '@/lib/api'
import { webRoutes, type WebRouteKey } from '@gridtip/shared/routes'
import { Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Pressable, ScrollView, Switch, View } from 'react-native'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

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

  const prefsQuery = useQuery(
    queryOptions({
      queryKey: ['notification-preferences', session?.token],
      queryFn: () => getNotificationPreferences(session!),
      enabled: !!session,
    }),
  )

  const mutation = useMutation({
    mutationFn: (next: boolean) => setNotificationPreferences(session!, next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({
        queryKey: ['notification-preferences', session?.token],
      })
      const previous = queryClient.getQueryData([
        'notification-preferences',
        session?.token,
      ])
      queryClient.setQueryData(
        ['notification-preferences', session?.token],
        { enableNotifications: next },
      )
      return { previous }
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['notification-preferences', session?.token],
          context.previous,
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences', session?.token],
      })
    },
  })

  const value = prefsQuery.data?.enableNotifications ?? false

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
      <Switch
        value={value}
        onValueChange={(next) => mutation.mutate(next)}
        disabled={prefsQuery.isLoading}
      />
    </View>
  )
}

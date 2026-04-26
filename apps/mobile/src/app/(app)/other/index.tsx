import { Text } from '@/components/ui/text'
import { useSession } from '@/lib/ctx'
import { getWebUrl } from '@/lib/url'
import { webRoutes, type WebRouteKey } from '@gridtip/shared/routes'
import { Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Pressable, ScrollView, View } from 'react-native'

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
  const { signOut } = useSession()

  function openLink(routeKey: WebRouteKey) {
    WebBrowser.openBrowserAsync(getWebUrl(webRoutes[routeKey]))
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Other' }} />
      <ScrollView>
        <View>
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

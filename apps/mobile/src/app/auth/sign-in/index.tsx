import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Stack, useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import * as WebBrowser from 'expo-web-browser'
import { Icon } from '@/components/ui/icon'
import { LucideAlertTriangle, LucideArrowUpRight } from 'lucide-react-native'
import { useState } from 'react'
import { getWebUrl } from '@/lib/url'

export default function SignInScreen() {
  const [hasError, setHasError] = useState(false)
  const router = useRouter()

  return (
    <Stack.Screen options={{ title: 'Sign in', headerTitle: 'Sign in' }}>
      <View className="bg-background flex flex-1 items-center justify-center gap-8 mx-4">
        <View className="flex flex-col gap-2 items-center">
          <View className="flex flex-col gap-2 items-center">
            <Text className="text-sm text-muted-foreground">Welcome to GridTip Mobile</Text>
            <Text className="font-semibold text-3xl">Log in to get started</Text>
          </View>
          <Text className="text-muted-foreground text-center">
            Log into your GridTip web account to access your data in the app.
          </Text>
        </View>

        {hasError && (
          <Alert variant="destructive" icon={LucideAlertTriangle}>
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              The login failed. Please try again. If this error persists, please contact us.
            </AlertDescription>
          </Alert>
        )}
        <Button size="lg" onPress={openToLogin}>
          <Text>Log in</Text>
          <Icon size={16} as={LucideArrowUpRight} />
        </Button>
      </View>
    </Stack.Screen>
  )

  async function openToLogin() {
    setHasError(false)
    const url = getWebUrl('/auth/mobile-app')
    const result = await WebBrowser.openAuthSessionAsync(url, 'gridtip://set-token')
    if (result.type !== 'success' || !result.url) {
      setHasError(true)
      return
    }
    router.push(result.url as '/auth/set-token/[token]')
  }
}

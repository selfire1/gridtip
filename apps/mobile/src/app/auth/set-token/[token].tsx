import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Loader2, LucideArrowLeft } from 'lucide-react-native'
import { useEffect } from 'react'
import { useSession } from '@/lib/ctx'
import Spinner from '@/components/spinner'
import { requestAndRegisterPushToken } from '@/lib/notifications'

export default function SetTokenScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()

  const { signIn, session, isLoading } = useSession()
  useEffect(() => {
    if (!token) {
      return
    }
    if (!session && !isLoading) {
      signIn(token)
    }
    if (session && !isLoading) {
      requestAndRegisterPushToken(session).catch((error) => {
        console.warn('push token registration failed', error)
      })
      router.push('/(app)/home')
    }
  }, [session, isLoading, signIn, token, router])

  if (!token) {
    return (
      <Stack.Screen>
        <View className="bg-background flex flex-1 items-center justify-center gap-8 mx-4">
          <View className="flex flex-col gap-2 items-center">
            <Text className="font-semibold text-2xl">Something went wrong</Text>
            <Text className="text-muted-foreground">Please try logging in again.</Text>
          </View>
          <Link href="/auth/sign-in" asChild>
            <Button size="lg">
              <Icon as={LucideArrowLeft} />
              <Text>Go back</Text>
            </Button>
          </Link>
        </View>
      </Stack.Screen>
    )
  }

  return (
    <Stack.Screen>
      <View className="bg-background flex flex-1 items-center justify-center gap-8 mx-4">
        <View className="flex flex-col gap-2">
          <View className="flex items-center justify-center gap-2 flex-row">
            <Spinner size={24} />
            <Text className="font-semibold text-2xl">Signing in</Text>
          </View>
          <Text className="text-muted-foreground">We will redirect you to the app shortly.</Text>
        </View>
      </View>
    </Stack.Screen>
  )
}

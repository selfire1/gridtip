import { Stack } from 'expo-router'
import '@/assets/global.css'
import { PortalHost } from '@rn-primitives/portal'
import { ThemeProvider } from '@react-navigation/native'
import { useColorScheme, AppState, Platform } from 'react-native'
import { SessionProvider } from '@/lib/ctx'
import { SplashScreenController } from '@/lib/splash'
import { NAV_THEME } from '@/lib/theme'
import { QueryClient, focusManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { asyncStoragePersister } from '@/lib/persister'
import { useEffect } from 'react'
import type { AppStateStatus } from 'react-native'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24h
      retry: 2,
    },
  },
})

export default function Root() {
  const colourScheme = useColorScheme()

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)

    return () => subscription.remove()
  }, [])

  function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active')
    }
  }

  return (
    <ThemeProvider value={NAV_THEME[colourScheme === 'unspecified' ? 'light' : colourScheme]}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: Infinity,
          buster: '1',
        }}
      >
        <SessionProvider>
          <SplashScreenController />
          <Stack screenOptions={{ headerShown: false }} />
          <PortalHost />
        </SessionProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  )
}

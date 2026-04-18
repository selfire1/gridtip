import { Stack } from 'expo-router'
import '@/assets/global.css'
import { PortalHost } from '@rn-primitives/portal'
import { ThemeProvider } from '@react-navigation/native'
import { useColorScheme } from 'react-native'

import { SessionProvider } from '@/lib/ctx'
import { SplashScreenController } from '@/lib/splash'
import { NAV_THEME } from '@/lib/theme'

export default function Root() {
  const colourScheme = useColorScheme()
  return (
    <ThemeProvider value={NAV_THEME[colourScheme === 'unspecified' ? 'light' : colourScheme]}>
      <SessionProvider>
        <SplashScreenController />
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </SessionProvider>
    </ThemeProvider>
  )
}

import { SplashScreen } from 'expo-router'
import { useSession } from './ctx'

SplashScreen.preventAutoHideAsync()

export function SplashScreenController() {
  const { isPending } = useSession()

  if (!isPending) {
    SplashScreen.hide()
  }

  return null
}

import { Stack } from 'expo-router'
import SettingsScreenContent from './_components/settings-screen-content'

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <SettingsScreenContent />
    </>
  )
}

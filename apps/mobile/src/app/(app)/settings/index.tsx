import { Stack } from 'expo-router'
import VariantAGrouped from './_components/variant-a-grouped'

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <VariantAGrouped />
    </>
  )
}

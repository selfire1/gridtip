import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useSession } from '@/lib/ctx'
import { Stack } from 'expo-router'
import { View, StyleSheet } from 'react-native'

export default function Other() {
  const { signOut } = useSession()
  return (
    <>
      <Stack.Screen options={{ title: 'Other' }} />
      <View style={styles.container}>
        <Button onPress={signOut}>
          <Text>Sign out</Text>
        </Button>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

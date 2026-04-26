import { LucideUser } from 'lucide-react-native'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'
import { Link } from 'expo-router'
import { Text } from './ui/text'

export default function NoSession() {
  return (
    <Alert icon={LucideUser}>
      <AlertTitle>Not logged in</AlertTitle>
      <AlertDescription>Please log in to continue.</AlertDescription>
      <Link href="/auth/sign-in" asChild>
        <Button size="lg">
          <Text>Log in</Text>
        </Button>
      </Link>
    </Alert>
  )
}

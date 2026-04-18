import { Text } from '@/components/ui/text'

export default function Debug({ value, hidden }: { value: any; hidden?: boolean }) {
  if (hidden) {
    return
  }
  return <Text variant="code">{JSON.stringify(value, null, 2)}</Text>
}

import { View } from 'react-native'
import { Icon } from './ui/icon'
import { Loader2 } from 'lucide-react-native'
import { cn } from '@/lib/utils'

export default function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <View className={cn('pointer-events-none animate-spin', className)}>
      <Icon className="text-muted-foreground" size={size} as={Loader2} />
    </View>
  )
}

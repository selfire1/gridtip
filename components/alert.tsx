import {
  Alert as SAlert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { LucideIcon } from 'lucide-react'

type Props = {
  variant?: 'default' | 'destructive'
  title: string
  description?: string
  icon?: LucideIcon | (() => React.ReactNode)
  className?: string
}
export default function Alert(props: Props) {
  return (
    <SAlert variant={props.variant || 'default'} className={props.className}>
      {props.icon && <props.icon />}
      <AlertTitle>{props.title}</AlertTitle>
      {props.description && (
        <AlertDescription>{props.description}</AlertDescription>
      )}
    </SAlert>
  )
}

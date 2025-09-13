import {
  Alert as SAlert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

type Props = {
  variant?: 'default' | 'destructive'
  title: string
  description?: string
  icon?: () => React.ReactNode
}
export default function Alert(props: Props) {
  return (
    <>
      <SAlert variant={props.variant || 'default'}>
        {props.icon && <props.icon />}
        <AlertTitle>{props.title}</AlertTitle>
        {props.description && (
          <AlertDescription>{props.description}</AlertDescription>
        )}
      </SAlert>
    </>
  )
}

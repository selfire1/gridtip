import { LucideIcon } from 'lucide-react'
import { ShadButtonProps, Button as ShadButton } from './ui/button'
import { Spinner } from './ui/spinner'

type MyButtonProps = {
  isPending?: boolean
  label: string
  icon?: LucideIcon
}
export default function AppButton(props: ShadButtonProps & MyButtonProps) {
  const { isPending, label, icon: Icon, ...shadProps } = props
  return (
    <ShadButton {...shadProps} disabled={isPending}>
      {isPending && <Spinner />}
      {Icon && !isPending && <Icon />}
      {label}
    </ShadButton>
  )
}

import { getImageHref } from '@/lib/utils/user'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

export default function UserAvatar(props: {
  name: string
  id: string
  className?: string
}) {
  const fallbackString = props.name
    .split(' ')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const avatar = getImageHref({ id: props.id })
  return (
    <>
      <Avatar className={props.className || 'rounded-lg'}>
        <AvatarImage src={avatar} alt={props.name} />
        <AvatarFallback className='rounded-lg'>{fallbackString}</AvatarFallback>
      </Avatar>
    </>
  )
}

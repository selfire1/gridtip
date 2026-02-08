import type { User } from '@/db/schema/schema'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

export default function UserAvatar(
  props: {
    className?: string
  } & Pick<User, 'name' | 'profileImageUrl'>,
) {
  const fallbackString = props.name
    ?.split(' ')
    ?.join('')
    ?.slice(0, 2)
    ?.toUpperCase()
  return (
    <>
      <Avatar className={props.className || 'rounded-lg'}>
        <AvatarImage
          src={props.profileImageUrl || undefined}
          alt={props.name}
        />
        <AvatarFallback className='rounded-lg'>{fallbackString}</AvatarFallback>
      </Avatar>
    </>
  )
}

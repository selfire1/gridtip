'use client'

import Image from 'next/image'
import type { User } from '@/db/schema/schema'
import {
  Avatar as HashAvatar,
  AvatarImage as HashAvatarImage,
  AvatarFallback as HashAvatarImageFallback,
} from 'facehash'

export default function UserAvatar(
  props: {
    className?: string
    profileImageUrl: string | undefined | null
  } & Pick<User, 'name'>,
) {
  // TODO: pass an id to make this always the same
  return (
    <>
      <HashAvatar className={props.className || 'rounded-lg'}>
        {props.profileImageUrl && (
          <Image
            src={props.profileImageUrl}
            alt={props.name}
            sizes='100px'
            width={200}
            height={200}
            className='object-cover h-full w-full'
          />
        )}
        <HashAvatarImage
          src={props.profileImageUrl || undefined}
          alt={props.name}
          className='hidden'
        />
        <HashAvatarImageFallback
          name={props.name}
          facehashProps={{
            colorClasses: [
              'bg-pink-500',
              'bg-blue-500',
              'bg-green-500',
              'bg-orange-500',
              'bg-yellow-500',
              'bg-lime-500',
              'bg-teal-500',
              'bg-violet-500',
            ],
            intensity3d: 'medium',
          }}
        />
      </HashAvatar>
    </>
  )
}

import { Database } from '@/db/types'
import clsx from 'clsx'
import { LucideCheck } from 'lucide-react'
import Image from 'next/image'

export type ConstructorProps = Pick<Database.Constructor, 'id' | 'name'>

export default function Constructor({
  constructor,
  className,
  isSelected = false,
  classNameImg,
}: {
  constructor: ConstructorProps
  className?: string
  isSelected?: boolean
  classNameImg?: string
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 w-full',
        isSelected && 'font-semibold',
        className,
      )}
    >
      <Image
        width={24}
        height={24}
        alt=''
        className={classNameImg}
        src={`/img/constructors/${constructor.id}.avif`}
      />
      <span>{constructor.name}</span>
      {isSelected && <LucideCheck className='ml-auto' />}
    </div>
  )
}

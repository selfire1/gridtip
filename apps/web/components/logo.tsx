import Link from 'next/link'
import Image from 'next/image'
import LogoImg from '@/public/logo.svg'
import { cn } from '@/lib/utils'

export default function Logo({
  href,
  title,
  className,
}: {
  href: string
  title?: string
  className?: string
}) {
  return (
    <Link
      className={cn(
        'flex items-center gap-1 py-2 dark:invert transition-transform',
        className,
      )}
      {...{ href, title }}
    >
      <Image
        className='w-18'
        src={LogoImg}
        priority={true}
        loading='eager'
        alt='GridTip logo'
      />
    </Link>
  )
}

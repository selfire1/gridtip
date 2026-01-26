import Link from 'next/link'
import Image from 'next/image'
import LogoImg from '@/public/logo.svg'

export default async function Logo({
  href,
  title,
}: {
  href: string
  title?: string
}) {
  return (
    <Link
      className='flex items-center gap-1 py-2 dark:invert transition-transform'
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

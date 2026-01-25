import { LucideTrophy } from 'lucide-react'
import Link from 'next/link'

export default async function Logo({
  href,
  title,
}: {
  href: string
  title?: string
}) {
  return (
    <Link className='flex items-center gap-1 py-2' {...{ href, title }}>
      <LucideTrophy size={20} />
      <p className='font-medium'>GridTip</p>
    </Link>
  )
}

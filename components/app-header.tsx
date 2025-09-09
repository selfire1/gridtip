import { LucideTrophy } from 'lucide-react'
import Link from 'next/link'

export function AppHeader() {
  return (
    <div className='flex items-center justify-between is-container py-1'>
      <Link className='flex items-center gap-1 py-2' href='/' title='Home'>
        <LucideTrophy size={20} />
        <p className='font-semibold'>GridTip</p>
      </Link>
    </div>
  )
}

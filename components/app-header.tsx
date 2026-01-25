import { LucideTrophy } from 'lucide-react'
import Link from 'next/link'

export async function AppHeader({
  renderRight,
}: {
  renderRight?: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between is-container py-2'>
      <Link className='flex items-center gap-1 py-2' href='/' title='Home'>
        <LucideTrophy size={20} />
        <p className='font-semibold'>GridTip</p>
      </Link>
      {renderRight}
    </div>
  )
}

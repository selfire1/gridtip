import { LucideTrophy } from 'lucide-react'
import Link from 'next/link'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <header className='is-container'>
        <AppHeader />
      </header>
      <main className='min-h-screen'>{children}</main>
      <footer>
        <AppFooter />
      </footer>
    </div>
  )
}

function AppFooter() {
  return (
    <div className='border-t py-2'>
      <p className='text-sm is-container text-muted-foreground'>
        Built by{' '}
        <Link
          className='hover:text-foreground transition-colors'
          href='https://joschua.io'
        >
          Joschua
        </Link>
      </p>
    </div>
  )
}

function AppHeader() {
  return (
    <div className='flex items-center gap-1 py-2'>
      <LucideTrophy size={20} />
      <p className='font-semibold'>GridTip</p>
    </div>
  )
}

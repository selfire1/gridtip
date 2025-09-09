import Link from 'next/link'
import { AppHeader } from '../../components/app-header'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <header className='sticky top-0 z-50 bg-background/80 backdrop-blur-lg'>
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

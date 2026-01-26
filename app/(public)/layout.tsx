import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AppHeader } from '../../components/app-header'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <header className='sticky top-0 z-50 bg-gradient-to-b from-background to-transparent'>
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
    <div className='border-t py-2 flex items-center justify-between text-sm is-container text-muted-foreground'>
      <Button asChild variant='link' className='text-muted-foreground'>
        <Link href='/privacy' title='Privacy Policy'>
          Privacy
        </Link>
      </Button>
      <p>
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

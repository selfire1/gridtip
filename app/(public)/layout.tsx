import Link from 'next/link'
import { AppHeader } from '../../components/app-header'
import { Button } from '@ui/button'
import { Path } from '@/lib/utils/path'
import { getMaybeSession } from '@/lib/dal'

export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getMaybeSession()

  return (
    <div>
      <header className='sticky top-0 z-50 bg-gradient-to-b from-background to-transparent'>
        <AppHeader renderRight={!session?.user && <AuthButtons />} />
      </header>
      <main className='min-h-screen'>{children}</main>
      <footer>
        <AppFooter />
      </footer>
    </div>
  )
}

function AuthButtons() {
  return (
    <div className='flex items-center gap-4'>
      <Button asChild variant='outline' size='sm'>
        <Link href={Path.Login} title='Login'>
          Login
        </Link>
      </Button>
      <Button asChild size='sm'>
        <Link href={Path.SignUp} title='Sign Up'>
          Sign Up
        </Link>
      </Button>
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

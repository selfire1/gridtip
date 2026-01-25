import { LucideTrophy } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Path } from '@/lib/utils/path'
import { getMaybeSession } from '@/lib/dal'

export async function AppHeader() {
  const session = await getMaybeSession()

  return (
    <div className='flex items-center justify-between is-container py-2'>
      <Link className='flex items-center gap-1 py-2' href='/' title='Home'>
        <LucideTrophy size={20} />
        <p className='font-semibold'>GridTip</p>
      </Link>
      {!session && <AuthButtons />}
    </div>
  )

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
}

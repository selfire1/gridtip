import { LoginForm } from '@/components/login-form'
import { AppHeader } from '@/components/app-header'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in or Sign up',
}

export default function AuthPage() {
  return (
    <div className='bg-muted min-h-svh flex flex-col'>
      <AppHeader />
      <div className='grow flex flex-col items-center justify-center p-6 md:p-10'>
        <div className='w-full max-w-sm md:max-w-3xl'>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

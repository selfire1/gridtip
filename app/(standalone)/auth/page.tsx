import { LoginForm } from '@/components/login-form'
import { Metadata } from 'next'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Log in or Sign up',
}

export default function AuthPage() {
  return (
    <Suspense fallback={<Skeleton className='h-96 w-prose' />}>
      <LoginForm />
    </Suspense>
  )
}

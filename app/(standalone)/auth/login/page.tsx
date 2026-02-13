import SpaImage from '@/public/img/spa.jpg'
import Image from 'next/image'
import { LoginForm } from '@/app/(standalone)/auth/_components/login-form'
import { getPlaceholder } from '../_lib/placeholder'
import AuthLayout from '../_components/auth-layout'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Log in',
}

export default function LoginPage() {
  return (
    <AuthLayout
      slotPrimary={
        <Suspense fallback={<Skeleton className='h-full w-full' />}>
          <LoginForm placeholder={getPlaceholder()} />
        </Suspense>
      }
      slotSecondary={
        <Image
          src={SpaImage}
          sizes='100vw, (max-width: 640px) 50vw, (max-width: 768px) 400px, (max-width: 1024px) 1080px'
          quality={80}
          priority={true}
          placeholder='blur'
          loading='eager'
          alt='Long exposure lights of race cars at night at the Spa-Francorchamps track'
          className='absolute inset-0 h-full w-full object-cover dark:brightness-50'
        />
      }
    />
  )
}

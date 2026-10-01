import HeroImage from '@/public/img/driver.jpg'
import Image from 'next/image'

import { getPlaceholder } from '../_lib/placeholder'
import { ForgotPasswordForm } from '../_components/forgot-password-form'
import AuthLayout from '../_components/auth-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot password',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      slotPrimary={<ForgotPasswordForm placeholder={getPlaceholder()} />}
      slotSecondary={
        <Image
          src={HeroImage}
          sizes='100vw, (max-width: 640px) 50vw, (max-width: 768px) 400px, (max-width: 1024px) 1080px'
          quality={80}
          priority={true}
          placeholder='blur'
          loading='eager'
          alt='Silhouette of a driver wearing a helmet'
          className='absolute inset-0 h-full w-full object-cover dark:brightness-50'
        />
      }
    />
  )
}

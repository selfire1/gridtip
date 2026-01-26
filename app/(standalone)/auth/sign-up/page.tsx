import HeroImage from '@/public/img/driver.jpg'
import Image from 'next/image'

import { getPlaceholder } from '../_lib/placeholder'
import { SignupForm } from '../_components/signup-form'
import AuthLayout from '../_components/auth-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up',
}

export default function SignUpPage() {
  return (
    <AuthLayout
      slotPrimary={<SignupForm placeholder={getPlaceholder()} />}
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

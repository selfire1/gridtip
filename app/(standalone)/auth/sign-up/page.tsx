import HeroImage from '@/public/img/driver.jpg'
import Image from 'next/image'

import { getPlaceholder } from '../_lib/placeholder'
import { SignupForm } from '../_components/signup-form'

export default function SignUpPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col gap-4 p-2 md:p-8'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-xs '>
            <SignupForm placeholder={getPlaceholder()} />
          </div>
        </div>
      </div>
      <div className='bg-muted relative hidden lg:block'>
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
      </div>
    </div>
  )
}

import SpaImage from '@/public/img/spa.jpg'
import Image from 'next/image'

import { LoginForm } from '@/components/login-form'
import { getPlaceholder } from '../_lib/placeholder'

export default function LoginPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col gap-4 p-2 md:p-8'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-xs '>
            <LoginForm placeholder={getPlaceholder()} />
          </div>
        </div>
      </div>
      <div className='bg-muted relative hidden lg:block'>
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
      </div>
    </div>
  )
}

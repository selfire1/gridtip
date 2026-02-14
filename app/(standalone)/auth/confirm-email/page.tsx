import { Metadata } from 'next'
import AuthLayout from '../_components/auth-layout'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { LucideMailQuestion } from 'lucide-react'
import VerifyImage from '@/public/img/_line.jpg'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Confirm Email',
}

export default function ConfirmEmailPage() {
  return (
    <AuthLayout
      slotPrimary={
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <LucideMailQuestion />
            </EmptyMedia>
            <EmptyTitle>Confirm your email</EmptyTitle>
            <div className='space-y-2'>
              <EmptyDescription>
                Please check your email inbox to verify your account.
              </EmptyDescription>
              <EmptyDescription>You can close this tab.</EmptyDescription>
            </div>
          </EmptyHeader>
        </Empty>
      }
      slotSecondary={
        <Image
          src={VerifyImage}
          priority={true}
          alt='Open books stacked on top of one another'
          loading='eager'
          quality='80'
          sizes='(max-width: 768px) 0px, 1920px'
          className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
        />
      }
    />
  )
}

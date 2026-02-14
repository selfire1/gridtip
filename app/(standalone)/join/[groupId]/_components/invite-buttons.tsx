'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Path } from '@/lib/utils/path'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'

export function InviteButtons({ loginHref }: { loginHref: string }) {
  return (
    <div className='flex flex-col sm:flex-row gap-2 items-center justify-center'>
      <Button
        asChild
        onClick={() => posthog.capture(AnalyticsEvent.INVITE_SIGNUP_CLICKED)}
      >
        <Link href={Path.SignUp}>Sign Up to Join</Link>
      </Button>
      <Button
        variant='outline'
        asChild
        onClick={() => posthog.capture(AnalyticsEvent.INVITE_LOGIN_CLICKED)}
      >
        <Link href={loginHref}>Log in to Join</Link>
      </Button>
    </div>
  )
}

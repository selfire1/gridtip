'use client'

import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { AnalyticsEvent } from '@/lib/posthog/events'
import { Path } from '@/lib/utils/path'
import { savePendingInviteUrlToLocalStorage } from '@/lib/utils/pending-invite'

export function InviteButtons({
  loginHref,
  groupId,
}: {
  loginHref: string
  groupId: string
}) {
  return (
    <div className='flex flex-col sm:flex-row gap-2 items-center justify-center'>
      <Button
        asChild
        onClick={() => {
          const joinUrl = `${window.location.origin}/join/${groupId}`
          savePendingInviteUrlToLocalStorage(joinUrl)
          posthog.capture(AnalyticsEvent.INVITE_SIGNUP_CLICKED)
        }}
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

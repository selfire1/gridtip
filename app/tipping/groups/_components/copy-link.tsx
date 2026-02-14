'use client'

import { Button, ShadButtonProps } from '@/components/ui/button'
import { Database } from '@/db/types'
import { LucideCheck, LucideClipboardCheck, LucideLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'

export default function CopyLink(
  props: {
    group: Pick<Database.Group, 'id' | 'name'>
  } & ShadButtonProps,
) {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) {
      return
    }
    const timeout = setTimeout(() => {
      setIsCopied(false)
    }, 4_000)

    return () => {
      clearTimeout(timeout)
    }
  }, [isCopied])

  const { group: _, ...buttonProps } = props

  return (
    <Button {...buttonProps} onClick={copyToClipboard}>
      {isCopied ? <LucideCheck /> : <LucideLink />}
      Copy invite link
    </Button>
  )

  function copyToClipboard() {
    posthog.capture(AnalyticsEvent.GROUP_INVITE_LINK_COPIED)
    const baseUrl = window.location.origin
    navigator.clipboard.writeText(`${baseUrl}/join/${props.group.id}`)
    setIsCopied(true)
    toast.success(
      <p>
        <span>Copied link for </span>
        <span className='font-semibold'>{props.group.name}</span>
      </p>,
      {
        icon: <LucideClipboardCheck size={18} />,
        description: 'Send it to your friends to join!',
      },
    )
  }
}

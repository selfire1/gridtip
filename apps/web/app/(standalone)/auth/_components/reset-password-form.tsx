'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { LucideLink } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { PasswordSchema } from '@/lib/schemas/password'
import { getAuthLinkWithOrigin } from '@/lib/utils/auth-origin'
import { Path } from '@/lib/utils/path'
import { QueryOrigin } from '@/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ButtonText } from '@/components/button-text'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ResetPasswordForm({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isTokenRejected, setIsTokenRejected] = useState(false)

  const token = searchParams?.get('token')
  const isLinkInvalid = isTokenRejected || !token || searchParams?.has('error')

  if (isLinkInvalid) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <LucideLink />
          </EmptyMedia>
          <EmptyTitle>This link is no longer valid</EmptyTitle>
          <div className='space-y-2'>
            <EmptyDescription>
              Reset links expire after one hour and work only once.
            </EmptyDescription>
            <EmptyDescription>
              <Link
                href={Path.ForgotPassword}
                className='underline underline-offset-4'
              >
                Request a new link
              </Link>
            </EmptyDescription>
          </div>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <form onSubmit={onSubmit} className={cn('flex flex-col gap-6', className)}>
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Choose a new password</h1>
          <p className='text-muted-foreground text-sm text-balance'>
            You’ll be signed out everywhere and asked to log in again
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor='password'>New password</FieldLabel>
          <Input
            disabled={isPending}
            id='password'
            type='password'
            name='password'
            required
            minLength={8}
            autoComplete='new-password'
          />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <Button type='submit' disabled={isPending}>
            <ButtonText
              label='Reset password'
              pendingText='Resetting…'
              isPending={isPending}
            />
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = event.target as HTMLFormElement
    const formState = Object.fromEntries(new FormData(target))

    const result = PasswordSchema.safeParse(formState.password)
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    startTransition(async () => {
      const { error } = await authClient.resetPassword({
        newPassword: result.data,
        token: token ?? undefined,
      })
      if (error) {
        if (error.code === 'INVALID_TOKEN') {
          setIsTokenRejected(true)
          return
        }
        console.error(error)
        toast.error('Something went wrong', {
          description: error.message,
        })
        return
      }
      router.push(getAuthLinkWithOrigin(QueryOrigin.PasswordReset))
    })
  }
}

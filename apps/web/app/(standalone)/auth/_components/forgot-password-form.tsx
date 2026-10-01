'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import z from 'zod'
import { LucideMailCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Path } from '@/lib/utils/path'
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
import { Placeholder } from '@/app/(standalone)/auth/_lib/placeholder'

const ForgotPasswordSchema = z.object({
  email: z.email(),
})

export function ForgotPasswordForm({
  className,
  placeholder,
}: {
  className?: string
  placeholder: Placeholder
}) {
  const [isPending, startTransition] = useTransition()
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (isSubmitted) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <LucideMailCheck />
          </EmptyMedia>
          <EmptyTitle>Check your email</EmptyTitle>
          <div className='space-y-2'>
            <EmptyDescription>
              If an account exists for that email, we sent a link to reset the
              password. It expires in one hour.
            </EmptyDescription>
            <EmptyDescription>
              <Link href={Path.Login} className='underline underline-offset-4'>
                Back to login
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
          <h1 className='text-2xl font-bold'>Forgot your password?</h1>
          <p className='text-muted-foreground text-sm text-balance'>
            Enter your email and we’ll send you a link to reset it
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input
            id='email'
            disabled={isPending}
            type='email'
            name='email'
            placeholder={placeholder.email}
            required
            autoComplete='email'
          />
        </Field>
        <Field>
          <Button type='submit' disabled={isPending}>
            <ButtonText
              label='Send reset link'
              pendingText='Sending…'
              isPending={isPending}
            />
          </Button>
          <FieldDescription className='text-center'>
            Remembered it?{' '}
            <Link href={Path.Login} className='underline underline-offset-4'>
              Back to login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = event.target as HTMLFormElement
    const formState = Object.fromEntries(new FormData(target))

    const result = ForgotPasswordSchema.safeParse(formState)
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: result.data.email,
        redirectTo: Path.ResetPassword,
      })
      if (error) {
        console.error(error)
        toast.error('Something went wrong', {
          description:
            'Please try again. If this error persists, please contact us.',
        })
        return
      }
      setIsSubmitted(true)
    })
  }
}

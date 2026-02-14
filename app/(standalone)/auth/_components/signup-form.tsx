'use client'

import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useMemo, useTransition } from 'react'
import { Spinner } from '@ui/spinner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Placeholder } from '@/app/(standalone)/auth/_lib/placeholder'
import Link from 'next/link'
import { Path } from '@/lib/utils/path'
import z from 'zod'
import { ButtonText } from '@/components/button-text'
import { GIcon } from './google-icon'
import * as Sentry from '@sentry/nextjs'

export function SignupForm({
  className,
  placeholder,
  ...props
}: React.ComponentProps<'form'> & {
  placeholder: Placeholder
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [isGooglePending, startGoogleTransition] = useTransition()
  const [isSignupPending, startSignupTransition] = useTransition()
  const isAnyPending = useMemo(
    () => isGooglePending || isSignupPending,
    [isGooglePending, isSignupPending],
  )

  return (
    <form
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Join the Grid</h1>
          <p className='text-muted-foreground text-sm text-balance'>
            Fill in the form below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor='name'>Your Name</FieldLabel>
          <Input
            id='name'
            type='text'
            placeholder={placeholder?.name}
            disabled={isAnyPending}
            autoComplete='name'
            name='name'
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input
            id='email'
            autoComplete='email'
            disabled={isAnyPending}
            type='email'
            name='email'
            placeholder={placeholder.email}
            required
          />
        </Field>
        <Field>
          <div className='flex items-center'>
            <FieldLabel htmlFor='password'>Password</FieldLabel>
          </div>
          <Input
            disabled={isAnyPending}
            id='password'
            type='password'
            name='password'
            required
            minLength={8}
          />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <Button type='submit' disabled={isAnyPending}>
            <ButtonText
              label='Create Account'
              pendingText='Creating account…'
              isPending={isSignupPending}
            />
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            variant='outline'
            type='button'
            disabled={isAnyPending}
            onClick={() => signInWithGoogle(searchParams.get('redirect'))}
          >
            {isGooglePending ? <Spinner /> : <GIcon />}
            Sign up with Google
          </Button>
          <FieldDescription className='text-center pt-6'>
            Already have an account?{' '}
            <Link href={Path.Login} className='underline underline-offset-4'>
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    startSignupTransition(async () => {
      const schema = z.object({
        name: z.string().trim().min(1),
        email: z.email(),
        password: z.string().trim().min(8),
      })
      event.preventDefault()
      const target = event.target as HTMLFormElement
      const formState = Object.fromEntries(new FormData(target))

      const result = schema.safeParse(formState)
      if (!result.success) {
        console.warn(result.error.issues)
        toast.error(result.error.issues[0].message)
        return
      }

      const value = result.data
      try {
        const signupContext = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
          callbackURL: Path.Onboarding,
          profileImageUrl: undefined,
        })
        if (signupContext.error) {
          throw new Error(signupContext.error.message)
        }
        router.push('/auth/confirm-email')
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: 'signup-email',
            context: 'client-component',
          },
        })
        console.error(error)
        toast.error('Something went wrong', {
          description:
            ((error as Error).message ?? 'Please try again.') +
            ' If this error persists, please contact us.',
          action: {
            label: 'Contact',
            onClick: () => {
              router.push('/contact')
            },
          },
        })
      }
    })
  }

  async function signInWithGoogle(redirect: string | null) {
    startGoogleTransition(async () => {
      const data = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirect || Path.Onboarding,
      })
      if (data.error) {
        toast.error('Something went wrong', {
          description:
            'Please try signing in with Google again. If this error persists, please contact us.',
          action: {
            label: 'Contact',
            onClick: () => {
              router.push('/contact')
            },
          },
        })
        return
      }
    })
  }
}

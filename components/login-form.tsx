'use client'

import {
  ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useTransition } from 'react'
import { LucideTrash } from 'lucide-react'
import { QueryOrigin } from '@/constants'
import { Spinner } from './ui/spinner'
import { filterQuery } from 'ufo'
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

export function LoginForm({
  className,
  placeholder,
  ...props
}: React.ComponentProps<'form'> & {
  placeholder: Placeholder
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    switch (searchParams.get('origin')) {
      case QueryOrigin.NotAllowed: {
        showSignInRequiredToast()
        removeSearchParam('origin')
        break
      }

      case QueryOrigin.Deleted: {
        toast.success('Account deleted', {
          description: 'We’re sorry to see you go 😥',
          icon: <LucideTrash size={16} />,
          duration: 4_000,
        })
        break
      }

      default:
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const description = getDescription(searchParams)

  const [isGooglePending, startGoogleTransition] = useTransition()
  const [isLoginPending, startLoginTransition] = useTransition()
  const isAnyPending = useMemo(
    () => isGooglePending || isLoginPending,
    [isGooglePending, isLoginPending],
  )

  return (
    <form
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Login to your account</h1>
          <p className='text-muted-foreground text-sm text-balance'>
            {description}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input
            id='email'
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
            <Link
              href={Path.ForgotPassword}
              className='ml-auto text-sm underline-offset-4 hover:underline'
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            disabled={isAnyPending}
            id='password'
            type='password'
            name='password'
            required
            minLength={8}
          />
        </Field>
        <Field>
          <Button type='submit' disabled={isAnyPending}>
            {isLoginPending && <Spinner />} Login
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
            Login with Google
          </Button>
          <FieldDescription className='text-center'>
            Don’t have an account?{' '}
            <Link href={Path.SignUp} className='underline underline-offset-4'>
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    startLoginTransition(async () => {
      const schema = z.object({
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
      const signInContext = await authClient.signIn.email({
        email: value.email,
        password: value.password,
        callbackURL: Path.Dashboard,
      })
      if (signInContext.error) {
        const isInvalidCredentialsError =
          signInContext.error.status === 403 ? 'unverified' : 'other'

        if (isInvalidCredentialsError) {
          toast.error('Invalid Credentials')
          return
        }
        toast.error('Something went wrong', {
          description: signInContext.error.message,
        })
        console.error(signInContext.error)
      }
    })
  }

  function removeSearchParam(param: string) {
    const url = pathname
    const urlWithParamRemoved = filterQuery(url, (key: string) => key !== param)
    router.replace(urlWithParamRemoved)
  }

  function showSignInRequiredToast() {
    toast.warning('Please sign in', {
      description: 'You must be signed in to access this page',
      duration: 6_000,
    })
  }

  async function signInWithGoogle(redirect: string | null) {
    startGoogleTransition(async () => {
      const data = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirect || '/tipping',
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

  function getDescription(params: ReadonlyURLSearchParams) {
    switch (params.get('origin')) {
      case QueryOrigin.Join:
        return 'Login or create an account first before joining this group.'
      default:
        return 'Enter your email below to login to your account'
    }
  }

  function GIcon(): React.ReactNode {
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
        <path
          d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
          fill='currentColor'
        />
      </svg>
    )
  }
}

'use client'

import {
  ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SpaImage from '@/public/img/spa.jpg'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { QueryOrigin } from '@/constants'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('origin') === QueryOrigin.NotAllowed) {
      showSignInRequiredToast()
      clearParams()
      function clearParams() {
        router.replace(pathname)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const description = getDescription(searchParams)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2 md:min-h-96'>
          <form
            className='p-6 md:p-8 flex flex-col justify-center'
            onSubmit={(e) => {
              e.preventDefault()
              signInWithGoogle(searchParams.get('redirect'))
            }}
          >
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>Get started</h1>
                <p className='text-muted-foreground text-balance'>
                  {description}
                </p>
              </div>
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <Loader2Icon className='animate-spin' />
                ) : (
                  <GIcon />
                )}
                <span>Continue with Google</span>
              </Button>
            </div>
          </form>
          <div className='bg-muted relative hidden md:block'>
            <Image
              src={SpaImage}
              sizes='100vw, (max-width: 640px) 50vw, (max-width: 768px) 400px, (max-width: 1024px) 1080px'
              quality={80}
              priority={true}
              placeholder='blur'
              loading='eager'
              alt='Long exposure lights of race cars at night at the Spa-Francorchamps track'
              className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] grayscale'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  function showSignInRequiredToast() {
    toast.warning('Please sign in', {
      description: 'You must be signed in to access this page',
      duration: 6_000,
    })
  }

  async function signInWithGoogle(redirect: string | null) {
    setIsLoading(true)
    const data = await authClient.signIn.social({
      provider: 'google',
      callbackURL: redirect || '/tipping',
    })
    setIsLoading(false)
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
    router.push('/tipping')
  }

  function getDescription(params: ReadonlyURLSearchParams) {
    switch (params.get('origin')) {
      case QueryOrigin.Join:
        return 'Please sign in or create an account first before joining this group.'
      default:
        return 'Sign in with Google to log in or set up a new GridTip account.'
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

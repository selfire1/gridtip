import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getImageHref } from '@/lib/utils/user'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className='py-12 is-container'>
      <div className='text-center max-w-prose mx-auto space-y-4'>
        <h1 className='text-primary leading-tighter text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl xl:tracking-tighter'>
          Out-tip your frenemies
        </h1>
        <p className='text-balance text-muted-foreground'>
          Gather your crew and establish once and for all who’s the F1 expert.
          Tip each race, accumulate points and predict your way to the podium.
        </p>
        <div className='flex w-full items-center justify-center gap-2 pt-2'>
          <GetStartedButton />
        </div>
      </div>
    </div>
  )
}

async function GetStartedButton() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const { to, label, title, src } = getData()
  return (
    <Button asChild>
      <Link href={to} {...{ title }}>
        {src && <UserAvatar src={src} />}
        {label}
        <ArrowRight />
      </Link>
    </Button>
  )

  function getData() {
    if (!session?.user) {
      return {
        to: '/auth',
        label: 'Get started',
        title: 'Sign up or log in',
        src: null,
      }
    }
    return {
      to: '/tipping',
      label: 'View dashboard',
      title: 'Dashboard',
      src: getImageHref(session.user),
    }
  }

  function UserAvatar(props: { src: string }) {
    if (!session?.user) {
      return
    }

    return (
      <Avatar className='size-6 border border-muted-foreground'>
        <AvatarImage src={props.src} alt='' />
      </Avatar>
    )
  }
}

import { Button } from '@/components/ui/button'
import { withQuery } from 'ufo'
import { Card, CardContent } from '@/components/ui/card'
import { Metadata } from 'next'
import Image from 'next/image'
import FansImage from '@/public/img/tifosi.jpg'
import Link from 'next/link'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Icon } from '@/components/icon'
import { ArrowUpRightIcon } from 'lucide-react'
import { Database } from '@/db/types'
import { db } from '@/db'
import { IconFromName } from '@/components/icon-from-name'
import { getMaybeSession } from '@/lib/dal'
import { getAuthLinkWithOrigin } from '@/lib/utils/auth-origin'
import { QueryOrigin } from '@/constants'
import JoinGroupClient from './_components/join-group'

export const metadata: Metadata = {
  title: 'Join Group',
}

export default async function JoinGroup({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params

  if (!groupId) {
    return <EmptyState />
  }

  const group = await getGroup(groupId)
  if (!group) {
    return <EmptyState />
  }

  const session = await getMaybeSession()
  const isUserAlreadyMemberOfGroup = session?.user.id
    ? await getIsMemberOfGroup({
        userId: session.user.id,
        groupId,
      })
    : false

  return (
    <div className='flex flex-col gap-6'>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2 md:min-h-96'>
          <div className='p-6 md:p-8 flex flex-col justify-center'>
            <div className='space-y-6 text-center max-w-prose mx-auto'>
              <div className='space-y-2'>
                <div className='flex flex-col items-center gap-1'>
                  <IconFromName
                    className='bg-muted rounded-lg p-2'
                    iconName={group.iconName}
                    size={32}
                  />
                  <h1 className='text-2xl font-bold'>{group.name}</h1>
                </div>
              </div>

              <p className='text-muted-foreground text-balance'>
                {isUserAlreadyMemberOfGroup
                  ? 'You are already a member of this group'
                  : 'You have been invited to start tipping with this group.'}
              </p>

              <JoinGroupButton
                isUserAlreadyMember={isUserAlreadyMemberOfGroup}
                isLoggedIn={!!session?.user.id}
              />
            </div>
          </div>
          <div className='bg-muted relative hidden md:block'>
            <Image
              src={FansImage}
              sizes='100vw, (max-width: 640px) 50vw, (max-width: 768px) 400px, (max-width: 1024px) 1080px'
              quality={80}
              priority={true}
              placeholder='blur'
              loading='eager'
              alt='Long exposure lights of race cars at night at the Spa-Francorchamps track'
              className='absolute inset-0 h-full w-full object-cover dark:brightness-50'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  function JoinGroupButton(props: {
    isUserAlreadyMember: boolean
    isLoggedIn: boolean
  }) {
    if (props.isUserAlreadyMember) {
      return (
        <Button asChild className='w-full'>
          <Link href='/tipping'>Go to Dashboard</Link>
        </Button>
      )
    }

    if (!props.isLoggedIn) {
      const href = withQuery(getAuthLinkWithOrigin(QueryOrigin.Join), {
        redirect: `/join/${groupId}`,
      })
      return (
        <Button asChild className='w-full'>
          <Link href={href}>Log in to Join</Link>
        </Button>
      )
    }
    return <JoinGroupClient groupId={groupId} />
  }

  async function getIsMemberOfGroup(info: {
    userId: Database.User['id']
    groupId: Database.Group['id']
  }) {
    const { userId, groupId } = info

    return !!(await db.query.groupMembersTable.findFirst({
      columns: { id: true },
      where(fields, { eq, and }) {
        return and(eq(fields.userId, userId), eq(fields.groupId, groupId))
      },
    }))
  }

  function getGroup(id: Database.Group['id']) {
    return db.query.groupsTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, id)
      },
      columns: {
        name: true,
        iconName: true,
      },
    })
  }

  function EmptyState() {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icon.Group />
            </EmptyMedia>
            <EmptyTitle>Invite not found</EmptyTitle>
            <EmptyDescription>
              Please ask for the invite to be sent again.
              <br />
              Get in touch with us if you believe there is an issue.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href='/' title='Home'>
                Back to Home
              </Link>
            </Button>
            <Button
              asChild
              variant='link'
              className='text-muted-foreground'
              size='sm'
            >
              <Link href='/contact' title='Contact'>
                Get in touch
                <ArrowUpRightIcon />
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Card>
    )
  }
}

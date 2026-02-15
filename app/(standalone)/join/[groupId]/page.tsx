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
import type { DalUser } from '@/lib/dal'
import { getAuthLinkWithOrigin } from '@/lib/utils/auth-origin'
import { QueryOrigin } from '@/constants'
import JoinGroupForm from './_components/join-group-form'
import { InviteButtons } from './_components/invite-buttons'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>
}): Promise<Metadata> {
  const { groupId } = await params

  if (!groupId) {
    return {
      title: 'Join Group',
    }
  }

  const group = await getGroup(groupId)

  if (!group) {
    return {
      title: 'Join Group',
    }
  }

  const title = `Join ${group.name}`
  const description = `Join ${group.name} to tip on Formula 1 races with the group members.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  } satisfies Metadata
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
    <div className='flex min-h-screen max-sm:pt-12 bg-linear-to-b from-muted to-background items-center justify-center gap-6 w-full'>
      <Card className='overflow-hidden w-full is-container py-0'>
        <CardContent className='grid px-0 md:grid-cols-2 md:min-h-96'>
          <div className='p-6 space-y-6 md:p-8 flex flex-col justify-center'>
            <div className='space-y-2 text-center max-w-prose mx-auto'>
              <div className='space-y-2'>
                <div className='flex flex-col items-center gap-1'>
                  <IconFromName
                    className='bg-muted rounded-lg p-2'
                    iconName={group.iconName}
                    size={36}
                  />
                  <h1 className='text-2xl font-bold'>{group.name}</h1>
                </div>
              </div>

              <p className='text-muted-foreground text-balance'>
                {isUserAlreadyMemberOfGroup
                  ? 'You are already a member of this group.'
                  : 'Join this group to tip with the members.'}
              </p>
            </div>
            <JoinGroupContent
              isUserAlreadyMember={isUserAlreadyMemberOfGroup}
              user={session?.user}
            />
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

  function JoinGroupContent(props: {
    isUserAlreadyMember: boolean
    user: DalUser | undefined
  }) {
    if (props.isUserAlreadyMember) {
      return (
        <Button asChild className='w-full'>
          <Link href='/tipping'>Go to Dashboard</Link>
        </Button>
      )
    }

    if (!props.user) {
      const href = withQuery(getAuthLinkWithOrigin(QueryOrigin.Join), {
        redirect: `/join/${groupId}`,
      })
      return <InviteButtons loginHref={href} groupId={groupId} />
    }
    return <JoinGroupForm user={props.user} groupId={groupId} />
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

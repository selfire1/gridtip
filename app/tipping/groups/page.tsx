import { IconFromName } from '@/components/icon-from-name'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getMemberStatus, verifySession } from '@/lib/dal'
import CopyLink from './_components/copy-link'
import CreateGroup from './_components/create-group'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { groupMembersTable } from '@/db/schema/schema'
import { Badge } from '@/components/ui/badge'
import { Suspense } from 'react'
import EditGroup from './_components/edit-group'
import { MemberStatus } from '@/types'

export default async function GroupsPage() {
  const { userId, user } = await verifySession()

  const groupsMemberships = await getGroupsForUser(userId)

  return (
    <div className='grid sm:grid-cols-2 gap-8'>
      {!!groupsMemberships.length && <YourGroups className='col-span-2' />}
      <CreateGroup user={user} />
      <JoinGroup />
    </div>
  )

  function JoinGroup({ className }: { className?: string }) {
    return (
      <Card {...{ className }}>
        <CardHeader>
          <CardTitle>Join group</CardTitle>
          <CardDescription>
            You can join a group with an invite link.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground text-pretty max-w-prose'>
          Ask a member of an existing group to send you a link to join.
        </CardContent>
      </Card>
    )
  }

  async function YourGroups({ className }: { className?: string }) {
    return (
      <Card {...{ className }}>
        <CardHeader>
          <CardTitle>Your groups</CardTitle>
          <CardDescription>
            These are the groups that you’ve joined
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupsMemberships.map((membership) => {
                return (
                  <TableRow key={membership.group.id}>
                    <TableCell className='flex items-center gap-2 font-medium'>
                      <div className='bg-muted rounded-lg p-2'>
                        <IconFromName
                          iconName={membership.group.iconName}
                          className='size-4 '
                        />
                      </div>
                      {membership.group.name}
                    </TableCell>
                    <TableCell>
                      <CopyLink group={membership.group} />
                    </TableCell>
                    <Suspense
                      fallback={
                        <TableCell>
                          <Badge variant='ghost'>Loading…</Badge>
                        </TableCell>
                      }
                    >
                      <MembershipStatusCells info={membership} />
                    </Suspense>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )

    async function MembershipStatusCells({
      info: membership,
    }: {
      info: Awaited<ReturnType<typeof getGroupsForUser>>[number]
    }) {
      const status = await getMemberStatus(membership.group, groupsMemberships)
      if (!status) {
        return
      }
      const statusToVariant = {
        [MemberStatus.Admin]: 'default',
        [MemberStatus.Member]: 'secondary',
      } as const
      return (
        <>
          <TableCell>
            <Badge variant={statusToVariant?.[status]}>{status}</Badge>
          </TableCell>
          <TableCell>
            <EditGroup group={membership.group} status={status} />
          </TableCell>
        </>
      )
    }
  }
}

async function getGroupsForUser(userId: string) {
  return await db.query.groupMembersTable.findMany({
    columns: {
      joinedAt: true,
      userId: true,
    },
    where: eq(groupMembersTable.userId, userId),
    with: {
      group: {
        columns: {
          id: true,
          adminUser: true,
          name: true,
          iconName: true,
          cutoffInMinutes: true,
        },
      },
    },
  })
}

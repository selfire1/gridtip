import { IconFromName } from '@/components/icon-from-name'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import { verifySession } from '@/lib/dal'
import { getCurrentGroupId, getGroupsForUser } from '@/lib/utils/groups'
import CopyLink from './_components/copy-link'
import CreateGroup from './_components/create-group'

export default async function GroupsPage() {
  const { userId } = await verifySession()
  const groupsMemberships = await getGroupsForUser(userId)

  return (
    <div className='grid sm:grid-cols-2 gap-8'>
      <YourGroups className='col-span-2' />
      <CreateGroup />
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
        <CardContent className='text-muted-foreground'>
          Ask a member of an existing group to send you a link to join.
        </CardContent>
      </Card>
    )
  }

  function YourGroups({ className }: { className?: string }) {
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
                <TableHead>Joined</TableHead>
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
                    <TableCell>
                      {membership.joinedAt.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
}

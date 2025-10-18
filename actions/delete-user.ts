'use server'

import { QueryOrigin } from '@/constants'
import { db } from '@/db'
import { groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { auth } from '@/lib/auth'
import { verifySession } from '@/lib/dal'
import { getAuthLinkWithOrigin } from '@/lib/utils/auth-origin'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function deleteCurrentUser() {
  const { user } = await verifySession()

  const groupsThatUserCreated = await getGroupsThatUserCreated()

  if (groupsThatUserCreated.length) {
    console.log('there are groups that user created', groupsThatUserCreated)
    await assignAdminshipToSomeoneElse(
      groupsThatUserCreated.map(({ id }) => id),
    )
  }

  const response = await auth.api.deleteUser({
    headers: await headers(),
    body: {},
  })

  if (!response.success) {
    return {
      ok: false,
      message: response.message,
    }
  }

  return {
    ok: true,
  }

  function getGroupsThatUserCreated() {
    return db.query.groupsTable.findMany({
      columns: {
        id: true,
      },
      where(table, { eq }) {
        return eq(table.adminUser, user.id)
      },
    })
  }

  async function assignAdminshipToSomeoneElse(
    groupIds: Database.Group['id'][],
  ) {
    return await Promise.all(
      groupIds.map(async (groupId) => {
        const members = await db.query.groupMembersTable.findMany({
          columns: {
            userId: true,
          },
          where(table, { eq }) {
            return eq(table.groupId, groupId)
          },
        })

        const membersThatAreNotMe = members.filter(
          ({ userId }) => userId !== user.id,
        )

        if (!membersThatAreNotMe.length) {
          // I'm the only member left, so we delete the group
          console.log('deleting group', groupId)
          await db.delete(groupsTable).where(eq(groupsTable.id, groupId))
          return null
        }

        await assignRandomMemberAsAdmin()
        return null

        async function assignRandomMemberAsAdmin() {
          const randomMember =
            membersThatAreNotMe[
              Math.floor(Math.random() * membersThatAreNotMe.length)
            ]

          console.log(
            'assigning admin of group',
            groupId,
            'to',
            randomMember.userId,
          )
          await db
            .update(groupsTable)
            .set({
              adminUser: randomMember.userId,
            })
            .where(eq(groupsTable.id, groupId))
        }
      }),
    )
  }
}

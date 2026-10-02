import { db } from '@/db'
import { groupsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { eq } from 'drizzle-orm'

export async function handOverGroupsOfUser(userId: string) {
  const groupsThatUserCreated = await db.query.groupsTable.findMany({
    columns: {
      id: true,
    },
    where(table, { eq }) {
      return eq(table.adminUser, userId)
    },
  })

  await Promise.all(
    groupsThatUserCreated.map(({ id }) => {
      return handOverGroup(id)
    }),
  )

  async function handOverGroup(groupId: Database.Group['id']) {
    const members = await db.query.groupMembersTable.findMany({
      columns: {
        userId: true,
      },
      where(table, { eq }) {
        return eq(table.groupId, groupId)
      },
    })

    const membersThatAreNotUser = members.filter(
      (member) => member.userId !== userId,
    )

    if (!membersThatAreNotUser.length) {
      await db.delete(groupsTable).where(eq(groupsTable.id, groupId))
      return
    }

    const randomMember =
      membersThatAreNotUser[
        Math.floor(Math.random() * membersThatAreNotUser.length)
      ]

    await db
      .update(groupsTable)
      .set({
        adminUser: randomMember.userId,
      })
      .where(eq(groupsTable.id, groupId))
  }
}

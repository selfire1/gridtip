import { eq } from 'drizzle-orm'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import z from 'zod'
import { db } from '@/db'
import { user as userTable } from '@/db/schema/auth-schema'
import { groupMembersTable } from '@/db/schema/schema'
import { verifySession } from '@/lib/dal'

const f = createUploadthing()

export const ourFileRouter = {
  setUserImage: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { user } = await verifySession()
      if (!user) {
        throw new UploadThingError('Unauthorised')
      }

      return { user }
    })
    .onUploadComplete(async ({ metadata: { user }, file }) => {
      await db
        .update(userTable)
        .set({
          profileImageUrl: file.ufsUrl,
        })
        .where(eq(userTable.id, user.id))
    }),

  setGroupImage: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    .input(z.object({ groupId: z.string() }))

    .middleware(async ({ input: { groupId } }) => {
      const { user } = await verifySession()
      if (!user) {
        throw new UploadThingError('Unauthorised')
      }
      const groupMembership = await db.query.groupMembersTable.findFirst({
        where: (groupMembersTable, { and, eq }) =>
          and(
            eq(groupMembersTable.groupId, groupId),
            eq(groupMembersTable.userId, user.id),
          ),
        columns: { id: true },
        with: {
          group: { columns: { name: true } },
        },
      })
      if (!groupMembership) {
        throw new UploadThingError('Unauthorised')
      }

      return { groupMembership }
    })
    .onUploadComplete(async ({ metadata: { groupMembership }, file }) => {
      await db
        .update(groupMembersTable)
        .set({
          profileImage: file.ufsUrl,
        })
        .where(eq(groupMembersTable.id, groupMembership.id))

      return { group: groupMembership.group }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

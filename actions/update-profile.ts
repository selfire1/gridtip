'use server'

import { Database } from '@/db/types'
import { verifySession } from '@/lib/dal'
import { Log } from './complete-onboarding'
import { uploadMaybeFile } from '@/lib/utils/uploadthing'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { eq } from 'drizzle-orm'

export async function updateProfile(
  group: Pick<Database.Group, 'name' | 'id'>,
  profile: { name?: string; file?: File; useDefaultImage: boolean },
) {
  const { userId, user } = await verifySession()
  console.log({ profile })
  const logs = [] as Log[]
  if (!profile.name && !profile.file && !profile.useDefaultImage) {
    console.log('no input')
    return logs
  }
  const imageResult = await uploadMaybeFile(profile.file)
  if (!imageResult.ok) {
    logs.push({
      ok: false,
      title: `${group.name}: Profile image error`,
      description: 'Could not upload profile image',
    })
  }

  const groupMembership = await db.query.groupMembersTable.findFirst({
    where(table, { eq, and }) {
      return and(eq(table.groupId, group.id), eq(table.userId, userId))
    },
    columns: { id: true },
  })
  if (!groupMembership) {
    logs.push({
      ok: false,
      title: 'Could not update group profile',
    })
    return logs
  }
  // HACK: this is not very clear. We should add some type narrowing up there. But if we should use the default image, we'll grab that from the user and discard the uploaded image 😬
  const profileImage = profile.useDefaultImage
    ? user.profileImageUrl
    : imageResult.data?.ufsUrl
  await db
    .update(groupMembersTable)
    .set({
      userName: profile.name || undefined,
      profileImage,
    })
    .where(eq(groupMembersTable.id, groupMembership.id))

  console.log('Updated profile for group', group.id)
  return logs
}

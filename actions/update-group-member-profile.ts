'use server'

import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { eq, and } from 'drizzle-orm'
import { ServerResponse } from '@/types'
import { uploadMaybeFile } from '@/lib/utils/uploadthing'
import * as Sentry from '@sentry/nextjs'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { z } from 'zod'

const updateGroupMemberProfileSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  imageFile: z.instanceof(File).optional(),
  clearImage: z.boolean().optional(),
})

export async function updateGroupMemberProfile(
  input: z.infer<typeof updateGroupMemberProfileSchema>
): Promise<ServerResponse> {
  try {
    const { user: currentUser } = await verifySession()

    // Validate input
    const validated = updateGroupMemberProfileSchema.parse(input)

    // Check if user is a member of the group
    const groupMembership = await db.query.groupMembersTable.findFirst({
      where: (table, { eq, and }) =>
        and(
          eq(table.groupId, validated.groupId),
          eq(table.userId, currentUser.id)
        ),
      columns: { id: true },
    })

    if (!groupMembership) {
      return { ok: false, message: 'You are not a member of this group' }
    }

    // Upload image if provided
    const imageResult = await uploadMaybeFile(validated.imageFile)

    if (!imageResult.ok && validated.imageFile) {
      Sentry.captureMessage('Failed to upload group member profile image', {
        level: 'error',
        tags: {
          operation: 'update-group-member-profile',
          context: 'image-upload',
        },
        extra: {
          userId: currentUser.id,
          groupId: validated.groupId,
          error: imageResult.message,
        },
      })
      return { ok: false, message: imageResult.message }
    }

    // Prepare update data
    const updateData: {
      userName: string
      profileImage?: string | null
    } = {
      userName: validated.name,
    }

    // Handle image updates
    if (validated.clearImage) {
      updateData.profileImage = null
    } else if (imageResult.data?.ufsUrl) {
      updateData.profileImage = imageResult.data.ufsUrl
    }

    // Update group member profile
    await db
      .update(groupMembersTable)
      .set(updateData)
      .where(eq(groupMembersTable.id, groupMembership.id))

    // Revalidate cache
    revalidateTag(CacheTag.MyGroupProfile)

    return { ok: true, message: 'Group profile updated successfully' }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'update-group-member-profile',
        context: 'server-action',
      },
    })

    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0].message }
    }

    console.error('Update group member profile error:', error)
    return { ok: false, message: 'Failed to update group profile' }
  }
}

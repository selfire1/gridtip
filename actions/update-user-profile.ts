'use server'

import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { user } from '@/db/schema/auth-schema'
import { eq } from 'drizzle-orm'
import { ServerResponse } from '@/types'
import { uploadMaybeFile } from '@/lib/utils/uploadthing'
import * as Sentry from '@sentry/nextjs'
import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/constants/cache'
import { z } from 'zod'

const updateUserProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  imageFile: z.instanceof(File).optional(),
  clearImage: z.boolean().optional(),
})

export async function updateUserProfile(
  input: z.infer<typeof updateUserProfileSchema>
): Promise<ServerResponse> {
  try {
    const { user: currentUser } = await verifySession()

    // Validate input
    const validated = updateUserProfileSchema.parse(input)

    // Upload image if provided
    const imageResult = await uploadMaybeFile(validated.imageFile)

    if (!imageResult.ok && validated.imageFile) {
      Sentry.captureMessage('Failed to upload profile image', {
        level: 'error',
        tags: {
          operation: 'update-user-profile',
          context: 'image-upload',
        },
        extra: {
          userId: currentUser.id,
          error: imageResult.message,
        },
      })
      return { ok: false, message: imageResult.message }
    }

    // Prepare update data
    const updateData: {
      name: string
      profileImageUrl?: string | null
    } = {
      name: validated.name,
    }

    // Handle image updates
    if (validated.clearImage) {
      updateData.profileImageUrl = null
    } else if (imageResult.data?.ufsUrl) {
      updateData.profileImageUrl = imageResult.data.ufsUrl
    }

    // Update user profile
    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, currentUser.id))

    // Revalidate cache
    revalidateTag(CacheTag.MyGroupProfile)

    return { ok: true, message: 'Profile updated successfully' }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'update-user-profile',
        context: 'server-action',
      },
    })

    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0].message }
    }

    console.error('Update user profile error:', error)
    return { ok: false, message: 'Failed to update profile' }
  }
}

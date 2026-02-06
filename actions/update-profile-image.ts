'use server'

import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { user } from '@/db/schema/auth-schema'
import { eq } from 'drizzle-orm'
import { ServerResponse } from '@/types'
import { uploadImageFile } from '@/lib/utils/uploadthing'

export async function updateDefaultProfileImage(
  formData: FormData,
): Promise<ServerResponse> {
  const session = await verifySession()

  const file = formData.get('file') as File
  if (!file || !file.size) {
    return { ok: false, message: 'No file provided' }
  }

  try {
    const response = await uploadImageFile(file)

    if (!response.ok) {
      return { ok: false, message: 'Upload failed' }
    }

    await db
      .update(user)
      .set({
        image: response.data.ufsUrl,
      })
      .where(eq(user.id, session.user.id))

    return { ok: true, message: 'Profile image updated' }
  } catch (error) {
    console.error('Upload error:', error)
    return { ok: false, message: 'Failed to upload image' }
  }
}


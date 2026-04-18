import 'server-only'
import { UTApi } from 'uploadthing/server'
import { ALLOWED_TYPES, MAX_FILE_SIZE } from './file-limits'

const utapi = new UTApi()

export async function uploadMaybeFile(file: File | undefined) {
  if (!file) {
    return { ok: true as const, message: 'No file' as const, data: null }
  }
  return await uploadImageFile(file)
}

export async function uploadImageFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      ok: false as const,
      message:
        'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' as const,
      data: null,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false as const,
      message: 'File too large. Maximum size is 5MB.',
      data: null,
    }
  }

  const result = await utapi.uploadFiles(file)

  if (!result.data?.ufsUrl) {
    console.error('No url after upload', result)
    return { ok: false as const, message: 'Upload failed', data: null }
  }

  return { ok: true as const, message: 'Success', data: result.data }
}

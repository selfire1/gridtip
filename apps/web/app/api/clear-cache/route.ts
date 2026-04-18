import { NextRequest } from 'next/server'
import { createResponse, validateToken } from '../utils'
import { CacheTag } from '@/constants/cache'
import { revalidateTag } from 'next/cache'

export const GET = async (_request: NextRequest) => {
  const validationResponse = await validateToken()
  if (!validationResponse.ok) {
    return validationResponse
  }

  for (const tag in CacheTag) {
    revalidateTag(tag)
  }

  return createResponse(200, 'Cache cleared')
}

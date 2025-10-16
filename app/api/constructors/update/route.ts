import { CacheTag } from '@/constants/cache'
import { revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export const GET = async (_request: NextRequest) => {
  revalidateTag(CacheTag.Constructors)

  // TODO: implement

  return new Response(
    JSON.stringify({
      status: 200,
    }),
  )
}

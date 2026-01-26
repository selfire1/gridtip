import { NextRequest, NextResponse } from 'next/server'
import { QueryOrigin } from '@/constants'
import { getCookieCache } from 'better-auth/cookies'
import { Path } from '@/lib/utils/path'

export async function middleware(request: NextRequest) {
  const session = await getCookieCache(request)

  if (!session) {
    const url = new URL(Path.Login, request.url)
    url.searchParams.append('origin', QueryOrigin.NotAllowed)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/tipping'],
}

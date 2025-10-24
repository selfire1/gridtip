import { NextRequest, NextResponse } from 'next/server'
import { QueryOrigin } from '@/constants'
import { getCookieCache } from 'better-auth/cookies'

export async function proxy(request: NextRequest) {
  const session = await getCookieCache(request)

  if (!session) {
    const url = new URL('/auth', request.url)
    url.searchParams.append('origin', QueryOrigin.NotAllowed)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/tipping'],
}

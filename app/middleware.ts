import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { QueryOrigin } from '@/constants'

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const url = new URL('/auth', request.url)
    url.searchParams.append('origin', QueryOrigin.NotAllowed)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/tipping'],
}

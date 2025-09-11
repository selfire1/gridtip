import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'
import { auth } from './auth'
import { redirect } from 'next/navigation'
import { QueryOrigin } from '@/constants'

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user.id) {
    redirect(`/auth?origin=${QueryOrigin.NotAllowed}`)
  }

  return { isAuth: true, userId: session.user.id }
})

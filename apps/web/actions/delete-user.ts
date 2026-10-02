'use server'

import { auth } from '@/lib/auth'
import { verifySession } from '@/lib/dal'
import { isAPIError } from 'better-auth/api'
import { headers } from 'next/headers'

export async function deleteCurrentUser() {
  await verifySession()

  try {
    await auth.api.deleteUser({
      headers: await headers(),
      body: {},
    })
  } catch (error) {
    console.error(error)
    return {
      ok: false,
      message: getErrorMessage(error),
    }
  }

  return {
    ok: true,
  }
}

function getErrorMessage(error: unknown) {
  if (isAPIError(error) && error.body?.code === 'SESSION_EXPIRED') {
    return 'For your security, please sign out and sign in again, then delete your account.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong'
}

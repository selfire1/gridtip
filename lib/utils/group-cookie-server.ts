import 'server-only'
import { cookies } from 'next/headers'
import { GROUP_ID_COOKIE_MAX_AGE, GROUP_ID_COOKIE_NAME } from '@/constants'

export async function setGroupCookie(groupId: string) {
  const cookieStore = await cookies()
  cookieStore.set(GROUP_ID_COOKIE_NAME, groupId, {
    maxAge: GROUP_ID_COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  })
}

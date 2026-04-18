import { GROUP_ID_COOKIE_MAX_AGE, GROUP_ID_COOKIE_NAME } from '@/constants'

export function setClientCookie(groupId: string) {
  document.cookie = `${GROUP_ID_COOKIE_NAME}=${groupId}; max-age=${GROUP_ID_COOKIE_MAX_AGE}; samesite=lax; path=/;`
}

export function clearClientCookie() {
  document.cookie = `${GROUP_ID_COOKIE_NAME}=''; max-age=${GROUP_ID_COOKIE_MAX_AGE}; samesite=lax; path=/;`
}

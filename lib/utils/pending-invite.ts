const STORAGE_KEY = 'gridtip:pendingInviteUrl'

export function savePendingInviteUrlToLocalStorage(joinUrl: string) {
  try {
    localStorage.setItem(STORAGE_KEY, joinUrl)
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}

export function consumePendingInviteUrlFromLocalStorage(): string | null {
  try {
    const url = localStorage.getItem(STORAGE_KEY)
    if (url) {
      localStorage.removeItem(STORAGE_KEY)
    }
    return url
  } catch {
    return null
  }
}

export function clearPendingInviteUrlFromLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // silently ignore
  }
}

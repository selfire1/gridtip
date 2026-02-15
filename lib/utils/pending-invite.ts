const STORAGE_KEY = 'gridtip:pendingInviteUrl'

/**
 * Stores a join invite URL in localStorage so it can be prefilled
 * during onboarding after a new user signs up from an invite link.
 */
export function savePendingInviteUrl(joinUrl: string) {
  try {
    localStorage.setItem(STORAGE_KEY, joinUrl)
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}

/**
 * Reads and removes the pending invite URL from localStorage.
 * Returns null if nothing is stored or localStorage is unavailable.
 */
export function consumePendingInviteUrl(): string | null {
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

/**
 * Removes the pending invite URL from localStorage without reading it.
 */
export function clearPendingInviteUrl() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // silently ignore
  }
}

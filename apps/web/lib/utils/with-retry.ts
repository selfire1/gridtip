type WithRetryOptions = {
  retries?: number
  baseDelayMs?: number
  label?: string
}

const RETRYABLE_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EAI_AGAIN',
]

const RETRYABLE_MESSAGES = [
  'socket connection was closed',
  'fetch failed',
  'connect timeout',
]

function isTransientConnectionError(error: unknown): boolean {
  let current: unknown = error
  const seen = new Set<unknown>()

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const err = current as { code?: unknown; message?: unknown; cause?: unknown }

    if (typeof err.code === 'string' && RETRYABLE_CODES.includes(err.code)) {
      return true
    }
    if (typeof err.message === 'string') {
      const message = err.message.toLowerCase()
      if (RETRYABLE_MESSAGES.some((pattern) => message.includes(pattern))) {
        return true
      }
    }

    current = err.cause
  }

  return false
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs `fn`, retrying on transient Turso/libsql connection errors (ECONNRESET,
 * dropped sockets, etc.) with exponential backoff. Only use for operations that
 * are safe to retry (reads, or idempotent writes).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {},
): Promise<T> {
  const { retries = 3, baseDelayMs = 500, label = 'operation' } = options

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt >= retries || !isTransientConnectionError(error)) {
        throw error
      }
      const delay = baseDelayMs * 2 ** attempt
      console.warn(
        `${label}: transient connection error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`,
      )
      await wait(delay)
    }
  }
}

import { describe, expect, it, vi } from 'vitest'
import { withRetry } from '@/lib/utils/with-retry'

function transientError() {
  return Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })
}

describe('withRetry', () => {
  it('resolves immediately without retrying when fn succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok')

    await expect(withRetry(fn, { baseDelayMs: 0 })).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries a transient connection error and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(transientError())
      .mockRejectedValueOnce(transientError())
      .mockResolvedValue('ok')

    await expect(withRetry(fn, { baseDelayMs: 0 })).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('retries when the transient error is nested in the cause chain', async () => {
    const wrapped = new Error('Failed query: select ...', {
      cause: transientError(),
    })
    const fn = vi.fn().mockRejectedValueOnce(wrapped).mockResolvedValue('ok')

    await expect(withRetry(fn, { baseDelayMs: 0 })).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('detects a transient error by message when no code is present', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(
        new Error('The socket connection was closed unexpectedly'),
      )
      .mockResolvedValue('ok')

    await expect(withRetry(fn, { baseDelayMs: 0 })).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry a non-transient error', async () => {
    const error = new Error('bad query')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(withRetry(fn, { baseDelayMs: 0 })).rejects.toBe(error)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws the original error after exhausting retries', async () => {
    const error = transientError()
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, { retries: 2, baseDelayMs: 0 }),
    ).rejects.toBe(error)
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

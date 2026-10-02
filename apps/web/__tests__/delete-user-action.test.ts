import { beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError } from 'better-auth/api'

const fixtures = vi.hoisted(() => {
  return {
    deleteUser: vi.fn(),
  }
})

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: () => {
    return Promise.resolve(new Headers())
  },
}))

vi.mock('@/lib/dal', () => ({
  verifySession: () => {
    return Promise.resolve({ user: { id: 'user-1' } })
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      deleteUser: fixtures.deleteUser,
    },
  },
}))

import { deleteCurrentUser } from '@/actions/delete-user'

describe('deleteCurrentUser', () => {
  beforeEach(() => {
    fixtures.deleteUser.mockReset()
  })

  it('asks the user to sign in again when the session is not fresh', async () => {
    fixtures.deleteUser.mockRejectedValue(
      APIError.from('BAD_REQUEST', {
        code: 'SESSION_EXPIRED',
        message: 'Session expired. Re-authenticate to perform this action.',
      }),
    )

    const result = await deleteCurrentUser()

    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/sign out and sign in again/i)
  })

  it('returns the error message when deletion fails for another reason', async () => {
    fixtures.deleteUser.mockRejectedValue(new Error('Database unavailable'))

    const result = await deleteCurrentUser()

    expect(result).toEqual({ ok: false, message: 'Database unavailable' })
  })

  it('returns ok when deletion succeeds', async () => {
    fixtures.deleteUser.mockResolvedValue({
      success: true,
      message: 'User deleted',
    })

    const result = await deleteCurrentUser()

    expect(result).toEqual({ ok: true })
  })
})

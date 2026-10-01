import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/db', () => ({ db: {} }))
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: vi.fn() }
  },
}))

import { auth } from '@/lib/auth'

describe('auth password reset config', () => {
  it('revokes every session on password reset', () => {
    expect(auth.options.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(
      true,
    )
  })

  it('sends reset emails', () => {
    expect(auth.options.emailAndPassword?.sendResetPassword).toBeTypeOf(
      'function',
    )
  })
})

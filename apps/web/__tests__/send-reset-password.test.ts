import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = vi.hoisted(() => {
  const send = vi.fn()
  return { send }
})

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: fixtures.send }
  },
}))

import { sendResetPasswordEmail } from '@/lib/emails/send-reset-password'

const user = { name: 'Ada Lovelace', email: 'ada@example.com' }
const url = 'https://gridtip.example/api/auth/reset-password/abc123'

describe('sendResetPasswordEmail', () => {
  beforeEach(() => {
    fixtures.send.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sends the reset link to the user from the GridTip sender', async () => {
    fixtures.send.mockResolvedValue({ error: null })

    await sendResetPasswordEmail({ user, url })

    expect(fixtures.send).toHaveBeenCalledTimes(1)
    const payload = fixtures.send.mock.calls[0][0]
    expect(payload.from).toBe('GridTip <gridtip@noreply.joschua.io>')
    expect(payload.to).toEqual(['ada@example.com'])
    expect(payload.html).toContain(url)
  })

  it('resolves without throwing when the provider returns an error', async () => {
    fixtures.send.mockResolvedValue({ error: { message: 'rate limited' } })

    await expect(sendResetPasswordEmail({ user, url })).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })

  it('resolves without throwing when the provider call rejects', async () => {
    fixtures.send.mockRejectedValue(new Error('network down'))

    await expect(sendResetPasswordEmail({ user, url })).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })
})

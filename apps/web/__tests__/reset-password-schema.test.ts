import { describe, expect, it } from 'vitest'
import { PasswordSchema } from '@/lib/schemas/password'

describe('PasswordSchema', () => {
  it('rejects a password shorter than 8 characters', () => {
    expect(PasswordSchema.safeParse('1234567').success).toBe(false)
  })

  it('rejects a password that is only whitespace', () => {
    expect(PasswordSchema.safeParse('        ').success).toBe(false)
  })

  it('accepts exactly 8 characters', () => {
    expect(PasswordSchema.safeParse('12345678').success).toBe(true)
  })

  it('trims surrounding whitespace like sign-up does', () => {
    expect(PasswordSchema.parse('  hunter2hunter2  ')).toBe('hunter2hunter2')
  })
})

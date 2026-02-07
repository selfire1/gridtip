import { z } from 'zod'
const USERNAME_REGEX = /^[a-zA-Z0-9\s\-_.]+$/

export const UsernameSchema = z
  .string()
  .trim()
  .min(1, 'Username is required')
  .max(50, 'Username must be 50 characters or less')
  .regex(
    USERNAME_REGEX,
    'Username can only contain letters, numbers, spaces, hyphens, underscores, and periods',
  )
  .refine((val) => val.length > 0, 'Username cannot be empty')
  .refine((val) => !/^\s+$/.test(val), 'Username cannot be only whitespace')
  .refine((val) => {
    const zeroWidthChars = /[\u200B-\u200D\uFEFF]/
    return !zeroWidthChars.test(val)
  }, 'Username contains invalid characters')

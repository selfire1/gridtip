import { SUPPORTED_ICON_NAMES } from '@/components/icon-from-name'
import z from 'zod'
export const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(60, 'Too long'),
  icon: z.enum(SUPPORTED_ICON_NAMES, 'Invalid icon'),
})

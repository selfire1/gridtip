import { UsernameSchema } from '@/lib/schemas/username'
import z from 'zod'
export const JoinGroupSchema = z.object({
  groupId: z.string(),
  userName: UsernameSchema,
})

export type JoinGroupData = z.infer<typeof JoinGroupSchema>

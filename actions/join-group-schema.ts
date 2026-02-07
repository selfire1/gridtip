import z from 'zod'
export const JoinGroupSchema = z.object({
  groupId: z.string(),
  userName: z.string(),
})

export type JoinGroupData = z.infer<typeof JoinGroupSchema>

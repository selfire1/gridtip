import z from 'zod'
import { CreateGroupSchema } from './create-group'

export const EditGroupSchema = CreateGroupSchema.omit({
  userName: true,
})
export type EditGroupData = z.infer<typeof EditGroupSchema>

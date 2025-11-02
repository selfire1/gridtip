import { RACE_PREDICTION_FIELDS } from '@/constants'
import z from 'zod/v3'

export type Schema = z.infer<typeof formSchema>
export const formSchema = z.object({
  userId: z.string(),
  raceId: z.string(),
  position: z.enum(RACE_PREDICTION_FIELDS),
  valueId: z.string(),
})

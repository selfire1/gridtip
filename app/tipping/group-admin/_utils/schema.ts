import { RACE_PREDICTION_FIELDS } from '@/constants'
import { TIP_OVERWRITE_OPTIONS } from '@/db/schema/schema'
import z from 'zod/v3'

export type Schema = z.infer<typeof formSchema>
export const formSchema = z.object({
  userId: z.string(),
  raceId: z.string(),
  position: z.enum(RACE_PREDICTION_FIELDS),
  valueId: z.string(),
  overwriteTo: z.enum([...TIP_OVERWRITE_OPTIONS, 'normal']).nullish(),
})

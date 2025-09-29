import z from 'zod'

export const schema = z.object({
  driver: z.object({
    id: z.string().min(1, 'Required'),
  }),
  constructor: z.object({
    id: z.string().min(1, 'Required'),
  }),
})

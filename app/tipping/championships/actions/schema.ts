import z from 'zod'

export const schema = z.object({
  driverChampion: z.object({
    id: z.string().min(1, 'Required'),
  }),
  constructorChampion: z.object({
    id: z.string().min(1, 'Required'),
  }),
})

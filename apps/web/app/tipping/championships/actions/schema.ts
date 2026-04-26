import z from 'zod'

export const ChampionshipsTipSchema = z.object({
  driverChampion: z.object({
    id: z.string().min(1, 'Required'),
  }),
  constructorChampion: z.object({
    id: z.string().min(1, 'Required'),
  }),
})

export type ChampionshipsTipData = z.infer<typeof ChampionshipsTipSchema>

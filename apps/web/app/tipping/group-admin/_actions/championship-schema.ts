import z from 'zod'

export const ChampionshipPointsSchema = z.object({
  driversPoints: z.coerce.number().positive(),
  constructorPoints: z.coerce.number().positive(),
})
export type ChampionshipPointsData = z.infer<typeof ChampionshipPointsSchema>

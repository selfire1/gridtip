import z from 'zod'

export const idObject = z
  .object({
    id: z.string().min(1, 'Required'),
  })
  .loose()

export const submitTipSchema = z.object({
  pole: idObject,
  p1: idObject,
  p10: idObject,
  last: idObject,
  constructorWithMostPoints: idObject,
  sprintP1: idObject,
  groupId: z.string('No group id'),
  raceId: z.string('Invalid race id'),
})

export const serverSubmitTipSchema = submitTipSchema.partial().extend({
  groupId: z.string('No group id'),
  raceId: z.string('Invalid race id'),
})

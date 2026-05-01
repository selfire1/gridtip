import { toFacehashHandler } from 'facehash/next'

const FACEHASH_COLORS = [
  '#ec4899',
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#14b8a6',
  '#8b5cf6',
]

export const { GET } = toFacehashHandler({
  size: 200,
  colors: FACEHASH_COLORS,
})

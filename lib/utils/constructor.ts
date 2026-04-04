import { Database } from '@/db/types'

export function getConstructorImage(id: Database.Constructor['id']) {
  return `/img/constructors/${id}.webp`
}

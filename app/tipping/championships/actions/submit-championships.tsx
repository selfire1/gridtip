'use server'

import { verifySession } from '@/lib/dal'

export async function submitChampionsship() {
  await verifySession()
}

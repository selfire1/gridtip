'use server'

import { verifySession } from '@/lib/dal'
import z from 'zod'
import { schema } from './schema'

export async function submitChampionsship(input: Record<string, any>) {
  type Schema = z.infer<typeof schema>

  const { userId } = await verifySession()
}

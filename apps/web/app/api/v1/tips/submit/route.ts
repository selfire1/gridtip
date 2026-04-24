import { submitChanges } from '@/app/tipping/add-tips/[race-id]/actions/submit-tip'
import { getMaybeSession } from '@/lib/dal'
import type { SubmitTipsResponse } from '@gridtip/shared/api-types'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await getMaybeSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const response = await submitChanges(body)
  if (!response.ok) {
    return NextResponse.json(response satisfies SubmitTipsResponse, {
      status: 400,
    })
  }
  return NextResponse.json(response satisfies SubmitTipsResponse, {
    status: 200,
  })
}

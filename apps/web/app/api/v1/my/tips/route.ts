import { db } from '@/db'
import { getMaybeSession } from '@/lib/dal'
import { getTips } from '@/lib/get-tips'
import type {
  GetTipsResponse,
  SubmitTipsResponse,
} from '@gridtip/shared/api-types'
import z from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { submitChanges } from '@/app/tipping/add-tips/[race-id]/actions/submit-tip'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const validation = z
    .object({
      groupId: z.string().min(1, 'Required'),
      raceId: z.string().min(1, 'Required'),
    })
    .safeParse({
      groupId: params.get('groupId') ?? '',
      raceId: params.get('raceId') ?? '',
    })
  const session = await getMaybeSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!validation.success) {
    return Response.json(
      { error: z.prettifyError(validation.error) },
      { status: 400 },
    )
  }

  const membership = await db.query.groupMembersTable.findFirst({
    where: (membership, { and, eq }) =>
      and(
        eq(membership.groupId, validation.data.groupId),
        eq(membership.userId, session.user.id),
      ),
    columns: {
      id: true,
    },
  })

  if (!membership?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tips = await getTips({
    memberId: membership.id,
    groupId: validation.data.groupId,
    raceId: validation.data.raceId,
  })

  return Response.json(tips satisfies GetTipsResponse, { status: 200 })
}

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

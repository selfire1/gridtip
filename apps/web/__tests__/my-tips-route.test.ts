import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = vi.hoisted(() => {
  let session: { user: { id: string } } | null = null
  let membership: { id: string } | undefined = undefined
  return {
    reset() {
      session = null
      membership = undefined
    },
    setSession(s: { user: { id: string } } | null) {
      session = s
    },
    getSession() {
      return session
    },
    setMembership(m: { id: string } | undefined) {
      membership = m
    },
    getMembership() {
      return membership
    },
  }
})

vi.mock('server-only', () => ({}))

vi.mock('@/lib/dal', () => {
  return {
    getMaybeSession: () => Promise.resolve(fixtures.getSession()),
  }
})

vi.mock('@/db', () => {
  return {
    db: {
      query: {
        groupMembersTable: {
          findFirst: () => Promise.resolve(fixtures.getMembership()),
        },
      },
    },
  }
})

vi.mock('@/lib/get-tips', () => {
  return {
    getTips: () => Promise.resolve({ tips: [] }),
  }
})

vi.mock('@/app/tipping/add-tips/[race-id]/actions/submit-tip', () => {
  return {
    submitChanges: vi.fn(),
  }
})

import { GET } from '@/app/api/v1/my/tips/route'

const makeRequest = () => {
  return new NextRequest(
    'http://localhost/api/v1/my/tips?groupId=group-1&raceId=race-1',
  )
}

describe('GET /api/v1/my/tips', () => {
  beforeEach(() => {
    fixtures.reset()
  })

  it('returns 401 when there is no session', async () => {
    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is not a member of the group', async () => {
    fixtures.setSession({ user: { id: 'user-A' } })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body).toEqual({ error: 'Not a member of group' })
  })

  it('returns 200 with tips for a group member', async () => {
    fixtures.setSession({ user: { id: 'user-A' } })
    fixtures.setMembership({ id: 'member-1' })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
  })
})

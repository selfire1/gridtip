import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type Row = {
  id: string
  userId: string
  token: string
  platform: string
  createdAt: Date
  updatedAt: Date
}

const fixtures = vi.hoisted(() => {
  const store = new Map<string, Row>()
  let session: { user: { id: string } } | null = null
  let idCounter = 0
  return {
    store,
    reset() {
      store.clear()
      session = null
      idCounter = 0
    },
    setSession(s: { user: { id: string } } | null) {
      session = s
    },
    getSession() {
      return session
    },
    nextId() {
      idCounter += 1
      return `id-${idCounter}`
    },
    seed(row: Row) {
      store.set(row.id, row)
    },
    rows() {
      return [...store.values()]
    },
    findByToken(token: string) {
      return [...store.values()].find((r) => r.token === token)
    },
  }
})

vi.mock('server-only', () => ({}))

vi.mock('@/lib/dal', () => {
  return {
    getMaybeSession: () => Promise.resolve(fixtures.getSession()),
  }
})

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: (col: unknown, val: unknown) => ({ __mockEq: true as const, col, val }),
  }
})

vi.mock('@/db', () => {
  type EqClause = { __mockEq: true; col: unknown; val: unknown }

  const findRowByToken = (token: string) =>
    [...fixtures.store.values()].find((r) => r.token === token)

  const tx = {
    query: {
      userPushTokensTable: {
        findFirst: async ({ where }: { where: EqClause }) => {
          // The route always queries findFirst by token.
          const found = findRowByToken(where.val as string)
          return found ? { id: found.id, userId: found.userId } : undefined
        },
      },
    },
    delete: (_table: unknown) => ({
      where: async (where: EqClause) => {
        // The route always deletes by id (after a findFirst).
        fixtures.store.delete(where.val as string)
      },
    }),
    insert: (_table: unknown) => ({
      values: (vals: { userId: string; token: string; platform: string }) => ({
        onConflictDoUpdate: async ({
          set,
        }: {
          target: unknown
          set: { platform: string; updatedAt: Date }
        }) => {
          const existing = findRowByToken(vals.token)
          if (existing) {
            existing.platform = set.platform
            existing.updatedAt = set.updatedAt
            return
          }
          const id = fixtures.nextId()
          const now = new Date()
          fixtures.seed({
            id,
            userId: vals.userId,
            token: vals.token,
            platform: vals.platform,
            createdAt: now,
            updatedAt: now,
          })
        },
      }),
    }),
  }

  type FakeTx = typeof tx
  return {
    db: {
      transaction: async <T>(cb: (tx: FakeTx) => Promise<T>) => cb(tx),
    },
  }
})

import { POST } from '@/app/api/v1/notifications/register/route'

const ENDPOINT = 'http://localhost/api/v1/notifications/register'

function buildRequest(body: unknown, opts: { rawBody?: string } = {}) {
  return new NextRequest(ENDPOINT, {
    method: 'POST',
    body: opts.rawBody ?? JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/v1/notifications/register', () => {
  beforeEach(() => {
    fixtures.reset()
  })

  it('returns 401 when there is no session', async () => {
    fixtures.setSession(null)

    const res = await POST(
      buildRequest({ token: 'ExponentPushToken[abc]', platform: 'ios' }),
    )

    expect(res.status).toBe(401)
    expect(fixtures.rows()).toHaveLength(0)
  })

  it('returns 400 when the token is empty', async () => {
    fixtures.setSession({ user: { id: 'user-A' } })

    const res = await POST(buildRequest({ token: '', platform: 'ios' }))

    expect(res.status).toBe(400)
    expect(fixtures.rows()).toHaveLength(0)
  })

  it('returns 400 when the body is malformed JSON', async () => {
    fixtures.setSession({ user: { id: 'user-A' } })

    const res = await POST(buildRequest(null, { rawBody: 'not-json{' }))

    expect(res.status).toBe(400)
    expect(fixtures.rows()).toHaveLength(0)
  })

  it('inserts a fresh row when the token is new', async () => {
    fixtures.setSession({ user: { id: 'user-A' } })

    const res = await POST(
      buildRequest({ token: 'ExponentPushToken[abc]', platform: 'ios' }),
    )

    expect(res.status).toBe(200)
    const rows = fixtures.rows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: 'user-A',
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    })
  })

  it('updates updated_at when the same user re-registers the same token', async () => {
    const oldDate = new Date('2026-01-01T00:00:00.000Z')
    fixtures.seed({
      id: 'id-existing',
      userId: 'user-A',
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
      createdAt: oldDate,
      updatedAt: oldDate,
    })
    fixtures.setSession({ user: { id: 'user-A' } })

    const res = await POST(
      buildRequest({ token: 'ExponentPushToken[abc]', platform: 'ios' }),
    )

    expect(res.status).toBe(200)
    const rows = fixtures.rows()
    expect(rows).toHaveLength(1)
    expect(rows[0].userId).toBe('user-A')
    expect(rows[0].updatedAt.getTime()).toBeGreaterThan(oldDate.getTime())
  })

  it('replaces the row owner when a different user registers an existing token', async () => {
    fixtures.seed({
      id: 'id-victim',
      userId: 'user-A',
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    fixtures.setSession({ user: { id: 'user-B' } })

    const res = await POST(
      buildRequest({ token: 'ExponentPushToken[abc]', platform: 'ios' }),
    )

    expect(res.status).toBe(200)
    const rows = fixtures.rows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: 'user-B',
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    })
    // The original row is gone — no orphan row left behind for user-A.
    expect(fixtures.rows().some((r) => r.userId === 'user-A')).toBe(false)
    // The row was deleted-then-inserted (not updated in place), so the id
    // changes. This guards the explicit-handoff policy: a future regression
    // that swaps the delete for a userId-overwriting onConflictDoUpdate
    // would leave the original id intact and fail this assertion.
    expect(rows[0].id).not.toBe('id-victim')
  })

  it('keeps userId stable but refreshes platform when the same user re-registers', async () => {
    fixtures.seed({
      id: 'id-existing',
      userId: 'user-A',
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    fixtures.setSession({ user: { id: 'user-A' } })

    const res = await POST(
      buildRequest({ token: 'ExponentPushToken[abc]', platform: 'ios' }),
    )

    expect(res.status).toBe(200)
    const rows = fixtures.rows()
    expect(rows).toHaveLength(1)
    expect(rows[0].userId).toBe('user-A')
    expect(rows[0].platform).toBe('ios')
  })
})

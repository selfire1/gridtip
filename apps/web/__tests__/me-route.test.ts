import { beforeEach, describe, expect, it, vi } from 'vitest'

type SessionUser = {
  id: string
  name: string
  email: string
  image?: string | null
  profileImageUrl?: string | null
}

const fixtures = vi.hoisted(() => {
  let session: { user: SessionUser } | null = null
  return {
    reset() {
      session = null
    },
    setSession(s: { user: SessionUser } | null) {
      session = s
    },
    getSession() {
      return session
    },
  }
})

vi.mock('server-only', () => ({}))

vi.mock('@/lib/dal', () => {
  return {
    getMaybeSession: () => Promise.resolve(fixtures.getSession()),
  }
})

import { GET } from '@/app/api/v1/me/route'

describe('GET /api/v1/me', () => {
  beforeEach(() => {
    fixtures.reset()
  })

  it('returns 401 when there is no session', async () => {
    fixtures.setSession(null)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns 200 with profile fields when authenticated', async () => {
    fixtures.setSession({
      user: {
        id: 'user-A',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        profileImageUrl: 'https://cdn.example.com/ada.png',
        image: 'https://googleusercontent.com/ada-google.png',
      },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({
      id: 'user-A',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      avatarUrl: 'https://cdn.example.com/ada.png',
    })
  })

  it('falls back to image when profileImageUrl is not set', async () => {
    fixtures.setSession({
      user: {
        id: 'user-B',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        profileImageUrl: null,
        image: 'https://googleusercontent.com/grace.png',
      },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.avatarUrl).toBe('https://googleusercontent.com/grace.png')
  })

  it('returns avatarUrl as null (not undefined) when neither image is set', async () => {
    fixtures.setSession({
      user: {
        id: 'user-C',
        name: 'Anonymous',
        email: 'anon@example.com',
        profileImageUrl: null,
        image: null,
      },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.avatarUrl).toBeNull()
    expect('avatarUrl' in body).toBe(true)
  })

  it('returns avatarUrl as null when both image fields are undefined', async () => {
    fixtures.setSession({
      user: {
        id: 'user-D',
        name: 'No Image',
        email: 'no-image@example.com',
      },
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.avatarUrl).toBeNull()
  })
})

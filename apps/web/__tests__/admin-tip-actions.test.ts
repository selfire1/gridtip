import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = vi.hoisted(() => {
  const writes: string[] = []
  return {
    writes,
    reset() {
      writes.length = 0
    },
  }
})

vi.mock('server-only', () => ({}))

vi.mock('@sentry/nextjs', () => ({
  captureException: () => {},
}))

vi.mock('next/cache', () => ({
  revalidateTag: () => {},
}))

vi.mock('@/lib/dal', () => ({
  verifySession: () => {
    return Promise.resolve({ userId: 'user-member' })
  },
  verifyIsAdmin: () => {
    return Promise.resolve({
      isAdmin: false,
      message: 'Not an admin of the group',
    })
  },
}))

vi.mock('@/lib/utils/groups', () => ({
  getCurrentGroup: () => {
    return Promise.resolve({ id: 'group-1' })
  },
  getGroupMembershipByMemberId: () => {
    return Promise.resolve({ id: 'member-1' })
  },
}))

vi.mock('@/db', () => {
  const findFirst = () => {
    return Promise.resolve({ id: 'member-1' })
  }
  const chain = (operation: string) => {
    fixtures.writes.push(operation)
    const builder: Record<string, unknown> = {}
    for (const key of ['values', 'set', 'where', 'returning']) {
      builder[key] = () => {
        return builder
      }
    }
    builder.then = (resolve: (value: unknown) => unknown) => {
      return resolve([{ id: 'prediction-1' }])
    }
    return builder
  }
  return {
    db: {
      query: new Proxy({}, { get: () => ({ findFirst }) }),
      insert: () => {
        return chain('insert')
      },
      update: () => {
        return chain('update')
      },
    },
  }
})

import {
  createTip,
  updateTip,
} from '@/app/tipping/group-admin/_utils/create-tip-action'
import type { AdminTipSchema } from '@/app/tipping/group-admin/_utils/schema'

const tip: AdminTipSchema = {
  memberId: 'member-1',
  raceId: 'race-1',
  position: 'p1',
  valueId: 'driver-1',
  overwriteTo: 'countAsCorrect',
}

describe('admin tip actions', () => {
  beforeEach(() => {
    fixtures.reset()
  })

  it('rejects createTip from a non-admin member', async () => {
    const result = await createTip(tip)

    expect(result).toEqual({ ok: false, message: 'Not an admin of the group' })
    expect(fixtures.writes).toEqual([])
  })

  it('rejects updateTip from a non-admin member', async () => {
    const result = await updateTip('entry-1' as never, tip)

    expect(result).toEqual({ ok: false, message: 'Not an admin of the group' })
    expect(fixtures.writes).toEqual([])
  })
})

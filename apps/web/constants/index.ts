import type { RacePredictionField } from '@gridtip/shared/constants'
import type { Database } from '@/db/types'

export const DEFAULT_CUTOFF_MINS = 180

export const CUTOFF_REFERENCE_KEY = {
  pole: 'qualifyingDate',
  p1: 'qualifyingDate',
  p10: 'qualifyingDate',
  last: 'qualifyingDate',
  constructorWithMostPoints: 'qualifyingDate',
  sprintP1: 'sprintQualifyingDate',
} as const satisfies Record<RacePredictionField, keyof Database.Race>

export enum QueryOrigin {
  /**
   * Signed out from app url
   */
  SignedOut = 'signed-out',
  /**
   * Is not allowed in app url
   */
  NotAllowed = 'not-logged-in',
  Join = 'join',
  /**
   * User deleted account
   */
  Deleted = 'deleted',
}

export const GROUP_ID_COOKIE_NAME = 'grid-tip-group-id' as const
export const GROUP_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const enum HREF_LINKS {
  GithubIssues = 'https://github.com/selfire1/gridtip/issues',
  Email = 'mailto:hi+gridtip@joschua.io',
}

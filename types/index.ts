export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export enum MemberStatus {
  Admin = 'Admin',
  Member = 'Member',
}

export type ServerResponse = {
  ok: boolean
  message: string
} & Record<string, unknown>

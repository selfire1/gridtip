export type Driver = {
  id: string
  permanentNumber: string
  fullName: string
  givenName: string
  familyName: string
  nationality: string
  constructor: Constructor
}

export type Constructor = {
  id?: string
  name?: string
  nationality?: string
}

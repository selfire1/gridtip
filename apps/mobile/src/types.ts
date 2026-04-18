export type Driver = {
  id: string
  permanentNumber: string | null
  givenName: string
  familyName: string
  constructorId: string
}

export type Constructor = {
  name: string
  id: string
  image: string
}
export type Group = {
  group: {
    id: string
    name: string
  }
}

export type Race = {
  id: string
  country: string
  raceName: string
  image: string
  isSprint: boolean
}

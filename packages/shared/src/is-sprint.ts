export function getIsSprint(race: { sprintQualifyingDate: Date | string | null | undefined }) {
  return !!race.sprintQualifyingDate
}

export function getIsSprint(race: { sprintQualifyingDate: Date | null | undefined }) {
  return !!race.sprintQualifyingDate
}

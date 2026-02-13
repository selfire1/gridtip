import { RacePredictionField } from '@/constants'

export function getFormFields(isSprint = false) {
  const allFields = [
    {
      name: 'sprintP1',
      description: 'Who will win the sprint race?',
      label: 'Sprint P1',
      type: 'driver',
    },
    {
      label: 'Pole Position',
      description: 'Which driver will start at the front?',
      name: 'pole',
      type: 'driver',
    },
    {
      label: 'P1',
      description: 'Who will finish first in the GP?',
      name: 'p1',
      type: 'driver',
    },
    {
      label: 'P10',
      description: 'Which driver will just snatch some points?',
      name: 'p10',
      type: 'driver',
    },
    {
      label: 'Last place',
      description: 'Which driver is last to finish? Excluding early DNFs.',
      name: 'last',
      type: 'driver',
    },
    {
      label: 'Most constructor points',
      description:
        'Which constructor will haul the most points in the Grand Prix?',
      name: 'constructorWithMostPoints',
      type: 'constructor',
    },
  ] as const satisfies ({ name: RacePredictionField } & Record<
    string,
    string
  >)[]
  return allFields.filter((field) =>
    field.name !== 'sprintP1' ? true : isSprint,
  )
}

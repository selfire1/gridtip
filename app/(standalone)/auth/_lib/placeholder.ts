export type Placeholder = {
  name: string
  email: string
}
export function getPlaceholder(): Placeholder {
  const all = [
    {
      name: 'Max Verstappen',
      email: 'simply-lovely@redbull.racing',
    },
    {
      name: 'Franz Hermann',
      email: 'nordschleife@nuerburg.de',
    },
    {
      name: 'Lewis Hamilton',
      email: 'still-we-rise@ferrari.forza',
    },
    {
      name: 'Charles Leclerc',
      email: 'il-predestinato@ferrari.forza',
    },
    {
      name: 'Lando Norris',
      email: 'no-power@mclaren.papaya',
    },
    {
      name: 'Fernando Alonso',
      email: 'gp2-engine@aston.karma',
    },
    {
      name: 'Ayrton Senna',
      email: 'magic@senna.legend',
    },
    {
      name: 'Michael Schumacher',
      email: 'the-michael@ferrari.goat',
    },
    {
      name: 'Kimi Raikkonen',
      email: 'bwoah@leave.alone',
    },
    {
      name: 'Sebastian Vettel',
      email: 'here-comes@sebastian.vet',
    },
    {
      name: 'Daniel Ricciardo',
      email: 'honey-badger@shoey.com',
    },
    {
      name: 'Niki Lauda',
      email: 'comeback-king@lauda.legend',
    },
    {
      name: 'George Russell',
      email: '63@mercedes.de',
    },
    {
      name: 'Oscar Piastri',
      email: 'aussieaussieaussie@mclaren.papaya',
    },
    {
      name: 'Alain Prost',
      email: 'the-professor@fourtime.champ',
    },
    {
      name: 'Valtteri Bottas',
      email: 'traditions@cadillac.racing',
    },
  ]

  // pick random from `all`
  return all[Math.floor(Math.random() * all.length)]
}

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
      email: 'franzhermann@nuerburg.de',
    },
    {
      name: 'Lewis Hamilton',
      email: 'lewis@ferrari.forza',
    },
    {
      name: 'Charles Leclerc',
      email: 'il-predestinato@ferrari.forza',
    },
    {
      name: 'Lando Norris',
      email: 'lando@mclaren.papaya',
    },
    {
      name: 'Fernando Alonso',
      email: 'rookie@aston.co.uk',
    },
    {
      name: 'Kimi Raikkonen',
      email: 'raikkonen@bwoah.fi',
    },
    {
      name: 'Daniel Ricciardo',
      email: 'honey-badger@shoey.com',
    },
    {
      name: 'George Russell',
      email: '63@mercedes.de',
    },
    {
      name: 'Oscar Piastri',
      email: 'piastri@mclaren.papaya',
    },
    {
      name: 'Carlos Sainz',
      email: 'smooth@williamsf1.com',
    },
    {
      name: 'Alain Prost',
      email: 'the-professor@f1.champ',
    },
    {
      name: 'Valtteri Bottas',
      email: 'traditions@cadillac.racing',
    },
  ]

  // pick random from `all`
  return all[Math.floor(Math.random() * all.length)]
}

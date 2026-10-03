import { VariationLinear } from './_components/variation-linear'
import { VariationRacing } from './_components/variation-racing'
import { VariationRams } from './_components/variation-rams'
import { VariationSimilar } from './_components/variation-similar'

const variations = [
  {
    id: 'similar',
    title: 'Similar',
    description:
      'Layout alike to the current sidebar, but with per-link icons and section separators replacing the toggleable headers.',
    component: <VariationSimilar />,
  },
  {
    id: 'linear',
    title: 'Industry best practices',
    description:
      'Density, restraint, and refined micro-detail in the spirit of Linear and Emil Kowalski — flat list, ⌘K hint, keyboard shortcuts on hover.',
    component: <VariationLinear />,
  },
  {
    id: 'rams',
    title: 'The Rams',
    description:
      'Dieter Rams meets Braun TS-505. Numbered grid, mono type, single accent of Braun orange, control-panel discipline.',
    component: <VariationRams />,
  },
  {
    id: 'racing',
    title: 'Racing',
    description:
      'F1 timing-tower aesthetic. Position prefixes, team-colour stripes, checkered dividers, Driver Card footer.',
    component: <VariationRacing />,
  },
]

export default function SidebarVariationsPage() {
  return (
    <main className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto max-w-[1600px]'>
        <header className='mb-10'>
          <h1 className='text-3xl font-semibold tracking-tight'>
            Sidebar variations
          </h1>
          <p className='mt-2 max-w-2xl text-muted-foreground'>
            Four design directions for the GridTip sidebar, rendered side by
            side at the live sidebar's 16rem width. Links are placeholders.
          </p>
        </header>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-4'>
          {variations.map((variation) => (
            <section
              key={variation.id}
              className='flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm'
            >
              <div className='border-b p-4'>
                <h2 className='text-lg font-medium'>{variation.title}</h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {variation.description}
                </p>
              </div>
              <div className='flex justify-center bg-muted/30 p-4'>
                <div className='h-[640px] overflow-hidden rounded-md border shadow-sm'>
                  {variation.component}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

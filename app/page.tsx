import DefaultLayout from './layouts/default'

export default function Home() {
  return (
    <DefaultLayout>
      <div className='py-12 is-container'>
        <div className='text-center max-w-prose mx-auto space-y-4'>
          <h1 className='text-4xl font-semibold'>
            Predict against your friends.
          </h1>
          <p className='text-muted-foreground text-pretty'>
            Gather your crew and establish once and for all who’s the F1 expert.
            Tip each race, accumulate points and predict your way to the podium.
          </p>
        </div>
      </div>
    </DefaultLayout>
  )
}

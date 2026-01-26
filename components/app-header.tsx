import Logo from './logo'

export async function AppHeader({
  renderRight,
}: {
  renderRight?: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between is-container py-4'>
      <Logo href='/' title='Home' />
      {renderRight}
    </div>
  )
}

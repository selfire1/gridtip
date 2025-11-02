import { Database } from '@/db/types'
import { LucideCheck } from 'lucide-react'

export type DriverOptionProps = Pick<
  Database.Driver,
  'constructorId' | 'givenName' | 'familyName' | 'id' | 'permanentNumber'
>

export default function DriverOption({
  driver,
  isSelected = false,
  short = false,
}: {
  driver: DriverOptionProps
  isSelected?: boolean
  short?: boolean
}) {
  return (
    <div
      className='flex items-stretch w-full gap-2 before:w-1 before:rounded-full before:bg-(--team-color)'
      style={getStyle()}
    >
      <p className={isSelected ? 'font-semibold' : ''}>
        {short ? (
          <span>{driver.familyName}</span>
        ) : (
          <>
            <span className='text-muted-foreground'>{driver.givenName}</span>
            <span> </span>
            <span>{driver.familyName}</span>
          </>
        )}
      </p>
      {isSelected && <LucideCheck className='ml-auto' />}
    </div>
  )

  function getStyle() {
    if (!driver.constructorId) {
      return {}
    }
    return {
      ['--team-color' as string]: getConstructorCssVariable(
        driver.constructorId,
      ),
    }

    function getConstructorCssVariable(teamId: string, opacity = 1) {
      const variableName = `--clr-team-${teamId}`
      return `rgba(var(${variableName}), ${opacity})`
    }
  }
}

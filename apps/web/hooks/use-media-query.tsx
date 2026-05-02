import * as React from 'react'

export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const result = matchMedia(query)
      result.addEventListener('change', onChange)
      return () => result.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = React.useCallback(() => matchMedia(query).matches, [query])

  const getServerSnapshot = () => false

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

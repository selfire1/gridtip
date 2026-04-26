import { queryOptions, useQuery, UseQueryResult } from '@tanstack/react-query'
import { GetLastUpdated } from '@gridtip/shared/api-types'
import { useEffect } from 'react'

export function useStaticQuery<TData>(
  remoteKey: keyof GetLastUpdated,
  lastUpdatedResult: UseQueryResult<GetLastUpdated, Error>,
  options: {
    queryKey: readonly unknown[]
    queryFn: () => Promise<TData>
  },
) {
  const query = useQuery(
    queryOptions({
      ...options,
      staleTime: Infinity, // never expire
      gcTime: Infinity,
    }),
  )

  useReinvalidate(query.refetch, {
    lastUpdatedOnApi: lastUpdatedResult.data?.[remoteKey],
    lastUpdatedLocally: query.dataUpdatedAt,
  })

  return query
}

function useReinvalidate(
  refetchFn: () => Promise<unknown>,
  {
    lastUpdatedOnApi,
    lastUpdatedLocally,
  }: {
    /** timestamp */
    lastUpdatedOnApi: string | undefined
    /** timestamp */
    lastUpdatedLocally: number
  },
) {
  useEffect(() => {
    if (!lastUpdatedOnApi) {
      return
    }

    const lastUpdatedOnApiNormalised = new Date(+lastUpdatedOnApi).getTime()
    if (lastUpdatedOnApiNormalised > lastUpdatedLocally) {
      refetchFn()
    }
  }, [lastUpdatedOnApi, lastUpdatedLocally, refetchFn])
}

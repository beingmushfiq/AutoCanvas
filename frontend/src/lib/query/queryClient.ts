import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { telemetry } from '../state/telemetry'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      telemetry.captureException(error, {
        queryKey: query.queryKey,
        context: 'ReactQuery.QueryCache',
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      telemetry.captureException(error, {
        mutationKey: mutation.options.mutationKey,
        context: 'ReactQuery.MutationCache',
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      retry: (failureCount, error) => {
        // Do not retry 401 Unauthorized or 403 Forbidden
        const status = (error as { status?: number })?.status
        if (status === 401 || status === 403) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})


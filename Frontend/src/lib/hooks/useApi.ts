import { useState, useEffect, useCallback } from 'react'

// ============================================================
// useApi — Generic data-fetching hook for API calls
// ============================================================

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => void
}

/**
 * Generic hook for fetching data from API services.
 *
 * @param fetcher  Async function that returns data (e.g. `() => getStudentDashboard()`)
 * @param deps     Dependency array — re-fetches when these change
 *
 * Usage:
 * ```tsx
 * const { data, loading, error } = useApi(() => getStudentDashboard())
 * if (loading) return <LoadingSpinner />
 * if (error) return <ErrorMessage message={error} />
 * ```
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fetcher()
      setState({ data, loading: false, error: null })
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? (err as { error: string }).error
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred'
      setState({ data: null, loading: false, error: message })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    execute()
  }, [execute])

  return { ...state, refetch: execute }
}

/**
 * Lazy variant — does not auto-fetch. Call `execute()` manually.
 *
 * Usage:
 * ```tsx
 * const { data, loading, execute } = useLazyApi<MyType>()
 * const handleClick = () => execute(() => api.post('/endpoint', payload))
 * ```
 */
export function useLazyApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (fetcher: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await fetcher()
      setState({ data, loading: false, error: null })
      return data
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? (err as { error: string }).error
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred'
      setState({ data: null, loading: false, error: message })
      throw err
    }
  }, [])

  return { ...state, execute }
}

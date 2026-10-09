// ============================================================
// Resilient Data Hook
// src/reliability/hooks/useReliableData.ts
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DataResult, ResilientRequestOptions } from '../types'
import { ReliableDataService } from '../services/reliableDataService'
import { useConnectivity } from './useConnectivity'

export interface UseReliableDataOptions<T> extends ResilientRequestOptions {
  enabled?: boolean
  initialData?: T
  onSuccess?: (data: T, source: string) => void
  onError?: (error: Error) => void
}

export function useReliableData<T>(
  key: string,
  namespace: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: UseReliableDataOptions<T> = {},
): DataResult<T> & { refetch: () => Promise<DataResult<T>>; isLoading: boolean } {
  const { enabled = true, initialData, onSuccess, onError, ...requestOptions } = options
  const { isOnline } = useConnectivity()

  const [result, setResult] = useState<DataResult<T>>({
    data: initialData ?? null,
    source: 'fallback',
    freshness: 'offline-only',
    fetchedAt: null,
    cachedAt: null,
    isStale: false,
    isOffline: !isOnline,
    isRevalidating: false,
  })

  const [isLoading, setIsLoading] = useState<boolean>(enabled && !initialData)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(
    async (forceRefresh = false): Promise<DataResult<T>> => {
      if (!enabled) {
        return result
      }

      // Abort any prior pending request from this hook instance
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsLoading(true)

      try {
        const queryResult = await ReliableDataService.query<T>(key, namespace, fetcher, {
          ...requestOptions,
          forceRefresh,
          signal: controller.signal,
        })

        setResult(queryResult)

        if (queryResult.data !== null && onSuccess) {
          onSuccess(queryResult.data, queryResult.source)
        }

        if (queryResult.error && onError) {
          onError(queryResult.error as Error)
        }

        return queryResult
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        const errorResult: DataResult<T> = {
          data: result.data,
          source: result.source,
          freshness: result.freshness,
          fetchedAt: result.fetchedAt,
          cachedAt: result.cachedAt,
          isStale: true,
          isOffline: !isOnline,
          isRevalidating: false,
          error,
          statusMessage: 'Error fetching data',
        }
        setResult(errorResult)
        if (onError) onError(error)
        return errorResult
      } finally {
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, namespace, enabled, isOnline],
  )

  useEffect(() => {
    if (enabled) {
      execute()
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [execute, enabled])

  const refetch = useCallback(() => execute(true), [execute])

  return {
    ...result,
    isLoading,
    refetch,
  }
}

// ============================================================
// Resilient Data Service
// src/reliability/services/reliableDataService.ts
// ============================================================

import type { DataResult, ResilientRequestOptions } from '../types'
import { cacheStorage } from '../storage/cacheStorageService'
import { ResilientFetcher } from '../network/resilientFetch'
import { connectivityMonitor } from '../network/connectivityMonitor'

export class ReliableDataService {
  /**
   * Primary query method: Orchestrates cache retrieval, live network fetching,
   * stale-while-revalidate, and offline fallbacks without fabricating data.
   */
  public static async query<T>(
    key: string,
    namespace: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options: ResilientRequestOptions = {},
  ): Promise<DataResult<T>> {
    const isClientOffline = connectivityMonitor.isOffline()
    const { forceRefresh = false, staleWhileRevalidate = true } = options

    // 1. Attempt reading from persistent cache
    const { record, freshness, isExpired } = await cacheStorage.get<T>(key, namespace)

    // 2. Offline Mode: Return cached data if available, or descriptive empty result
    if (isClientOffline && !forceRefresh) {
      if (record) {
        return {
          data: record.data,
          source: freshness === 'fresh' ? 'cache' : 'stale-cache',
          freshness: isExpired ? 'expired' : freshness,
          fetchedAt: record.meta.fetchedAt,
          cachedAt: record.meta.fetchedAt,
          isStale: freshness !== 'fresh',
          isOffline: true,
          isRevalidating: false,
          statusMessage: isExpired
            ? 'Displaying previously saved data in offline mode.'
            : 'Displaying cached data in offline mode.',
        }
      }

      return {
        data: null,
        source: 'fallback',
        freshness: 'offline-only',
        fetchedAt: null,
        cachedAt: null,
        isStale: false,
        isOffline: true,
        isRevalidating: false,
        statusMessage: 'This content is not available offline. Connect to the internet to load it.',
      }
    }

    // 3. Cache-hit (Fresh): Return immediately if not forced refresh
    if (record && freshness === 'fresh' && !forceRefresh) {
      return {
        data: record.data,
        source: 'cache',
        freshness: 'fresh',
        fetchedAt: record.meta.fetchedAt,
        cachedAt: record.meta.fetchedAt,
        isStale: false,
        isOffline: false,
        isRevalidating: false,
      }
    }

    // 4. Stale-While-Revalidate: Return stale cache immediately and refresh in background
    if (record && freshness === 'stale' && staleWhileRevalidate && !forceRefresh) {
      // Trigger background revalidation (non-blocking)
      this.revalidateInBackground(key, namespace, fetcher, options)

      return {
        data: record.data,
        source: 'stale-cache',
        freshness: 'stale',
        fetchedAt: record.meta.fetchedAt,
        cachedAt: record.meta.fetchedAt,
        isStale: true,
        isOffline: false,
        isRevalidating: true,
        statusMessage: 'Refreshing data in the background…',
      }
    }

    // 5. Live Network Fetch
    try {
      const liveData = await ResilientFetcher.fetch<T>(key, fetcher, options)

      // Validate that returned data is not null or malformed before caching
      if (liveData !== null && liveData !== undefined) {
        await cacheStorage.set(key, namespace, liveData, key.split(':')[0] || 'remote', options.cachePolicy)
      }

      const now = Date.now()
      return {
        data: liveData,
        source: 'live',
        freshness: 'fresh',
        fetchedAt: now,
        cachedAt: now,
        isStale: false,
        isOffline: false,
        isRevalidating: false,
      }
    } catch (networkError) {
      // 6. Network failure recovery: Fall back to existing cached data if present
      if (record) {
        return {
          data: record.data,
          source: 'stale-cache',
          freshness: isExpired ? 'expired' : 'stale',
          fetchedAt: record.meta.fetchedAt,
          cachedAt: record.meta.fetchedAt,
          isStale: true,
          isOffline: connectivityMonitor.isOffline(),
          isRevalidating: false,
          error: networkError instanceof Error ? networkError : new Error(String(networkError)),
          statusMessage: 'Could not reach server. Using previously saved data.',
        }
      }

      // No cached data available to rescue the request
      return {
        data: null,
        source: 'fallback',
        freshness: 'offline-only',
        fetchedAt: null,
        cachedAt: null,
        isStale: false,
        isOffline: connectivityMonitor.isOffline(),
        isRevalidating: false,
        error: networkError instanceof Error ? networkError : new Error(String(networkError)),
        statusMessage: 'Unable to retrieve data. Please check your network connection.',
      }
    }
  }

  /**
   * Background revalidation worker.
   */
  private static revalidateInBackground<T>(
    key: string,
    namespace: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options: ResilientRequestOptions,
  ): void {
    ResilientFetcher.fetch<T>(key, fetcher, { ...options, maxRetries: 1 })
      .then(async (freshData) => {
        if (freshData !== null && freshData !== undefined) {
          await cacheStorage.set(key, namespace, freshData, key.split(':')[0] || 'remote', options.cachePolicy)
        }
      })
      .catch((err) => {
        // Silently retain existing cache on background refresh error
        console.debug(`Background revalidation for ${key} paused:`, err?.message || err)
      })
  }

  /**
   * Prefetch and warm the cache for a resource.
   */
  public static async prefetch<T>(
    key: string,
    namespace: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options?: ResilientRequestOptions,
  ): Promise<boolean> {
    try {
      const res = await this.query<T>(key, namespace, fetcher, options)
      return res.data !== null
    } catch {
      return false
    }
  }
}

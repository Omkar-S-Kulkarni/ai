// ============================================================
// Resilient Fetch Coordinator
// src/reliability/network/resilientFetch.ts
// ============================================================

import type { ResilientRequestOptions } from '../types'
import { requestDeduplicator } from './requestDeduplicator'
import { RetryStrategy } from './retryStrategy'
import { connectivityMonitor } from './connectivityMonitor'

export class ResilientFetcher {
  /**
   * Executes a network operation with timeout, cancellation, deduplication, and retries.
   */
  public static async fetch<T>(
    key: string,
    operation: (signal: AbortSignal) => Promise<T>,
    options: ResilientRequestOptions = {},
  ): Promise<T> {
    const {
      timeoutMs = 9000,
      maxRetries = 2,
      retryDelayMs = 500,
      signal: userSignal,
      dedupKey = key,
    } = options

    const execute = async (): Promise<T> => {
      return RetryStrategy.executeWithRetry(
        async () => {
          const controller = new AbortController()
          let timeoutId: number | undefined

          if (timeoutMs > 0) {
            timeoutId = window.setTimeout(() => {
              controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError'))
            }, timeoutMs)
          }

          // Link external user cancellation signal if provided
          if (userSignal) {
            if (userSignal.aborted) {
              controller.abort(userSignal.reason)
            } else {
              userSignal.addEventListener('abort', () => controller.abort(userSignal.reason), { once: true })
            }
          }

          try {
            const result = await operation(controller.signal)
            connectivityMonitor.reportRequestSuccess()
            return result
          } catch (err) {
            const status = (err as { status?: number; response?: { status?: number } })?.status ??
              (err as { response?: { status?: number } })?.response?.status
            connectivityMonitor.reportRequestFailure(status)
            throw err
          } finally {
            if (timeoutId) clearTimeout(timeoutId)
          }
        },
        { maxRetries, initialDelayMs: retryDelayMs },
        userSignal,
      )
    }

    // Deduplicate concurrent in-flight requests for the same key
    return requestDeduplicator.deduplicate(dedupKey, execute)
  }
}

// ============================================================
// Resilient Retry & Rate Limit Strategy
// src/reliability/network/retryStrategy.ts
// ============================================================

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffFactor: number
  jitter: boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 6000,
  backoffFactor: 2,
  jitter: true,
}

export class RetryStrategy {
  /**
   * Determine if an error is eligible for retry.
   */
  public static isRetryable(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const err = error as {
      status?: number
      code?: string
      name?: string
      response?: { status?: number; headers?: Record<string, string> }
      message?: string
    }

    // Never retry explicit cancellations or aborts
    if (err.name === 'AbortError' || err.code === 'CANCELLED' || err.code === 'ERR_CANCELED') {
      return false
    }

    const status = err.status ?? err.response?.status

    // 404 Not Found, 400 Bad Request, 401/403 Auth - Not retryable
    if (status === 404 || status === 400 || status === 401 || status === 403) {
      return false
    }

    // 429 Rate limited - Handled via special backoff or not retried in loops
    if (status === 429) {
      return true
    }

    // 5xx Server Errors & Network / Timeout errors - Retryable
    if (status && status >= 500 && status <= 599) {
      return true
    }

    if (
      err.code === 'ECONNABORTED' ||
      err.code === 'TIMEOUT' ||
      err.code === 'NETWORK_ERROR' ||
      err.code === 'ERR_NETWORK' ||
      err.message?.toLowerCase().includes('network') ||
      err.message?.toLowerCase().includes('timeout') ||
      err.message?.toLowerCase().includes('failed to fetch')
    ) {
      return true
    }

    return false
  }

  /**
   * Calculates backoff delay with jitter.
   */
  public static calculateDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
    const baseDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt)
    const cappedDelay = Math.min(baseDelay, config.maxDelayMs)

    if (config.jitter) {
      // Full jitter: random between 0.5 * delay and 1.5 * delay
      const jitterFactor = 0.5 + Math.random()
      return Math.round(cappedDelay * jitterFactor)
    }

    return cappedDelay
  }

  /**
   * Execute an async operation with jittered exponential backoff retries.
   */
  public static async executeWithRetry<T>(
    operation: () => Promise<T>,
    configOverride?: Partial<RetryConfig>,
    signal?: AbortSignal,
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...configOverride }
    let lastError: unknown

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      if (signal?.aborted) {
        throw new DOMException('Operation aborted by user signal', 'AbortError')
      }

      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt === config.maxRetries || !RetryStrategy.isRetryable(error)) {
          throw error
        }

        // Check if 429 rate limit has a Retry-After header
        let delayMs = RetryStrategy.calculateDelay(attempt, config)
        const err = error as { response?: { headers?: Record<string, string>; status?: number } }
        if (err.response?.status === 429) {
          const retryAfter = err.response.headers?.['retry-after']
          if (retryAfter) {
            const parsedSeconds = parseInt(retryAfter, 10)
            if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
              delayMs = Math.min(parsedSeconds * 1000, 10000)
            }
          } else {
            delayMs = Math.max(delayMs, 2000) // Minimum 2s for 429
          }
        }

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, delayMs)
          if (signal) {
            signal.addEventListener(
              'abort',
              () => {
                clearTimeout(timeout)
                reject(new DOMException('Aborted during retry delay', 'AbortError'))
              },
              { once: true },
            )
          }
        })
      }
    }

    throw lastError
  }
}

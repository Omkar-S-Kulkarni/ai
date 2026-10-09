// ============================================================
// Reliability Module Types & Interfaces
// src/reliability/types.ts
// ============================================================

/**
 * Origin source of the returned data.
 * - 'live': Freshly fetched from the remote upstream provider.
 * - 'cache': Retrieved from local persistent storage within fresh TTL.
 * - 'stale-cache': Retrieved from cache after stale threshold but before eviction, or during offline fallback.
 * - 'fallback': Generated deterministic offline default / placeholder (when explicitly safe).
 */
export type DataSource = 'live' | 'cache' | 'stale-cache' | 'fallback'

/**
 * Data freshness classification.
 * - 'fresh': Within fresh TTL window.
 * - 'stale': Past fresh TTL window, eligible for background revalidation.
 * - 'expired': Past hard expiration threshold, but retained as offline fallback.
 * - 'offline-only': Stored locally without active remote connection.
 */
export type DataFreshness = 'fresh' | 'stale' | 'expired' | 'offline-only'

/**
 * Current network and provider connectivity health.
 * - 'online': Internet available and providers reachable.
 * - 'offline': Device has no active network connection.
 * - 'degraded': Network detected but upstream provider is slow, failing, or rate-limited.
 */
export type ConnectivityStatus = 'online' | 'offline' | 'degraded'

/**
 * Metadata stored alongside cached records in persistent storage.
 */
export interface CacheMetadata {
  /** Unique composite cache key (e.g. `pokemon:detail:25`) */
  key: string
  /** Resource category namespace */
  namespace: string
  /** Schema version for migrations */
  schemaVersion: number
  /** Epoch timestamp (ms) when data was fetched */
  fetchedAt: number
  /** Epoch timestamp (ms) when data becomes stale and should be revalidated */
  staleAt: number
  /** Epoch timestamp (ms) when data expires (hard TTL) */
  expiresAt: number
  /** Number of times this cache item was accessed */
  accessCount: number
  /** Last epoch timestamp (ms) when item was read */
  lastAccessedAt: number
  /** Upstream origin identifier (e.g. 'pokeapi.co', 'nominatim.openstreetmap.org') */
  source: string
  /** Approximate byte size of payload */
  byteSize?: number
  /** ETag or Last-Modified header if provided by server */
  etag?: string
}

/**
 * Wrapper for stored records in IndexedDB.
 */
export interface CacheRecord<T = unknown> {
  key: string
  namespace: string
  data: T
  meta: CacheMetadata
}

/**
 * Unified result object returned by resilient data queries.
 */
export interface DataResult<T> {
  /** The payload data (normalized and validated) */
  data: T | null
  /** Origin source of this data */
  source: DataSource
  /** Freshness status */
  freshness: DataFreshness
  /** Timestamp when this data was fetched from source */
  fetchedAt: number | null
  /** Timestamp when this data was saved to local cache */
  cachedAt?: number | null
  /** True if data is stale and background refresh was attempted */
  isStale: boolean
  /** True if client is currently in offline mode */
  isOffline: boolean
  /** True if an active network refresh is in progress */
  isRevalidating: boolean
  /** Error details if a live refresh failed while returning cached data */
  error?: Error | null
  /** Human-readable explanation of the data state */
  statusMessage?: string
}

/**
 * Declarative Cache Policy per resource type.
 */
export interface CachePolicy {
  /** Resource namespace identifier */
  namespace: string
  /** Time in ms before cached data is considered stale (eligible for SWR) */
  staleTimeMs: number
  /** Hard expiration time in ms (after which it is only used during offline) */
  maxAgeMs: number
  /** Maximum number of records to retain in this namespace before LRU eviction */
  maxEntries?: number
  /** Whether this data should be retained indefinitely if offline */
  persistOffline: boolean
  /** Priority level for cache eviction (higher priority = evicted last) */
  evictionPriority: 'low' | 'medium' | 'high' | 'never'
}

/**
 * Storage quota and usage metrics.
 */
export interface StorageQuotaInfo {
  usageBytes: number
  quotaBytes: number
  percentUsed: number
  entryCounts: Record<string, number>
  isStorageAvailable: boolean
  backend: 'indexeddb' | 'memory' | 'unavailable'
}

/**
 * Options for resilient network requests.
 */
export interface ResilientRequestOptions {
  /** Timeout in ms before aborting request (default 8000ms) */
  timeoutMs?: number
  /** Maximum number of retry attempts for transient errors (default 2) */
  maxRetries?: number
  /** Initial backoff delay in ms (default 500ms) */
  retryDelayMs?: number
  /** AbortSignal for user-initiated cancellation */
  signal?: AbortSignal
  /** Custom cache policy override */
  cachePolicy?: Partial<CachePolicy>
  /** Skip cache read and force live fetch */
  forceRefresh?: boolean
  /** Enable background revalidation if stale */
  staleWhileRevalidate?: boolean
  /** Request deduplication key (defaults to URL/method) */
  dedupKey?: string
}

/**
 * Generic simulation audit and input contract for the simulation engine integration.
 */
export interface SimulationInputContext {
  pokemonId: number
  pokemonName: string
  pokemonLevel?: number
  locationName?: string
  latitude?: number
  longitude?: number
  biomeType?: string
  weatherCondition?: string
}

/**
 * Generic simulation result record stored persistently.
 */
export interface SimulationRecord {
  /** Unique simulation ID (UUID or timestamp-derived) */
  id: string
  /** Timestamp when simulation executed */
  timestamp: number
  /** Type / mode of simulation (e.g. 'battle', 'encounter', 'catch', 'expedition') */
  simulationType: string
  /** Input parameters provided to the simulation engine */
  inputs: SimulationInputContext
  /** Output results produced by the simulation engine */
  results: Record<string, unknown>
  /** Engine version and ruleset identifier used */
  engineVersion: string
  /** Whether the simulation was executed with live or cached inputs */
  dataFreshnessAtRun: DataFreshness
  /** Optional user notes or tags */
  tags?: string[]
}

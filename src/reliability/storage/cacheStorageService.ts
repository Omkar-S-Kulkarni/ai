// ============================================================
// Unified Cache Storage Service
// src/reliability/storage/cacheStorageService.ts
// ============================================================

import type { CacheMetadata, CachePolicy, CacheRecord, DataFreshness, SimulationRecord, StorageQuotaInfo } from '../types'
import { getCachePolicy } from '../config/cachePolicies'
import { indexedDbEngine } from './indexedDb'
import { memoryStorageEngine } from './memoryFallback'

export class CacheStorageService {
  private useIndexedDb = true

  /**
   * Reads a cached item and evaluates its current freshness state.
   */
  public async get<T>(
    key: string,
    namespace: string,
  ): Promise<{ record: CacheRecord<T> | null; freshness: DataFreshness; isExpired: boolean }> {
    let record: CacheRecord<T> | null = null

    if (this.useIndexedDb) {
      try {
        record = await indexedDbEngine.get<T>(key, namespace)
      } catch (err) {
        console.warn(`IndexedDB read failed for ${key}, falling back to memory:`, err)
        this.useIndexedDb = false
        record = await memoryStorageEngine.get<T>(key, namespace)
      }
    } else {
      record = await memoryStorageEngine.get<T>(key, namespace)
    }

    if (!record) {
      return { record: null, freshness: 'expired', isExpired: true }
    }

    const now = Date.now()
    const { staleAt, expiresAt } = record.meta

    let freshness: DataFreshness = 'fresh'
    let isExpired = false

    if (now > expiresAt) {
      freshness = 'expired'
      isExpired = true
    } else if (now > staleAt) {
      freshness = 'stale'
    }

    return { record, freshness, isExpired }
  }

  /**
   * Stores a payload into cache with computed metadata and freshness timestamps.
   */
  public async set<T>(
    key: string,
    namespace: string,
    data: T,
    source: string,
    policyOverride?: Partial<CachePolicy>,
  ): Promise<boolean> {
    const policy = { ...getCachePolicy(namespace), ...policyOverride }
    const now = Date.now()

    const meta: CacheMetadata = {
      key,
      namespace,
      schemaVersion: 2,
      fetchedAt: now,
      staleAt: policy.staleTimeMs === Infinity ? Infinity : now + policy.staleTimeMs,
      expiresAt: policy.maxAgeMs === Infinity ? Infinity : now + policy.maxAgeMs,
      accessCount: 1,
      lastAccessedAt: now,
      source,
      byteSize: this.approximateByteSize(data),
    }

    const record: CacheRecord<T> = {
      key,
      namespace,
      data,
      meta,
    }

    if (this.useIndexedDb) {
      try {
        const ok = await indexedDbEngine.set(record)
        if (ok) return true
      } catch (err) {
        console.warn(`IndexedDB write failed for ${key}, using memory:`, err)
        this.useIndexedDb = false
      }
    }

    return memoryStorageEngine.set(record)
  }

  /**
   * Removes a specific cached entry.
   */
  public async delete(key: string, namespace: string): Promise<boolean> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.delete(key, namespace)
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.delete(key, namespace)
  }

  /**
   * Retrieves all items within a namespace (e.g. all cached Pokémon for offline search).
   */
  public async getAllByNamespace<T>(namespace: string): Promise<CacheRecord<T>[]> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.getAllByNamespace<T>(namespace)
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.getAllByNamespace<T>(namespace)
  }

  /**
   * Save a simulation record into persistent storage.
   */
  public async saveSimulation(record: SimulationRecord): Promise<boolean> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.saveSimulationRecord(record)
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.saveSimulationRecord(record)
  }

  /**
   * Retrieve all saved simulation records.
   */
  public async getSimulations(): Promise<SimulationRecord[]> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.getAllSimulationRecords()
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.getAllSimulationRecords()
  }

  /**
   * Delete a simulation record by ID.
   */
  public async deleteSimulation(id: string): Promise<boolean> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.deleteSimulationRecord(id)
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.deleteSimulationRecord(id)
  }

  /**
   * Maintenance sweep: Prunes expired and excess LRU records.
   */
  public async maintenanceSweep(): Promise<{ prunedCount: number }> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.pruneExpiredAndLru()
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.pruneExpiredAndLru()
  }

  /**
   * Clears non-critical caches.
   */
  public async clearCache(namespace?: string): Promise<boolean> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.clear(namespace)
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.clear(namespace)
  }

  /**
   * Retrieves storage quota and usage information.
   */
  public async getQuotaInfo(): Promise<StorageQuotaInfo> {
    if (this.useIndexedDb) {
      try {
        return await indexedDbEngine.getQuotaInfo()
      } catch {
        this.useIndexedDb = false
      }
    }
    return memoryStorageEngine.getQuotaInfo()
  }

  /**
   * Estimate rough JSON byte size.
   */
  private approximateByteSize(data: unknown): number {
    try {
      return JSON.stringify(data).length
    } catch {
      return 0
    }
  }
}

export const cacheStorage = new CacheStorageService()

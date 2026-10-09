// ============================================================
// In-Memory Storage Fallback
// src/reliability/storage/memoryFallback.ts
// ============================================================

import type { CacheRecord, SimulationRecord, StorageQuotaInfo } from '../types'
import { getCachePolicy } from '../config/cachePolicies'

export class MemoryStorageEngine {
  private cache = new Map<string, CacheRecord>()
  private simulations = new Map<string, SimulationRecord>()

  public async get<T>(key: string, _namespace?: string): Promise<CacheRecord<T> | null> {
    const record = this.cache.get(key)
    if (!record) return null
    record.meta.accessCount = (record.meta.accessCount || 0) + 1
    record.meta.lastAccessedAt = Date.now()
    return record as CacheRecord<T>
  }

  public async set<T>(record: CacheRecord<T>): Promise<boolean> {
    this.cache.set(record.key, record as CacheRecord)
    return true
  }

  public async delete(key: string, _namespace?: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  public async getAllByNamespace<T>(namespace: string): Promise<CacheRecord<T>[]> {
    const results: CacheRecord<T>[] = []
    for (const record of this.cache.values()) {
      if (record.namespace === namespace) {
        results.push(record as CacheRecord<T>)
      }
    }
    return results
  }

  public async saveSimulationRecord(record: SimulationRecord): Promise<boolean> {
    this.simulations.set(record.id, record)
    return true
  }

  public async getAllSimulationRecords(): Promise<SimulationRecord[]> {
    return Array.from(this.simulations.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  public async deleteSimulationRecord(id: string): Promise<boolean> {
    return this.simulations.delete(id)
  }

  public async pruneExpiredAndLru(): Promise<{ prunedCount: number }> {
    const now = Date.now()
    let prunedCount = 0
    const byNamespace = new Map<string, CacheRecord[]>()

    for (const record of this.cache.values()) {
      const group = byNamespace.get(record.namespace) ?? []
      group.push(record)
      byNamespace.set(record.namespace, group)
    }

    for (const [ns, group] of byNamespace.entries()) {
      const policy = getCachePolicy(ns)
      if (policy.evictionPriority === 'never') continue

      for (const item of group) {
        if (item.meta.expiresAt && item.meta.expiresAt < now) {
          this.cache.delete(item.key)
          prunedCount++
        }
      }

      const remaining = group.filter((item) => this.cache.has(item.key))
      if (policy.maxEntries && remaining.length > policy.maxEntries) {
        remaining.sort((a, b) => (a.meta.lastAccessedAt || 0) - (b.meta.lastAccessedAt || 0))
        const excess = remaining.length - policy.maxEntries
        for (const item of remaining.slice(0, excess)) {
          this.cache.delete(item.key)
          prunedCount++
        }
      }
    }

    return { prunedCount }
  }

  public async clear(namespace?: string): Promise<boolean> {
    if (namespace) {
      for (const [key, record] of this.cache.entries()) {
        if (record.namespace === namespace) {
          this.cache.delete(key)
        }
      }
      return true
    }
    this.cache.clear()
    return true
  }

  public async getQuotaInfo(): Promise<StorageQuotaInfo> {
    return {
      usageBytes: this.cache.size * 512,
      quotaBytes: 10 * 1024 * 1024,
      percentUsed: 1,
      entryCounts: {
        cache: this.cache.size,
        simulations: this.simulations.size,
      },
      isStorageAvailable: true,
      backend: 'memory',
    }
  }
}

export const memoryStorageEngine = new MemoryStorageEngine()

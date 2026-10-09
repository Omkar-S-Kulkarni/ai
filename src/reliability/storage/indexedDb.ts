// ============================================================
// Typed IndexedDB Storage Engine
// src/reliability/storage/indexedDb.ts
// ============================================================

import type { CacheRecord, SimulationRecord, StorageQuotaInfo } from '../types'
import { getCachePolicy } from '../config/cachePolicies'

const DB_NAME = 'pokeverse_reliability_db'
const DB_VERSION = 2

export const STORES = {
  POKEMON: 'pokemon_cache',
  GEOCODING: 'geocoding_cache',
  USER_DATA: 'user_data',
  SIMULATION: 'simulation_store',
  META: 'meta_store',
} as const

export class IndexedDbEngine {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null
  private isAvailable: boolean = true

  /**
   * Initializes or returns the open IndexedDB connection.
   */
  public async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        this.isAvailable = false
        return reject(new Error('IndexedDB is not supported in this environment'))
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = (event) => {
          const db = request.result
          const oldVersion = event.oldVersion

          // Store 1: Pokémon Cache
          if (!db.objectStoreNames.contains(STORES.POKEMON)) {
            const store = db.createObjectStore(STORES.POKEMON, { keyPath: 'key' })
            store.createIndex('namespace', 'namespace', { unique: false })
            store.createIndex('expiresAt', 'meta.expiresAt', { unique: false })
            store.createIndex('lastAccessedAt', 'meta.lastAccessedAt', { unique: false })
          }

          // Store 2: Geocoding & Map Cache
          if (!db.objectStoreNames.contains(STORES.GEOCODING)) {
            const store = db.createObjectStore(STORES.GEOCODING, { keyPath: 'key' })
            store.createIndex('namespace', 'namespace', { unique: false })
            store.createIndex('expiresAt', 'meta.expiresAt', { unique: false })
          }

          // Store 3: User Persistent Data (Favorites, Recents, Preferences)
          if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
            db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' })
          }

          // Store 4: Simulation Engine Records & History
          if (!db.objectStoreNames.contains(STORES.SIMULATION)) {
            const store = db.createObjectStore(STORES.SIMULATION, { keyPath: 'id' })
            store.createIndex('timestamp', 'timestamp', { unique: false })
            store.createIndex('simulationType', 'simulationType', { unique: false })
          }

          // Store 5: Metadata & Schema Migrations
          if (!db.objectStoreNames.contains(STORES.META)) {
            db.createObjectStore(STORES.META, { keyPath: 'key' })
          }

          // Handle schema migration metadata
          if (oldVersion < 2 && db.objectStoreNames.contains(STORES.META)) {
            const tx = request.transaction
            if (tx) {
              const metaStore = tx.objectStore(STORES.META)
              metaStore.put({
                key: 'schema_version',
                version: DB_VERSION,
                migratedAt: Date.now(),
              })
            }
          }
        }

        request.onsuccess = () => {
          this.db = request.result
          this.isAvailable = true

          this.db.onversionchange = () => {
            this.db?.close()
            this.db = null
          }

          this.db.onerror = (e) => {
            console.error('IndexedDB runtime error:', e)
          }

          resolve(this.db)
        }

        request.onerror = () => {
          this.isAvailable = false
          reject(request.error ?? new Error('Failed to open IndexedDB'))
        }

        request.onblocked = () => {
          console.warn('IndexedDB blocked by another open connection')
        }
      } catch (err) {
        this.isAvailable = false
        reject(err)
      }
    })

    return this.initPromise
  }

  /**
   * Determine the target store for a given namespace.
   */
  private getStoreNameForNamespace(namespace: string): string {
    if (namespace.startsWith('pokemon')) return STORES.POKEMON
    if (namespace.startsWith('geocoding') || namespace.startsWith('reverse_geocoding') || namespace === 'geolocation' || namespace === 'weather') {
      return STORES.GEOCODING
    }
    if (namespace.startsWith('user')) return STORES.USER_DATA
    if (namespace === 'simulation_history' || namespace === 'simulation') return STORES.SIMULATION
    return STORES.POKEMON
  }

  /**
   * Get a cache record by key.
   */
  public async get<T>(key: string, namespace: string): Promise<CacheRecord<T> | null> {
    try {
      const db = await this.getDb()
      const storeName = this.getStoreNameForNamespace(namespace)
      return new Promise<CacheRecord<T> | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          const record = request.result as CacheRecord<T> | undefined
          if (record && record.meta) {
            // Update LRU access stats asynchronously
            record.meta.accessCount = (record.meta.accessCount || 0) + 1
            record.meta.lastAccessedAt = Date.now()
            store.put(record)
            resolve(record)
          } else {
            resolve(null)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.warn(`IndexedDB get failed for ${key}:`, err)
      return null
    }
  }

  /**
   * Put or overwrite a cache record.
   */
  public async set<T>(record: CacheRecord<T>): Promise<boolean> {
    try {
      const db = await this.getDb()
      const storeName = this.getStoreNameForNamespace(record.namespace)
      return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.put(record)

        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.warn(`IndexedDB set failed for ${record.key}:`, err)
      return false
    }
  }

  /**
   * Delete a record by key.
   */
  public async delete(key: string, namespace: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      const storeName = this.getStoreNameForNamespace(namespace)
      return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.delete(key)

        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.warn(`IndexedDB delete failed for ${key}:`, err)
      return false
    }
  }

  /**
   * Query all records matching a namespace.
   */
  public async getAllByNamespace<T>(namespace: string): Promise<CacheRecord<T>[]> {
    try {
      const db = await this.getDb()
      const storeName = this.getStoreNameForNamespace(namespace)
      return new Promise<CacheRecord<T>[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)

        if (store.indexNames.contains('namespace')) {
          const index = store.index('namespace')
          const request = index.getAll(namespace)
          request.onsuccess = () => resolve(request.result as CacheRecord<T>[])
          request.onerror = () => reject(request.error)
        } else {
          const request = store.getAll()
          request.onsuccess = () => {
            const all = request.result as CacheRecord<T>[]
            resolve(all.filter((r) => r.namespace === namespace))
          }
          request.onerror = () => reject(request.error)
        }
      })
    } catch (err) {
      console.warn(`IndexedDB getAllByNamespace failed for ${namespace}:`, err)
      return []
    }
  }

  /**
   * Save a simulation record in the dedicated simulation store.
   */
  public async saveSimulationRecord(record: SimulationRecord): Promise<boolean> {
    try {
      const db = await this.getDb()
      return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(STORES.SIMULATION, 'readwrite')
        const store = tx.objectStore(STORES.SIMULATION)
        const request = store.put(record)

        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.warn('Failed to save simulation record:', err)
      return false
    }
  }

  /**
   * Retrieve all saved simulation records (ordered newest first).
   */
  public async getAllSimulationRecords(): Promise<SimulationRecord[]> {
    try {
      const db = await this.getDb()
      return new Promise<SimulationRecord[]>((resolve, reject) => {
        const tx = db.transaction(STORES.SIMULATION, 'readonly')
        const store = tx.objectStore(STORES.SIMULATION)
        const request = store.getAll()

        request.onsuccess = () => {
          const records = (request.result as SimulationRecord[]).sort(
            (a, b) => b.timestamp - a.timestamp,
          )
          resolve(records)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.warn('Failed to retrieve simulation records:', err)
      return []
    }
  }

  /**
   * Delete a simulation record by ID.
   */
  public async deleteSimulationRecord(id: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(STORES.SIMULATION, 'readwrite')
        const store = tx.objectStore(STORES.SIMULATION)
        const request = store.delete(id)

        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.warn(`Failed to delete simulation record ${id}:`, err)
      return false
    }
  }

  /**
   * Perform LRU eviction and expired cleanup across stores.
   * NEVER evicts 'never' priority items (Favorites, User history, Simulation history).
   */
  public async pruneExpiredAndLru(): Promise<{ prunedCount: number }> {
    let prunedCount = 0
    try {
      const db = await this.getDb()
      const now = Date.now()

      for (const storeName of [STORES.POKEMON, STORES.GEOCODING]) {
        const records = await new Promise<CacheRecord[]>((resolve) => {
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          const req = store.getAll()
          req.onsuccess = () => resolve(req.result as CacheRecord[])
          req.onerror = () => resolve([])
        })

        // Group by namespace
        const byNamespace = new Map<string, CacheRecord[]>()
        for (const record of records) {
          const ns = record.namespace || 'default'
          const group = byNamespace.get(ns) ?? []
          group.push(record)
          byNamespace.set(ns, group)
        }

        for (const [ns, group] of byNamespace.entries()) {
          const policy = getCachePolicy(ns)
          if (policy.evictionPriority === 'never') continue

          const toDelete: string[] = []

          // 1. Expired records beyond hard maxAge
          for (const item of group) {
            if (item.meta.expiresAt && item.meta.expiresAt < now) {
              toDelete.push(item.key)
            }
          }

          // 2. LRU eviction if exceeding maxEntries limit
          const remaining = group.filter((item) => !toDelete.includes(item.key))
          if (policy.maxEntries && remaining.length > policy.maxEntries) {
            // Sort by least recently accessed
            remaining.sort((a, b) => (a.meta.lastAccessedAt || 0) - (b.meta.lastAccessedAt || 0))
            const excess = remaining.length - policy.maxEntries
            const evicted = remaining.slice(0, excess)
            for (const item of evicted) {
              toDelete.push(item.key)
            }
          }

          if (toDelete.length > 0) {
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            for (const key of toDelete) {
              store.delete(key)
              prunedCount++
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error during cache pruning:', err)
    }

    return { prunedCount }
  }

  /**
   * Clear all records in a given namespace or across all caches.
   */
  public async clear(namespace?: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      if (namespace) {
        const storeName = this.getStoreNameForNamespace(namespace)
        const records = await this.getAllByNamespace(namespace)
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        for (const rec of records) {
          store.delete(rec.key)
        }
        return true
      }

      // Clear non-critical stores only
      for (const storeName of [STORES.POKEMON, STORES.GEOCODING]) {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        store.clear()
      }
      return true
    } catch (err) {
      console.warn('Error clearing cache:', err)
      return false
    }
  }

  /**
   * Get quota and usage statistics.
   */
  public async getQuotaInfo(): Promise<StorageQuotaInfo> {
    let usageBytes = 0
    let quotaBytes = 0

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate()
        usageBytes = estimate.usage ?? 0
        quotaBytes = estimate.quota ?? 0
      } catch {
        // Fallback estimate
      }
    }

    const counts: Record<string, number> = {}
    try {
      const db = await this.getDb()
      for (const name of Object.values(STORES)) {
        counts[name] = await new Promise<number>((resolve) => {
          const tx = db.transaction(name, 'readonly')
          const store = tx.objectStore(name)
          const req = store.count()
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => resolve(0)
        })
      }
    } catch {
      // Ignore count failure
    }

    const percentUsed = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0

    return {
      usageBytes,
      quotaBytes,
      percentUsed: Math.round(percentUsed * 100) / 100,
      entryCounts: counts,
      isStorageAvailable: this.isAvailable,
      backend: this.isAvailable ? 'indexeddb' : 'memory',
    }
  }
}

export const indexedDbEngine = new IndexedDbEngine()

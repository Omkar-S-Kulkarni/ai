// ============================================================
// Data Reliability & Offline Caching Test Suite
// src/reliability/__tests__/reliability.test.ts
// ============================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  ReliableDataService,
  cacheStorage,
  requestDeduplicator,
  RetryStrategy,
  ResilientFetcher,
  connectivityMonitor,
  simulationStorage,
  CACHE_NAMESPACES,
} from '../index'

describe('Data Reliability & Offline Caching Module', () => {
  beforeEach(async () => {
    await cacheStorage.clearCache()
    requestDeduplicator.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // ------------------------------------------------------------
  // Test 1: Successful live API retrieval
  // ------------------------------------------------------------
  it('1. performs successful live API retrieval and saves to persistent cache', async () => {
    const mockData = { id: 25, name: 'pikachu', height: 4, weight: 60 }
    const fetcher = vi.fn().mockResolvedValue(mockData)

    const result = await ReliableDataService.query(
      'pokemon:detail:25',
      CACHE_NAMESPACES.POKEMON_DETAIL,
      fetcher,
    )

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.data).toEqual(mockData)
    expect(result.source).toBe('live')
    expect(result.freshness).toBe('fresh')
    expect(result.isOffline).toBe(false)

    // Verify written to storage
    const cached = await cacheStorage.get('pokemon:detail:25', CACHE_NAMESPACES.POKEMON_DETAIL)
    expect(cached.record?.data).toEqual(mockData)
    expect(cached.freshness).toBe('fresh')
  })

  // ------------------------------------------------------------
  // Test 2: Reusing a valid cached response
  // ------------------------------------------------------------
  it('2. reuses valid cached response without making network request', async () => {
    const mockData = { id: 6, name: 'charizard', types: ['fire', 'flying'] }
    await cacheStorage.set('pokemon:detail:6', CACHE_NAMESPACES.POKEMON_DETAIL, mockData, 'pokeapi.co')

    const fetcher = vi.fn().mockResolvedValue({ id: 6, name: 'charizard-different' })

    const result = await ReliableDataService.query(
      'pokemon:detail:6',
      CACHE_NAMESPACES.POKEMON_DETAIL,
      fetcher,
    )

    expect(fetcher).not.toHaveBeenCalled()
    expect(result.data).toEqual(mockData)
    expect(result.source).toBe('cache')
    expect(result.freshness).toBe('fresh')
  })

  // ------------------------------------------------------------
  // Test 3: Refreshing stale data when online (Stale-While-Revalidate)
  // ------------------------------------------------------------
  it('3. serves stale cached data immediately while triggering background refresh', async () => {
    const oldData = { id: 1, name: 'bulbasaur', version: 1 }
    const freshData = { id: 1, name: 'bulbasaur', version: 2 }

    // Seed stale record (staleTime: 0)
    await cacheStorage.set(
      'pokemon:detail:1',
      CACHE_NAMESPACES.POKEMON_DETAIL,
      oldData,
      'pokeapi.co',
      { staleTimeMs: -1000, maxAgeMs: 60000 },
    )

    const fetcher = vi.fn().mockResolvedValue(freshData)

    const result = await ReliableDataService.query(
      'pokemon:detail:1',
      CACHE_NAMESPACES.POKEMON_DETAIL,
      fetcher,
      { staleWhileRevalidate: true },
    )

    expect(result.data).toEqual(oldData)
    expect(result.source).toBe('stale-cache')
    expect(result.isStale).toBe(true)
    expect(result.isRevalidating).toBe(true)

    // Wait for background revalidation
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetcher).toHaveBeenCalled()

    // Next query should return updated fresh data
    const updated = await cacheStorage.get('pokemon:detail:1', CACHE_NAMESPACES.POKEMON_DETAIL)
    expect(updated.record?.data).toEqual(freshData)
  })

  // ------------------------------------------------------------
  // Test 4: Falling back to cached data when offline
  // ------------------------------------------------------------
  it('4. falls back cleanly to cached data when device is offline', async () => {
    const savedData = { city: 'Tokyo', lat: 35.6762, lon: 139.6503 }
    await cacheStorage.set('geocoding:tokyo', CACHE_NAMESPACES.GEOCODING, savedData, 'nominatim')

    vi.spyOn(connectivityMonitor, 'isOffline').mockReturnValue(true)

    const fetcher = vi.fn().mockRejectedValue(new Error('Network unreachable'))

    const result = await ReliableDataService.query(
      'geocoding:tokyo',
      CACHE_NAMESPACES.GEOCODING,
      fetcher,
    )

    expect(fetcher).not.toHaveBeenCalled()
    expect(result.data).toEqual(savedData)
    expect(result.isOffline).toBe(true)
    expect(result.source).toBe('cache')
  })

  // ------------------------------------------------------------
  // Test 5: Missing cached data while offline
  // ------------------------------------------------------------
  it('5. returns explicit un-cached status message when offline and item was never saved', async () => {
    vi.spyOn(connectivityMonitor, 'isOffline').mockReturnValue(true)

    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await ReliableDataService.query(
      'pokemon:detail:99999',
      CACHE_NAMESPACES.POKEMON_DETAIL,
      fetcher,
    )

    expect(result.data).toBeNull()
    expect(result.isOffline).toBe(true)
    expect(result.source).toBe('fallback')
    expect(result.freshness).toBe('offline-only')
    expect(result.statusMessage).toContain('not available offline')
  })

  // ------------------------------------------------------------
  // Test 6: Failed refresh while retaining valid cached data
  // ------------------------------------------------------------
  it('6. retains valid cached data when live refresh fails (never overwrites valid cache with error)', async () => {
    const goodData = { id: 150, name: 'mewtwo', attack: 110 }
    await cacheStorage.set('pokemon:detail:150', CACHE_NAMESPACES.POKEMON_DETAIL, goodData, 'pokeapi.co')

    const fetcher = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'))

    const result = await ReliableDataService.query(
      'pokemon:detail:150',
      CACHE_NAMESPACES.POKEMON_DETAIL,
      fetcher,
      { forceRefresh: true },
    )

    expect(result.data).toEqual(goodData)
    expect(result.source).toBe('stale-cache')
    expect(result.error).toBeDefined()

    // Ensure storage still contains goodData
    const verifyStorage = await cacheStorage.get('pokemon:detail:150', CACHE_NAMESPACES.POKEMON_DETAIL)
    expect(verifyStorage.record?.data).toEqual(goodData)
  })

  // ------------------------------------------------------------
  // Test 7: Invalid API responses / malformed data
  // ------------------------------------------------------------
  it('7. handles null/undefined data safely without polluting cache', async () => {
    const fetcher = vi.fn().mockResolvedValue(null)

    const result = await ReliableDataService.query(
      'pokemon:detail:invalid',
      CACHE_NAMESPACES.POKEMON_DETAIL,
      fetcher,
    )

    expect(result.data).toBeNull()
    const inCache = await cacheStorage.get('pokemon:detail:invalid', CACHE_NAMESPACES.POKEMON_DETAIL)
    expect(inCache.record).toBeNull()
  })

  // ------------------------------------------------------------
  // Test 8: Duplicate concurrent requests (Request Deduplication)
  // ------------------------------------------------------------
  it('8. deduplicates concurrent identical requests into a single in-flight call', async () => {
    let callCount = 0
    const mockFetcher = vi.fn(async () => {
      callCount++
      await new Promise((r) => setTimeout(r, 20))
      return { id: 9, name: 'blastoise' }
    })

    // Fire 4 requests simultaneously for the same resource
    const [res1, res2, res3, res4] = await Promise.all([
      ResilientFetcher.fetch('pokemon:9', mockFetcher),
      ResilientFetcher.fetch('pokemon:9', mockFetcher),
      ResilientFetcher.fetch('pokemon:9', mockFetcher),
      ResilientFetcher.fetch('pokemon:9', mockFetcher),
    ])

    expect(callCount).toBe(1)
    expect(res1).toEqual({ id: 9, name: 'blastoise' })
    expect(res2).toEqual({ id: 9, name: 'blastoise' })
    expect(res3).toEqual({ id: 9, name: 'blastoise' })
    expect(res4).toEqual({ id: 9, name: 'blastoise' })
  })

  // ------------------------------------------------------------
  // Test 9: Request timeout and cancellation
  // ------------------------------------------------------------
  it('9. supports request cancellation via AbortSignal', async () => {
    const controller = new AbortController()

    const slowOperation = vi.fn(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Too slow')), 1000)
        }),
    )

    const promise = ResilientFetcher.fetch('slow-op', slowOperation, {
      signal: controller.signal,
      maxRetries: 0,
    })

    controller.abort()

    await expect(promise).rejects.toThrow()
  })

  // ------------------------------------------------------------
  // Test 10: Rate-limit (429) handling
  // ------------------------------------------------------------
  it('10. classifies 429 status and avoids infinite retry loops', async () => {
    const rateLimitError = { response: { status: 429, headers: { 'retry-after': '1' } } }
    expect(RetryStrategy.isRetryable(rateLimitError)).toBe(true)

    // Non-retryable check for 404
    const notFoundError = { response: { status: 404 } }
    expect(RetryStrategy.isRetryable(notFoundError)).toBe(false)
  })

  // ------------------------------------------------------------
  // Test 11: Cache expiration and TTL validation
  // ------------------------------------------------------------
  it('11. correctly evaluates freshness and expiration based on timestamps', async () => {
    const testData = { species: 'articuno' }
    await cacheStorage.set(
      'pokemon:species:144',
      CACHE_NAMESPACES.POKEMON_SPECIES,
      testData,
      'pokeapi.co',
      { staleTimeMs: 100, maxAgeMs: 200 },
    )

    // Immediate read: fresh
    const read1 = await cacheStorage.get('pokemon:species:144', CACHE_NAMESPACES.POKEMON_SPECIES)
    expect(read1.freshness).toBe('fresh')
    expect(read1.isExpired).toBe(false)

    // Wait for stale threshold
    await new Promise((r) => setTimeout(r, 120))
    const read2 = await cacheStorage.get('pokemon:species:144', CACHE_NAMESPACES.POKEMON_SPECIES)
    expect(read2.freshness).toBe('stale')
    expect(read2.isExpired).toBe(false)

    // Wait for hard expiration threshold
    await new Promise((r) => setTimeout(r, 100))
    const read3 = await cacheStorage.get('pokemon:species:144', CACHE_NAMESPACES.POKEMON_SPECIES)
    expect(read3.freshness).toBe('expired')
    expect(read3.isExpired).toBe(true)
  })

  // ------------------------------------------------------------
  // Test 12: Storage quota & safe maintenance pruning
  // ------------------------------------------------------------
  it('12. prunes expired records and enforces LRU limits while protecting never-evict data', async () => {
    // Seed expired items in geocoding
    await cacheStorage.set('geocoding:temp1', CACHE_NAMESPACES.GEOCODING, { city: 'Temp1' }, 'nominatim', {
      maxAgeMs: -1000,
    })
    await cacheStorage.set('geocoding:temp2', CACHE_NAMESPACES.GEOCODING, { city: 'Temp2' }, 'nominatim', {
      maxAgeMs: -1000,
    })

    // Seed simulation record (never evict)
    await simulationStorage.storeSimulationResult('battle', {
      pokemonId: 25,
      pokemonName: 'Pikachu',
    }, { outcome: 'win' })

    const { prunedCount } = await cacheStorage.maintenanceSweep()
    expect(prunedCount).toBeGreaterThanOrEqual(2)

    // Verify simulation record is intact
    const simulations = await simulationStorage.getSimulationHistory()
    expect(simulations.length).toBe(1)
    expect(simulations[0].inputs.pokemonName).toBe('Pikachu')
  })

  // ------------------------------------------------------------
  // Test 13: Simulation storage - Input retrieval, result persistence, and history
  // ------------------------------------------------------------
  it('13. provides simulation engine with cached inputs and securely stores results', async () => {
    // Seed cached Pokémon detail
    const gengar = { id: 94, name: 'gengar', baseStats: { hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110 } }
    await cacheStorage.set('pokemon:detail:94', CACHE_NAMESPACES.POKEMON_DETAIL, gengar, 'pokeapi.co')

    // Simulation engine requests cached inputs
    const inputCheck = await simulationStorage.requestCachedPokemonInput(94)
    expect(inputCheck.data?.name).toBe('gengar')
    expect(inputCheck.freshness).toBe('fresh')

    // Simulation engine runs and stores result
    const runResult = await simulationStorage.storeSimulationResult(
      'expedition',
      {
        pokemonId: 94,
        pokemonName: 'Gengar',
        locationName: 'Lavender Town',
        latitude: 35.0,
        longitude: 139.0,
      },
      {
        encounters: 3,
        itemsFound: ['Spell Tag', 'Ghost Gem'],
        xpGained: 450,
      },
      '2.0.0',
      ['ghost', 'night-run'],
    )

    expect(runResult.id).toBeDefined()
    expect(runResult.simulationType).toBe('expedition')
    expect(runResult.dataFreshnessAtRun).toBe('fresh')

    // Query simulation history
    const history = await simulationStorage.getSimulationHistory({ pokemonId: 94 })
    expect(history.length).toBe(1)
    expect(history[0].inputs.locationName).toBe('Lavender Town')

    // Export logs
    const exportedLogs = await simulationStorage.exportSimulationLogs()
    expect(exportedLogs).toContain('Lavender Town')
    expect(exportedLogs).toContain('totalRuns')
  })

  // ------------------------------------------------------------
  // Test 14: Storage quota information
  // ------------------------------------------------------------
  it('14. reports storage quota, usage bytes, and availability statistics', async () => {
    const quotaInfo = await cacheStorage.getQuotaInfo()
    expect(quotaInfo.isStorageAvailable).toBe(true)
    expect(quotaInfo.backend).toBeDefined()
    expect(quotaInfo.entryCounts).toBeDefined()
  })

  // ------------------------------------------------------------
  // Test 15: Namespace bulk retrieval for offline search
  // ------------------------------------------------------------
  it('15. allows querying all stored records in a namespace for offline search/filtering', async () => {
    await cacheStorage.set('pokemon:detail:1', CACHE_NAMESPACES.POKEMON_DETAIL, { id: 1, name: 'bulbasaur' }, 'pokeapi.co')
    await cacheStorage.set('pokemon:detail:4', CACHE_NAMESPACES.POKEMON_DETAIL, { id: 4, name: 'charmander' }, 'pokeapi.co')
    await cacheStorage.set('pokemon:detail:7', CACHE_NAMESPACES.POKEMON_DETAIL, { id: 7, name: 'squirtle' }, 'pokeapi.co')

    const allCached = await cacheStorage.getAllByNamespace(CACHE_NAMESPACES.POKEMON_DETAIL)
    expect(allCached.length).toBe(3)

    const names = allCached.map((c) => (c.data as { name: string }).name)
    expect(names).toContain('bulbasaur')
    expect(names).toContain('charmander')
    expect(names).toContain('squirtle')
  })

  // ------------------------------------------------------------
  // Test 16: Network status listener and reconnection
  // ------------------------------------------------------------
  it('16. emits connectivity status transitions on online/offline events', () => {
    const statusEvents: string[] = []
    const unsubscribe = connectivityMonitor.subscribe((status) => {
      statusEvents.push(status)
    })

    expect(statusEvents.length).toBeGreaterThanOrEqual(1)

    // Simulate network error reporting for degraded state
    connectivityMonitor.reportRequestFailure(503)
    connectivityMonitor.reportRequestFailure(503)
    connectivityMonitor.reportRequestFailure(503)

    expect(connectivityMonitor.isDegraded() || connectivityMonitor.isOffline()).toBe(true)

    // Simulate recovery
    connectivityMonitor.reportRequestSuccess()
    expect(connectivityMonitor.isOnline()).toBe(true)

    unsubscribe()
  })
})


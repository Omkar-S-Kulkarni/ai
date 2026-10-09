# PokéVerse — Live Data, Offline Caching, and Reliability Guide

This document provides a comprehensive technical reference for the **PokéVerse Live Data, Offline Caching, and Reliability Infrastructure Module**.

---

## 1. Architecture Overview

The reliability layer acts as an intelligent intermediary between UI components, the simulation engine, and external API providers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PokéVerse Application                          │
│     (Pokédex Dashboard, World Map, Simulation Engine, Profile Deep-Dive)│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │          Reliability Module           │
                 │   (useReliableData / useConnectivity) │
                 └───────────────────┬───────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
┌──────────▼──────────┐                             ┌──────────▼──────────┐
│   Persistent Cache  │                             │   Resilient Fetch   │
│     (IndexedDB)     │                             │ (Deduplication,     │
│  - pokemon_cache    │                             │  Exponential Backoff│
│  - geocoding_cache  │                             │  429 Rate Limiter,  │
│  - simulation_store │                             │  Timeouts & Signals)│
│  - user_data        │                             └──────────┬──────────┘
└─────────────────────┘                                        │
                                              ┌────────────────┴────────────────┐
                                              │        External Providers       │
                                              │  • PokéAPI (REST v2)            │
                                              │  • OSM Nominatim / Photon       │
                                              │  • IP Geolocation               │
                                              └─────────────────────────────────┘
```

### Core Design Principles
1. **Never Fabricate Data**: Offline states and stale caches are explicitly distinguished with clear status indicators (`source: 'live' | 'cache' | 'stale-cache' | 'fallback'`).
2. **Never Overwrite Valid Cache with an Error**: When a live network refresh fails or times out, existing cached data is retained and returned alongside error metadata.
3. **In-Flight Request Deduplication**: Multiple simultaneous queries for the same resource share a single network Promise.
4. **Resilient Rate Limiting**: Exponential backoff with full jitter and `Retry-After` header parsing prevents infinite retry loops and respects provider rate limits.
5. **Multi-Store IndexedDB with Fallback**: Full schema-versioned persistence in IndexedDB with graceful fallback to in-memory caching in restricted environments.

---

## 2. Supported Data Providers

| Provider | Purpose | Default Stale Time | Hard Expiration (Max Age) |
| :--- | :--- | :--- | :--- |
| **PokéAPI** (`pokeapi.co`) | Pokémon lists, details, stats, species, evolutions, abilities, types | 12h – 48h | 7d – 30d |
| **OSM Nominatim / Photon** | Destination search, coordinates, reverse geocoding | 7 days | 30 days |
| **IP-API Geolocation** | Approximate user location & map default center | 1 hour | 24 hours |
| **Weather (Extensible)** | Local ambient weather for simulations | 15 minutes | 2 hours |
| **Simulation History** | Saved battle, catch, and expedition results | `Infinity` | `180 days` (Never evicted by LRU) |
| **User Favorites & Recents** | Pinned Pokémon and selection tray state | `Infinity` | `Infinity` (Never evicted) |

---

## 3. Declarative Cache Policies

Configured in [`src/reliability/config/cachePolicies.ts`](file:///c:/Users/Akshay/api_frontend/src/reliability/config/cachePolicies.ts):

* **`evictionPriority: 'never'`**: Applied to `user_favorites`, `user_recent`, and `simulation_history`. Automated pruning will **never** delete user-created records.
* **`evictionPriority: 'high'`**: Applied to Pokémon details and type charts (evicted last during storage pressure).
* **`evictionPriority: 'medium' | 'low'`**: Applied to search queries and IP lookups (evicted first when approaching quota limits).

---

## 4. Online vs. Offline Operation

### When Online
1. If data is **fresh** in cache: returned immediately from IndexedDB.
2. If data is **stale** (past stale threshold but before maxAge): served immediately from cache while triggering a non-blocking background revalidation (Stale-While-Revalidate).
3. If data is **missing**: fetched from remote provider, validated, normalized, and saved to IndexedDB.

### When Offline
1. If data is in cache (even if stale/expired): returned immediately with `source: 'stale-cache'`, `isOffline: true`, and a status message.
2. If data has never been cached: returns `data: null`, `source: 'fallback'`, `freshness: 'offline-only'`, and displays `<OfflineEmptyState />`.
3. The `<OfflineBanner />` automatically informs the user that cached data is being served.

---

## 5. How to Retrieve Cached Data from Other Modules

Use the generic `useReliableData` React hook or `ReliableDataService.query`:

```tsx
import { useReliableData, CACHE_NAMESPACES, DataFreshnessBadge } from '@/reliability'
import { getPokemonDetails } from '@/services/pokemon'

export function PokemonProfile({ id }: { id: number }) {
  const {
    data: pokemon,
    source,
    freshness,
    fetchedAt,
    isOffline,
    isLoading,
    refetch,
  } = useReliableData(
    `pokemon:detail:${id}`,
    CACHE_NAMESPACES.POKEMON_DETAIL,
    (signal) => getPokemonDetails(id, signal),
  )

  if (isLoading) return <div>Loading...</div>
  if (!pokemon) return <OfflineEmptyState resourceName={`Pokémon #${id}`} onRetry={refetch} />

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2>{pokemon.name}</h2>
        <DataFreshnessBadge source={source} freshness={freshness} fetchedAt={fetchedAt} />
      </div>
      {/* Render Pokémon profile */}
    </div>
  )
}
```

---

## 6. How the Simulation Engine Integrates with Storage

The simulation engine can interact with [`simulationStorage`](file:///c:/Users/Akshay/api_frontend/src/reliability/services/simulationStorageService.ts):

### A. Requesting Cached Inputs Before Running a Simulation
```ts
import { simulationStorage } from '@/reliability'

// 1. Safe access to cached Pokémon stats
const { data: pokemon, freshness } = await simulationStorage.requestCachedPokemonInput(25)

// 2. Safe access to cached location
const { data: location } = await simulationStorage.requestCachedLocationInput('Tokyo')

// 3. Verify inputs are available before simulation
if (!pokemon) {
  throw new Error('Simulation cannot execute offline without cached Pokémon data.')
}
```

### B. Storing Completed Simulation Results
```ts
const record = await simulationStorage.storeSimulationResult(
  'battle',
  {
    pokemonId: 25,
    pokemonName: 'Pikachu',
    locationName: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    winner: 'Pikachu',
    rounds: 4,
    damageDealt: 280,
    xpEarned: 150,
  },
  '1.0.0', // Engine version
  ['electric', 'tokyo-arena'], // Optional tags
)
```

### C. Retrieving Simulation History in React
```tsx
import { useSimulationStorage } from '@/reliability'

export function SimulationHistoryView() {
  const { history, isLoading, deleteSimulation } = useSimulationStorage({
    simulationType: 'battle',
    limit: 20,
  })

  return (
    <ul>
      {history.map((run) => (
        <li key={run.id}>
          {run.inputs.pokemonName} vs Simulation ({run.dataFreshnessAtRun})
        </li>
      ))}
    </ul>
  )
}
```

---

## 7. Service Worker & PWA Behavior

* **Registration**: Automatically configured via [`registerServiceWorker()`](file:///c:/Users/Akshay/api_frontend/src/reliability/serviceWorker/registerServiceWorker.ts) in `src/main.tsx`.
* **Caching Rules** ([`public/sw.js`](file:///c:/Users/Akshay/api_frontend/public/sw.js)):
  1. `App Shell & Static Assets`: Cache-First with background version invalidation.
  2. `Pokémon Sprites`: Stale-While-Revalidate caching for fast sprite rendering offline.
  3. `API Endpoints`: Network-First with cached fallback.
  4. `Offline Fallback`: Serves [`public/offline.html`](file:///c:/Users/Akshay/api_frontend/public/offline.html) if navigation fails while offline.

---

## 8. How to Add a New Cacheable Data Source

1. Add a namespace constant to [`CACHE_NAMESPACES`](file:///c:/Users/Akshay/api_frontend/src/reliability/config/cachePolicies.ts#L10).
2. Define its `staleTimeMs`, `maxAgeMs`, `maxEntries`, and `evictionPriority` in `DEFAULT_CACHE_POLICIES`.
3. Query the data using `ReliableDataService.query(key, namespace, fetcher)`.

---

## 9. Manual Offline Testing Instructions

1. Open PokéVerse in Chrome or Edge (`npm run dev` or `npm run preview`).
2. Search for a destination (e.g. *Tokyo*) and view a few Pokémon (e.g. *Pikachu*, *Charizard*).
3. Open **Chrome DevTools (F12)** → **Network tab** → Select **Offline** throttling.
4. Browse to `/pokemon/25` or the World Map:
   - Notice the **Offline Banner** appears at the top.
   - Cached Pokémon details and maps display a `Cached` or `Offline Cache` badge.
   - Attempting to load an uncached Pokémon displays the clear `<OfflineEmptyState />` message explaining that an internet connection is required.
5. Re-enable network connectivity:
   - The banner clears and data automatically revalidates in the background.

---

## 10. Automated Test Suite

Run the full automated test suite covering all 16 reliability scenarios:

```powershell
npm test
```

* Tests covered:
  * ✅ Live API retrieval & cache persistence
  * ✅ Cached response reuse without network calls
  * ✅ Stale-while-revalidate background refresh
  * ✅ Offline fallback handling
  * ✅ Explicit un-cached messaging for missing offline data
  * ✅ Cache retention on failed refresh (never overwrites valid cache with errors)
  * ✅ Malformed / invalid API response rejection
  * ✅ Concurrent in-flight request deduplication
  * ✅ AbortSignal cancellation & timeouts
  * ✅ Rate-limiting (HTTP 429) backoff handling
  * ✅ TTL evaluation & timestamp expiration
  * ✅ Storage quota management & LRU eviction (never evicting favorites/simulations)
  * ✅ Simulation engine input retrieval, result persistence, and history
  * ✅ Storage quota usage reporting
  * ✅ Bulk namespace query for offline search
  * ✅ Network status transition events & recovery

// ============================================================
// Resource-Specific Cache Policies
// src/reliability/config/cachePolicies.ts
// ============================================================

import type { CachePolicy } from '../types'

/**
 * Standard resource namespace definitions.
 */
export const CACHE_NAMESPACES = {
  POKEMON_LIST: 'pokemon_list',
  POKEMON_DETAIL: 'pokemon_detail',
  POKEMON_SPECIES: 'pokemon_species',
  POKEMON_EVOLUTION: 'pokemon_evolution',
  POKEMON_TYPE: 'pokemon_type',
  GEOCODING: 'geocoding',
  REVERSE_GEOCODING: 'reverse_geocoding',
  GEOLOCATION: 'geolocation',
  WEATHER: 'weather',
  USER_FAVORITES: 'user_favorites',
  USER_RECENT: 'user_recent',
  USER_SELECTION: 'user_selection',
  SIMULATION_HISTORY: 'simulation_history',
} as const

export type CacheNamespace = typeof CACHE_NAMESPACES[keyof typeof CACHE_NAMESPACES]

/**
 * Declarative policies governing freshness, retention, and eviction priorities.
 */
export const DEFAULT_CACHE_POLICIES: Record<string, CachePolicy> = {
  [CACHE_NAMESPACES.POKEMON_LIST]: {
    namespace: CACHE_NAMESPACES.POKEMON_LIST,
    staleTimeMs: 12 * 60 * 60 * 1000, // 12 hours
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 100,
    persistOffline: true,
    evictionPriority: 'medium',
  },
  [CACHE_NAMESPACES.POKEMON_DETAIL]: {
    namespace: CACHE_NAMESPACES.POKEMON_DETAIL,
    staleTimeMs: 24 * 60 * 60 * 1000, // 24 hours
    maxAgeMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    maxEntries: 300,
    persistOffline: true,
    evictionPriority: 'high',
  },
  [CACHE_NAMESPACES.POKEMON_SPECIES]: {
    namespace: CACHE_NAMESPACES.POKEMON_SPECIES,
    staleTimeMs: 48 * 60 * 60 * 1000, // 48 hours
    maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 300,
    persistOffline: true,
    evictionPriority: 'medium',
  },
  [CACHE_NAMESPACES.POKEMON_EVOLUTION]: {
    namespace: CACHE_NAMESPACES.POKEMON_EVOLUTION,
    staleTimeMs: 48 * 60 * 60 * 1000,
    maxAgeMs: 30 * 24 * 60 * 60 * 1000,
    maxEntries: 200,
    persistOffline: true,
    evictionPriority: 'medium',
  },
  [CACHE_NAMESPACES.POKEMON_TYPE]: {
    namespace: CACHE_NAMESPACES.POKEMON_TYPE,
    staleTimeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAgeMs: 60 * 24 * 60 * 60 * 1000, // 60 days
    maxEntries: 50,
    persistOffline: true,
    evictionPriority: 'high',
  },
  [CACHE_NAMESPACES.GEOCODING]: {
    namespace: CACHE_NAMESPACES.GEOCODING,
    staleTimeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 200,
    persistOffline: true,
    evictionPriority: 'medium',
  },
  [CACHE_NAMESPACES.REVERSE_GEOCODING]: {
    namespace: CACHE_NAMESPACES.REVERSE_GEOCODING,
    staleTimeMs: 7 * 24 * 60 * 60 * 1000,
    maxAgeMs: 30 * 24 * 60 * 60 * 1000,
    maxEntries: 200,
    persistOffline: true,
    evictionPriority: 'medium',
  },
  [CACHE_NAMESPACES.GEOLOCATION]: {
    namespace: CACHE_NAMESPACES.GEOLOCATION,
    staleTimeMs: 60 * 60 * 1000, // 1 hour
    maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 20,
    persistOffline: true,
    evictionPriority: 'low',
  },
  [CACHE_NAMESPACES.WEATHER]: {
    namespace: CACHE_NAMESPACES.WEATHER,
    staleTimeMs: 15 * 60 * 1000, // 15 minutes
    maxAgeMs: 2 * 60 * 60 * 1000, // 2 hours
    maxEntries: 50,
    persistOffline: true,
    evictionPriority: 'low',
  },
  [CACHE_NAMESPACES.USER_FAVORITES]: {
    namespace: CACHE_NAMESPACES.USER_FAVORITES,
    staleTimeMs: Infinity,
    maxAgeMs: Infinity,
    persistOffline: true,
    evictionPriority: 'never', // Critical: NEVER evict user favorites
  },
  [CACHE_NAMESPACES.USER_RECENT]: {
    namespace: CACHE_NAMESPACES.USER_RECENT,
    staleTimeMs: Infinity,
    maxAgeMs: 90 * 24 * 60 * 60 * 1000,
    maxEntries: 50,
    persistOffline: true,
    evictionPriority: 'high',
  },
  [CACHE_NAMESPACES.SIMULATION_HISTORY]: {
    namespace: CACHE_NAMESPACES.SIMULATION_HISTORY,
    staleTimeMs: Infinity,
    maxAgeMs: 180 * 24 * 60 * 60 * 1000, // 180 days
    maxEntries: 500,
    persistOffline: true,
    evictionPriority: 'never', // Critical: NEVER evict simulation records
  },
}

/**
 * Returns the cache policy for a given namespace, falling back to a safe default.
 */
export function getCachePolicy(namespace: string): CachePolicy {
  return (
    DEFAULT_CACHE_POLICIES[namespace] ?? {
      namespace,
      staleTimeMs: 5 * 60 * 1000, // 5 min default
      maxAgeMs: 24 * 60 * 60 * 1000, // 24 hour default
      maxEntries: 100,
      persistOffline: true,
      evictionPriority: 'medium',
    }
  )
}

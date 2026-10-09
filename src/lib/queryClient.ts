// ============================================================
// React Query Client
// src/lib/queryClient.ts
// ============================================================

import { QueryClient } from '@tanstack/react-query'
import { POKEAPI_CONFIG } from './config'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: POKEAPI_CONFIG.staleTimeMs,
      gcTime: POKEAPI_CONFIG.gcTimeMs,
      retry: (failureCount, error) => {
        // Don't retry on 404 (not found) or cancelled requests
        const err = error as { status?: number; code?: string }
        if (err?.status === 404 || err?.code === 'CANCELLED') return false
        return failureCount < 2
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// ------------------------------------------------------------------
// Query key factories — centralized to avoid string duplication
// ------------------------------------------------------------------
export const pokemonKeys = {
  all: ['pokemon'] as const,
  lists: () => [...pokemonKeys.all, 'list'] as const,
  list: (limit: number, offset: number) => [...pokemonKeys.lists(), { limit, offset }] as const,
  search: (query: string) => [...pokemonKeys.all, 'search', query] as const,
  details: () => [...pokemonKeys.all, 'detail'] as const,
  detail: (nameOrId: string | number) => [...pokemonKeys.details(), nameOrId] as const,
  species: (nameOrId: string | number) => [...pokemonKeys.all, 'species', nameOrId] as const,
  evolution: (id: number) => [...pokemonKeys.all, 'evolution', id] as const,
  type: (nameOrId: string | number) => [...pokemonKeys.all, 'type', nameOrId] as const,
  ability: (nameOrId: string | number) => [...pokemonKeys.all, 'ability', nameOrId] as const,
  generation: (nameOrId: string | number) => [...pokemonKeys.all, 'generation', nameOrId] as const,
  generations: () => [...pokemonKeys.all, 'generations'] as const,
  pokedex: (nameOrId: string | number) => [...pokemonKeys.all, 'pokedex', nameOrId] as const,
  types: () => [...pokemonKeys.all, 'types'] as const,
  typePokemon: (type: string) => [...pokemonKeys.all, 'typePokemon', type] as const,
  generationSpecies: (genId: string | number) => [...pokemonKeys.all, 'generationSpecies', genId] as const,
  multiple: (ids: (string | number)[]) => [...pokemonKeys.all, 'multiple', ...ids] as const,
} as const

export const geoKeys = {
  all: ['geolocation'] as const,
  ip: () => [...geoKeys.all, 'ip'] as const,
} as const

// ============================================================
// Pokémon React Query Hooks
// src/hooks/usePokemon.ts
// ============================================================

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { pokemonKeys } from '@/lib/queryClient'
import {
  fetchPokemonList,
  fetchPokemon,
  fetchPokemonSpecies,
  fetchEvolutionChainForPokemon,
  fetchType,
  fetchAbility,
  fetchGeneration,
  fetchPokedex,
} from '@/services/pokemon'

// ------------------------------------------------------------------
// Paginated list hook
// ------------------------------------------------------------------
export function usePokemonList(limit: number, offset: number) {
  return useQuery({
    queryKey: pokemonKeys.list(limit, offset),
    queryFn: ({ signal }) => fetchPokemonList(limit, offset, signal),
    placeholderData: keepPreviousData,
  })
}

// ------------------------------------------------------------------
// Single Pokémon details
// ------------------------------------------------------------------
export function usePokemon(nameOrId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.detail(nameOrId ?? ''),
    queryFn: ({ signal }) => fetchPokemon(nameOrId!, signal),
    enabled: nameOrId !== null && nameOrId !== '' && nameOrId !== 0,
  })
}

// ------------------------------------------------------------------
// Pokémon species
// ------------------------------------------------------------------
export function usePokemonSpecies(nameOrId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.species(nameOrId ?? ''),
    queryFn: ({ signal }) => fetchPokemonSpecies(nameOrId!, signal),
    enabled: nameOrId !== null && nameOrId !== '' && nameOrId !== 0,
  })
}

// ------------------------------------------------------------------
// Evolution chain (resolves chain from species automatically)
// ------------------------------------------------------------------
export function useEvolutionChain(speciesNameOrId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.evolution(
      typeof speciesNameOrId === 'string' ? 0 : (speciesNameOrId ?? 0)
    ),
    queryFn: ({ signal }) => fetchEvolutionChainForPokemon(speciesNameOrId!, signal),
    enabled: speciesNameOrId !== null && speciesNameOrId !== '' && speciesNameOrId !== 0,
  })
}

// ------------------------------------------------------------------
// Type with damage relations
// ------------------------------------------------------------------
export function usePokemonType(nameOrId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.type(nameOrId ?? ''),
    queryFn: ({ signal }) => fetchType(nameOrId!, signal),
    enabled: nameOrId !== null && nameOrId !== '',
  })
}

// ------------------------------------------------------------------
// Ability details
// ------------------------------------------------------------------
export function useAbility(nameOrId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.ability(nameOrId ?? ''),
    queryFn: ({ signal }) => fetchAbility(nameOrId!, signal),
    enabled: nameOrId !== null && nameOrId !== '',
  })
}

// ------------------------------------------------------------------
// Generation
// ------------------------------------------------------------------
export function useGeneration(nameOrId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.generation(nameOrId ?? ''),
    queryFn: ({ signal }) => fetchGeneration(nameOrId!, signal),
    enabled: nameOrId !== null && nameOrId !== '',
  })
}

// ------------------------------------------------------------------
// Pokédex
// ------------------------------------------------------------------
export function usePokedex(nameOrId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.pokedex(nameOrId ?? ''),
    queryFn: ({ signal }) => fetchPokedex(nameOrId!, signal),
    enabled: nameOrId !== null && nameOrId !== '',
  })
}

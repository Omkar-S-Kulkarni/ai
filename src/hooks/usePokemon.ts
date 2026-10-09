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
  fetchGenerationList,
  fetchTypeList,
  fetchPokemonByType,
  fetchPokemonByGeneration,
  fetchMultiplePokemon,
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
// Generation List
// ------------------------------------------------------------------
export function useGenerationList() {
  return useQuery({
    queryKey: pokemonKeys.generations(),
    queryFn: ({ signal }) => fetchGenerationList(signal),
    staleTime: 60 * 60 * 1000, // Generations never change
  })
}

// ------------------------------------------------------------------
// Type List
// ------------------------------------------------------------------
export function useTypeList() {
  return useQuery({
    queryKey: pokemonKeys.types(),
    queryFn: ({ signal }) => fetchTypeList(signal),
    staleTime: 60 * 60 * 1000, // Types rarely change
  })
}

// ------------------------------------------------------------------
// Pokemon by Type
// ------------------------------------------------------------------
export function usePokemonByType(typeName: string | null) {
  return useQuery({
    queryKey: pokemonKeys.typePokemon(typeName ?? ''),
    queryFn: ({ signal }) => fetchPokemonByType(typeName!, signal),
    enabled: Boolean(typeName && typeName !== 'all'),
  })
}

// ------------------------------------------------------------------
// Pokemon by Generation
// ------------------------------------------------------------------
export function usePokemonByGeneration(genId: string | number | null) {
  return useQuery({
    queryKey: pokemonKeys.generationSpecies(genId ?? ''),
    queryFn: ({ signal }) => fetchPokemonByGeneration(genId!, signal),
    enabled: Boolean(genId && genId !== 'all'),
  })
}

// ------------------------------------------------------------------
// Multiple Pokemon (for comparison & tray)
// ------------------------------------------------------------------
export function useMultiplePokemon(ids: (string | number)[]) {
  return useQuery({
    queryKey: pokemonKeys.multiple(ids),
    queryFn: ({ signal }) => fetchMultiplePokemon(ids, signal),
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
  })
}

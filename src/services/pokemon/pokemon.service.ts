// ============================================================
// PokéAPI Service
// src/services/pokemon/pokemon.service.ts
// ============================================================
// All PokéAPI HTTP calls live here. Never call the API directly from components.

import { pokemonApiClient, makeCancelable } from '@/lib/httpClient'
import { POKEAPI_ENDPOINTS } from '@/lib/config'
import type {
  ApiPaginatedResponse,
  ApiPokemon,
  ApiPokemonSpecies,
  ApiEvolutionChain,
  ApiType,
  ApiAbility,
  ApiGeneration,
  ApiPokedex,
} from './pokemon.api.types'
import {
  normalizePokemonSummary,
  normalizePokemon,
  normalizeSpecies,
  normalizeEvolutionChain,
  normalizeType,
  normalizeAbility,
  normalizeGeneration,
  normalizePokedex,
  extractIdFromUrl,
} from './pokemon.normalizers'
import type { PaginatedList, PokemonSummary, PokemonDetails, PokemonSpecies, EvolutionChain, PokemonType, PokemonAbility, GenerationInfo, PokedexInfo } from '@/types'

// ------------------------------------------------------------------
// Pokémon list with pagination
// ------------------------------------------------------------------
export async function fetchPokemonList(
  limit: number,
  offset: number,
  signal?: AbortSignal,
): Promise<PaginatedList<PokemonSummary>> {
  const { data } = await pokemonApiClient.get<ApiPaginatedResponse>(
    POKEAPI_ENDPOINTS.pokemon,
    { params: { limit, offset }, ...makeCancelable(signal) },
  )
  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    results: data.results.map(normalizePokemonSummary),
  }
}

// ------------------------------------------------------------------
// Single Pokémon details by name or ID
// ------------------------------------------------------------------
export async function fetchPokemon(
  nameOrId: string | number,
  signal?: AbortSignal,
): Promise<PokemonDetails> {
  const { data } = await pokemonApiClient.get<ApiPokemon>(
    `${POKEAPI_ENDPOINTS.pokemon}/${nameOrId}`,
    makeCancelable(signal),
  )
  return normalizePokemon(data)
}

// ------------------------------------------------------------------
// Pokémon species
// ------------------------------------------------------------------
export async function fetchPokemonSpecies(
  nameOrId: string | number,
  signal?: AbortSignal,
): Promise<PokemonSpecies> {
  const { data } = await pokemonApiClient.get<ApiPokemonSpecies>(
    `${POKEAPI_ENDPOINTS.pokemonSpecies}/${nameOrId}`,
    makeCancelable(signal),
  )
  return normalizeSpecies(data)
}

// ------------------------------------------------------------------
// Evolution chain by chain ID
// ------------------------------------------------------------------
export async function fetchEvolutionChain(
  chainId: number,
  signal?: AbortSignal,
): Promise<EvolutionChain> {
  const { data } = await pokemonApiClient.get<ApiEvolutionChain>(
    `${POKEAPI_ENDPOINTS.evolutionChain}/${chainId}`,
    makeCancelable(signal),
  )
  return normalizeEvolutionChain(data)
}

/**
 * Convenience: fetch species to get chain URL, then fetch the chain.
 * Returns the evolution chain for any Pokémon name/id.
 */
export async function fetchEvolutionChainForPokemon(
  speciesNameOrId: string | number,
  signal?: AbortSignal,
): Promise<EvolutionChain> {
  const species = await fetchPokemonSpecies(speciesNameOrId, signal)
  const chainId = extractIdFromUrl(species.evolutionChainUrl)
  return fetchEvolutionChain(chainId, signal)
}

// ------------------------------------------------------------------
// Type with damage relations
// ------------------------------------------------------------------
export async function fetchType(
  nameOrId: string | number,
  signal?: AbortSignal,
): Promise<PokemonType & { damageRelations: NonNullable<PokemonType['damageRelations']> }> {
  const { data } = await pokemonApiClient.get<ApiType>(
    `${POKEAPI_ENDPOINTS.type}/${nameOrId}`,
    makeCancelable(signal),
  )
  return normalizeType(data)
}

// ------------------------------------------------------------------
// Ability with effect text
// ------------------------------------------------------------------
export async function fetchAbility(
  nameOrId: string | number,
  signal?: AbortSignal,
): Promise<PokemonAbility> {
  const { data } = await pokemonApiClient.get<ApiAbility>(
    `${POKEAPI_ENDPOINTS.ability}/${nameOrId}`,
    makeCancelable(signal),
  )
  return normalizeAbility(data)
}

// ------------------------------------------------------------------
// Generation info
// ------------------------------------------------------------------
export async function fetchGeneration(
  nameOrId: string | number,
  signal?: AbortSignal,
): Promise<GenerationInfo> {
  const { data } = await pokemonApiClient.get<ApiGeneration>(
    `${POKEAPI_ENDPOINTS.generation}/${nameOrId}`,
    makeCancelable(signal),
  )
  return normalizeGeneration(data)
}

// ------------------------------------------------------------------
// Pokédex info
// ------------------------------------------------------------------
export async function fetchPokedex(
  nameOrId: string | number,
  signal?: AbortSignal,
): Promise<PokedexInfo> {
  const { data } = await pokemonApiClient.get<ApiPokedex>(
    `${POKEAPI_ENDPOINTS.pokedex}/${nameOrId}`,
    makeCancelable(signal),
  )
  return normalizePokedex(data)
}

// ------------------------------------------------------------------
// List all generations
// ------------------------------------------------------------------
export async function fetchGenerationList(signal?: AbortSignal): Promise<PaginatedList<{ name: string; url: string }>> {
  const { data } = await pokemonApiClient.get<ApiPaginatedResponse>(
    POKEAPI_ENDPOINTS.generation,
    makeCancelable(signal),
  )
  return { count: data.count, next: data.next, previous: data.previous, results: data.results }
}

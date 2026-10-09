// ============================================================
// PokéAPI Normalizers
// src/services/pokemon/pokemon.normalizers.ts
// ============================================================
// Transform raw API responses into normalized application types.

import type {
  ApiPokemon,
  ApiPokemonSpecies,
  ApiEvolutionChain,
  ApiChainLink,
  ApiType,
  ApiAbility,
  ApiGeneration,
  ApiPokedex,
  ApiNamedResource,
} from './pokemon.api.types'

import type {
  PokemonDetails,
  PokemonSummary,
  PokemonSpecies,
  EvolutionChain,
  EvolutionNode,
  PokemonType,
  PokemonAbility,
  GenerationInfo,
  PokedexInfo,
} from '@/types/pokemon'

import { getPokemonArtworkUrl, getPokemonSpriteUrl, getPokemonAnimatedUrl } from '@/lib/config'

// ------------------------------------------------------------------
// Extract Pokémon ID from PokeAPI URL
// e.g. "https://pokeapi.co/api/v2/pokemon/25/" → 25
// ------------------------------------------------------------------
export function extractIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? parseInt(match[1], 10) : 0
}

// ------------------------------------------------------------------
// Pokémon summary (for list views)
// ------------------------------------------------------------------
export function normalizePokemonSummary(resource: ApiNamedResource): PokemonSummary {
  const id = extractIdFromUrl(resource.url)
  return {
    id,
    name: resource.name,
    url: resource.url,
    spriteUrl: getPokemonSpriteUrl(id),
  }
}

// ------------------------------------------------------------------
// Full Pokémon details
// ------------------------------------------------------------------
export function normalizePokemon(raw: ApiPokemon): PokemonDetails {
  const officialArtwork =
    raw.sprites.other?.['official-artwork']?.front_default ??
    getPokemonArtworkUrl(raw.id)

  // Prefer animated sprite from Black/White, fall back to static
  const animatedBase =
    raw.sprites.versions?.['generation-v']?.['black-white'] as
      { animated?: { front_default?: string | null } } | undefined

  return {
    id: raw.id,
    name: raw.name,
    displayName: toDisplayName(raw.name),
    height: raw.height,
    weight: raw.weight,
    baseExperience: raw.base_experience,
    isDefault: raw.is_default,
    order: raw.order,
    types: raw.types.map((t) => ({
      slot: t.slot,
      name: t.type.name,
      url: t.type.url,
    })),
    stats: raw.stats.map((s) => ({
      name: s.stat.name,
      baseStat: s.base_stat,
      effort: s.effort,
    })),
    abilities: raw.abilities.map((a) => ({
      name: a.ability.name,
      url: a.ability.url,
      isHidden: a.is_hidden,
      slot: a.slot,
    })),
    moves: raw.moves.slice(0, 50).map((m) => {
      const firstDetail = m.version_group_details[0]
      return {
        name: m.move.name,
        url: m.move.url,
        learnMethod: firstDetail?.move_learn_method.name ?? 'unknown',
        levelLearnedAt: firstDetail?.level_learned_at ?? 0,
        versionGroup: firstDetail?.version_group.name ?? 'unknown',
      }
    }),
    sprites: {
      frontDefault: raw.sprites.front_default,
      frontShiny: raw.sprites.front_shiny,
      backDefault: raw.sprites.back_default,
      backShiny: raw.sprites.back_shiny,
      officialArtwork,
      animated: animatedBase?.animated?.front_default ?? getPokemonAnimatedUrl(raw.id),
    },
    speciesUrl: raw.species.url,
  }
}

// ------------------------------------------------------------------
// Pokémon species
// ------------------------------------------------------------------
export function normalizeSpecies(raw: ApiPokemonSpecies): PokemonSpecies {
  const englishFlavorTexts = raw.flavor_text_entries
    .filter((e) => e.language.name === 'en')
    .map((e) => ({
      text: e.flavor_text.replace(/\f|\n/g, ' '),
      language: e.language.name,
      version: e.version.name,
    }))

  const englishGenus = raw.genera.find((g) => g.language.name === 'en')?.genus ?? raw.name

  return {
    id: raw.id,
    name: raw.name,
    isBaby: raw.is_baby,
    isLegendary: raw.is_legendary,
    isMythical: raw.is_mythical,
    captureRate: raw.capture_rate,
    baseHappiness: raw.base_happiness,
    genderRate: raw.gender_rate,
    growthRate: raw.growth_rate.name,
    habitat: raw.habitat?.name ?? null,
    color: raw.color.name,
    shape: raw.shape?.name ?? null,
    generation: raw.generation.name,
    evolutionChainUrl: raw.evolution_chain.url,
    flavorTexts: englishFlavorTexts,
    genera: englishGenus,
  }
}

// ------------------------------------------------------------------
// Evolution chain
// ------------------------------------------------------------------
export function normalizeEvolutionChain(raw: ApiEvolutionChain): EvolutionChain {
  return {
    id: raw.id,
    chain: normalizeChainLink(raw.chain),
  }
}

function normalizeChainLink(link: ApiChainLink): EvolutionNode {
  const id = extractIdFromUrl(link.species.url)
  return {
    speciesName: link.species.name,
    speciesUrl: link.species.url,
    id,
    evolutionDetails: link.evolution_details.map((d) => ({
      minLevel: d.min_level,
      trigger: d.trigger.name,
      item: d.item?.name ?? null,
      heldItem: d.held_item?.name ?? null,
      knownMove: d.known_move?.name ?? null,
      minHappiness: d.min_happiness,
      minAffection: d.min_affection,
      needsOverworldRain: d.needs_overworld_rain,
      timeOfDay: d.time_of_day,
    })),
    evolvesTo: link.evolves_to.map(normalizeChainLink),
  }
}

// ------------------------------------------------------------------
// Type with damage relations
// ------------------------------------------------------------------
export function normalizeType(raw: ApiType): PokemonType & { damageRelations: NonNullable<PokemonType['damageRelations']> } {
  return {
    slot: 0,
    name: raw.name,
    url: `https://pokeapi.co/api/v2/type/${raw.id}/`,
    damageRelations: {
      doubleDamageTo: raw.damage_relations.double_damage_to,
      halfDamageTo: raw.damage_relations.half_damage_to,
      noDamageTo: raw.damage_relations.no_damage_to,
      doubleDamageFrom: raw.damage_relations.double_damage_from,
      halfDamageFrom: raw.damage_relations.half_damage_from,
      noDamageFrom: raw.damage_relations.no_damage_from,
    },
  }
}

// ------------------------------------------------------------------
// Ability with effect text
// ------------------------------------------------------------------
export function normalizeAbility(raw: ApiAbility): PokemonAbility {
  const englishEffect = raw.effect_entries.find((e) => e.language.name === 'en')
  return {
    name: raw.name,
    url: `https://pokeapi.co/api/v2/ability/${raw.id}/`,
    isHidden: false,
    slot: 0,
    shortEffect: englishEffect?.short_effect,
    effect: englishEffect?.effect,
  }
}

// ------------------------------------------------------------------
// Generation info
// ------------------------------------------------------------------
export function normalizeGeneration(raw: ApiGeneration): GenerationInfo {
  return {
    id: raw.id,
    name: raw.name,
    mainRegion: raw.main_region.name,
    pokemonSpecies: raw.pokemon_species,
  }
}

// ------------------------------------------------------------------
// Pokédex info
// ------------------------------------------------------------------
export function normalizePokedex(raw: ApiPokedex): PokedexInfo {
  return {
    id: raw.id,
    name: raw.name,
    isMainSeries: raw.is_main_series,
    region: raw.region?.name ?? null,
    pokemonEntries: raw.pokemon_entries.map((e) => ({
      entryNumber: e.entry_number,
      pokemonSpecies: e.pokemon_species,
    })),
  }
}

// ------------------------------------------------------------------
// Utility: "bulbasaur" → "Bulbasaur", "mr-mime" → "Mr. Mime"
// ------------------------------------------------------------------
export function toDisplayName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bMr\b/, 'Mr.')
    .replace(/\bMs\b/, 'Ms.')
}

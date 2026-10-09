// ============================================================
// Pokémon Type Contracts
// src/types/pokemon.ts
// ============================================================
// Normalized application types — separate from raw API response types.
// Raw API response types live in src/services/pokemon/pokemon.api.types.ts

// ------------------------------------------------------------------
// Pokémon Type (fire, water, grass …)
// ------------------------------------------------------------------
export interface PokemonTypeName {
  name: string
  url: string
}

export interface TypeDamageRelations {
  /** This type deals ×2 damage to */
  doubleDamageTo: PokemonTypeName[]
  /** This type deals ×0.5 damage to */
  halfDamageTo: PokemonTypeName[]
  /** This type deals ×0 damage to */
  noDamageTo: PokemonTypeName[]
  /** This type receives ×2 damage from */
  doubleDamageFrom: PokemonTypeName[]
  /** This type receives ×0.5 damage from */
  halfDamageFrom: PokemonTypeName[]
  /** This type receives ×0 damage from */
  noDamageFrom: PokemonTypeName[]
}

export interface PokemonType {
  slot: number
  name: string
  url: string
  damageRelations?: TypeDamageRelations
}

// ------------------------------------------------------------------
// Pokémon Stats
// ------------------------------------------------------------------
export type StatName =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed'

export interface PokemonStat {
  name: StatName | string
  baseStat: number
  effort: number
}

// ------------------------------------------------------------------
// Abilities
// ------------------------------------------------------------------
export interface PokemonAbility {
  name: string
  url: string
  isHidden: boolean
  slot: number
  shortEffect?: string
  effect?: string
}

// ------------------------------------------------------------------
// Moves
// ------------------------------------------------------------------
export interface PokemonMove {
  name: string
  url: string
  learnMethod: string
  levelLearnedAt: number
  versionGroup: string
}

// ------------------------------------------------------------------
// Sprites / Artwork
// ------------------------------------------------------------------
export interface PokemonSprites {
  frontDefault: string | null
  frontShiny: string | null
  backDefault: string | null
  backShiny: string | null
  /** High-quality official artwork from PokeAPI */
  officialArtwork: string | null
  /** Animated sprite if available */
  animated: string | null
}

// ------------------------------------------------------------------
// Summary (list view — minimal data)
// ------------------------------------------------------------------
export interface PokemonSummary {
  id: number
  name: string
  url: string
  /** Thumbnail sprite URL derived from id */
  spriteUrl: string
}

// ------------------------------------------------------------------
// Full Pokémon Details
// ------------------------------------------------------------------
export interface PokemonDetails {
  id: number
  name: string
  /** Display-friendly name with capitalization */
  displayName: string
  height: number  // in decimetres (÷10 = metres)
  weight: number  // in hectograms (÷10 = kg)
  baseExperience: number | null
  isDefault: boolean
  order: number
  types: PokemonType[]
  stats: PokemonStat[]
  abilities: PokemonAbility[]
  moves: PokemonMove[]
  sprites: PokemonSprites
  speciesUrl: string
}

// ------------------------------------------------------------------
// Species
// ------------------------------------------------------------------
export interface PokemonFlavorText {
  text: string
  language: string
  version: string
}

export interface PokemonSpecies {
  id: number
  name: string
  isBaby: boolean
  isLegendary: boolean
  isMythical: boolean
  captureRate: number
  baseHappiness: number | null
  genderRate: number  // -1 = genderless; 0-8 female ratio
  growthRate: string
  habitat: string | null
  color: string
  shape: string | null
  generation: string
  evolutionChainUrl: string
  flavorTexts: PokemonFlavorText[]
  genera: string  // e.g. "Seed Pokémon"
}

// ------------------------------------------------------------------
// Evolution Chain
// ------------------------------------------------------------------
export interface EvolutionDetail {
  minLevel: number | null
  trigger: string
  item: string | null
  heldItem: string | null
  knownMove: string | null
  minHappiness: number | null
  minAffection: number | null
  needsOverworldRain: boolean
  timeOfDay: string
}

export interface EvolutionNode {
  speciesName: string
  speciesUrl: string
  id: number
  evolutionDetails: EvolutionDetail[]
  evolvesTo: EvolutionNode[]
}

export interface EvolutionChain {
  id: number
  chain: EvolutionNode
}

// ------------------------------------------------------------------
// Paginated List
// ------------------------------------------------------------------
export interface PaginatedList<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ------------------------------------------------------------------
// Generation & Pokédex
// ------------------------------------------------------------------
export interface GenerationInfo {
  id: number
  name: string
  mainRegion: string
  pokemonSpecies: PokemonTypeName[]
}

export interface PokedexEntry {
  entryNumber: number
  pokemonSpecies: PokemonTypeName
}

export interface PokedexInfo {
  id: number
  name: string
  isMainSeries: boolean
  region: string | null
  pokemonEntries: PokedexEntry[]
}

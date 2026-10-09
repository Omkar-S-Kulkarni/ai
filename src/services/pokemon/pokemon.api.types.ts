// ============================================================
// PokéAPI Raw Response Types
// src/services/pokemon/pokemon.api.types.ts
// ============================================================
// These mirror the actual JSON shape returned by https://pokeapi.co/api/v2/
// Keep these SEPARATE from normalized application types in src/types/pokemon.ts

export interface ApiNamedResource {
  name: string
  url: string
}

export interface ApiPaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: ApiNamedResource[]
}

// ------------------------------------------------------------------
// /pokemon/:id
// ------------------------------------------------------------------
export interface ApiPokemon {
  id: number
  name: string
  base_experience: number | null
  height: number
  is_default: boolean
  order: number
  weight: number
  abilities: ApiPokemonAbility[]
  forms: ApiNamedResource[]
  held_items: ApiHeldItem[]
  location_area_encounters: string
  moves: ApiPokemonMove[]
  past_types: unknown[]
  sprites: ApiSprites
  species: ApiNamedResource
  stats: ApiPokemonStat[]
  types: ApiPokemonType[]
}

export interface ApiPokemonAbility {
  ability: ApiNamedResource
  is_hidden: boolean
  slot: number
}

export interface ApiPokemonType {
  slot: number
  type: ApiNamedResource
}

export interface ApiPokemonStat {
  base_stat: number
  effort: number
  stat: ApiNamedResource
}

export interface ApiPokemonMove {
  move: ApiNamedResource
  version_group_details: ApiMoveVersionGroupDetail[]
}

export interface ApiMoveVersionGroupDetail {
  level_learned_at: number
  move_learn_method: ApiNamedResource
  version_group: ApiNamedResource
}

export interface ApiHeldItem {
  item: ApiNamedResource
  version_details: unknown[]
}

export interface ApiSprites {
  back_default: string | null
  back_female: string | null
  back_shiny: string | null
  back_shiny_female: string | null
  front_default: string | null
  front_female: string | null
  front_shiny: string | null
  front_shiny_female: string | null
  other: {
    dream_world: { front_default: string | null; front_female: string | null }
    home: { front_default: string | null; front_female: string | null; front_shiny: string | null; front_shiny_female: string | null }
    'official-artwork': { front_default: string | null; front_shiny: string | null }
    showdown?: { front_default?: string | null; back_default?: string | null; front_shiny?: string | null }
  }
  versions: Record<string, Record<string, Partial<ApiSprites>>>
}

// ------------------------------------------------------------------
// /pokemon-species/:id
// ------------------------------------------------------------------
export interface ApiPokemonSpecies {
  id: number
  name: string
  order: number
  gender_rate: number
  capture_rate: number
  base_happiness: number | null
  is_baby: boolean
  is_legendary: boolean
  is_mythical: boolean
  hatch_counter: number
  has_gender_differences: boolean
  forms_switchable: boolean
  growth_rate: ApiNamedResource
  pokedex_numbers: ApiPokedexNumber[]
  egg_groups: ApiNamedResource[]
  color: ApiNamedResource
  shape: ApiNamedResource | null
  evolves_from_species: ApiNamedResource | null
  evolution_chain: { url: string }
  habitat: ApiNamedResource | null
  generation: ApiNamedResource
  names: ApiLanguageValue[]
  flavor_text_entries: ApiFlavorText[]
  form_descriptions: unknown[]
  genera: ApiGenera[]
  varieties: ApiVariety[]
  pal_park_encounters: unknown[]
}

export interface ApiPokedexNumber {
  entry_number: number
  pokedex: ApiNamedResource
}

export interface ApiLanguageValue {
  name: string
  language: ApiNamedResource
}

export interface ApiFlavorText {
  flavor_text: string
  language: ApiNamedResource
  version: ApiNamedResource
}

export interface ApiGenera {
  genus: string
  language: ApiNamedResource
}

export interface ApiVariety {
  is_default: boolean
  pokemon: ApiNamedResource
}

// ------------------------------------------------------------------
// /evolution-chain/:id
// ------------------------------------------------------------------
export interface ApiEvolutionChain {
  id: number
  baby_trigger_item: ApiNamedResource | null
  chain: ApiChainLink
}

export interface ApiChainLink {
  is_baby: boolean
  species: ApiNamedResource
  evolution_details: ApiEvolutionDetail[]
  evolves_to: ApiChainLink[]
}

export interface ApiEvolutionDetail {
  item: ApiNamedResource | null
  trigger: ApiNamedResource
  gender: number | null
  held_item: ApiNamedResource | null
  known_move: ApiNamedResource | null
  known_move_type: ApiNamedResource | null
  location: ApiNamedResource | null
  min_level: number | null
  min_happiness: number | null
  min_beauty: number | null
  min_affection: number | null
  needs_overworld_rain: boolean
  party_species: ApiNamedResource | null
  party_type: ApiNamedResource | null
  relative_physical_stats: number | null
  time_of_day: string
  trade_species: ApiNamedResource | null
  turn_upside_down: boolean
}

// ------------------------------------------------------------------
// /type/:name
// ------------------------------------------------------------------
export interface ApiType {
  id: number
  name: string
  damage_relations: ApiDamageRelations
  past_damage_relations: unknown[]
  game_indices: unknown[]
  generation: ApiNamedResource
  move_damage_class: ApiNamedResource | null
  names: ApiLanguageValue[]
  pokemon: ApiTypePokemon[]
  moves: ApiNamedResource[]
}

export interface ApiDamageRelations {
  no_damage_to: ApiNamedResource[]
  half_damage_to: ApiNamedResource[]
  double_damage_to: ApiNamedResource[]
  no_damage_from: ApiNamedResource[]
  half_damage_from: ApiNamedResource[]
  double_damage_from: ApiNamedResource[]
}

export interface ApiTypePokemon {
  slot: number
  pokemon: ApiNamedResource
}

// ------------------------------------------------------------------
// /ability/:name
// ------------------------------------------------------------------
export interface ApiAbility {
  id: number
  name: string
  is_main_series: boolean
  generation: ApiNamedResource
  names: ApiLanguageValue[]
  effect_entries: ApiAbilityEffect[]
  effect_changes: unknown[]
  flavor_text_entries: ApiFlavorText[]
  pokemon: ApiAbilityPokemon[]
}

export interface ApiAbilityEffect {
  effect: string
  short_effect: string
  language: ApiNamedResource
}

export interface ApiAbilityPokemon {
  is_hidden: boolean
  slot: number
  pokemon: ApiNamedResource
}

// ------------------------------------------------------------------
// /generation/:id and /pokedex/:id
// ------------------------------------------------------------------
export interface ApiGeneration {
  id: number
  name: string
  abilities: ApiNamedResource[]
  names: ApiLanguageValue[]
  main_region: ApiNamedResource
  moves: ApiNamedResource[]
  pokemon_species: ApiNamedResource[]
  types: ApiNamedResource[]
  version_groups: ApiNamedResource[]
}

export interface ApiPokedex {
  id: number
  name: string
  is_main_series: boolean
  descriptions: ApiLanguageValue[]
  names: ApiLanguageValue[]
  pokemon_entries: ApiPokedexEntry[]
  region: ApiNamedResource | null
  version_groups: ApiNamedResource[]
}

export interface ApiPokedexEntry {
  entry_number: number
  pokemon_species: ApiNamedResource
}

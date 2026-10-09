// ============================================================
// Application Configuration
// src/lib/config.ts
// ============================================================

export const APP_CONFIG = {
  name: 'PokéVerse',
  version: '0.1.0',
} as const

// ------------------------------------------------------------------
// PokéAPI
// ------------------------------------------------------------------
export const POKEAPI_CONFIG = {
  baseUrl: 'https://pokeapi.co/api/v2',
  defaultLimit: 20,
  maxLimit: 100,
  /** Stale time for react-query: 10 minutes (Pokémon data rarely changes) */
  staleTimeMs: 10 * 60 * 1000,
  /** Cache time for react-query: 30 minutes */
  gcTimeMs: 30 * 60 * 1000,
  /** Request timeout in milliseconds */
  timeoutMs: 15_000,
} as const

export const POKEAPI_ENDPOINTS = {
  pokemon: '/pokemon',
  pokemonSpecies: '/pokemon-species',
  evolutionChain: '/evolution-chain',
  type: '/type',
  ability: '/ability',
  move: '/move',
  generation: '/generation',
  pokedex: '/pokedex',
} as const

// ------------------------------------------------------------------
// IP-API
// ------------------------------------------------------------------
/**
 * ⚠️  IMPORTANT LIMITATION:
 *
 * ip-api.com free endpoint is HTTP-ONLY (http://ip-api.com).
 * Calling it from an HTTPS page will be blocked by the browser's
 * Mixed Content policy and will fail silently or with a network error.
 *
 * For production HTTPS deployments:
 *   Option A — Use the paid ip-api.com Pro plan (HTTPS support)
 *   Option B — Proxy requests through your own HTTPS backend
 *   Option C — Switch provider (see GeolocationProviderConfig in types/geolocation.ts)
 *
 * During local development (http://localhost), the HTTP endpoint works fine.
 */
export const IPAPI_CONFIG = {
  /** HTTP-only free endpoint. Works on http:// origins only. */
  baseUrl: 'http://ip-api.com',
  /** HTTPS Pro endpoint (requires paid plan / API key) */
  proBaseUrl: 'https://pro.ip-api.com',
  /**
   * Fields to request — reduces response size and avoids sending
   * fields we don't use. See: https://ip-api.com/docs/api:json
   */
  fields: [
    'status', 'message', 'country', 'countryCode', 'region', 'regionName',
    'city', 'zip', 'lat', 'lon', 'timezone', 'offset', 'currency',
    'isp', 'org', 'as', 'asname', 'mobile', 'proxy', 'hosting', 'query',
  ].join(','),
  timeoutMs: 8_000,
} as const

// ------------------------------------------------------------------
// Official artwork URL helper (no API call needed)
// ------------------------------------------------------------------
export const getPokemonSpriteUrl = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

export const getPokemonArtworkUrl = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

export const getPokemonAnimatedUrl = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`

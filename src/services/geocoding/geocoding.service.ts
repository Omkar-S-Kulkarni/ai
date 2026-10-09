// ============================================================
// Geocoding Service (Nominatim / OpenStreetMap)
// src/services/geocoding/geocoding.service.ts
// ============================================================
//
// Provider: Nominatim (https://nominatim.openstreetmap.org)
//
// USAGE POLICY — MUST READ:
//   • Nominatim is a FREE public API from OpenStreetMap.
//   • Max 1 request per second from a single IP.
//   • You MUST send a descriptive User-Agent header identifying your app.
//   • You MUST display OpenStreetMap attribution: "© OpenStreetMap contributors"
//   • Commercial heavy-use requires self-hosting or a paid provider.
//   • See: https://operations.osmfoundation.org/policies/nominatim/
//
// COORDINATE VALIDATION:
//   • lat must be in [-90, 90]
//   • lon must be in [-180, 180]
//   • Never generate random coordinates — only use results from this service.

import axios from 'axios'
import type { NominatimSearchResult, NominatimReverseResult } from './geocoding.api.types'
import type { GeocodingResult } from '@/types'

// ------------------------------------------------------------------
// Nominatim client (separate from pokemonApiClient and geoApiClient)
// ------------------------------------------------------------------
const nominatimClient = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    // REQUIRED by Nominatim usage policy
    'User-Agent': 'PokéVerse-App/0.1 (github.com/Omkar-S-Kulkarni/ai)',
  },
})

nominatimClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject({ code: 'CANCELLED', message: 'Geocoding request cancelled' })
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ code: 'TIMEOUT', message: 'Geocoding request timed out' })
    }
    if (error.response?.status === 429) {
      return Promise.reject({
        code: 'RATE_LIMITED',
        message: 'Geocoding rate limit exceeded — please wait before retrying',
      })
    }
    return Promise.reject({ code: 'NETWORK_ERROR', message: 'Geocoding network error', raw: error })
  },
)

// ------------------------------------------------------------------
// Normalizer: raw Nominatim → app GeocodingResult
// ------------------------------------------------------------------
function normalizeNominatimResult(raw: NominatimSearchResult): GeocodingResult {
  const lat = parseFloat(raw.lat)
  const lon = parseFloat(raw.lon)

  // Derive a short readable name: prefer the `name` field, then first segment of display_name
  const shortName = raw.name || raw.display_name.split(',')[0].trim()

  // Derive city from address detail object
  const city =
    raw.address?.city ??
    raw.address?.town ??
    raw.address?.village ??
    raw.address?.municipality ??
    null

  const boundingBox: GeocodingResult['boundingBox'] =
    raw.boundingbox
      ? [
          parseFloat(raw.boundingbox[0]),  // south (minLat)
          parseFloat(raw.boundingbox[1]),  // north (maxLat)
          parseFloat(raw.boundingbox[2]),  // west  (minLon)
          parseFloat(raw.boundingbox[3]),  // east  (maxLon)
        ]
      : null

  return {
    placeId: String(raw.place_id),
    displayName: raw.display_name,
    shortName,
    lat,
    lon,
    category: raw.class,
    type: raw.type,
    importance: raw.importance,
    country: raw.address?.country ?? null,
    countryCode: raw.address?.country_code?.toUpperCase() ?? null,
    region: raw.address?.state ?? raw.address?.region ?? null,
    city,
    boundingBox,
    provider: 'nominatim',
    fetchedAt: new Date().toISOString(),
  }
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Search for locations by free-text query.
 *
 * Uses Nominatim (OpenStreetMap). Requires attribution on display.
 * Respects max 1 req/s — callers should debounce.
 *
 * @param query  - Free-text search string (e.g. "Tokyo", "France", "Central Park")
 * @param limit  - Max results (1–10). Nominatim hard cap is 50.
 * @param signal - AbortSignal for cancellation
 */
export async function searchLocations(
  query: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  if (!query.trim()) return []

  const { data } = await nominatimClient.get<NominatimSearchResult[]>('/search', {
    params: {
      q: query.trim(),
      format: 'json',
      limit: Math.min(Math.max(limit, 1), 10),
      addressdetails: 1,
      namedetails: 0,
      'accept-language': 'en',
    },
    ...(signal ? { signal } : {}),
  })

  return data.map(normalizeNominatimResult)
}

/**
 * Reverse-geocode a lat/lon coordinate to a place name.
 *
 * Validates coordinate ranges before sending the request.
 * Never generates or transforms coordinates.
 *
 * @param lat    - Latitude  [-90, 90]
 * @param lon    - Longitude [-180, 180]
 * @param signal - AbortSignal for cancellation
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<GeocodingResult> {
  // Validate coordinate ranges
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be in range [-90, 90].`)
  }
  if (lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude: ${lon}. Must be in range [-180, 180].`)
  }

  const { data } = await nominatimClient.get<NominatimReverseResult>('/reverse', {
    params: {
      lat,
      lon,
      format: 'json',
      addressdetails: 1,
      'accept-language': 'en',
      zoom: 10,  // city-level resolution
    },
    ...(signal ? { signal } : {}),
  })

  return normalizeNominatimResult(data)
}

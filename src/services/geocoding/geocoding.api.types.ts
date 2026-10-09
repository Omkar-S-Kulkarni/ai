// ============================================================
// Geocoding API Raw Response Types
// src/services/geocoding/geocoding.api.types.ts
// ============================================================
// Raw Nominatim (OpenStreetMap) API response shapes.
// These are internal to the service layer — normalized types live in src/types/map.ts.

/** Nominatim /search response item */
export interface NominatimSearchResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string        // string latitude
  lon: string        // string longitude
  class: string
  type: string
  place_rank: number
  importance: number
  addresstype: string
  name: string
  display_name: string
  address?: NominatimAddress
  boundingbox?: [string, string, string, string]  // [minLat, maxLat, minLon, maxLon]
}

/** Nominatim address detail object (returned when addressdetails=1) */
export interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  county?: string
  state?: string
  country?: string
  country_code?: string
  postcode?: string
  road?: string
  suburb?: string
  neighbourhood?: string
  municipality?: string
  region?: string
}

/** Nominatim /reverse response */
export interface NominatimReverseResult extends NominatimSearchResult {
  address: NominatimAddress
}

// ============================================================
// Map Type Contracts
// src/types/map.ts
// ============================================================
// Shared types for the interactive world map feature.
// These are the normalized application-layer types for map, location, and marker data.

import type { SimulationResult, Competitor } from './simulation'

// ------------------------------------------------------------------
// Geocoding / Location Search
// ------------------------------------------------------------------

/** Normalized geocoding result returned by the geocoding service */
export interface GeocodingResult {
  /** Unique place identifier from provider */
  placeId: string
  /** Full display name for UI (e.g. "Paris, Île-de-France, France") */
  displayName: string
  /** Short human-friendly label (city or first meaningful component) */
  shortName: string
  lat: number
  lon: number
  /** Place category (e.g. "city", "country", "region") */
  category: string
  /** OSM type string for filtering */
  type: string
  /** Importance score 0–1, higher = more prominent */
  importance: number
  /** Country name if available */
  country: string | null
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string | null
  /** State / administrative region */
  region: string | null
  /** City / town name */
  city: string | null
  /** Bounding box [south, north, west, east] if provided */
  boundingBox: [number, number, number, number] | null
  /** Provider that returned this result */
  provider: 'nominatim'
  /** Timestamp of the fetch */
  fetchedAt: string
}

// ------------------------------------------------------------------
// Selected Map Location (what the user has chosen)
// ------------------------------------------------------------------

/** Source of a selected location */
export type MapLocationSource =
  | 'search'       // selected from geocoding search results
  | 'map-click'    // clicked directly on the map
  | 'ip'           // derived from IP geolocation
  | 'browser'      // browser GPS geolocation
  | 'none'         // nothing selected

/** A location selected/active on the map */
export interface MapLocation {
  lat: number
  lon: number
  /** Where this selection came from */
  source: MapLocationSource
  /** Human-readable label (e.g. "Tokyo, Japan") */
  label: string
  /** Whether lat/lon comes from precise GPS vs approximate/search */
  isPrecise: boolean
  /** Country if known */
  country: string | null
  /** Country code if known */
  countryCode: string | null
  /** Region/state if known */
  region: string | null
  /** City if known */
  city: string | null
  /** Latitude validated to [-90, 90] */
  validatedLat: boolean
  /** Longitude validated to [-180, 180] */
  validatedLon: boolean
  /** When this location was selected */
  selectedAt: string
  /** Full geocoding result if available */
  geocodingResult?: GeocodingResult
}

// ------------------------------------------------------------------
// Map Marker (Pokémon deployments / simulation outcomes)
// ------------------------------------------------------------------

export type MapMarkerType =
  | 'deployment'        // Pokémon deployed to this location
  | 'simulation-win'    // Competitor won here
  | 'simulation-loss'   // Competitor lost here
  | 'competitor'        // Another competitor's location

export interface MapMarker {
  id: string
  lat: number
  lon: number
  markerType: MapMarkerType
  /** Display label for the marker popup */
  label: string
  /** Pokémon sprite URL if applicable */
  spriteUrl?: string
  /** Competitor info if available */
  competitor?: Pick<Competitor, 'id' | 'trainerName' | 'rating'>
  /** Simulation result associated with this marker */
  simulationResult?: Pick<SimulationResult, 'id' | 'outcome' | 'timestamp'>
  /** Pokémon name deployed */
  pokemonName?: string
  createdAt: string
}

// ------------------------------------------------------------------
// Deployment Payload (passed to shared deployment workflow)
// ------------------------------------------------------------------

/** Payload sent when a user confirms a location for Pokémon deployment */
export interface LocationDeploymentPayload {
  location: MapLocation
  /** Timestamp when the user initiated the deployment */
  deployedAt: string
  /** Optional note / context from the user */
  note?: string
}

// ------------------------------------------------------------------
// Map viewport state
// ------------------------------------------------------------------

export interface MapViewport {
  lat: number
  lon: number
  zoom: number
  bearing: number
  pitch: number
}

export const DEFAULT_VIEWPORT: MapViewport = {
  lat: 20,
  lon: 0,
  zoom: 1.8,
  bearing: 0,
  pitch: 0,
}

// ============================================================
// Geolocation Type Contracts
// src/types/geolocation.ts
// ============================================================

// ------------------------------------------------------------------
// Provider abstraction — allows swapping IP-API for another provider
// ------------------------------------------------------------------
export type GeolocationProvider = 'ip-api' | 'ipinfo' | 'ipgeolocation' | 'custom'

export interface GeolocationProviderConfig {
  provider: GeolocationProvider
  /** Base URL for the provider. Swap this to migrate to HTTPS providers. */
  baseUrl: string
  /**
   * IMPORTANT: ip-api.com free endpoint is HTTP-only.
   * Calling it from an HTTPS page will be blocked by Mixed Content policy.
   * For production HTTPS deployments, switch to an HTTPS-capable provider
   * or proxy requests through your own backend.
   */
  requiresHttps: boolean
  /** Whether the provider requires an API key */
  requiresApiKey: boolean
  /** Field selection string (provider-specific) */
  fieldSelector?: string
}

// ------------------------------------------------------------------
// IP Geolocation result (normalized across providers)
// ------------------------------------------------------------------
export interface IpGeolocationResult {
  /** Status from the provider: 'success' | 'fail' */
  status: 'success' | 'fail'
  /** Failure message from provider (if status = fail) */
  message?: string

  // Network identity
  /** The queried IP address */
  query: string
  /** ISP name */
  isp: string | null
  /** Organization name */
  org: string | null
  /** Autonomous System number and name, e.g. "AS15169 Google LLC" */
  as: string | null
  /** Raw ASN number */
  asname: string | null

  // Location
  country: string | null
  countryCode: string | null
  region: string | null
  regionName: string | null
  city: string | null
  zip: string | null
  /** Approximate latitude — NOT precise browser geolocation */
  lat: number | null
  /** Approximate longitude — NOT precise browser geolocation */
  lon: number | null
  timezone: string | null
  /** UTC offset in seconds */
  offset: number | null
  currency: string | null

  // Connection flags (may not be present on free tier)
  mobile: boolean | null
  proxy: boolean | null
  hosting: boolean | null

  // Metadata
  /** Provider that returned this result */
  provider: GeolocationProvider
  /** Timestamp of the fetch */
  fetchedAt: string
}

// ------------------------------------------------------------------
// Browser Geolocation (precise — requires explicit user permission)
// ------------------------------------------------------------------
/**
 * NOTE: This is completely separate from IP-based geolocation.
 * Browser geolocation is precise and requires explicit user consent via
 * navigator.geolocation.getCurrentPosition(). Never request it automatically.
 */
export interface BrowserGeolocationResult {
  lat: number
  lon: number
  accuracy: number  // metres
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
  timestamp: number
}

// ------------------------------------------------------------------
// Combined geographic location (used in components)
// ------------------------------------------------------------------
export interface GeographicLocation {
  /** Source of this location data */
  source: 'ip' | 'browser' | 'none'
  ip?: IpGeolocationResult
  browser?: BrowserGeolocationResult
  /** Whether this location came from a user-granted permission */
  isPrecise: boolean
  /** User-friendly label (e.g. "Mumbai, IN") */
  label: string | null
}

// ------------------------------------------------------------------
// Geolocation error
// ------------------------------------------------------------------
export type GeolocationErrorCode =
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'MIXED_CONTENT'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'UNKNOWN'

export interface GeolocationError {
  code: GeolocationErrorCode
  message: string
  raw?: unknown
}

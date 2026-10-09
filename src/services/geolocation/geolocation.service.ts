// ============================================================
// Geolocation Service
// src/services/geolocation/geolocation.service.ts
// ============================================================
// Fetches approximate IP-based location using ip-api.com.
//
// ⚠️  PROVIDER LIMITATION:
//   ip-api.com free endpoint is HTTP-ONLY.
//   It will be blocked by browsers on HTTPS pages (Mixed Content policy).
//   Works on http://localhost during development.
//
//   To switch providers, update ACTIVE_PROVIDER_CONFIG below and
//   implement the corresponding adapter in fetchIpGeolocation().

import { geoApiClient, makeCancelable } from '@/lib/httpClient'
import { IPAPI_CONFIG } from '@/lib/config'
import type {
  IpGeolocationResult,
  GeolocationProviderConfig,
  GeolocationErrorCode,
  GeolocationError,
} from '@/types'

// ------------------------------------------------------------------
// Raw ip-api.com JSON response shape
// ------------------------------------------------------------------
interface IpApiRawResponse {
  status: 'success' | 'fail'
  message?: string
  country?: string
  countryCode?: string
  region?: string
  regionName?: string
  city?: string
  zip?: string
  lat?: number
  lon?: number
  timezone?: string
  offset?: number
  currency?: string
  isp?: string
  org?: string
  as?: string
  asname?: string
  mobile?: boolean
  proxy?: boolean
  hosting?: boolean
  query?: string
}

// ------------------------------------------------------------------
// Provider adapter registry — add new providers here
// ------------------------------------------------------------------
export const ACTIVE_PROVIDER_CONFIG: GeolocationProviderConfig = {
  provider: 'ip-api',
  baseUrl: IPAPI_CONFIG.baseUrl,
  requiresHttps: false,  // ← Free tier is HTTP-only
  requiresApiKey: false,
  fieldSelector: IPAPI_CONFIG.fields,
}

// ------------------------------------------------------------------
// ip-api.com adapter
// ------------------------------------------------------------------
async function fetchFromIpApi(signal?: AbortSignal): Promise<IpGeolocationResult> {
  const url = `${IPAPI_CONFIG.baseUrl}/json`
  const { data } = await geoApiClient.get<IpApiRawResponse>(url, {
    params: { fields: IPAPI_CONFIG.fields },
    ...makeCancelable(signal),
  })

  return {
    status: data.status,
    message: data.message,
    query: data.query ?? '',
    isp: data.isp ?? null,
    org: data.org ?? null,
    as: data.as ?? null,
    asname: data.asname ?? null,
    country: data.country ?? null,
    countryCode: data.countryCode ?? null,
    region: data.region ?? null,
    regionName: data.regionName ?? null,
    city: data.city ?? null,
    zip: data.zip ?? null,
    lat: data.lat ?? null,
    lon: data.lon ?? null,
    timezone: data.timezone ?? null,
    offset: data.offset ?? null,
    currency: data.currency ?? null,
    mobile: data.mobile ?? null,
    proxy: data.proxy ?? null,
    hosting: data.hosting ?? null,
    provider: 'ip-api',
    fetchedAt: new Date().toISOString(),
  }
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Fetch approximate IP-based geolocation.
 *
 * ⚠️  This is APPROXIMATE location derived from the network IP.
 *     It is NOT precise browser geolocation.
 *     It typically resolves to city level ±50km.
 *     Never use this for map pins or turn-by-turn directions.
 *
 * @param signal - AbortSignal for cancellation
 * @throws GeolocationError with code MIXED_CONTENT on HTTPS pages
 */
export async function fetchIpGeolocation(signal?: AbortSignal): Promise<IpGeolocationResult> {
  const provider = ACTIVE_PROVIDER_CONFIG.provider

  try {
    switch (provider) {
      case 'ip-api':
        return await fetchFromIpApi(signal)
      // Future providers:
      // case 'ipinfo': return await fetchFromIpInfo(signal)
      // case 'ipgeolocation': return await fetchFromIpGeolocation(signal)
      default:
        throw { code: 'PROVIDER_ERROR', message: `Unknown provider: ${provider}` } satisfies GeolocationError
    }
  } catch (err) {
    const error = err as { code?: string; message?: string }

    // Re-throw already-structured errors
    if (error.code === 'MIXED_CONTENT' || error.code === 'TIMEOUT' || error.code === 'CANCELLED') {
      throw err
    }

    // Classify network errors
    const code: GeolocationErrorCode =
      error.code === 'NETWORK_ERROR' ? 'NETWORK_ERROR' :
      error.code === 'TIMEOUT' ? 'TIMEOUT' :
      'UNKNOWN'

    throw { code, message: error.message ?? 'Geolocation failed', raw: err } satisfies GeolocationError
  }
}

// ------------------------------------------------------------------
// Browser Geolocation (precise — requires explicit permission)
// ------------------------------------------------------------------

/**
 * Request precise location via browser Geolocation API.
 *
 * 🔒 REQUIRES explicit user permission via browser prompt.
 * 📍 Returns coordinates accurate to ~10m (GPS).
 * ⚡ Must only be called in response to an explicit user action.
 *
 * Never call this automatically on page load.
 */
export function fetchBrowserGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation API is not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      reject(new Error(`Browser geolocation error (${err.code}): ${err.message}`))
    }, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60 * 1000,
    })
  })
}

// ============================================================
// Geocoding React Query Hook
// src/hooks/useGeocoding.ts
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { searchLocations, reverseGeocode } from '@/services/geocoding'

// ------------------------------------------------------------------
// Query key factory (local — geocoding keys added here)
// ------------------------------------------------------------------
export const geocodingKeys = {
  all: ['geocoding'] as const,
  search: (query: string) => [...geocodingKeys.all, 'search', query] as const,
  reverse: (lat: number, lon: number) => [...geocodingKeys.all, 'reverse', lat, lon] as const,
} as const

// ------------------------------------------------------------------
// Location search hook
// ------------------------------------------------------------------

/**
 * Search for locations via Nominatim (OpenStreetMap).
 *
 * Callers should debounce the query string before passing it here
 * to respect Nominatim's 1 req/s usage policy.
 *
 * Enabled only when query has ≥3 non-space characters.
 */
export function useLocationSearch(query: string, enabled = true) {
  const trimmed = query.trim()
  const shouldSearch = trimmed.length >= 3 && enabled

  return useQuery({
    queryKey: geocodingKeys.search(trimmed),
    queryFn: ({ signal }) => searchLocations(trimmed, 5, signal),
    enabled: shouldSearch,
    staleTime: 5 * 60 * 1000,   // geocoding results stable for 5 min
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      const err = error as { code?: string }
      if (err?.code === 'RATE_LIMITED' || err?.code === 'CANCELLED') return false
      return failureCount < 1
    },
    placeholderData: (prev) => prev,
  })
}

// ------------------------------------------------------------------
// Reverse geocoding hook
// ------------------------------------------------------------------

/**
 * Reverse-geocode a coordinate pair (lat/lon) to a place name.
 *
 * Only enabled when both lat and lon are provided and non-null.
 */
export function useReverseGeocode(
  lat: number | null,
  lon: number | null,
  enabled = true,
) {
  const canFetch =
    lat !== null &&
    lon !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    enabled

  return useQuery({
    queryKey: geocodingKeys.reverse(lat ?? 0, lon ?? 0),
    queryFn: ({ signal }) => reverseGeocode(lat!, lon!, signal),
    enabled: canFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: (failureCount, error) => {
      const err = error as { code?: string }
      if (err?.code === 'CANCELLED') return false
      return failureCount < 1
    },
  })
}

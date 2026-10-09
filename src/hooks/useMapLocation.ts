// ============================================================
// Map Location State Hook
// src/hooks/useMapLocation.ts
// ============================================================
// Manages the selected/active location on the world map.
// Converts geolocation and geocoding results into the shared MapLocation contract.

import { useState, useCallback } from 'react'
import type { MapLocation, GeocodingResult } from '@/types'
import type { IpGeolocationResult } from '@/types'

// ------------------------------------------------------------------
// Coordinate validation
// ------------------------------------------------------------------
function validateCoords(lat: number, lon: number): { validatedLat: boolean; validatedLon: boolean } {
  return {
    validatedLat: lat >= -90 && lat <= 90,
    validatedLon: lon >= -180 && lon <= 180,
  }
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useMapLocation() {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)

  /** Select a location from a geocoding search result */
  const selectFromSearch = useCallback((result: GeocodingResult) => {
    const { validatedLat, validatedLon } = validateCoords(result.lat, result.lon)
    setSelectedLocation({
      lat: result.lat,
      lon: result.lon,
      source: 'search',
      label: result.displayName,
      isPrecise: false,
      country: result.country,
      countryCode: result.countryCode,
      region: result.region,
      city: result.city,
      validatedLat,
      validatedLon,
      selectedAt: new Date().toISOString(),
      geocodingResult: result,
    })
  }, [])

  /** Select a location from a direct map click (with optional reverse geocoding result) */
  const selectFromMapClick = useCallback(
    (lat: number, lon: number, reverseResult?: GeocodingResult) => {
      const { validatedLat, validatedLon } = validateCoords(lat, lon)
      const label =
        reverseResult?.displayName ??
        `${lat.toFixed(5)}, ${lon.toFixed(5)}`
      setSelectedLocation({
        lat,
        lon,
        source: 'map-click',
        label,
        isPrecise: false,  // map click on Mercator ≠ GPS precision
        country: reverseResult?.country ?? null,
        countryCode: reverseResult?.countryCode ?? null,
        region: reverseResult?.region ?? null,
        city: reverseResult?.city ?? null,
        validatedLat,
        validatedLon,
        selectedAt: new Date().toISOString(),
        geocodingResult: reverseResult,
      })
    },
    [],
  )

  /** Select from IP geolocation (approximate) */
  const selectFromIp = useCallback((ipResult: IpGeolocationResult) => {
    if (ipResult.lat === null || ipResult.lon === null) return
    const { validatedLat, validatedLon } = validateCoords(ipResult.lat, ipResult.lon)
    const label = [ipResult.city, ipResult.regionName, ipResult.country]
      .filter(Boolean)
      .join(', ') || 'Approximate Location'
    setSelectedLocation({
      lat: ipResult.lat,
      lon: ipResult.lon,
      source: 'ip',
      label,
      isPrecise: false,
      country: ipResult.country,
      countryCode: ipResult.countryCode,
      region: ipResult.regionName,
      city: ipResult.city,
      validatedLat,
      validatedLon,
      selectedAt: new Date().toISOString(),
    })
  }, [])

  /** Select from browser GPS (precise, requires explicit user action) */
  const selectFromBrowser = useCallback(
    (lat: number, lon: number, reverseResult?: GeocodingResult) => {
      const { validatedLat, validatedLon } = validateCoords(lat, lon)
      const label =
        reverseResult?.displayName ??
        `${lat.toFixed(5)}, ${lon.toFixed(5)}`
      setSelectedLocation({
        lat,
        lon,
        source: 'browser',
        label,
        isPrecise: true,  // browser GPS is precise
        country: reverseResult?.country ?? null,
        countryCode: reverseResult?.countryCode ?? null,
        region: reverseResult?.region ?? null,
        city: reverseResult?.city ?? null,
        validatedLat,
        validatedLon,
        selectedAt: new Date().toISOString(),
        geocodingResult: reverseResult,
      })
    },
    [],
  )

  const clearLocation = useCallback(() => setSelectedLocation(null), [])

  return {
    selectedLocation,
    selectFromSearch,
    selectFromMapClick,
    selectFromIp,
    selectFromBrowser,
    clearLocation,
  }
}

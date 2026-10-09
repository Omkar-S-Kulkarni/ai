// ============================================================
// Geolocation React Query Hook
// src/hooks/useGeolocation.ts
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { geoKeys } from '@/lib/queryClient'
import { fetchIpGeolocation, fetchBrowserGeolocation } from '@/services/geolocation'
import type { BrowserGeolocationResult } from '@/types'

// ------------------------------------------------------------------
// IP-based approximate geolocation
// ------------------------------------------------------------------
export function useIpGeolocation(enabled = true) {
  return useQuery({
    queryKey: geoKeys.ip(),
    queryFn: ({ signal }) => fetchIpGeolocation(signal),
    enabled,
    // Don't retry on mixed content — it will always fail from HTTPS
    retry: (failureCount, error) => {
      const err = error as { code?: string }
      if (err?.code === 'MIXED_CONTENT' || err?.code === 'PROVIDER_ERROR') return false
      return failureCount < 1
    },
    // IP location doesn't change frequently — keep for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// ------------------------------------------------------------------
// Browser precise geolocation (requires explicit user action)
// ------------------------------------------------------------------
export function useBrowserGeolocation() {
  const [position, setPosition] = useState<BrowserGeolocationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Call this ONLY in response to an explicit user interaction.
   * This triggers a browser permission prompt.
   */
  const requestLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const pos = await fetchBrowserGeolocation()
      setPosition({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get location'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { position, error, isLoading, requestLocation }
}

// ============================================================
// WorldMap Component — MapLibre GL JS
// src/components/map/WorldMap.tsx
// ============================================================
//
// Map provider: MapLibre GL JS (open-source, free, no API key for rendering)
// Tile style:   MapTiler Basic (free tier) — OR — OSM Bright via MapTiler CDN
//
// Attribution (REQUIRED):
//   • MapLibre GL JS — BSD license, credit in map watermark
//   • © OpenStreetMap contributors — tile data
//   • © MapTiler — tile hosting (when using their CDN)
//
// The map displays:
//   • Full-world interactive pan/zoom (including keyboard nav)
//   • Click-to-select location
//   • Custom markers for selected location, Pokémon deployments, results
//   • Smooth fly-to animation when location is programmatically set

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
  AttributionControl,
  ScaleControl,
  type LngLatLike,
  type MarkerOptions,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MapPin, Target } from 'lucide-react'
import type { MapLocation, MapMarker, MapViewport } from '@/types'
import { DEFAULT_VIEWPORT } from '@/types'

// ------------------------------------------------------------------
// Free MapTiler style (no API key required for basic usage in dev)
// We use the OSM-based free style endpoint.
// Attribution to MapTiler is required per their ToS.
// ------------------------------------------------------------------
const MAP_STYLE_URL =
  'https://demotiles.maplibre.org/style.json'

// ------------------------------------------------------------------
// Props
// ------------------------------------------------------------------
interface WorldMapProps {
  /** Currently selected location (controls selected-location marker) */
  selectedLocation: MapLocation | null
  /** Pokémon deployment / simulation markers to display */
  markers?: MapMarker[]
  /** Called when user clicks a point on the map */
  onMapClick?: (lat: number, lon: number) => void
  /** Called when viewport changes significantly */
  onViewportChange?: (viewport: MapViewport) => void
  /** Whether to show loading state while initializing */
  isLoading?: boolean
  className?: string
}

// ------------------------------------------------------------------
// Selected location marker (custom HTML element)
// ------------------------------------------------------------------
function createSelectedMarkerEl(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'selected-map-marker'
  el.setAttribute('aria-label', 'Selected location')
  el.innerHTML = `
    <div class="marker-pulse-ring"></div>
    <div class="marker-pin">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `
  return el
}

// ------------------------------------------------------------------
// Deployment marker (Pokémon sprite or colored dot)
// ------------------------------------------------------------------
function createDeploymentMarkerEl(marker: MapMarker): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'deployment-map-marker'
  el.setAttribute('aria-label', marker.label)

  const colorMap: Record<MapMarker['markerType'], string> = {
    'deployment': '#6366f1',
    'simulation-win': '#22c55e',
    'simulation-loss': '#ef4444',
    'competitor': '#f59e0b',
  }
  const color = colorMap[marker.markerType]

  if (marker.spriteUrl) {
    el.innerHTML = `
      <div class="pokemon-marker-sprite" style="border-color: ${color};">
        <img src="${marker.spriteUrl}" alt="${marker.pokemonName ?? 'Pokémon'}" loading="lazy" />
      </div>
    `
  } else {
    el.innerHTML = `
      <div class="dot-marker" style="background: ${color};">
        <span class="dot-marker-label">${marker.label.charAt(0)}</span>
      </div>
    `
  }
  return el
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export function WorldMap({
  selectedLocation,
  markers = [],
  onMapClick,
  onViewportChange,
  isLoading = false,
  className = '',
}: WorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const selectedMarkerRef = useRef<Marker | null>(null)
  const deploymentMarkersRef = useRef<Map<string, Marker>>(new Map())
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // ------------------------------------------------------------------
  // Initialize the map
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    let map: MapLibreMap

    try {
      map = new MapLibreMap({
        container: mapContainerRef.current,
        style: MAP_STYLE_URL,
        center: [DEFAULT_VIEWPORT.lon, DEFAULT_VIEWPORT.lat] as LngLatLike,
        zoom: DEFAULT_VIEWPORT.zoom,
        bearing: DEFAULT_VIEWPORT.bearing,
        pitch: DEFAULT_VIEWPORT.pitch,
        attributionControl: false,  // we add a custom attribution below
        maxZoom: 18,
        minZoom: 1,
      })

      // Accessibility: enable keyboard navigation
      map.keyboard.enable()
      map.dragRotate.disable()   // keep it simple for world exploration
      map.touchZoomRotate.disableRotation()

      // Custom attribution (required by OSM + MapLibre)
      map.addControl(
        new AttributionControl({
          customAttribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }),
        'bottom-right',
      )

      // Navigation controls (keyboard accessible)
      map.addControl(
        new NavigationControl({ showCompass: false }),
        'bottom-right',
      )

      // Scale control
      map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')

      map.on('load', () => {
        setMapReady(true)
        mapRef.current = map
      })

      map.on('error', (e) => {
        console.error('[WorldMap] MapLibre error:', e.error)
        setMapError('Map failed to load. Please check your internet connection.')
      })

      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick(e.lngLat.lat, e.lngLat.lng)
        }
      })

      map.on('moveend', () => {
        if (onViewportChange) {
          const center = map.getCenter()
          onViewportChange({
            lat: center.lat,
            lon: center.lng,
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
          })
        }
      })

      // Change cursor on hover over map for click affordance
      map.getCanvas().style.cursor = 'crosshair'

    } catch (err) {
      console.error('[WorldMap] Failed to initialize:', err)
      setMapError('Failed to initialize the map.')
    }

    return () => {
      if (map) {
        map.remove()
        mapRef.current = null
        setMapReady(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ------------------------------------------------------------------
  // Fly to selected location & update selected marker
  // ------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    // Remove old selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove()
      selectedMarkerRef.current = null
    }

    if (!selectedLocation) return

    const { lat, lon } = selectedLocation

    // Fly to the selected location with smooth animation
    map.flyTo({
      center: [lon, lat] as LngLatLike,
      zoom: Math.max(map.getZoom(), 6),
      duration: 1400,
      essential: true,
    })

    // Place marker
    const el = createSelectedMarkerEl()
    const markerOpts: MarkerOptions = { element: el, anchor: 'bottom', offset: [0, 0] }
    const marker = new Marker(markerOpts)
      .setLngLat([lon, lat] as LngLatLike)
      .addTo(map)

    selectedMarkerRef.current = marker
  }, [selectedLocation, mapReady])

  // ------------------------------------------------------------------
  // Sync deployment markers
  // ------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    // Remove old deployment markers not in the new list
    const currentIds = new Set(markers.map((m) => m.id))
    deploymentMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        deploymentMarkersRef.current.delete(id)
      }
    })

    // Add new markers
    markers.forEach((markerData) => {
      if (!deploymentMarkersRef.current.has(markerData.id)) {
        const el = createDeploymentMarkerEl(markerData)
        const mapMarker = new Marker({ element: el, anchor: 'center' })
          .setLngLat([markerData.lon, markerData.lat] as LngLatLike)
          .setPopup(
            new Popup({ offset: 25 }).setHTML(
              `<div class="marker-popup">
                <strong>${markerData.label}</strong>
                ${markerData.pokemonName ? `<br/><span>Pokémon: ${markerData.pokemonName}</span>` : ''}
                ${markerData.competitor ? `<br/><span>Trainer: ${markerData.competitor.trainerName}</span>` : ''}
              </div>`,
            ),
          )
          .addTo(map)
        deploymentMarkersRef.current.set(markerData.id, mapMarker)
      }
    })
  }, [markers, mapReady])

  // ------------------------------------------------------------------
  // Keyboard: fly-to-world-view on Escape
  // ------------------------------------------------------------------
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && mapRef.current) {
      mapRef.current.flyTo({
        center: [DEFAULT_VIEWPORT.lon, DEFAULT_VIEWPORT.lat] as LngLatLike,
        zoom: DEFAULT_VIEWPORT.zoom,
        duration: 1000,
      })
    }
  }, [])

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div
      className={`relative w-full h-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
        aria-label="Interactive world map. Click to select a location. Use arrow keys and +/- to navigate."
        role="application"
        tabIndex={0}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {(isLoading || (!mapReady && !mapError)) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 rounded-xl z-10"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
                <MapPin className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-slate-300 text-sm font-medium animate-pulse">Loading world map…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 rounded-xl z-10">
          <div className="flex flex-col items-center gap-3 max-w-xs text-center p-6">
            <Target className="h-10 w-10 text-red-400" />
            <p className="text-slate-200 font-semibold">Map Unavailable</p>
            <p className="text-slate-400 text-sm">{mapError}</p>
            <button
              className="btn-secondary mt-2"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hint (shown briefly) */}
      {mapReady && (
        <div className="absolute bottom-24 left-3 z-10 pointer-events-none">
          <div className="text-xs text-slate-400 bg-slate-900/70 backdrop-blur-sm px-2 py-1 rounded-md">
            Click map to select · Esc to reset view
          </div>
        </div>
      )}

      {/* Loading indicator for reverse geocoding */}
      {isLoading && mapReady && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-slate-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>Looking up location…</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// WorldMap Page
// src/pages/WorldMapPage.tsx
// ============================================================
// Full-page interactive world map experience for PokéVerse.
//
// Layout:
//   • Map fills the entire viewport (central visual experience)
//   • Floating search bar at the top
//   • Slide-in location panel on the right
//   • Optional geolocation controls bottom-left
//   • Status bar at top-right

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Navigation, Wifi, WifiOff, MapPin,
  ChevronDown, Info, Loader2, AlertTriangle,
} from 'lucide-react'
import { WorldMap } from '@/components/map/WorldMap'
import { SearchBar } from '@/components/map/SearchBar'
import { LocationPanel } from '@/components/map/LocationPanel'
import { useMapLocation } from '@/hooks/useMapLocation'
import { useReverseGeocode } from '@/hooks/useGeocoding'
import { useIpGeolocation, useBrowserGeolocation } from '@/hooks/useGeolocation'
import type { GeocodingResult, LocationDeploymentPayload, MapMarker } from '@/types'

// ------------------------------------------------------------------
// Demo markers (will be replaced by real simulation data in Phase 4)
// Clearly labelled as demo/simulated — not real locations.
// ------------------------------------------------------------------
const DEMO_MARKERS: MapMarker[] = [
  {
    id: 'demo-1',
    lat: 35.6762,
    lon: 139.6503,
    markerType: 'deployment',
    label: 'Tokyo Deployment',
    pokemonName: 'Pikachu',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    lat: 48.8566,
    lon: 2.3522,
    markerType: 'simulation-win',
    label: 'Paris Battle Won',
    pokemonName: 'Charizard',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    competitor: { id: 'c1', trainerName: 'Trainer Red', rating: 1850 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    lat: -23.5505,
    lon: -46.6333,
    markerType: 'competitor',
    label: 'São Paulo Competitor',
    competitor: { id: 'c2', trainerName: 'Trainer Blue', rating: 1720 },
    createdAt: new Date().toISOString(),
  },
]

// ------------------------------------------------------------------
// IP location status indicator
// ------------------------------------------------------------------
function IpLocationBadge({
  city,
  country,
  isLoading,
  isError,
}: {
  city: string | null
  country: string | null
  isLoading: boolean
  isError: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Locating…</span>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <WifiOff className="h-3 w-3" />
        <span>Location unavailable</span>
      </div>
    )
  }
  const label = [city, country].filter(Boolean).join(', ')
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <Wifi className="h-3 w-3 text-green-400" />
      <span>{label || 'IP location found'}</span>
    </div>
  )
}

// ------------------------------------------------------------------
// Pending deployment state
// ------------------------------------------------------------------
interface PendingDeployment extends LocationDeploymentPayload {
  id: string
}

// ------------------------------------------------------------------
// Page component
// ------------------------------------------------------------------
export function WorldMapPage() {
  const {
    selectedLocation,
    selectFromSearch,
    selectFromMapClick,
    selectFromIp,
    selectFromBrowser,
    clearLocation,
  } = useMapLocation()

  // Reverse-geocode when user clicks the map
  const [pendingClickCoords, setPendingClickCoords] = useState<{ lat: number; lon: number } | null>(null)
  const { data: reverseResult, isFetching: isReverseGeocoding } = useReverseGeocode(
    pendingClickCoords?.lat ?? null,
    pendingClickCoords?.lon ?? null,
    pendingClickCoords !== null,
  )

  // When reverse geocoding completes, set the location
  const [lastProcessedClick, setLastProcessedClick] = useState<string | null>(null)
  if (
    pendingClickCoords !== null &&
    !isReverseGeocoding &&
    reverseResult
  ) {
    const clickKey = `${pendingClickCoords.lat},${pendingClickCoords.lon}`
    if (clickKey !== lastProcessedClick) {
      setLastProcessedClick(clickKey)
      selectFromMapClick(pendingClickCoords.lat, pendingClickCoords.lon, reverseResult)
    }
  }

  // IP geolocation (optional, works on HTTP only)
  const {
    data: ipData,
    isLoading: ipLoading,
    isError: ipError,
  } = useIpGeolocation()

  // Browser geolocation
  const {
    position: browserPosition,
    error: browserGeoError,
    isLoading: browserGeoLoading,
    requestLocation: requestBrowserLocation,
  } = useBrowserGeolocation()

  // Deployments (local state for demo — Phase 4 will use shared simulation state)
  const [deployments, setDeployments] = useState<PendingDeployment[]>([])
  const [deploySuccess, setDeploySuccess] = useState(false)

  // Show info panel
  const [showInfo, setShowInfo] = useState(false)

  // Combined markers: demo + active deployments
  const allMarkers: MapMarker[] = [
    ...DEMO_MARKERS,
    ...deployments.map<MapMarker>((d) => ({
      id: d.id,
      lat: d.location.lat,
      lon: d.location.lon,
      markerType: 'deployment' as const,
      label: d.location.city ?? d.location.label,
      createdAt: d.deployedAt,
    })),
  ]

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const handleSearchSelect = useCallback(
    (result: GeocodingResult) => {
      selectFromSearch(result)
    },
    [selectFromSearch],
  )

  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      setPendingClickCoords({ lat, lon })
      // Optimistically set the location immediately
      selectFromMapClick(lat, lon)
    },
    [selectFromMapClick],
  )

  const handleGoToMyIpLocation = useCallback(() => {
    if (ipData && ipData.lat !== null && ipData.lon !== null) {
      selectFromIp(ipData)
    }
  }, [ipData, selectFromIp])

  const handleBrowserGps = useCallback(async () => {
    await requestBrowserLocation()
    if (browserPosition) {
      selectFromBrowser(browserPosition.lat, browserPosition.lon)
    }
  }, [requestBrowserLocation, browserPosition, selectFromBrowser])

  // Update location when browser GPS comes in
  if (browserPosition && selectedLocation?.source !== 'browser') {
    // No-op: let the button explicitly trigger it
  }

  const handleDeploy = useCallback(
    (payload: LocationDeploymentPayload) => {
      const id = `deploy-${Date.now()}`
      setDeployments((prev) => [...prev, { ...payload, id }])
      setDeploySuccess(true)
      setTimeout(() => setDeploySuccess(false), 3000)
    },
    [],
  )

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden flex flex-col">
      {/* ── Top navigation bar ── */}
      <div className="relative z-30 flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-sm tracking-wide">PokéVerse</span>
            <span className="ml-2 text-xs text-slate-400 font-medium uppercase tracking-wider">World Map</span>
          </div>
        </div>

        {/* IP location info + controls */}
        <div className="flex items-center gap-3">
          <IpLocationBadge
            city={ipData?.city ?? null}
            country={ipData?.country ?? null}
            isLoading={ipLoading}
            isError={ipError}
          />
          <button
            id="info-toggle-btn"
            aria-label="Toggle map info"
            onClick={() => setShowInfo((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Map fills remaining space ── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map layer */}
        <WorldMap
          selectedLocation={selectedLocation}
          markers={allMarkers}
          onMapClick={handleMapClick}
          isLoading={isReverseGeocoding}
          className="absolute inset-0"
        />

        {/* ── Floating search bar (top-center) ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4">
          <SearchBar
            onLocationSelected={handleSearchSelect}
            placeholder="Search for a country, city, or region…"
          />
        </div>

        {/* ── Location panel (right side) ── */}
        <div className="absolute top-20 right-4 z-20 w-72">
          <AnimatePresence>
            {selectedLocation && (
              <LocationPanel
                key="location-panel"
                location={selectedLocation}
                isReverseGeocoding={isReverseGeocoding}
                onDeploy={handleDeploy}
                onClear={clearLocation}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Deploy success toast ── */}
        <AnimatePresence>
          {deploySuccess && (
            <motion.div
              key="deploy-toast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-green-600/90 backdrop-blur-sm rounded-xl text-white text-sm font-medium shadow-xl">
                <MapPin className="h-4 w-4" />
                Pokémon deployed! (Simulation only — not a real location)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Geolocation controls (bottom-left floating) ── */}
        <div className="absolute bottom-10 left-4 z-20 flex flex-col gap-2">
          {/* IP location jump */}
          {ipData && ipData.lat !== null && (
            <button
              id="goto-ip-location-btn"
              aria-label="Go to my approximate IP location"
              onClick={handleGoToMyIpLocation}
              title="Jump to approximate IP location"
              className="
                flex items-center gap-2 px-3 py-2
                bg-slate-800/90 backdrop-blur-sm
                border border-slate-700/60
                rounded-xl text-sm text-slate-300
                hover:text-slate-100 hover:border-slate-600
                transition-all duration-150 shadow-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
            >
              <Wifi className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs">My IP Location</span>
              <span className="text-xs text-slate-500">(approx.)</span>
            </button>
          )}

          {/* Browser GPS */}
          <button
            id="request-gps-btn"
            aria-label="Request precise GPS location"
            onClick={handleBrowserGps}
            disabled={browserGeoLoading}
            title="Request browser GPS location"
            className="
              flex items-center gap-2 px-3 py-2
              bg-slate-800/90 backdrop-blur-sm
              border border-slate-700/60
              rounded-xl text-sm text-slate-300
              hover:text-slate-100 hover:border-slate-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150 shadow-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
          >
            {browserGeoLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-indigo-400" />
            )}
            <span className="text-xs">Use GPS</span>
          </button>

          {/* GPS error */}
          {browserGeoError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 rounded-lg text-xs text-red-300 max-w-48"
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span className="leading-tight">GPS unavailable. App continues normally.</span>
            </motion.div>
          )}
        </div>

        {/* ── Info overlay ── */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              key="info-overlay"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 right-4 z-30 w-72"
            >
              <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-200">Map Info</h4>
                  <button
                    aria-label="Close info"
                    onClick={() => setShowInfo(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                  <p>
                    <span className="text-slate-300 font-medium">Map tiles:</span>{' '}
                    MapLibre GL JS ·{' '}
                    <a href="https://maplibre.org" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">BSD license</a>
                  </p>
                  <p>
                    <span className="text-slate-300 font-medium">Map data:</span>{' '}
                    © <a href="https://www.openstreetmap.org/copyright" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>
                  </p>
                  <p>
                    <span className="text-slate-300 font-medium">Geocoding:</span>{' '}
                    <a href="https://nominatim.openstreetmap.org" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">Nominatim</a> · OSM · Free (max 1 req/s)
                  </p>
                  <p>
                    <span className="text-slate-300 font-medium">IP location:</span>{' '}
                    ip-api.com · Approximate only · HTTP dev only
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-slate-500 italic">
                    ⚠ Pokémon markers are simulated. They do not exist at real locations.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

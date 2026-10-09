// ============================================================
// LocationPanel Component
// src/components/map/LocationPanel.tsx
// ============================================================
// Slide-in panel showing details about the selected location,
// environmental context (timezone, region), and deployment action.

import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Globe, Clock, Compass, Navigation,
  Crosshair, X, Zap, AlertTriangle, CheckCircle,
} from 'lucide-react'
import type { MapLocation, LocationDeploymentPayload } from '@/types'

// ------------------------------------------------------------------
// Props
// ------------------------------------------------------------------
interface LocationPanelProps {
  location: MapLocation | null
  isReverseGeocoding?: boolean
  onDeploy?: (payload: LocationDeploymentPayload) => void
  onClear?: () => void
  className?: string
}

// ------------------------------------------------------------------
// Source badge
// ------------------------------------------------------------------
function SourceBadge({ source }: { source: MapLocation['source'] }) {
  const config: Record<MapLocation['source'], { label: string; icon: React.ReactNode; color: string }> = {
    search: {
      label: 'Search Result',
      icon: <Compass className="h-3 w-3" />,
      color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
    },
    'map-click': {
      label: 'Map Selection',
      icon: <Crosshair className="h-3 w-3" />,
      color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
    },
    ip: {
      label: 'Approx. IP Location',
      icon: <Globe className="h-3 w-3" />,
      color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    },
    browser: {
      label: 'GPS Location',
      icon: <Navigation className="h-3 w-3" />,
      color: 'text-green-400 bg-green-500/15 border-green-500/30',
    },
    none: {
      label: 'No Source',
      icon: null,
      color: 'text-slate-400 bg-slate-700/40 border-slate-600/30',
    },
  }

  const { label, icon, color } = config[source]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  )
}

// ------------------------------------------------------------------
// Info row
// ------------------------------------------------------------------
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-slate-500 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 leading-none mb-0.5">{label}</p>
        <p className="text-sm text-slate-200 break-words leading-snug">{value}</p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export function LocationPanel({
  location,
  isReverseGeocoding = false,
  onDeploy,
  onClear,
  className = '',
}: LocationPanelProps) {
  if (!location) return null

  const coords = `${location.lat.toFixed(5)}°, ${location.lon.toFixed(5)}°`
  const isValidCoords = location.validatedLat && location.validatedLon

  const timezone = location.geocodingResult
    ? null  // no timezone in geocoding results; shown from IP if available
    : null

  const handleDeploy = () => {
    if (!onDeploy || !location) return
    const payload: LocationDeploymentPayload = {
      location,
      deployedAt: new Date().toISOString(),
    }
    onDeploy(payload)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="location-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`
          bg-slate-800/95 backdrop-blur-md
          border border-slate-700/60
          rounded-xl shadow-2xl shadow-black/40
          flex flex-col overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 leading-tight truncate">
                {location.city ?? location.geocodingResult?.shortName ?? 'Selected Location'}
              </h3>
              {isReverseGeocoding && (
                <p className="text-xs text-slate-400 animate-pulse mt-0.5">Looking up details…</p>
              )}
            </div>
          </div>
          {onClear && (
            <button
              aria-label="Clear selected location"
              onClick={onClear}
              className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {/* Source badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <SourceBadge source={location.source} />
            {location.isPrecise ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium text-green-400 bg-green-500/15 border-green-500/30">
                <CheckCircle className="h-3 w-3" />
                Precise GPS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium text-amber-400 bg-amber-500/15 border-amber-500/30">
                <AlertTriangle className="h-3 w-3" />
                Approximate
              </span>
            )}
          </div>

          {/* Coordinate validity warning */}
          {!isValidCoords && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Coordinates out of valid range</span>
            </div>
          )}

          {/* Location details */}
          <div className="space-y-2.5">
            <InfoRow
              icon={<Crosshair className="h-3.5 w-3.5" />}
              label="Coordinates"
              value={coords}
            />
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="City"
              value={location.city}
            />
            <InfoRow
              icon={<Compass className="h-3.5 w-3.5" />}
              label="Region"
              value={location.region}
            />
            <InfoRow
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Country"
              value={
                location.country
                  ? `${location.country}${location.countryCode ? ` (${location.countryCode})` : ''}`
                  : null
              }
            />
            {timezone && (
              <InfoRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Timezone"
                value={timezone}
              />
            )}
          </div>

          {/* Full display name */}
          {location.geocodingResult?.displayName && (
            <div className="pt-1 border-t border-slate-700/40">
              <p className="text-xs text-slate-500 mb-0.5">Full address</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {location.geocodingResult.displayName}
              </p>
            </div>
          )}

          {/* IP location disclaimer */}
          {location.source === 'ip' && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>Approximate IP-based location. Accuracy typically within 50km.</span>
            </div>
          )}

          {/* Simulation disclaimer */}
          <div className="text-xs text-slate-600 italic">
            Pokémon shown here are simulated. They do not exist at real-world locations.
          </div>
        </div>

        {/* Deploy action */}
        {onDeploy && isValidCoords && (
          <div className="p-3 border-t border-slate-700/50">
            <button
              id="deploy-pokemon-btn"
              onClick={handleDeploy}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-xl
                bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                text-white text-sm font-semibold
                transition-all duration-150
                shadow-lg shadow-indigo-900/40
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800
              "
            >
              <Zap className="h-4 w-4" />
              Deploy Pokémon Here
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

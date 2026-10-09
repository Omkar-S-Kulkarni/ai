// ============================================================
// Offline & Degraded Banner Component
// src/reliability/components/OfflineBanner.tsx
// ============================================================

import React, { useState } from 'react'
import { WifiOff, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { useConnectivity } from '../hooks/useConnectivity'

export const OfflineBanner: React.FC = () => {
  const { isOffline, isDegraded, recheck } = useConnectivity()
  const [dismissed, setDismissed] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  if ((!isOffline && !isDegraded) || dismissed) {
    return null
  }

  const handleRetry = async () => {
    setIsChecking(true)
    try {
      await recheck()
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <aside
      aria-label="Network status notification"
      className={`w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium backdrop-blur-md border-b transition-colors ${
        isOffline
          ? 'bg-amber-950/90 text-amber-200 border-amber-800/80'
          : 'bg-indigo-950/90 text-indigo-200 border-indigo-800/80'
      }`}
    >
      <div className="flex items-center gap-2.5 max-w-4xl mx-auto flex-1">
        {isOffline ? (
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0" />
        )}
        <p className="leading-snug">
          {isOffline ? (
            <span>
              <strong>Offline Mode Active:</strong> You are browsing using locally cached PokéVerse data.
              Some uncached information and live simulations require an internet connection.
            </span>
          ) : (
            <span>
              <strong>Degraded Network:</strong> Connecting to data providers is taking longer than usual.
              Serving cached data where available.
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-white border border-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking…' : 'Reconnect'}</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-black/30 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss offline banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  )
}

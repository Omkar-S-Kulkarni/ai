// ============================================================
// Data Freshness Badge Component
// src/reliability/components/DataFreshnessBadge.tsx
// ============================================================

import React from 'react'
import { Wifi, Database, Clock, CloudOff } from 'lucide-react'
import type { DataSource, DataFreshness } from '../types'

export interface DataFreshnessBadgeProps {
  source: DataSource
  freshness?: DataFreshness
  fetchedAt?: number | null
  isRevalidating?: boolean
  className?: string
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  source,
  freshness = 'fresh',
  fetchedAt,
  isRevalidating = false,
  className = '',
}) => {
  const timeAgo = fetchedAt ? formatTimeAgo(fetchedAt) : null

  if (source === 'live') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
        title={`Live data fetched ${timeAgo ? `(${timeAgo})` : 'just now'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <Wifi className="w-3 h-3" />
        <span>Live</span>
      </div>
    )
  }

  if (source === 'cache') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 ${className}`}
        title={`Cached data ${timeAgo ? `(saved ${timeAgo})` : ''}`}
      >
        <Database className="w-3 h-3 text-indigo-400" />
        <span>Cached {timeAgo && `• ${timeAgo}`}</span>
      </div>
    )
  }

  if (source === 'stale-cache') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 ${className}`}
        title={isRevalidating ? 'Updating in background…' : `Saved data ${timeAgo ? `(${timeAgo})` : ''}`}
      >
        {isRevalidating ? (
          <Clock className="w-3 h-3 text-amber-400 animate-spin" />
        ) : (
          <Clock className="w-3 h-3 text-amber-400" />
        )}
        <span>{isRevalidating ? 'Revalidating…' : `Offline Cache • ${timeAgo || 'Stale'}`}</span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 ${className}`}
      title="Offline fallback mode"
    >
      <CloudOff className="w-3 h-3" />
      <span>{freshness === 'offline-only' ? 'Offline' : 'Fallback'}</span>
    </div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

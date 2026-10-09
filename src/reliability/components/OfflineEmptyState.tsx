// ============================================================
// Offline Empty State Component
// src/reliability/components/OfflineEmptyState.tsx
// ============================================================

import React from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'

export interface OfflineEmptyStateProps {
  title?: string
  message?: string
  resourceName?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

export const OfflineEmptyState: React.FC<OfflineEmptyStateProps> = ({
  title = 'Content Not Cached',
  message,
  resourceName = 'this content',
  onRetry,
  isRetrying = false,
  className = '',
}) => {
  const defaultMessage = `You are currently offline, and ${resourceName} has not been saved locally yet. Reconnect to the internet to fetch and cache it.`

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <CloudOff className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-slate-200 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
        {message || defaultMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Attempting Connection…' : 'Try Reconnecting'}</span>
        </button>
      )}
    </div>
  )
}

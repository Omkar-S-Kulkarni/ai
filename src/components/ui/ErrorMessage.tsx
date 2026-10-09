// ============================================================
// ErrorMessage Component
// src/components/ui/ErrorMessage.tsx
// ============================================================

import { AlertCircle } from 'lucide-react'
import { extractErrorMessage } from '@/utils'

interface ErrorMessageProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const message = extractErrorMessage(error)

  return (
    <div className="flex flex-col items-center gap-4 p-6 card text-center max-w-md mx-auto">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <div>
        <p className="font-semibold text-slate-200 mb-1">Something went wrong</p>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  )
}

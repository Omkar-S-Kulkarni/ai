// ============================================================
// PokemonDetailModal Component
// src/components/pokemon/PokemonDetailModal.tsx
// ============================================================

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, ExternalLink } from 'lucide-react'
import { PokemonDetail } from './PokemonDetail'
import type { PokemonSummary } from '@/types'

interface PokemonDetailModalProps {
  pokemon: PokemonSummary | null
  onClose: () => void
}

export function PokemonDetailModal({ pokemon, onClose }: PokemonDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!pokemon) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 shadow-2xl rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <Link
            to={`/pokemon/${pokemon.id}`}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Open Dedicated Profile Page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inner Pokémon Profile */}
        <PokemonDetail nameOrId={pokemon.id} onClose={onClose} />
      </div>
    </div>
  )
}

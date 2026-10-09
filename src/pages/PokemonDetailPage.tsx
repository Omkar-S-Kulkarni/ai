// ============================================================
// PokemonDetailPage
// src/pages/PokemonDetailPage.tsx
// ============================================================

import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { PokemonDetail } from '@/components/pokemon'
import { formatPokedexNumber } from '@/utils'

export function PokemonDetailPage() {
  const { nameOrId } = useParams<{ nameOrId: string }>()
  const navigate = useNavigate()

  if (!nameOrId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 mb-4">No Pokémon specified.</p>
        <Link to="/" className="btn-primary">
          Return to Pokédex
        </Link>
      </div>
    )
  }

  const currentId = Number(nameOrId)
  const hasNumericId = !isNaN(currentId) && currentId > 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Quick Prev / Next Navigator (for numeric IDs) */}
        {hasNumericId && (
          <div className="flex items-center gap-2">
            {currentId > 1 && (
              <Link
                to={`/pokemon/${currentId - 1}`}
                className="btn-secondary text-xs flex items-center gap-1 px-3 py-2"
                title={`Previous #${currentId - 1}`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{formatPokedexNumber(currentId - 1)}</span>
              </Link>
            )}

            <Link
              to={`/pokemon/${currentId + 1}`}
              className="btn-secondary text-xs flex items-center gap-1 px-3 py-2"
              title={`Next #${currentId + 1}`}
            >
              <span>{formatPokedexNumber(currentId + 1)}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Main Detail Body */}
      <PokemonDetail nameOrId={nameOrId} />
    </div>
  )
}

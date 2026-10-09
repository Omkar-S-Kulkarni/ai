// ============================================================
// PokémonCard Component
// src/components/pokemon/PokemonCard.tsx
// ============================================================

import { formatPokedexNumber } from '@/utils'
import type { PokemonSummary } from '@/types'

interface PokemonCardProps {
  pokemon: PokemonSummary
  isSelected?: boolean
  onClick?: (pokemon: PokemonSummary) => void
}

export function PokemonCard({ pokemon, isSelected, onClick }: PokemonCardProps) {
  return (
    <button
      onClick={() => onClick?.(pokemon)}
      className={`
        card p-3 text-left w-full transition-all duration-200 group
        hover:border-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg
        ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <img
          src={pokemon.spriteUrl}
          alt={pokemon.name}
          className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-200"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget
            img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`
            img.onerror = null
          }}
        />
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-mono">{formatPokedexNumber(pokemon.id)}</p>
          <p className="text-sm font-semibold text-slate-200 capitalize truncate">{pokemon.name}</p>
        </div>
      </div>
    </button>
  )
}

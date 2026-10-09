// ============================================================
// PokemonCard Component
// src/components/pokemon/PokemonCard.tsx
// ============================================================

import { Link } from 'react-router-dom'
import { Heart, Scale, Eye, Check } from 'lucide-react'
import { TypeBadge } from '@/components/ui'
import { formatPokedexNumber, toDisplayName } from '@/utils'
import { usePokemonContext } from '@/context/PokemonContext'
import { usePokemon } from '@/hooks/usePokemon'
import type { PokemonSummary } from '@/types'

interface PokemonCardProps {
  pokemon: PokemonSummary
  isSelected?: boolean
  onClick?: (pokemon: PokemonSummary) => void
  onQuickView?: (pokemon: PokemonSummary) => void
  viewMode?: 'grid' | 'compact'
}

export function PokemonCard({
  pokemon,
  onQuickView,
  viewMode = 'grid',
}: PokemonCardProps) {
  const {
    isPokemonSelected,
    toggleSelect,
    isFavorite,
    toggleFavorite,
    addRecentlyViewed,
  } = usePokemonContext()

  // Pre-fetch details (for types and official artwork if needed, auto-cached)
  const { data: details } = usePokemon(pokemon.id)

  const selected = isPokemonSelected(pokemon.id)
  const favorited = isFavorite(pokemon.id)

  const primaryType = details?.types[0]?.name || 'normal'
  const artwork =
    details?.sprites.officialArtwork ||
    details?.sprites.frontDefault ||
    pokemon.spriteUrl ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`

  const handleCardClick = () => {
    addRecentlyViewed(pokemon.id)
  }

  // -------------------------------------------------------------
  // Compact View Layout
  // -------------------------------------------------------------
  if (viewMode === 'compact') {
    return (
      <div
        className={`
          flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 group
          ${
            selected
              ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
          }
        `}
      >
        <Link
          to={`/pokemon/${pokemon.id}`}
          onClick={handleCardClick}
          className="flex items-center gap-3 min-w-0 flex-1"
        >
          <img
            src={artwork}
            alt={pokemon.name}
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
            }}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">
                {formatPokedexNumber(pokemon.id)}
              </span>
              <span className="text-sm font-bold text-slate-200 capitalize truncate">
                {toDisplayName(pokemon.name)}
              </span>
            </div>
            <div className="flex gap-1 mt-0.5">
              {details?.types.map((t) => (
                <TypeBadge key={t.slot} type={t.name} size="sm" />
              ))}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {onQuickView && (
            <button
              onClick={() => onQuickView(pokemon)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Quick preview"
              aria-label={`Quick view ${pokemon.name}`}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => toggleFavorite(pokemon.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              favorited
                ? 'text-rose-400 hover:text-rose-300 bg-rose-950/30'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={`Favorite ${pokemon.name}`}
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-rose-400' : ''}`} />
          </button>

          <button
            onClick={() => toggleSelect(pokemon)}
            className={`p-1.5 rounded-lg transition-colors ${
              selected
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
            }`}
            title={selected ? 'Remove from comparison' : 'Add to comparison'}
            aria-label={`Select ${pokemon.name} for comparison`}
          >
            {selected ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
          </button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // Grid View Layout (Rich Card)
  // -------------------------------------------------------------
  return (
    <div
      className={`
        group relative flex flex-col justify-between rounded-2xl border transition-all duration-300 overflow-hidden
        hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/40
        ${
          selected
            ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl'
            : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
        }
      `}
    >
      {/* Type-based Subtle Gradient Banner */}
      <div
        className={`absolute top-0 inset-x-0 h-28 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-b from-${primaryType} to-transparent pointer-events-none`}
      />

      {/* Card Header: Pokédex # and Actions */}
      <div className="relative z-10 flex items-center justify-between p-3.5 pb-0">
        <span className="text-xs font-mono font-bold text-slate-400/90 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
          {formatPokedexNumber(pokemon.id)}
        </span>

        <div className="flex items-center gap-1">
          {onQuickView && (
            <button
              onClick={() => onQuickView(pokemon)}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/90 rounded-lg transition-colors"
              title="Quick view details"
              aria-label={`Quick view ${pokemon.name}`}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => toggleFavorite(pokemon.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              favorited
                ? 'text-rose-400 bg-rose-950/40'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/90'
            }`}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={`Favorite ${pokemon.name}`}
          >
            <Heart className={`h-3.5 w-3.5 ${favorited ? 'fill-rose-400' : ''}`} />
          </button>

          <button
            onClick={() => toggleSelect(pokemon)}
            className={`p-1.5 rounded-lg transition-colors ${
              selected
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/90'
            }`}
            title={selected ? 'Remove from comparison' : 'Add to comparison'}
            aria-label={`Select ${pokemon.name} for comparison`}
          >
            {selected ? <Check className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Center: Sprite & Artwork */}
      <Link
        to={`/pokemon/${pokemon.id}`}
        onClick={handleCardClick}
        className="relative z-10 flex flex-col items-center p-4 text-center group-hover:scale-105 transition-transform duration-300"
      >
        <div className="relative w-28 h-28 flex items-center justify-center my-1">
          <img
            src={artwork}
            alt={pokemon.name}
            className="w-full h-full object-contain drop-shadow-md group-hover:drop-shadow-xl transition-all duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
            }}
          />
        </div>

        <h3 className="text-base font-bold text-slate-100 capitalize mt-2 group-hover:text-indigo-300 transition-colors">
          {toDisplayName(pokemon.name)}
        </h3>

        {/* Type Badges */}
        <div className="flex gap-1.5 mt-2 justify-center flex-wrap">
          {details?.types ? (
            details.types.map((t) => (
              <TypeBadge key={t.slot} type={t.name} size="sm" />
            ))
          ) : (
            <div className="h-5 w-12 bg-slate-800 rounded animate-pulse" />
          )}
        </div>
      </Link>

      {/* Card Footer: Quick Stats Preview */}
      <div className="relative z-10 px-3.5 py-2.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div>
          {details ? (
            <span>
              BST: <strong className="text-slate-200">{details.stats.reduce((a, b) => a + b.baseStat, 0)}</strong>
            </span>
          ) : (
            <span className="text-slate-600">Loading stats...</span>
          )}
        </div>

        <Link
          to={`/pokemon/${pokemon.id}`}
          onClick={handleCardClick}
          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
        >
          Profile →
        </Link>
      </div>
    </div>
  )
}

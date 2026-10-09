// ============================================================
// FavoritesPage
// src/pages/FavoritesPage.tsx
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, History, Trash2, Scale } from 'lucide-react'
import { usePokemonContext } from '@/context/PokemonContext'
import { useMultiplePokemon } from '@/hooks/usePokemon'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { PokemonCardSkeleton } from '@/components/pokemon/PokemonCardSkeleton'
import { PokemonDetailModal } from '@/components/pokemon/PokemonDetailModal'
import { ErrorMessage } from '@/components/ui'
import type { PokemonSummary } from '@/types'

export function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent'>('favorites')
  const [quickViewPokemon, setQuickViewPokemon] = useState<PokemonSummary | null>(null)

  const {
    favorites,
    clearFavorites,
    recentViewed,
    clearRecentlyViewed,
    selectAll,
  } = usePokemonContext()

  const currentIds = activeTab === 'favorites' ? favorites : recentViewed

  const {
    data: pokemonList,
    isLoading,
    error,
    refetch,
  } = useMultiplePokemon(currentIds)

  const summaries: PokemonSummary[] =
    pokemonList?.map((p) => ({
      id: p.id,
      name: p.name,
      url: `https://pokeapi.co/api/v2/pokemon/${p.id}/`,
      spriteUrl:
        p.sprites.officialArtwork ||
        p.sprites.frontDefault ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
    })) || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
            Favorites & Activity
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your favorited Pokémon and review your recently inspected species.
          </p>
        </div>

        {summaries.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAll(summaries)}
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="Add first 4 to comparison tray"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Select For Comparison</span>
            </button>

            <button
              onClick={activeTab === 'favorites' ? clearFavorites : clearRecentlyViewed}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 rounded-xl transition-colors text-xs flex items-center gap-1"
              title={`Clear all ${activeTab}`}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear List</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'favorites'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Heart className="h-3.5 w-3.5" />
          <span>Favorited Pokémon ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'recent'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Recently Viewed ({recentViewed.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <PokemonCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {error && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {!isLoading && currentIds.length === 0 && (
        <div className="card p-12 text-center max-w-md mx-auto space-y-4 bg-slate-900/80 border-slate-800">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            {activeTab === 'favorites' ? (
              <Heart className="h-7 w-7 text-rose-500" />
            ) : (
              <History className="h-7 w-7 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {activeTab === 'favorites' ? 'No Favorites Yet' : 'No Recent Activity'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'favorites'
                ? 'Explore the Pokédex and click the heart icon to save your favorite Pokémon.'
                : 'Inspecting Pokémon profiles will automatically add them to your history.'}
            </p>
          </div>
          <Link to="/" className="btn-primary text-xs mx-auto">
            Explore Pokédex
          </Link>
        </div>
      )}

      {!isLoading && summaries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {summaries.map((pokemon) => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              onQuickView={setQuickViewPokemon}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <PokemonDetailModal
        pokemon={quickViewPokemon}
        onClose={() => setQuickViewPokemon(null)}
      />
    </div>
  )
}

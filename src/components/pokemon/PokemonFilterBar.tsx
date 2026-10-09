// ============================================================
// PokemonFilterBar Component
// src/components/pokemon/PokemonFilterBar.tsx
// ============================================================

import { useState } from 'react'
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Heart,
  History,
  Grid3X3,
  LayoutList,
  Flame,
} from 'lucide-react'
import { TypeBadge } from '@/components/ui'

export type SortOption =
  | 'id-asc'
  | 'id-desc'
  | 'name-asc'
  | 'name-desc'
  | 'weight-asc'
  | 'weight-desc'
  | 'height-asc'
  | 'height-desc'

export interface FilterState {
  searchQuery: string
  selectedType: string
  selectedGeneration: string
  sortOption: SortOption
  onlyFavorites: boolean
  onlyRecent: boolean
  viewMode: 'grid' | 'compact'
}

interface PokemonFilterBarProps {
  filters: FilterState
  onFilterChange: (updater: (prev: FilterState) => FilterState) => void
  onReset: () => void
  typeList: { name: string; url: string }[]
  generationList: { name: string; url: string }[]
  totalCount: number
  filteredCount: number
  favoritesCount: number
  recentCount: number
}

export function PokemonFilterBar({
  filters,
  onFilterChange,
  onReset,
  typeList,
  generationList,
  totalCount,
  filteredCount,
  favoritesCount,
  recentCount,
}: PokemonFilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const isFiltered =
    Boolean(filters.searchQuery) ||
    filters.selectedType !== 'all' ||
    filters.selectedGeneration !== 'all' ||
    filters.onlyFavorites ||
    filters.onlyRecent ||
    filters.sortOption !== 'id-asc'

  return (
    <div className="space-y-4 mb-6">
      {/* Top Search & Quick Control Bar */}
      <div className="card p-3 sm:p-4 bg-slate-900/80 border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) =>
                onFilterChange((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              placeholder="Search by Pokémon name or Pokédex # (e.g. Lucario, 448)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() =>
                  onFilterChange((prev) => ({ ...prev, searchQuery: '' }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-md"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons & Sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Favorites Toggle */}
            <button
              onClick={() =>
                onFilterChange((prev) => ({
                  ...prev,
                  onlyFavorites: !prev.onlyFavorites,
                  onlyRecent: false,
                }))
              }
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${
                  filters.onlyFavorites
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-sm shadow-rose-900/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                }
              `}
              title="Show only favorited Pokémon"
            >
              <Heart
                className={`h-3.5 w-3.5 ${
                  filters.onlyFavorites ? 'text-rose-400 fill-rose-400' : 'text-slate-400'
                }`}
              />
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Recently Viewed Toggle */}
            <button
              onClick={() =>
                onFilterChange((prev) => ({
                  ...prev,
                  onlyRecent: !prev.onlyRecent,
                  onlyFavorites: false,
                }))
              }
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${
                  filters.onlyRecent
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-900/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                }
              `}
              title="Show recently viewed Pokémon"
            >
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span>Recent</span>
              {recentCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200 font-bold">
                  {recentCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={filters.sortOption}
              onChange={(e) =>
                onFilterChange((prev) => ({
                  ...prev,
                  sortOption: e.target.value as SortOption,
                }))
              }
              className="bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
              aria-label="Sort Pokémon"
            >
              <option value="id-asc">Pokédex # (Lowest)</option>
              <option value="id-desc">Pokédex # (Highest)</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="weight-desc">Weight (Heavy → Light)</option>
              <option value="weight-asc">Weight (Light → Heavy)</option>
              <option value="height-desc">Height (Tall → Short)</option>
              <option value="height-asc">Height (Short → Tall)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() =>
                  onFilterChange((prev) => ({ ...prev, viewMode: 'grid' }))
                }
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  filters.viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  onFilterChange((prev) => ({ ...prev, viewMode: 'compact' }))
                }
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  filters.viewMode === 'compact'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Compact view"
                aria-label="Compact view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
              aria-label="Open advanced filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Extended Filter Controls (Generations & Types) */}
        <div className={`mt-3 pt-3 border-t border-slate-800/80 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            {/* Generation Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Region:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                <button
                  onClick={() =>
                    onFilterChange((prev) => ({
                      ...prev,
                      selectedGeneration: 'all',
                    }))
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filters.selectedGeneration === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  All Generations
                </button>
                {generationList.map((gen, idx) => {
                  const genId = String(idx + 1)
                  const genNames = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea']
                  const regionName = genNames[idx] || `Gen ${genId}`
                  const isSelected = filters.selectedGeneration === genId
                  return (
                    <button
                      key={gen.name}
                      onClick={() =>
                        onFilterChange((prev) => ({
                          ...prev,
                          selectedGeneration: isSelected ? 'all' : genId,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Gen {genId} ({regionName})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Reset / Count stats */}
            <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
              <span className="text-xs text-slate-400">
                Showing <strong className="text-slate-200">{filteredCount}</strong> of {totalCount}
              </span>
              {isFiltered && (
                <button
                  onClick={onReset}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Type Filter Pills Carousel */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Flame className="h-3 w-3 text-orange-400" />
              Type:
            </span>
            <button
              onClick={() =>
                onFilterChange((prev) => ({ ...prev, selectedType: 'all' }))
              }
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
                filters.selectedType === 'all'
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            {typeList.map((t) => {
              const isSelected = filters.selectedType.toLowerCase() === t.name.toLowerCase()
              return (
                <button
                  key={t.name}
                  onClick={() =>
                    onFilterChange((prev) => ({
                      ...prev,
                      selectedType: isSelected ? 'all' : t.name,
                    }))
                  }
                  className={`shrink-0 transition-transform ${
                    isSelected
                      ? 'scale-105 ring-2 ring-indigo-400 rounded-md'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <TypeBadge type={t.name} size="sm" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

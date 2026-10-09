// ============================================================
// PokemonGrid Component
// src/components/pokemon/PokemonGrid.tsx
// ============================================================

import { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  SearchX,
  RefreshCw,
} from 'lucide-react'
import {
  usePokemonList,
  useTypeList,
  useGenerationList,
  usePokemonByType,
  usePokemonByGeneration,
} from '@/hooks/usePokemon'
import { usePokemonContext } from '@/context/PokemonContext'
import { PokemonCard } from './PokemonCard'
import { PokemonCardSkeleton } from './PokemonCardSkeleton'
import { PokemonFilterBar, type FilterState } from './PokemonFilterBar'
import { PokemonDetailModal } from './PokemonDetailModal'
import { ErrorMessage } from '@/components/ui'
import type { PokemonSummary } from '@/types'

const PAGE_SIZE = 24

const initialFilters: FilterState = {
  searchQuery: '',
  selectedType: 'all',
  selectedGeneration: 'all',
  sortOption: 'id-asc',
  onlyFavorites: false,
  onlyRecent: false,
  viewMode: 'grid',
}

export function PokemonGrid() {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [offset, setOffset] = useState(0)
  const [quickViewPokemon, setQuickViewPokemon] = useState<PokemonSummary | null>(null)

  const { favorites, recentViewed } = usePokemonContext()

  // Base paginated list query
  const {
    data: standardList,
    isLoading: loadingList,
    error: listError,
    refetch: refetchList,
    isFetching,
  } = usePokemonList(151 * 8, 0) // Fetch list of summaries (cached by React Query)

  // Types & Generations queries
  const { data: typeListData } = useTypeList()
  const { data: genListData } = useGenerationList()

  // Type-filtered list (when active)
  const {
    data: typePokemonList,
    isLoading: loadingType,
  } = usePokemonByType(filters.selectedType !== 'all' ? filters.selectedType : null)

  // Generation-filtered list (when active)
  const {
    data: genPokemonList,
    isLoading: loadingGen,
  } = usePokemonByGeneration(filters.selectedGeneration !== 'all' ? filters.selectedGeneration : null)

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters)
    setOffset(0)
  }, [])

  // -------------------------------------------------------------
  // Filter & Sort Pipeline
  // -------------------------------------------------------------
  const processedPokemon = useMemo(() => {
    let list: PokemonSummary[] = standardList?.results || []

    // 1. Generation filter
    if (filters.selectedGeneration !== 'all' && genPokemonList) {
      const genIds = new Set(genPokemonList.map((p) => p.id))
      list = list.filter((p) => genIds.has(p.id))
    }

    // 2. Type filter
    if (filters.selectedType !== 'all' && typePokemonList) {
      const typeIds = new Set(typePokemonList.map((p) => p.id))
      list = list.filter((p) => typeIds.has(p.id))
    }

    // 3. Favorites only filter
    if (filters.onlyFavorites) {
      const favSet = new Set(favorites)
      list = list.filter((p) => favSet.has(p.id))
    }

    // 4. Recently viewed only filter
    if (filters.onlyRecent) {
      const recentSet = new Set(recentViewed)
      list = list.filter((p) => recentSet.has(p.id))
    }

    // 5. Search query (name or ID)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase()
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || String(p.id) === q,
      )
    }

    // 6. Sorting
    const sorted = [...list]
    switch (filters.sortOption) {
      case 'id-asc':
        sorted.sort((a, b) => a.id - b.id)
        break
      case 'id-desc':
        sorted.sort((a, b) => b.id - a.id)
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      default:
        sorted.sort((a, b) => a.id - b.id)
    }

    return sorted
  }, [
    standardList,
    filters,
    typePokemonList,
    genPokemonList,
    favorites,
    recentViewed,
  ])

  // Pagination slicing
  const totalCount = standardList?.count || 1025
  const filteredCount = processedPokemon.length
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1
  const currentPage = Math.min(Math.floor(offset / PAGE_SIZE) + 1, totalPages)

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return processedPokemon.slice(start, start + PAGE_SIZE)
  }, [processedPokemon, currentPage])

  const isLoadingData =
    loadingList ||
    (filters.selectedType !== 'all' && loadingType) ||
    (filters.selectedGeneration !== 'all' && loadingGen)

  return (
    <div className="space-y-6">
      {/* Interactive Filter Bar */}
      <PokemonFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
        typeList={typeListData?.results || []}
        generationList={genListData?.results || []}
        totalCount={totalCount}
        filteredCount={filteredCount}
        favoritesCount={favorites.length}
        recentCount={recentViewed.length}
      />

      {/* Loading state indicator */}
      {isFetching && !isLoadingData && (
        <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse justify-end">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Updating data cache...</span>
        </div>
      )}

      {/* Error state */}
      {listError && (
        <ErrorMessage
          error={listError}
          onRetry={() => refetchList()}
        />
      )}

      {/* Loading Skeletons */}
      {isLoadingData && (
        <div
          className={
            filters.viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5'
          }
        >
          {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
            <PokemonCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingData && paginatedList.length === 0 && (
        <div className="card p-12 text-center max-w-md mx-auto space-y-4 bg-slate-900/80 border-slate-800">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            {filters.onlyFavorites ? (
              <AlertCircle className="h-7 w-7 text-rose-400" />
            ) : (
              <SearchX className="h-7 w-7 text-indigo-400" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {filters.onlyFavorites
                ? 'No Favorites Saved Yet'
                : filters.onlyRecent
                ? 'No Recently Viewed Pokémon'
                : 'No Pokémon Match Your Filters'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {filters.onlyFavorites
                ? 'Click the heart icon on any Pokémon card to save it to your favorites.'
                : 'Try adjusting your search query, type selection, or region filter.'}
            </p>
          </div>

          <button
            onClick={handleResetFilters}
            className="btn-primary text-xs mx-auto"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Populated Pokémon Grid / List */}
      {!isLoadingData && paginatedList.length > 0 && (
        <>
          <div
            className={
              filters.viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5'
            }
          >
            {paginatedList.map((pokemon) => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                viewMode={filters.viewMode}
                onQuickView={setQuickViewPokemon}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="card p-3 bg-slate-900/90 border-slate-800 flex items-center justify-between mt-8">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={currentPage === 1 || isFetching}
                className="btn-secondary text-xs flex items-center gap-1"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Page</span>
                <strong className="text-slate-100 font-mono text-sm">
                  {currentPage}
                </strong>
                <span>of</span>
                <strong className="text-slate-100 font-mono text-sm">
                  {totalPages}
                </strong>
              </div>

              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={currentPage >= totalPages || isFetching}
                className="btn-secondary text-xs flex items-center gap-1"
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Quick View Modal */}
      <PokemonDetailModal
        pokemon={quickViewPokemon}
        onClose={() => setQuickViewPokemon(null)}
      />
    </div>
  )
}

// ============================================================
// PokedexPage
// src/pages/PokedexPage.tsx
// ============================================================

import { Sparkles, Compass } from 'lucide-react'
import { PokemonGrid } from '@/components/pokemon'

export function PokedexPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            <Compass className="h-4 w-4" />
            <span>Pokémon World Database</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            PokéVerse Discovery
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Explore all 1,025+ canonical Pokémon species across all 9 regions. Filter by elemental type, generation, base stat parameters, and create competitive comparisons.
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2 self-start">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
              <span>PokéAPI Synchronized</span>
              <Sparkles className="h-3 w-3 text-amber-400" />
            </span>
            <span className="text-[10px] text-slate-500 font-mono">10-min live cache</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <PokemonGrid />
    </div>
  )
}

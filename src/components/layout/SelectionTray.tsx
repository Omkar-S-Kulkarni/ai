// ============================================================
// SelectionTray Component
// src/components/layout/SelectionTray.tsx
// ============================================================

import { Link } from 'react-router-dom'
import { Scale, X, Trash2, ArrowRight } from 'lucide-react'
import { usePokemonContext } from '@/context/PokemonContext'
import { formatPokedexNumber } from '@/utils'

export function SelectionTray() {
  const { selectedPokemon, removeSelected, clearSelection, maxSelected } = usePokemonContext()

  if (selectedPokemon.length === 0) return null

  const emptySlots = Array.from({ length: maxSelected - selectedPokemon.length })

  return (
    <aside
      aria-label="Pokémon comparison tray"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-slide-up"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/50 shadow-2xl shadow-indigo-950/80 rounded-2xl p-3 sm:p-4 text-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Header & Slots */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-indigo-400" />
                Comparison Tray
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedPokemon.length} of {maxSelected} selected
              </span>
            </div>

            {/* Selected Pokémon Slots */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial overflow-x-auto py-1">
              {selectedPokemon.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="relative group flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 pr-1.5 shrink-0"
                >
                  <img
                    src={pokemon.spriteUrl}
                    alt={pokemon.name}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-200 capitalize max-w-[70px] truncate leading-tight">
                      {pokemon.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono leading-none">
                      {formatPokedexNumber(pokemon.id)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSelected(pokemon.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-700/80 transition-colors"
                    title={`Remove ${pokemon.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Empty placeholder slots */}
              {emptySlots.map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl border border-dashed border-slate-700 text-slate-600 text-xs font-mono"
                  title="Empty slot"
                >
                  +
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={clearSelection}
              className="p-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Clear all selections"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <Link
              to="/compare"
              className="btn-primary text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <span>Compare</span>
              <span className="bg-indigo-700 px-1.5 py-0.2 text-[10px] rounded-md font-bold">
                {selectedPokemon.length}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </aside>
  )
}

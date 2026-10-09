// ============================================================
// PokemonStatVisualizer Component
// src/components/pokemon/PokemonStatVisualizer.tsx
// ============================================================

import { useMemo } from 'react'
import { Shield, Zap, Heart, Sword, FastForward, ShieldAlert } from 'lucide-react'
import type { PokemonStat } from '@/types'
import { formatStatName, getStatColor, statPercent, MAX_BASE_STAT } from '@/utils'

interface PokemonStatVisualizerProps {
  stats: PokemonStat[]
  showMinMax?: boolean
}

export function PokemonStatVisualizer({
  stats,
  showMinMax = true,
}: PokemonStatVisualizerProps) {
  const bst = useMemo(
    () => stats.reduce((acc, curr) => acc + curr.baseStat, 0),
    [stats],
  )

  const getStatIcon = (name: string) => {
    switch (name) {
      case 'hp':
        return <Heart className="h-3.5 w-3.5 text-rose-400" />
      case 'attack':
        return <Sword className="h-3.5 w-3.5 text-orange-400" />
      case 'defense':
        return <Shield className="h-3.5 w-3.5 text-blue-400" />
      case 'special-attack':
        return <Zap className="h-3.5 w-3.5 text-amber-400" />
      case 'special-defense':
        return <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
      case 'speed':
        return <FastForward className="h-3.5 w-3.5 text-cyan-400" />
      default:
        return null
    }
  }

  // Calculate standard Min/Max at Lv 100 (neutral nature, 0/252 EVs, 0/31 IVs)
  const calculateStatRange = (name: string, base: number) => {
    if (name === 'hp') {
      if (base === 1) return { min: 1, max: 1 } // Shedinja
      const min = Math.floor(((2 * base + 0 + 0) * 100) / 100) + 100 + 10
      const max = Math.floor(((2 * base + 31 + 63) * 100) / 100) + 100 + 10
      return { min, max }
    }
    const min = Math.floor((Math.floor(((2 * base + 0 + 0) * 100) / 100) + 5) * 0.9)
    const max = Math.floor((Math.floor(((2 * base + 31 + 63) * 100) / 100) + 5) * 1.1)
    return { min, max }
  }

  // Determine Tier rating based on BST
  const tierRating = useMemo(() => {
    if (bst >= 670) return { label: 'Uber / Legendary', color: 'text-purple-400 border-purple-500/40 bg-purple-950/40' }
    if (bst >= 580) return { label: 'Sub-Legendary / OU', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' }
    if (bst >= 500) return { label: 'High Tier (Tier 1)', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' }
    if (bst >= 420) return { label: 'Mid Tier (Tier 2)', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' }
    return { label: 'Early Stage / Tier 3', color: 'text-slate-400 border-slate-700 bg-slate-800/40' }
  }, [bst])

  return (
    <div className="space-y-4">
      {/* Header with Total & Tier */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Base Stat Total (BST)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-mono">{bst}</span>
            <span className="text-xs text-slate-500">/ {MAX_BASE_STAT * 6} Max</span>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border tracking-wide ${tierRating.color}`}
        >
          {tierRating.label}
        </span>
      </div>

      {/* Stat Bars List */}
      <div className="space-y-3.5">
        {stats.map((stat) => {
          const pct = statPercent(stat.baseStat)
          const colorClass = getStatColor(stat.baseStat)
          const range = calculateStatRange(stat.name, stat.baseStat)

          return (
            <div key={stat.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 w-28 shrink-0">
                  {getStatIcon(stat.name)}
                  <span className="font-semibold text-slate-300">
                    {formatStatName(stat.name)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-100 text-sm w-10 text-right">
                    {stat.baseStat}
                  </span>

                  {showMinMax && (
                    <span className="hidden sm:inline-block font-mono text-[10px] text-slate-500 w-24 text-right">
                      {range.min} - {range.max} (Lv 100)
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden relative shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={stat.baseStat}
                  aria-valuemin={0}
                  aria-valuemax={MAX_BASE_STAT}
                />
              </div>
            </div>
          )
        })}
      </div>

      {showMinMax && (
        <p className="text-[11px] text-slate-500 italic text-right pt-1">
          * Min/Max range calculated for Level 100 competitive benchmarks.
        </p>
      )}
    </div>
  )
}

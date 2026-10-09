// ============================================================
// StatBar Component
// src/components/ui/StatBar.tsx
// ============================================================

import { formatStatName, getStatColor, statPercent } from '@/utils'
import type { PokemonStat } from '@/types'

interface StatBarProps {
  stat: PokemonStat
}

export function StatBar({ stat }: StatBarProps) {
  const pct = statPercent(stat.baseStat)
  const colorClass = getStatColor(stat.baseStat)

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-16 shrink-0 text-right font-medium">
        {formatStatName(stat.name)}
      </span>
      <span className="text-xs font-mono font-semibold text-slate-200 w-8 shrink-0 text-right">
        {stat.baseStat}
      </span>
      <div className="stat-bar flex-1">
        <div
          className={`stat-bar-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={stat.baseStat}
          aria-valuemin={0}
          aria-valuemax={255}
        />
      </div>
    </div>
  )
}

// ============================================================
// PokemonTypeEffectiveness Component
// src/components/pokemon/PokemonTypeEffectiveness.tsx
// ============================================================

import { useMemo } from 'react'
import { ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react'
import { usePokemonType } from '@/hooks/usePokemon'
import { TypeBadge, LoadingSpinner } from '@/components/ui'
import type { PokemonType } from '@/types'

interface PokemonTypeEffectivenessProps {
  types: PokemonType[]
}

const ALL_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy',
]

export function PokemonTypeEffectiveness({ types }: PokemonTypeEffectivenessProps) {
  // Fetch primary type damage relations
  const primaryTypeName = types[0]?.name
  const secondaryTypeName = types[1]?.name

  const { data: primaryTypeData, isLoading: loadingPrimary } = usePokemonType(primaryTypeName)
  const { data: secondaryTypeData, isLoading: loadingSecondary } = usePokemonType(
    secondaryTypeName || null,
  )

  // Compute combined multipliers
  const effectivenessMap = useMemo(() => {
    if (!primaryTypeData) return null

    const multipliers: Record<string, number> = {}
    ALL_TYPES.forEach((t) => {
      multipliers[t] = 1.0
    })

    // Apply primary type
    if (primaryTypeData.damageRelations) {
      const rel = primaryTypeData.damageRelations
      rel.doubleDamageFrom.forEach((t) => {
        multipliers[t.name] = (multipliers[t.name] || 1) * 2
      })
      rel.halfDamageFrom.forEach((t) => {
        multipliers[t.name] = (multipliers[t.name] || 1) * 0.5
      })
      rel.noDamageFrom.forEach((t) => {
        multipliers[t.name] = 0
      })
    }

    // Apply secondary type
    if (secondaryTypeData?.damageRelations) {
      const rel = secondaryTypeData.damageRelations
      rel.doubleDamageFrom.forEach((t) => {
        multipliers[t.name] = (multipliers[t.name] || 1) * 2
      })
      rel.halfDamageFrom.forEach((t) => {
        multipliers[t.name] = (multipliers[t.name] || 1) * 0.5
      })
      rel.noDamageFrom.forEach((t) => {
        multipliers[t.name] = 0
      })
    }

    return multipliers
  }, [primaryTypeData, secondaryTypeData])

  if (loadingPrimary || (secondaryTypeName && loadingSecondary)) {
    return <LoadingSpinner size="sm" message="Computing type matchups..." />
  }

  if (!effectivenessMap) return null

  const quadrupleWeak = Object.entries(effectivenessMap).filter(([, m]) => m === 4)
  const doubleWeak = Object.entries(effectivenessMap).filter(([, m]) => m === 2)
  const halfResist = Object.entries(effectivenessMap).filter(([, m]) => m === 0.5)
  const quarterResist = Object.entries(effectivenessMap).filter(([, m]) => m === 0.25)
  const immune = Object.entries(effectivenessMap).filter(([, m]) => m === 0)

  return (
    <div className="space-y-4">
      {/* Weaknesses */}
      {(quadrupleWeak.length > 0 || doubleWeak.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Takes Increased Damage (Weaknesses)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quadrupleWeak.map(([typeName]) => (
              <div key={typeName} className="flex items-center gap-1 bg-rose-950/40 border border-rose-800/60 rounded-lg p-1 pr-2">
                <TypeBadge type={typeName} size="sm" />
                <span className="text-xs font-mono font-black text-rose-400">4×</span>
              </div>
            ))}
            {doubleWeak.map(([typeName]) => (
              <div key={typeName} className="flex items-center gap-1 bg-rose-950/20 border border-rose-900/40 rounded-lg p-1 pr-2">
                <TypeBadge type={typeName} size="sm" />
                <span className="text-xs font-mono font-bold text-rose-300">2×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resistances */}
      {(halfResist.length > 0 || quarterResist.length > 0) && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Takes Reduced Damage (Resistances)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quarterResist.map(([typeName]) => (
              <div key={typeName} className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-1 pr-2">
                <TypeBadge type={typeName} size="sm" />
                <span className="text-xs font-mono font-black text-emerald-400">¼×</span>
              </div>
            ))}
            {halfResist.map(([typeName]) => (
              <div key={typeName} className="flex items-center gap-1 bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-1 pr-2">
                <TypeBadge type={typeName} size="sm" />
                <span className="text-xs font-mono font-bold text-emerald-300">½×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immunities */}
      {immune.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <ShieldOff className="h-3.5 w-3.5" />
            <span>Immune To (0× Damage)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {immune.map(([typeName]) => (
              <div key={typeName} className="flex items-center gap-1 bg-purple-950/40 border border-purple-800/60 rounded-lg p-1 pr-2">
                <TypeBadge type={typeName} size="sm" />
                <span className="text-xs font-mono font-black text-purple-300">0×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

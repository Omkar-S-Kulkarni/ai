// ============================================================
// EvolutionChainDisplay Component
// src/components/pokemon/EvolutionChainDisplay.tsx
// ============================================================

import { ChevronRight } from 'lucide-react'
import type { EvolutionChain, EvolutionNode } from '@/types'
import { getPokemonSpriteUrl } from '@/lib/config'
import { slugToLabel } from '@/utils'

interface EvolutionChainDisplayProps {
  chain: EvolutionChain
  currentId?: number
}

export function EvolutionChainDisplay({ chain, currentId }: EvolutionChainDisplayProps) {
  const stages = flattenChain(chain.chain)

  if (stages.length <= 1) {
    return (
      <p className="text-sm text-slate-500 italic">This Pokémon does not evolve.</p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {stages.map((node, index) => (
        <div key={node.speciesName} className="flex items-center gap-1">
          {index > 0 && (
            <div className="flex flex-col items-center text-slate-500 mx-1">
              <ChevronRight className="h-5 w-5" />
              {node.evolutionDetails[0] && (
                <span className="text-xs text-slate-500">
                  {formatTrigger(node.evolutionDetails[0])}
                </span>
              )}
            </div>
          )}
          <div className={`
            flex flex-col items-center gap-1 p-2 rounded-lg
            ${node.id === currentId ? 'bg-indigo-900/40 border border-indigo-600' : 'bg-slate-700/40'}
          `}>
            <img
              src={getPokemonSpriteUrl(node.id)}
              alt={node.speciesName}
              className="w-12 h-12 object-contain"
              onError={(e) => { e.currentTarget.style.opacity = '0.3' }}
            />
            <span className="text-xs text-slate-300 capitalize">{node.speciesName}</span>
            {node.id === currentId && (
              <span className="text-xs text-indigo-400 font-semibold">Current</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Flatten chain into a linear sequence (handles branching by taking first branch)
function flattenChain(node: EvolutionNode): EvolutionNode[] {
  const result: EvolutionNode[] = [node]
  if (node.evolvesTo.length > 0) {
    // Show all evolutions (branched), not just first
    return [node, ...node.evolvesTo.flatMap((n) => flattenChain(n).slice(0, 1))]
  }
  return result
}

function formatTrigger(detail: EvolutionNode['evolutionDetails'][0]): string {
  if (detail.minLevel) return `Lv. ${detail.minLevel}`
  if (detail.item) return slugToLabel(detail.item)
  if (detail.trigger === 'trade') return 'Trade'
  if (detail.trigger === 'level-up') return 'Level up'
  return slugToLabel(detail.trigger)
}

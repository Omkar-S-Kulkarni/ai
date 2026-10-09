// ============================================================
// PokemonComparison Component
// src/components/pokemon/PokemonComparison.tsx
// ============================================================

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  X,
  Plus,
  Heart,
  Sword,
  Shield,
  Zap,
  ShieldAlert,
  FastForward,
  ExternalLink,
} from 'lucide-react'
import { useMultiplePokemon } from '@/hooks/usePokemon'
import { usePokemonContext } from '@/context/PokemonContext'
import { TypeBadge, LoadingSpinner, ErrorMessage } from '@/components/ui'
import {
  formatHeight,
  formatWeight,
  formatPokedexNumber,
  formatStatName,
  slugToLabel,
  toDisplayName,
} from '@/utils'
import type { PokemonStat } from '@/types'

export function PokemonComparison() {
  const { selectedPokemon, removeSelected, clearSelection } = usePokemonContext()

  const selectedIds = useMemo(
    () => selectedPokemon.map((p) => p.id),
    [selectedPokemon],
  )

  const {
    data: pokemonList,
    isLoading,
    error,
    refetch,
  } = useMultiplePokemon(selectedIds)

  if (selectedPokemon.length === 0) {
    return (
      <div className="card p-12 text-center max-w-xl mx-auto space-y-4 bg-slate-900/80 border-slate-800">
        <div className="w-16 h-16 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
          <Scale className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Comparison Tray is Empty</h2>
        <p className="text-sm text-slate-400">
          Select 2 to 4 Pokémon from the Pokédex discovery dashboard to analyze their stats, types, and competitive parameters side by side.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-2">
          <span>Browse Pokédex</span>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" message="Loading comparison metrics..." />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => refetch()} />
  }

  if (!pokemonList || pokemonList.length === 0) return null

  // Calculate highest stat for each category to highlight (without declaring an overall winner)
  const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

  const getStatValue = (stats: PokemonStat[], name: string) => {
    return stats.find((s) => s.name === name)?.baseStat || 0
  }

  const highestStatMap: Record<string, number> = {}
  statNames.forEach((sName) => {
    highestStatMap[sName] = Math.max(...pokemonList.map((p) => getStatValue(p.stats, sName)))
  })

  const highestBst = Math.max(
    ...pokemonList.map((p) => p.stats.reduce((acc, curr) => acc + curr.baseStat, 0)),
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

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <Scale className="h-7 w-7 text-indigo-400" />
            Pokémon Comparison Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing {pokemonList.length} Pokémon side by side across base stats, typing, and attributes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {pokemonList.length < 4 && (
            <Link
              to="/"
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="Select more Pokémon"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Pokémon ({pokemonList.length}/4)</span>
            </Link>
          )}

          <button
            onClick={clearSelection}
            className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Side-by-Side Pokémon Profiles Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${pokemonList.length} gap-4`}>
        {pokemonList.map((pokemon) => {
          const bst = pokemon.stats.reduce((acc, curr) => acc + curr.baseStat, 0)
          const artwork =
            pokemon.sprites.officialArtwork ||
            pokemon.sprites.frontDefault ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`

          return (
            <div
              key={pokemon.id}
              className="card p-5 bg-slate-900/80 border-slate-800 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Remove button */}
              <button
                onClick={() => removeSelected(pokemon.id)}
                className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title={`Remove ${pokemon.displayName}`}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-3">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {formatPokedexNumber(pokemon.id)}
                </span>

                <div className="w-28 h-28 flex items-center justify-center">
                  <img
                    src={artwork}
                    alt={pokemon.displayName}
                    className="w-full h-full object-contain drop-shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {pokemon.displayName}
                  </h3>
                  <div className="flex gap-1.5 justify-center mt-1.5 flex-wrap">
                    {pokemon.types.map((t) => (
                      <TypeBadge key={t.slot} type={t.name} size="sm" />
                    ))}
                  </div>
                </div>

                <Link
                  to={`/pokemon/${pokemon.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mt-1"
                >
                  <span>Full Profile</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* BST Badge */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Base Stat Total</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    bst === highestBst ? 'text-amber-400' : 'text-slate-200'
                  }`}
                >
                  {bst} {bst === highestBst && '★'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* STAT COMPARISON MATRIX */}
      <div className="card p-6 bg-slate-900/80 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Sword className="h-4 w-4 text-indigo-400" />
          Base Stats Breakdown
        </h3>

        <div className="space-y-4">
          {statNames.map((sName) => {
            const maxVal = highestStatMap[sName]

            return (
              <div key={sName} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  {getStatIcon(sName)}
                  <span>{formatStatName(sName)}</span>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${pokemonList.length} gap-3`}>
                  {pokemonList.map((pokemon) => {
                    const statVal = getStatValue(pokemon.stats, sName)
                    const isLeader = statVal === maxVal
                    const pct = (statVal / 255) * 100

                    return (
                      <div key={pokemon.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 capitalize truncate">
                            {pokemon.name}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              isLeader ? 'text-indigo-400' : 'text-slate-300'
                            }`}
                          >
                            {statVal} {isLeader && '▲'}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLeader ? 'bg-indigo-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PHYSICAL & METRIC ATTRIBUTES COMPARISON */}
      <div className="card p-6 bg-slate-900/80 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Physical Attributes & Metrics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Metric</th>
                {pokemonList.map((p) => (
                  <th key={p.id} className="py-2.5 px-3 capitalize font-bold text-slate-200">
                    {toDisplayName(p.name)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-3 text-slate-400 font-medium">Height</td>
                {pokemonList.map((p) => (
                  <td key={p.id} className="py-3 px-3 font-semibold text-slate-100">
                    {formatHeight(p.height)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-400 font-medium">Weight</td>
                {pokemonList.map((p) => (
                  <td key={p.id} className="py-3 px-3 font-semibold text-slate-100">
                    {formatWeight(p.weight)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-400 font-medium">Base Experience</td>
                {pokemonList.map((p) => (
                  <td key={p.id} className="py-3 px-3 font-semibold text-slate-100">
                    {p.baseExperience ?? 'N/A'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-3 text-slate-400 font-medium">Abilities</td>
                {pokemonList.map((p) => (
                  <td key={p.id} className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.abilities.map((a) => (
                        <span
                          key={a.name}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            a.isHidden
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {slugToLabel(a.name)}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

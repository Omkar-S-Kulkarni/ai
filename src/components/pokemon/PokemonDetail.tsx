// ============================================================
// PokémonDetail Component
// src/components/pokemon/PokemonDetail.tsx
// ============================================================

import { TypeBadge, StatBar, LoadingSpinner, ErrorMessage } from '@/components/ui'
import { formatHeight, formatWeight, formatPokedexNumber, slugToLabel } from '@/utils'
import { usePokemon, usePokemonSpecies, useEvolutionChain } from '@/hooks/usePokemon'
import { EvolutionChainDisplay } from './EvolutionChainDisplay'

interface PokemonDetailProps {
  nameOrId: string | number
}

export function PokemonDetail({ nameOrId }: PokemonDetailProps) {
  const { data: pokemon, isLoading, error, refetch } = usePokemon(nameOrId)
  const { data: species } = usePokemonSpecies(nameOrId)
  const { data: evolution } = useEvolutionChain(nameOrId)

  if (isLoading) return <LoadingSpinner size="lg" message={`Loading ${nameOrId}…`} />
  if (error) return <ErrorMessage error={error} onRetry={() => refetch()} />
  if (!pokemon) return null

  const artwork =
    pokemon.sprites.officialArtwork ??
    pokemon.sprites.frontDefault ??
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`

  const flavorText =
    species?.flavorTexts.find((f) => f.version === 'scarlet') ??
    species?.flavorTexts[0]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="shrink-0 text-center">
            <img
              src={artwork}
              alt={pokemon.displayName}
              className="w-40 h-40 object-contain"
              onError={(e) => {
                e.currentTarget.src = pokemon.sprites.frontDefault ??
                  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                e.currentTarget.onerror = null
              }}
            />
            {/* Shiny sprite */}
            {pokemon.sprites.frontShiny && (
              <img
                src={pokemon.sprites.frontShiny}
                alt={`${pokemon.displayName} shiny`}
                className="w-10 h-10 object-contain mx-auto"
                title="Shiny"
              />
            )}
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs text-slate-500 font-mono">{formatPokedexNumber(pokemon.id)}</p>
            <h2 className="text-3xl font-bold text-slate-100">{pokemon.displayName}</h2>
            {species?.genera && (
              <p className="text-sm text-slate-400 italic mt-0.5">{species.genera}</p>
            )}
            {flavorText && (
              <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-prose">
                {flavorText.text}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {pokemon.types.map((t) => <TypeBadge key={t.slot} type={t.name} size="lg" />)}
            </div>
            <div className="flex gap-6 mt-4 justify-center sm:justify-start text-sm">
              <div>
                <p className="text-slate-500 text-xs">Height</p>
                <p className="text-slate-200 font-semibold">{formatHeight(pokemon.height)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Weight</p>
                <p className="text-slate-200 font-semibold">{formatWeight(pokemon.weight)}</p>
              </div>
              {pokemon.baseExperience !== null && (
                <div>
                  <p className="text-slate-500 text-xs">Base EXP</p>
                  <p className="text-slate-200 font-semibold">{pokemon.baseExperience}</p>
                </div>
              )}
              {species && (
                <div>
                  <p className="text-slate-500 text-xs">Capture Rate</p>
                  <p className="text-slate-200 font-semibold">{species.captureRate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Base Stats</h3>
        <div className="space-y-3">
          {pokemon.stats.map((stat) => <StatBar key={stat.name} stat={stat} />)}
        </div>
        <p className="text-xs text-slate-500 mt-3 text-right">
          Total: <span className="font-bold text-slate-300">
            {pokemon.stats.reduce((acc, s) => acc + s.baseStat, 0)}
          </span>
        </p>
      </div>

      {/* Abilities */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Abilities</h3>
        <div className="flex flex-wrap gap-2">
          {pokemon.abilities.map((a) => (
            <span
              key={a.name}
              className={`badge ${a.isHidden ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-slate-700 text-slate-200'}`}
            >
              {slugToLabel(a.name)}
              {a.isHidden && <span className="ml-1 text-purple-400 text-xs">(hidden)</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Moves preview */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Moves (first 20)
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {pokemon.moves.slice(0, 20).map((m) => (
            <span key={m.name} className="badge bg-slate-700/60 text-slate-300 text-xs">
              {slugToLabel(m.name)}
            </span>
          ))}
        </div>
      </div>

      {/* Evolution chain */}
      {evolution && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Evolution Chain
          </h3>
          <EvolutionChainDisplay chain={evolution} currentId={pokemon.id} />
        </div>
      )}

      {/* Species info */}
      {species && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Species</h3>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'Generation', value: slugToLabel(species.generation) },
              { label: 'Growth Rate', value: slugToLabel(species.growthRate) },
              { label: 'Color', value: slugToLabel(species.color) },
              { label: 'Habitat', value: species.habitat ? slugToLabel(species.habitat) : '—' },
              { label: 'Baby', value: species.isBaby ? 'Yes' : 'No' },
              { label: 'Legendary', value: species.isLegendary ? 'Yes' : 'No' },
              { label: 'Mythical', value: species.isMythical ? 'Yes' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-700/40 rounded-lg p-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-slate-200 font-medium capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

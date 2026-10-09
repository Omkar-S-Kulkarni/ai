// ============================================================
// PokémonDetail Component
// src/components/pokemon/PokemonDetail.tsx
// ============================================================

import { useState } from 'react'
import {
  Heart,
  Scale,
  Sparkles,
  Info,
  Shield,
  Activity,
  Layers,
  Swords,
  GitFork,
  Check,
} from 'lucide-react'
import { TypeBadge, LoadingSpinner, ErrorMessage } from '@/components/ui'
import {
  formatHeight,
  formatWeight,
  formatPokedexNumber,
  slugToLabel,
  toDisplayName,
} from '@/utils'
import {
  usePokemon,
  usePokemonSpecies,
  useEvolutionChain,
} from '@/hooks/usePokemon'
import { usePokemonContext } from '@/context/PokemonContext'
import { EvolutionChainDisplay } from './EvolutionChainDisplay'
import { PokemonStatVisualizer } from './PokemonStatVisualizer'
import { PokemonTypeEffectiveness } from './PokemonTypeEffectiveness'

interface PokemonDetailProps {
  nameOrId: string | number
  onClose?: () => void
}

type TabType = 'overview' | 'stats' | 'matchups' | 'abilities' | 'moves' | 'evolution'

export function PokemonDetail({ nameOrId }: PokemonDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showShiny, setShowShiny] = useState(false)
  const [moveFilter, setMoveFilter] = useState<'all' | 'level-up' | 'machine' | 'egg' | 'tutor'>('all')

  const { data: pokemon, isLoading, error, refetch } = usePokemon(nameOrId)
  const { data: species } = usePokemonSpecies(nameOrId)
  const { data: evolution } = useEvolutionChain(nameOrId)

  const {
    isPokemonSelected,
    toggleSelect,
    isFavorite,
    toggleFavorite,
  } = usePokemonContext()

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message={`Loading Pokémon details for #${nameOrId}...`} />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => refetch()} />
  }

  if (!pokemon) return null

  const selected = isPokemonSelected(pokemon.id)
  const favorited = isFavorite(pokemon.id)

  const defaultArtwork =
    pokemon.sprites.officialArtwork ||
    pokemon.sprites.frontDefault ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`

  const shinyArtwork =
    pokemon.sprites.frontShiny ||
    pokemon.sprites.officialArtwork ||
    defaultArtwork

  const currentArtwork = showShiny ? shinyArtwork : defaultArtwork

  // Gender ratio calculation (genderRate: -1 = genderless, else rate/8 female)
  const genderRatio =
    species?.genderRate === -1
      ? null
      : species
      ? {
          female: (species.genderRate / 8) * 100,
          male: ((8 - species.genderRate) / 8) * 100,
        }
      : null

  // Filtered moves
  const filteredMoves = pokemon.moves.filter((m) => {
    if (moveFilter === 'all') return true
    return m.learnMethod === moveFilter
  })

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'stats', label: 'Base Stats', icon: Activity },
    { id: 'matchups', label: 'Type Matchups', icon: Shield },
    { id: 'abilities', label: 'Abilities', icon: Layers },
    { id: 'moves', label: `Moves (${pokemon.moves.length})`, icon: Swords },
    { id: 'evolution', label: 'Evolutions', icon: GitFork },
  ]

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Hero Header Card */}
      <div className="card p-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
          {/* Artwork & Sprite Toggle */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-48 h-48 flex items-center justify-center p-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
              <img
                src={currentArtwork}
                alt={pokemon.displayName}
                className="w-full h-full object-contain drop-shadow-2xl transition-all duration-300"
                onError={(e) => {
                  e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                }}
              />

              {species?.isLegendary && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Legendary
                </span>
              )}
              {species?.isMythical && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Mythical
                </span>
              )}
            </div>

            {/* Shiny Toggle Button */}
            {pokemon.sprites.frontShiny && (
              <button
                onClick={() => setShowShiny(!showShiny)}
                className={`
                  mt-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all
                  ${
                    showShiny
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }
                `}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{showShiny ? 'Shiny Form' : 'Normal Form'}</span>
              </button>
            )}
          </div>

          {/* Details & Action CTAs */}
          <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {formatPokedexNumber(pokemon.id)}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                  {pokemon.displayName}
                </h1>
                {species?.genera && (
                  <p className="text-sm text-slate-400 italic font-medium">
                    The {species.genera}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 justify-center md:justify-end">
                <button
                  onClick={() => toggleFavorite(pokemon.id)}
                  className={`
                    p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold
                    ${
                      favorited
                        ? 'bg-rose-950/50 border-rose-500 text-rose-300 shadow-sm shadow-rose-950'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-rose-300'
                    }
                  `}
                  title={favorited ? 'Favorited' : 'Add to Favorites'}
                >
                  <Heart className={`h-4 w-4 ${favorited ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span className="hidden sm:inline">{favorited ? 'Favorited' : 'Favorite'}</span>
                </button>

                <button
                  onClick={() =>
                    toggleSelect({
                      id: pokemon.id,
                      name: pokemon.name,
                      url: `https://pokeapi.co/api/v2/pokemon/${pokemon.id}/`,
                      spriteUrl: pokemon.sprites.frontDefault || '',
                    })
                  }
                  className={`
                    px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold
                    ${
                      selected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-300'
                    }
                  `}
                >
                  {selected ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                  <span>{selected ? 'In Compare Tray' : 'Add to Compare'}</span>
                </button>
              </div>
            </div>

            {/* Type Badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
              {pokemon.types.map((t) => (
                <TypeBadge key={t.slot} type={t.name} size="lg" />
              ))}
            </div>

            {/* Primary Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Height</span>
                <p className="text-sm font-bold text-slate-100">{formatHeight(pokemon.height)}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Weight</span>
                <p className="text-sm font-bold text-slate-100">{formatWeight(pokemon.weight)}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Base EXP</span>
                <p className="text-sm font-bold text-slate-100">{pokemon.baseExperience ?? 'N/A'}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Capture Rate</span>
                <p className="text-sm font-bold text-slate-100">{species?.captureRate ?? 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pokédex Flavor Descriptions */}
            <div className="card p-5 bg-slate-900/80 border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-400" />
                Pokédex Entries
              </h3>

              {species?.flavorTexts && species.flavorTexts.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {species.flavorTexts.slice(0, 4).map((f, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {toDisplayName(f.version)}
                      </span>
                      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                        {f.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No entry data available in English.</p>
              )}
            </div>

            {/* Species Biology & Breeding */}
            <div className="card p-5 bg-slate-900/80 border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Biology & Breeding
              </h3>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <dt className="text-slate-400">Generation</dt>
                  <dd className="text-slate-100 font-bold mt-0.5 capitalize">
                    {species?.generation ? slugToLabel(species.generation) : 'Generation 1'}
                  </dd>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <dt className="text-slate-400">Growth Rate</dt>
                  <dd className="text-slate-100 font-bold mt-0.5 capitalize">
                    {species?.growthRate ? slugToLabel(species.growthRate) : 'Medium Fast'}
                  </dd>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <dt className="text-slate-400">Color / Habitat</dt>
                  <dd className="text-slate-100 font-bold mt-0.5 capitalize">
                    {species?.color ? slugToLabel(species.color) : '—'} / {species?.habitat ? slugToLabel(species.habitat) : 'Unknown'}
                  </dd>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <dt className="text-slate-400">Base Happiness</dt>
                  <dd className="text-slate-100 font-bold mt-0.5">
                    {species?.baseHappiness ?? '50 / 255'}
                  </dd>
                </div>
              </dl>

              {/* Gender Distribution */}
              {genderRatio ? (
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-blue-400">♂ Male: {genderRatio.male}%</span>
                    <span className="text-pink-400">♀ Female: {genderRatio.female}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
                    <div className="bg-blue-500 h-full" style={{ width: `${genderRatio.male}%` }} />
                    <div className="bg-pink-500 h-full" style={{ width: `${genderRatio.female}%` }} />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                  Gender: <strong className="text-slate-200">Genderless</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STATS */}
        {activeTab === 'stats' && (
          <div className="card p-6 bg-slate-900/80 border-slate-800">
            <PokemonStatVisualizer stats={pokemon.stats} />
          </div>
        )}

        {/* TAB 3: MATCHUPS */}
        {activeTab === 'matchups' && (
          <div className="card p-6 bg-slate-900/80 border-slate-800">
            <PokemonTypeEffectiveness types={pokemon.types} />
          </div>
        )}

        {/* TAB 4: ABILITIES */}
        {activeTab === 'abilities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pokemon.abilities.map((ability) => (
              <div
                key={ability.name}
                className="card p-5 bg-slate-900/80 border-slate-800 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-100 capitalize">
                    {slugToLabel(ability.name)}
                  </h4>
                  {ability.isHidden ? (
                    <span className="badge bg-purple-950/70 text-purple-300 border border-purple-700">
                      Hidden Ability
                    </span>
                  ) : (
                    <span className="badge bg-slate-800 text-slate-300">
                      Slot {ability.slot}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {ability.shortEffect || ability.effect || 'Standard Pokémon ability.'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: MOVES */}
        {activeTab === 'moves' && (
          <div className="card p-6 bg-slate-900/80 border-slate-800 space-y-4">
            {/* Move Filter Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Learnable Moves ({filteredMoves.length})
              </h3>

              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'level-up', 'machine', 'egg', 'tutor'] as const).map((mType) => (
                  <button
                    key={mType}
                    onClick={() => setMoveFilter(mType)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                      moveFilter === mType
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mType === 'level-up' ? 'Level Up' : mType}
                  </button>
                ))}
              </div>
            </div>

            {/* Moves Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredMoves.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl"
                >
                  <span className="text-xs font-bold text-slate-200 capitalize truncate">
                    {slugToLabel(m.name)}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {m.learnMethod === 'level-up' ? `Lv. ${m.levelLearnedAt}` : m.learnMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: EVOLUTION */}
        {activeTab === 'evolution' && (
          <div className="card p-6 bg-slate-900/80 border-slate-800">
            {evolution ? (
              <EvolutionChainDisplay chain={evolution} currentId={pokemon.id} />
            ) : (
              <p className="text-sm text-slate-500 italic">Evolution chain information unavailable.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

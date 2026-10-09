// ============================================================
// API Verification Page
// src/pages/ApiVerification.tsx
// ============================================================
// Developer-facing integration test page.
// NOT the final PokéVerse dashboard.

import { useState, useCallback } from 'react'
import {
  Search, ChevronLeft, ChevronRight, MapPin, Wifi, Globe,
  AlertCircle, CheckCircle, Info, RefreshCw,
} from 'lucide-react'
import { PokemonCard } from '@/components/pokemon'
import { PokemonDetail } from '@/components/pokemon'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'
import { usePokemonList, usePokemon } from '@/hooks/usePokemon'
import { useIpGeolocation, useBrowserGeolocation } from '@/hooks/useGeolocation'
import type { PokemonSummary } from '@/types'

const LIMIT = 20

export function ApiVerificationPage() {
  // Pokémon list state
  const [offset, setOffset] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSummary | null>(null)

  // IP geolocation (fetch on demand to avoid automatic requests)
  const [geoEnabled, setGeoEnabled] = useState(false)

  // Pokémon list
  const listQuery = usePokemonList(LIMIT, offset)

  // Search query (only fires when searchQuery is set)
  const searchResultQuery = usePokemon(searchQuery)

  // IP geolocation
  const geoQuery = useIpGeolocation(geoEnabled)

  // Browser geolocation (explicit)
  const { position: browserGeo, error: browserGeoError, isLoading: browserGeoLoading, requestLocation } = useBrowserGeolocation()

  const totalPages = Math.ceil((listQuery.data?.count ?? 0) / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim().toLowerCase()
    if (!q) return
    setSearchQuery(q)
    setSelectedPokemon(null)
  }, [searchInput])

  const handleClearSearch = useCallback(() => {
    setSearchQuery(null)
    setSearchInput('')
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">P</div>
            <span className="font-bold text-slate-100">PokéVerse</span>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full ml-auto">
            API Verification · Dev Only
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-700/40 rounded-xl">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <strong>Integration Test Page</strong> — This verifies real API connectivity.
            It is not the final dashboard. All Pokémon data is live from{' '}
            <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer" className="underline text-blue-300">pokeapi.co</a>.
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* LEFT: Pokémon list + search */}
          <div className="xl:col-span-1 space-y-4">

            {/* Search */}
            <div className="card p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Search className="h-4 w-4" /> Pokémon Search
              </h2>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Name or ID (e.g. pikachu, 25)"
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary px-3">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {searchQuery && (
                <button onClick={handleClearSearch} className="text-xs text-slate-400 hover:text-slate-200">
                  ✕ Clear search (show list)
                </button>
              )}
            </div>

            {/* Search result or list */}
            {searchQuery ? (
              <div className="card p-4">
                <h3 className="text-xs text-slate-400 mb-3">Search: "{searchQuery}"</h3>
                {searchResultQuery.isLoading && <LoadingSpinner message="Searching…" />}
                {searchResultQuery.error && (
                  <ErrorMessage error={searchResultQuery.error} onRetry={() => searchResultQuery.refetch()} />
                )}
                {searchResultQuery.data && (
                  <PokemonCard
                    pokemon={{
                      id: searchResultQuery.data.id,
                      name: searchResultQuery.data.name,
                      url: `https://pokeapi.co/api/v2/pokemon/${searchResultQuery.data.id}/`,
                      spriteUrl: searchResultQuery.data.sprites.frontDefault ??
                        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${searchResultQuery.data.id}.png`,
                    }}
                    isSelected={selectedPokemon?.id === searchResultQuery.data?.id}
                    onClick={() => {
                      if (searchResultQuery.data) {
                        setSelectedPokemon({
                          id: searchResultQuery.data.id,
                          name: searchResultQuery.data.name,
                          url: `https://pokeapi.co/api/v2/pokemon/${searchResultQuery.data.id}/`,
                          spriteUrl: searchResultQuery.data.sprites.frontDefault ?? '',
                        })
                      }
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs text-slate-400">
                    Pokédex ({listQuery.data?.count ?? '…'} total)
                  </h3>
                  {listQuery.isFetching && <RefreshCw className="h-3 w-3 text-indigo-400 animate-spin" />}
                </div>

                {listQuery.isLoading && <LoadingSpinner message="Loading Pokémon…" />}
                {listQuery.error && <ErrorMessage error={listQuery.error} onRetry={() => listQuery.refetch()} />}

                <div className="grid grid-cols-1 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {listQuery.data?.results.map((p) => (
                    <PokemonCard
                      key={p.id}
                      pokemon={p}
                      isSelected={selectedPokemon?.id === p.id}
                      onClick={() => {
                        setSelectedPokemon(p)
                        setSearchQuery(null)
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {(listQuery.data?.count ?? 0) > LIMIT && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                      disabled={offset === 0 || listQuery.isFetching}
                      className="btn-secondary px-3 py-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-slate-400">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setOffset(offset + LIMIT)}
                      disabled={!listQuery.data?.next || listQuery.isFetching}
                      className="btn-secondary px-3 py-1.5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Pokémon detail */}
          <div className="xl:col-span-2">
            {selectedPokemon ? (
              <PokemonDetail nameOrId={selectedPokemon.id} />
            ) : (
              <div className="card p-12 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">⚡</div>
                <p className="text-slate-400">Select a Pokémon from the list or search by name / ID</p>
              </div>
            )}
          </div>
        </div>

        {/* Geolocation Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-400" />
            IP Geolocation (ip-api.com)
          </h2>

          {/* HTTP-only limitation banner */}
          <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200 space-y-1">
              <p className="font-semibold">⚠️ HTTP-Only Provider Limitation</p>
              <p>
                The ip-api.com free endpoint is <strong>HTTP-only</strong>.
                It works on <code className="bg-amber-900/40 px-1 rounded">http://localhost</code> (dev) but will be
                blocked by browsers on any <code className="bg-amber-900/40 px-1 rounded">https://</code> page due
                to Mixed Content policy.
              </p>
              <p>
                For production HTTPS: upgrade to ip-api Pro, proxy via backend, or swap the provider
                adapter in <code className="bg-amber-900/40 px-1 rounded">src/services/geolocation/geolocation.service.ts</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* IP Geolocation */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-green-400" />
                  Approximate IP Location
                </h3>
                {!geoEnabled ? (
                  <button onClick={() => setGeoEnabled(true)} className="btn-primary text-xs">
                    Fetch Location
                  </button>
                ) : (
                  <button onClick={() => geoQuery.refetch()} disabled={geoQuery.isFetching} className="btn-secondary text-xs">
                    <RefreshCw className={`h-3 w-3 ${geoQuery.isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 italic">
                This is approximate network-level location, not browser GPS. Accuracy is typically city-level (±50 km).
              </p>

              {!geoEnabled && (
                <p className="text-sm text-slate-500 text-center py-4">Click "Fetch Location" to query ip-api.com</p>
              )}

              {geoEnabled && geoQuery.isLoading && <LoadingSpinner message="Querying ip-api.com…" />}
              {geoEnabled && geoQuery.error && (
                <ErrorMessage error={geoQuery.error} onRetry={() => geoQuery.refetch()} />
              )}

              {geoEnabled && geoQuery.data && (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 text-sm font-semibold ${
                    geoQuery.data.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {geoQuery.data.status === 'success'
                      ? <CheckCircle className="h-4 w-4" />
                      : <AlertCircle className="h-4 w-4" />
                    }
                    Status: {geoQuery.data.status}
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'IP', value: geoQuery.data.query },
                      { label: 'Country', value: `${geoQuery.data.country ?? '—'} (${geoQuery.data.countryCode ?? '—'})` },
                      { label: 'Region', value: geoQuery.data.regionName ?? '—' },
                      { label: 'City', value: geoQuery.data.city ?? '—' },
                      { label: 'Postal', value: geoQuery.data.zip ?? '—' },
                      { label: 'Timezone', value: geoQuery.data.timezone ?? '—' },
                      { label: 'UTC Offset', value: geoQuery.data.offset !== null ? `${geoQuery.data.offset / 3600}h` : '—' },
                      { label: 'Currency', value: geoQuery.data.currency ?? '—' },
                      { label: 'Lat / Lon', value: geoQuery.data.lat !== null ? `${geoQuery.data.lat}, ${geoQuery.data.lon}` : '—' },
                      { label: 'ISP', value: geoQuery.data.isp ?? '—' },
                      { label: 'Org', value: geoQuery.data.org ?? '—' },
                      { label: 'ASN', value: geoQuery.data.as ?? '—' },
                      { label: 'Mobile', value: geoQuery.data.mobile !== null ? String(geoQuery.data.mobile) : '—' },
                      { label: 'Proxy', value: geoQuery.data.proxy !== null ? String(geoQuery.data.proxy) : '—' },
                      { label: 'Hosting', value: geoQuery.data.hosting !== null ? String(geoQuery.data.hosting) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-700/40 rounded p-2">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="text-slate-200 font-medium truncate" title={value ?? ''}>{value ?? '—'}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className="text-xs text-slate-600">
                    Fetched at: {new Date(geoQuery.data.fetchedAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>

            {/* Browser Geolocation */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  Precise Browser Location
                </h3>
                <button
                  onClick={requestLocation}
                  disabled={browserGeoLoading}
                  className="btn-primary text-xs"
                >
                  {browserGeoLoading ? 'Requesting…' : 'Grant Permission'}
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200">
                  This uses the browser's Geolocation API (GPS/Wi-Fi). It requires your explicit permission
                  and is separate from IP-based location. Click "Grant Permission" to trigger the browser prompt.
                </p>
              </div>

              {browserGeoError && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {browserGeoError}
                </div>
              )}

              {browserGeo && (
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Latitude', value: browserGeo.lat.toFixed(6) },
                    { label: 'Longitude', value: browserGeo.lon.toFixed(6) },
                    { label: 'Accuracy', value: `±${Math.round(browserGeo.accuracy)} m` },
                    { label: 'Altitude', value: browserGeo.altitude !== null ? `${browserGeo.altitude?.toFixed(1)} m` : '—' },
                    { label: 'Heading', value: browserGeo.heading !== null ? `${browserGeo.heading?.toFixed(1)}°` : '—' },
                    { label: 'Speed', value: browserGeo.speed !== null ? `${browserGeo.speed?.toFixed(1)} m/s` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-700/40 rounded p-2">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-slate-200 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {!browserGeo && !browserGeoLoading && !browserGeoError && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No location yet. Click "Grant Permission" to test.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* API Endpoints reference */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Integrated API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {[
              ['GET', `https://pokeapi.co/api/v2/pokemon?limit={n}&offset={n}`],
              ['GET', `https://pokeapi.co/api/v2/pokemon/{name|id}`],
              ['GET', `https://pokeapi.co/api/v2/pokemon-species/{name|id}`],
              ['GET', `https://pokeapi.co/api/v2/evolution-chain/{id}`],
              ['GET', `https://pokeapi.co/api/v2/type/{name|id}`],
              ['GET', `https://pokeapi.co/api/v2/ability/{name|id}`],
              ['GET', `https://pokeapi.co/api/v2/generation/{name|id}`],
              ['GET', `https://pokeapi.co/api/v2/pokedex/{name|id}`],
              ['GET', `http://ip-api.com/json?fields={fields}`],
              ['Browser', `navigator.geolocation.getCurrentPosition()`],
            ].map(([method, url]) => (
              <div key={url} className="flex gap-2 items-start bg-slate-800/60 rounded p-2">
                <span className={`shrink-0 font-bold ${method === 'Browser' ? 'text-blue-400' : method === 'GET' ? 'text-green-400' : 'text-orange-400'}`}>
                  {method}
                </span>
                <span className="text-slate-400 break-all">{url}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

# PokéVerse

> Premium Pokémon world simulation — Phase 1: Foundation & API Integration

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF)](https://vite.dev/)

---

## Quick Start

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# TypeScript type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) to see the API Verification page.

---

## Project Structure

```
src/
├── app/              # Router and app shell
├── components/
│   ├── pokemon/      # PokémonCard, PokémonDetail, EvolutionChainDisplay
│   └── ui/           # TypeBadge, StatBar, LoadingSpinner, ErrorMessage
├── hooks/
│   ├── usePokemon.ts         # React Query hooks for PokéAPI
│   └── useGeolocation.ts     # IP + browser geolocation hooks
├── lib/
│   ├── config.ts             # Centralized API config and endpoint constants
│   ├── httpClient.ts         # Axios clients with error interceptors
│   └── queryClient.ts        # React Query client + query key factories
├── pages/
│   └── ApiVerification.tsx   # Developer integration test page
├── services/
│   ├── pokemon/
│   │   ├── pokemon.api.types.ts    # Raw PokéAPI response types
│   │   ├── pokemon.normalizers.ts  # API → app type normalizers
│   │   ├── pokemon.service.ts      # All HTTP calls
│   │   └── index.ts
│   └── geolocation/
│       ├── geolocation.service.ts  # ip-api adapter + browser geo
│       └── index.ts
├── types/
│   ├── pokemon.ts        # Normalized Pokémon types
│   ├── geolocation.ts    # Geolocation types + provider abstraction
│   ├── api.ts            # Shared API types
│   ├── simulation.ts     # Future simulation contracts (no impl)
│   └── index.ts          # Barrel export
└── utils/
    └── index.ts          # Display helpers, formatters, type colors
```

---

## Integrated APIs

### PokéAPI (`https://pokeapi.co/api/v2`)

| Endpoint | Usage |
|----------|-------|
| `GET /pokemon?limit={n}&offset={n}` | Paginated Pokémon list |
| `GET /pokemon/{name\|id}` | Full details, stats, sprites, moves |
| `GET /pokemon-species/{name\|id}` | Species, flavor text, evolution URL |
| `GET /evolution-chain/{id}` | Full evolution chain |
| `GET /type/{name\|id}` | Type with damage relations |
| `GET /ability/{name\|id}` | Ability with effect descriptions |
| `GET /generation/{name\|id}` | Generation info |
| `GET /pokedex/{name\|id}` | Pokédex entries |

**No API key required.** Rate limit: ~100 req/min. Responses are cached by React Query for 10 minutes.

### IP-API (`http://ip-api.com`)

Provides approximate IP-based geolocation (city-level, ±50 km).

> **⚠️ HTTP-Only Limitation**
>
> The free tier of ip-api.com is **HTTP-only**. It works on `http://localhost` during development but will be **blocked by browsers on `https://` pages** due to Mixed Content policy.
>
> **For production HTTPS**, choose one of:
> - [ip-api Pro](https://ip-api.com/docs/pro) — paid plan with HTTPS support
> - Proxy requests through your own HTTPS backend
> - Switch provider (see `src/services/geolocation/geolocation.service.ts`)

Fields requested: `status, message, country, countryCode, region, regionName, city, zip, lat, lon, timezone, offset, currency, isp, org, as, asname, mobile, proxy, hosting, query`

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **React Query** | Caching, deduplication, background refetch — prevents redundant API calls |
| **Axios** | Request cancellation with AbortSignal, interceptors for error normalization |
| **Separate raw API types** | `pokemon.api.types.ts` mirrors PokéAPI; `types/pokemon.ts` = normalized app types |
| **Query key factories** | Centralized in `queryClient.ts` — prevents cache key typos |
| **Provider adapter pattern** | `GeolocationProviderConfig` allows swapping ip-api without touching hooks |
| **Tailwind CSS v3** | Stable, well-supported; CSS type color utilities avoid JS-driven inline styles |

---

## Testing the APIs

1. Open [http://localhost:5173](http://localhost:5173)
2. The list loads first 20 Pokémon automatically
3. Click any card to see full details, stats, and evolution chain
4. Use the search box to find any Pokémon by name or ID
5. Scroll down to "IP Geolocation" and click **Fetch Location**
6. Click **Grant Permission** to test browser GPS (requires browser prompt)

---

## Known Limitations

| Limitation | Impact |
|------------|--------|
| ip-api free endpoint is HTTP-only | Geolocation blocked on HTTPS pages |
| Evolution chain display shows one branch for split evolutions | Eevee, Wurmple, etc. show simplified tree |
| PokéAPI animated sprites only exist for Gen V Pokémon | Later Pokémon fall back to static sprites |
| Rate limits on PokéAPI (~100 req/min) | Cached aggressively; unlikely to hit in normal use |

---

## Running on a Second Machine (Laptop 2)

```powershell
# 1. Clone the repository
git clone <your-repo-url>
cd pokeverse  # or whatever the folder is

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

No `.env` file is needed for Phase 1 — both APIs used are public and key-free.

---

## Next Development Tasks (Phase 2 Suggestions)

1. **Dashboard layout** — Main PokéVerse shell with sidebar navigation
2. **World Map** — Interactive globe using Leaflet or deck.gl with Pokémon spawn points
3. **Pokédex browser** — Filterable, sortable grid with type/generation filters
4. **Comparison tool** — Side-by-side stat comparison for 2–4 Pokémon
5. **Competition engine** — Implement the `SimulationResult` contract from `types/simulation.ts`
6. **Backend proxy** — Next.js / Hono API route to proxy ip-api.com for HTTPS production

---

## API Documentation

- [PokéAPI Docs](https://pokeapi.co/docs/v2)
- [ip-api Docs](https://ip-api.com/docs)
- [ip-api JSON Fields](https://ip-api.com/docs/api:json)

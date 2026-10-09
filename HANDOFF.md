# PokéVerse — Developer Handoff Document

> **Status:** Phase 1 Complete (Foundation & Live API Integration Verified)  
> **Last Updated:** October 9, 2026  
> **Repository:** `d:\ai` (or cloned repository)

---

## 1. Executive Summary & Current State

The foundation of **PokéVerse** is fully established, configured, and verified against live APIs. **No mock data or fake fallbacks are used.**

### What is Completed (Phase 1):
- **Tooling & Build System:** React 18 + TypeScript + Vite 6 + Tailwind CSS v3 + React Router v6 + Lucide React + Framer Motion.
- **Strict Quality Checks:** TypeScript (`tsc --noEmit`), ESLint 9, and Vite production build all pass with **0 errors and 0 warnings**.
- **PokéAPI Service Layer:** Full integration with live [PokéAPI](https://pokeapi.co/api/v2/) covering Pokémon lists, details, species, evolution chains, stats, abilities, moves, types, and damage relations.
- **IP Geolocation Layer:** Integration with live [IP-API](http://ip-api.com) with field filtering and provider abstraction, plus separate native browser GPS geolocation requiring explicit user action.
- **Data Architecture:** Clear separation between raw API responses (`src/services/pokemon/pokemon.api.types.ts`) and normalized UI contracts (`src/types/`).
- **Caching & Resilience:** Centralized React Query configuration with deduplication, stale-while-revalidate (10 min stale time), and `AbortSignal` request cancellation.
- **Verification UI:** Developer-facing verification dashboard at `/` to test all endpoints interactively.

---

## 2. Tech Stack & Key Libraries

| Area | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime / UI** | React | `^18.3.1` | View layer with `StrictMode` enabled |
| **Language** | TypeScript | `~5.7.2` | Strict typing with `@/*` path alias |
| **Bundler / Dev** | Vite | `^6.0.5` | Fast HMR and production bundling |
| **Styling** | Tailwind CSS | `^3.4.17` | Utility styling + custom Pokémon type palette |
| **Data Fetching** | `@tanstack/react-query` | `^5.62.7` | Caching, deduplication, query keys |
| **HTTP Client** | Axios | `^1.7.9` | Request cancellation, timeouts, interceptors |
| **Routing** | React Router DOM | `^6.28.0` | Client-side navigation |
| **Icons** | Lucide React | `^0.468.0` | SVG icons across UI components |
| **Animations** | Framer Motion | `^11.15.0` | Ready for simulation and UI transitions |

---

## 3. Project Directory Map

```
d:\ai/
├── .env.example                     # Environment variables documentation
├── .gitignore                       # Clean git ignore for node, vite, build, env
├── eslint.config.js                 # ESLint 9 flat config
├── index.html                       # HTML entry point
├── package.json                     # Scripts & dependencies
├── postcss.config.js                # PostCSS with Tailwind & Autoprefixer
├── README.md                        # High-level overview & setup
├── HANDOFF.md                       # This continuous work guide
├── tailwind.config.js               # Theme extension with custom Pokémon type colors
├── tsconfig.json                    # Strict app tsconfig with baseUrl & @/* alias
├── tsconfig.node.json               # Node tsconfig for Vite configuration
├── vite.config.ts                   # Vite config with @/ path resolution
└── src/
    ├── App.tsx                      # Root App with QueryClientProvider & Router
    ├── main.tsx                     # DOM mount point
    ├── index.css                    # Tailwind directives & type badge CSS utilities
    ├── app/
    │   └── Router.tsx               # App routing configuration
    ├── components/
    │   ├── ui/                      # Shared reusable UI primitives
    │   │   ├── TypeBadge.tsx        # Pokémon type badge with custom colors
    │   │   ├── StatBar.tsx          # Animated stat bar with ARIA attributes
    │   │   ├── LoadingSpinner.tsx   # Configurable loading spinner
    │   │   ├── ErrorMessage.tsx     # Standard error display with retry
    │   │   └── index.ts
    │   └── pokemon/                 # Pokémon-specific domain components
    │       ├── PokemonCard.tsx      # List item card with sprite & fallback
    │       ├── PokemonDetail.tsx    # Full details: stats, moves, abilities, species
    │       ├── EvolutionChainDisplay.tsx # Evolution tree visualization
    │       └── index.ts
    ├── hooks/
    │   ├── usePokemon.ts            # React Query hooks for all PokéAPI endpoints
    │   └── useGeolocation.ts        # IP + browser geolocation query hooks
    ├── lib/
    │   ├── config.ts                # API URLs, query timeouts, sprite builders
    │   ├── httpClient.ts            # Axios instances with error normalizers
    │   └── queryClient.ts           # React Query configuration & key factories
    ├── pages/
    │   └── ApiVerification.tsx      # Interactive developer verification page
    ├── services/
    │   ├── pokemon/
    │   │   ├── pokemon.api.types.ts # Raw API JSON response typings
    │   │   ├── pokemon.normalizers.ts # Raw API -> Normalized app type converters
    │   │   ├── pokemon.service.ts   # Axios API calls with AbortSignal
    │   │   └── index.ts
    │   └── geolocation/
    │       ├── geolocation.service.ts # IP-API adapter + browser GPS
    │       └── index.ts
    ├── types/                       # Shared normalized data contracts
    │   ├── pokemon.ts               # PokemonSummary, PokemonDetails, Species, etc.
    │   ├── geolocation.ts           # IpGeolocationResult, Provider contracts
    │   ├── api.ts                   # ApiResult<T>, Pagination, DeploymentConfig
    │   ├── simulation.ts            # Future simulation & battle engine contracts
    │   └── index.ts                 # Barrel export
    └── utils/
        └── index.ts                 # Formatting (height, weight, stats, colors)
```

---

## 4. API Reference & Provider Architecture

### A. PokéAPI (`https://pokeapi.co/api/v2`)
Central service: [`src/services/pokemon/pokemon.service.ts`](file:///d:/ai/src/services/pokemon/pokemon.service.ts)
- `fetchPokemonList(limit, offset, signal)`: Paginated overview.
- `fetchPokemon(nameOrId, signal)`: Full details (stats, types, abilities, moves, sprites).
- `fetchPokemonSpecies(nameOrId, signal)`: Genus, flavor text, color, habitat, evolution chain URL.
- `fetchEvolutionChain(chainId, signal)`: Evolution tree with trigger conditions.
- `fetchEvolutionChainForPokemon(nameOrId, signal)`: Resolves species then chain.
- `fetchType(nameOrId, signal)`: Damage relations (`doubleDamageTo`, `halfDamageFrom`, etc.).
- `fetchAbility(nameOrId, signal)`: Ability effects.
- `fetchGeneration(nameOrId, signal)` & `fetchPokedex(nameOrId, signal)`.

### B. Geolocation Service
Central service: [`src/services/geolocation/geolocation.service.ts`](file:///d:/ai/src/services/geolocation/geolocation.service.ts)
- `fetchIpGeolocation(signal)`: Queries `http://ip-api.com/json` with field filtering.
- `fetchBrowserGeolocation()`: Wraps `navigator.geolocation.getCurrentPosition()` as a Promise.

> **CRITICAL PROVIDER LIMITATION & PRODUCTION NOTE:**
> - The free tier of `ip-api.com` is **HTTP-only**.
> - It works during local development (`http://localhost:5173`).
> - In an HTTPS production deployment, browsers will block HTTP requests (Mixed Content policy).
> - **Adapter ready:** To switch providers for production, update `ACTIVE_PROVIDER_CONFIG` in `src/services/geolocation/geolocation.service.ts` or route requests through a backend HTTPS proxy.

---

## 5. Shared Data Contracts (`src/types/`)

Import all contracts cleanly using `@/types`:

```typescript
import type {
  PokemonSummary,
  PokemonDetails,
  PokemonStat,
  PokemonType,
  PokemonAbility,
  PokemonSpecies,
  EvolutionChain,
  IpGeolocationResult,
  GeographicLocation,
  Competitor,
  SimulationResult,
  Leaderboard,
  DeploymentConfig,
} from '@/types'
```

*Note: `simulation.ts` specifies the interfaces for future competition & world simulation logic without coupling to UI.*

---

## 6. Commands to Run & Verify

All commands are PowerShell and bash compatible:

```powershell
# 1. Install dependencies
npm install

# 2. Start local dev server (default: http://localhost:5173)
npm run dev

# 3. Run strict TypeScript check (0 errors expected)
npm run type-check

# 4. Run ESLint (0 errors expected)
npm run lint

# 5. Run full production build
npm run build
```

---

## 7. Working on Laptop 2 / Cloning Instructions

To continue work on a second machine:

1. Clone the repository:
   ```powershell
   git clone <REPO_URL>
   cd ai
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the dev server:
   ```powershell
   npm run dev
   ```
4. Verify by browsing to `http://localhost:5173`. No API keys or `.env` configuration are required for Phase 1.

---

## 8. Next Steps & Phase 2 Roadmap

When you continue development, proceed with the following modules in order:

### Step 1: Main Application Shell & Navigation
- Create layout components (`AppLayout`, `Sidebar`, `Header`) in `src/components/layout/`.
- Set up routes in `src/app/Router.tsx` for:
  - `/` -> Main Dashboard / World Overview
  - `/pokedex` -> Full Interactive Pokédex
  - `/map` -> Interactive World Map & Regional Pokémon Spawns
  - `/arena` -> Simulation & Battle Engine
  - `/verify` -> Developer API Verification (keep existing page accessible)

### Step 2: Interactive Pokédex Explorer
- Build a full-screen grid with virtualized scrolling or pagination.
- Add multi-facet filtering (Type, Generation, Stat range, Legendary/Mythical).
- Add Pokémon comparison modal (compare base stats side-by-side).

### Step 3: PokéVerse World Map
- Use Leaflet (`react-leaflet`) or Mapbox/deck.gl to render an interactive map.
- Center map on the user's approximate IP geolocation (`useIpGeolocation`).
- Plot Pokémon regional habitats and simulated biome encounters based on latitude/longitude/climate.

### Step 4: Battle Simulation Engine
- Implement the battle logic satisfying `SimulationResult` from `src/types/simulation.ts`.
- Calculate type advantages using `fetchType` damage relations.
- Add turn-by-turn combat visualizer with `framer-motion`.

---

## 9. Code Conventions & Best Practices

1. **Path Aliasing:** Always use `@/...` (e.g. `import { usePokemon } from '@/hooks/usePokemon'`).
2. **Never Call APIs Directly in UI:** All data fetching must go through `src/services/` and `src/hooks/`.
3. **Cancellation:** Always pass `signal` from `useQuery` query functions to service functions.
4. **Type Separation:** Keep raw API response types in `*.api.types.ts` and normalized application models in `src/types/`.
5. **No Fake Fallback Data:** If an API fails, bubble up the error state to the UI via `ErrorMessage` component.

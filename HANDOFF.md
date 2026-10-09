# PokéVerse — Developer Handoff Document

> **Status:** Phase 2 Complete (Pokémon Discovery & Data Dashboard Implemented & Verified)  
> **Last Updated:** October 9, 2026  
> **Branch:** `feature/pokemon-dashboard`  
> **Repository:** `d:\ai` (or cloned repository)

---

## 1. Executive Summary & Current State

The **PokéVerse Pokémon Discovery & Data Dashboard** is fully implemented, responsive, and verified against live PokéAPI endpoints.

### What is Completed:
- **Pokémon Discovery Dashboard (`/`):**
  - Full-text search by Pokémon name or Pokédex number.
  - Multi-facet filters: 18 elemental types, 9 game generations / regions (Kanto through Paldea).
  - Multi-attribute sorting: Pokédex # (Asc/Desc), Name (A-Z/Z-A), Height, Weight.
  - Quick filters for Favorites and Recently Viewed.
  - Dual view modes: Responsive Grid Cards and Compact Table-style List.
  - Shimmering skeleton loading placeholders, animated error cards with retry, and friendly empty states.
- **Dedicated Pokémon Profile (`/pokemon/:nameOrId`) & Quick Modal Preview:**
  - Official high-resolution artwork + shiny form switcher.
  - Key vitals: height, weight, base EXP, capture rate, gender ratios, growth rates, habitat, egg groups.
  - Comprehensive Tabbed Interface:
    - **Overview:** Multiversion Pokédex flavor text and breeding biology.
    - **Base Stats:** Visual stat bars with Level 100 competitive min/max calculations and Tier ratings.
    - **Type Matchups:** Live defense multipliers (4× Weaknesses, 2× Weaknesses, ½× Resistances, ¼× Resistances, 0× Immunities).
    - **Abilities:** Standard and hidden abilities with full in-game effect descriptions.
    - **Moves:** Filterable learnset by method (Level-up with level requirement, TM/Machine, Egg, Tutor).
    - **Evolution Chain:** Interactive visual evolutionary lines with level/item triggers.
    - Previous / Next Pokémon fast navigation headers.
- **Side-by-Side Comparison Engine (`/compare`):**
  - Compare 2 to 4 selected Pokémon simultaneously.
  - Stat comparison with stat category leaders highlighted (without falsely declaring an overall "winner").
  - Physical attribute comparison (height, weight, base EXP, abilities).
- **Persistent Selection Tray & Favorites (`/favorites`):**
  - Global `PokemonContext` with active comparison tray (up to 4 Pokémon) persistent across all page navigation.
  - Favorites & Recently Viewed history saved to `localStorage`.
- **Developer Integration Verification (`/verify`):**
  - Retained the Phase 1 developer integration page without breaking existing tests.

---

## 2. Tech Stack & Key Libraries

| Area | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime / UI** | React | `^18.3.1` | StrictMode view layer |
| **Language** | TypeScript | `~5.7.2` | Strict typing with `@/*` path alias |
| **Bundler / Dev** | Vite | `^6.0.5` | Fast HMR and production bundling |
| **Styling** | Tailwind CSS | `^3.4.17` | Utility styling + custom Pokémon type palette |
| **Data Fetching** | `@tanstack/react-query` | `^5.62.7` | Caching, deduplication, query keys |
| **HTTP Client** | Axios | `^1.7.9` | Request cancellation, timeouts, interceptors |
| **Routing** | React Router DOM | `^6.28.0` | Client-side navigation & deep linking |
| **Icons** | Lucide React | `^0.468.0` | SVG icons across UI components |
| **Animations** | Framer Motion | `^11.15.0` | Micro-interactions and UI transitions |

---

## 3. Project Directory Map

```
d:\ai/
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
    ├── App.tsx                      # Root App with QueryClientProvider, PokemonProvider & Router
    ├── main.tsx                     # DOM mount point
    ├── index.css                    # Tailwind directives & type badge CSS utilities
    ├── app/
    │   └── Router.tsx               # App routing configuration
    ├── context/
    │   └── PokemonContext.tsx       # Selection tray, favorites, & recent history context
    ├── components/
    │   ├── layout/                  # Navigation & Shell
    │   │   ├── AppNavbar.tsx        # Top navigation with badges & responsive menu
    │   │   ├── SelectionTray.tsx    # Floating persistent comparison tray (up to 4 Pokémon)
    │   │   ├── AppLayout.tsx        # Shell wrapper with Navbar, main, & tray
    │   │   └── index.ts
    │   ├── ui/                      # Shared reusable UI primitives
    │   │   ├── TypeBadge.tsx        # Pokémon type badge with custom colors
    │   │   ├── StatBar.tsx          # Stat bar with ARIA attributes
    │   │   ├── LoadingSpinner.tsx   # Accessible loading spinner
    │   │   ├── ErrorMessage.tsx     # Standard error display with retry
    │   │   └── index.ts
    │   └── pokemon/                 # Pokémon-specific domain components
    │       ├── PokemonCard.tsx      # Rich grid & compact cards with actions
    │       ├── PokemonCardSkeleton.tsx # Shimmering loading placeholders
    │       ├── PokemonFilterBar.tsx # Search, types, generation pills, sort, view toggles
    │       ├── PokemonGrid.tsx      # Main discovery grid with pagination & modals
    │       ├── PokemonDetail.tsx    # Tabbed profile: stats, moves, abilities, species
    │       ├── PokemonDetailModal.tsx # Quick overlay preview from dashboard
    │       ├── PokemonStatVisualizer.tsx # BST, Tier badges, Lv 100 min/max calculations
    │       ├── PokemonTypeEffectiveness.tsx # Dual-type weakness/resistance matrix
    │       ├── EvolutionChainDisplay.tsx # Evolution tree visualization
    │       ├── PokemonComparison.tsx # Side-by-side multi-pokemon comparison
    │       └── index.ts
    ├── hooks/
    │   ├── usePokemon.ts            # React Query hooks for all PokéAPI endpoints
    │   └── useGeolocation.ts        # IP + browser geolocation query hooks
    ├── lib/
    │   ├── config.ts                # API URLs, query timeouts, sprite builders
    │   ├── httpClient.ts            # Axios instances with error normalizers
    │   └── queryClient.ts           # React Query configuration & key factories
    ├── pages/
    │   ├── PokedexPage.tsx          # Main discovery dashboard
    │   ├── PokemonDetailPage.tsx    # Deep-dive Pokémon profile page
    │   ├── ComparePage.tsx          # Multi-Pokémon comparison view
    │   ├── FavoritesPage.tsx        # Favorites & recently viewed manager
    │   └── ApiVerification.tsx      # Developer API verification & diagnostics
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
        └── index.ts                 # Formatting (height, weight, stats, toDisplayName)
```

---

## 4. Routes Map

| Route | Page | Purpose |
|---|---|---|
| `/` | `PokedexPage` | Primary Pokémon discovery dashboard with filtering, search & pagination |
| `/pokemon/:nameOrId` | `PokemonDetailPage` | Deep-dive profile page with tabbed stats, moves, and evolution lines |
| `/compare` | `ComparePage` | Side-by-side analysis for 2 to 4 selected Pokémon |
| `/favorites` | `FavoritesPage` | Manage favorited Pokémon and review history |
| `/verify` | `ApiVerificationPage` | Developer diagnostics and live API integration tests |

---

## 5. Verification Commands

```powershell
# TypeScript Type Check (0 errors expected)
npm run type-check

# ESLint Check (0 errors, 0 warnings expected)
npm run lint

# Production Build
npm run build

# Start Local Dev Server
npm run dev
```

---

## 6. Git Commands to Commit & Push Feature Branch

```powershell
# 1. Verify you are on the feature branch
git branch

# 2. Stage all dashboard implementation files
git add .

# 3. Commit with semantic message
git commit -m "feat(dashboard): implement pokemon discovery, details, comparison, and favorites"

# 4. Push to remote feature branch
git push -u origin feature/pokemon-dashboard
```

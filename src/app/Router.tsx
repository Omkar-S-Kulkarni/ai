// ============================================================
// App Router
// src/app/Router.tsx
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import { PokedexPage } from '@/pages/PokedexPage'
import { PokemonDetailPage } from '@/pages/PokemonDetailPage'
import { ComparePage } from '@/pages/ComparePage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { ApiVerificationPage } from '@/pages/ApiVerification'
import { WorldMapPage } from '@/pages/WorldMapPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Main Pokémon Discovery Dashboard */}
        <Route path="/" element={<PokedexPage />} />

        {/* Dedicated Pokémon Profile Deep-Dive */}
        <Route path="/pokemon/:nameOrId" element={<PokemonDetailPage />} />

        {/* Multi-Pokémon Comparison Analysis */}
        <Route path="/compare" element={<ComparePage />} />

        {/* Favorites & History */}
        <Route path="/favorites" element={<FavoritesPage />} />

        {/* Developer Integration Verification */}
        <Route path="/verify" element={<ApiVerificationPage />} />
      </Route>

      {/* Full-viewport Interactive World Map */}
      <Route path="/map" element={<WorldMapPage />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


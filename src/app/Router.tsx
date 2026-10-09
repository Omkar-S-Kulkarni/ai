// ============================================================
// App Router
// src/app/Router.tsx
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { ApiVerificationPage } from '@/pages/ApiVerification'
import { WorldMapPage } from '@/pages/WorldMapPage'

export function AppRouter() {
  return (
    <Routes>
      {/* Main world map — default landing */}
      <Route path="/" element={<WorldMapPage />} />
      {/* Interactive world map (explicit) */}
      <Route path="/map" element={<WorldMapPage />} />
      {/* Dev verification page */}
      <Route path="/verify" element={<ApiVerificationPage />} />
      {/* Future routes will be added in later phases */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

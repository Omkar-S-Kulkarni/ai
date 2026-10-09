// ============================================================
// App Router
// src/app/Router.tsx
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { ApiVerificationPage } from '@/pages/ApiVerification'

export function AppRouter() {
  return (
    <Routes>
      {/* Dev verification page — root for now */}
      <Route path="/" element={<ApiVerificationPage />} />
      <Route path="/verify" element={<ApiVerificationPage />} />
      {/* Future routes will be added in later phases */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

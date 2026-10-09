// ============================================================
// AppLayout Component
// src/components/layout/AppLayout.tsx
// ============================================================

import React from 'react'
import { Outlet } from 'react-router-dom'
import { AppNavbar } from './AppNavbar'
import { SelectionTray } from './SelectionTray'
import { OfflineBanner } from '@/reliability'

export function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <AppNavbar />

      {/* Network & Offline Status Banner */}
      <OfflineBanner />

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        {children || <Outlet />}
      </main>

      {/* Floating Selection Tray */}
      <SelectionTray />
    </div>
  )
}

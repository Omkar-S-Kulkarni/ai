// ============================================================
// AppNavbar Component
// src/components/layout/AppNavbar.tsx
// ============================================================

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sparkles,
  Heart,
  Scale,
  Code2,
  Menu,
  X,
  Compass,
  Globe,
} from 'lucide-react'
import { usePokemonContext } from '@/context/PokemonContext'

export function AppNavbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { selectedPokemon, favorites } = usePokemonContext()

  const navItems = [
    { label: 'Pokédex', path: '/', icon: Compass },
    { label: 'World Map', path: '/map', icon: Globe },
    {
      label: 'Compare',
      path: '/compare',
      icon: Scale,
      badge: selectedPokemon.length > 0 ? selectedPokemon.length : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      label: 'Favorites',
      path: '/favorites',
      icon: Heart,
      badge: favorites.length > 0 ? favorites.length : undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    { label: 'API Diagnostics', path: '/verify', icon: Code2 },
  ]

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-extrabold text-lg">P</span>
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg bg-gradient-to-r from-slate-100 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  PokéVerse
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  v0.1
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5">
                Pokémon Discovery & World Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isActive
                        ? 'bg-slate-800 text-indigo-300 border border-slate-700 shadow-sm'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium
                  ${
                    isActive
                      ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800'
                      : 'text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}

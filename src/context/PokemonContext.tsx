/* eslint-disable react-refresh/only-export-components */
// ============================================================
// Pokémon Context
// src/context/PokemonContext.tsx
// ============================================================
// Manages global selection tray, favorites, and recently viewed Pokémon.
// Persists favorites and recent history to localStorage.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { PokemonSummary } from '@/types'

const MAX_SELECTED = 4
const MAX_RECENT = 10

const FAVORITES_STORAGE_KEY = 'pokeverse_favorites_v1'
const RECENT_STORAGE_KEY = 'pokeverse_recent_v1'

export interface PokemonContextValue {
  // Selection Tray
  selectedPokemon: PokemonSummary[]
  toggleSelect: (pokemon: PokemonSummary) => void
  isPokemonSelected: (id: number) => boolean
  removeSelected: (id: number) => void
  clearSelection: () => void
  selectAll: (list: PokemonSummary[]) => void
  maxSelected: number

  // Favorites
  favorites: number[]
  toggleFavorite: (id: number) => void
  isFavorite: (id: number) => boolean
  clearFavorites: () => void

  // Recently Viewed
  recentViewed: number[]
  addRecentlyViewed: (id: number) => void
  clearRecentlyViewed: () => void
}

const PokemonContext = createContext<PokemonContextValue | null>(null)

export const PokemonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Selection Tray (in-memory for active session)
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonSummary[]>([])

  // Favorites (localStorage)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as number[]) : []
    } catch {
      return []
    }
  })

  // Recently Viewed (localStorage)
  const [recentViewed, setRecentViewed] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as number[]) : []
    } catch {
      return []
    }
  })

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    } catch (e) {
      console.warn('Failed to persist favorites to localStorage', e)
    }
  }, [favorites])

  // Persist recently viewed
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentViewed))
    } catch (e) {
      console.warn('Failed to persist recently viewed to localStorage', e)
    }
  }, [recentViewed])

  // Selection Tray handlers
  const toggleSelect = useCallback((pokemon: PokemonSummary) => {
    setSelectedPokemon((prev) => {
      const exists = prev.some((p) => p.id === pokemon.id)
      if (exists) {
        return prev.filter((p) => p.id !== pokemon.id)
      }
      if (prev.length >= MAX_SELECTED) {
        // Replace oldest if full or prevent
        return [...prev.slice(1), pokemon]
      }
      return [...prev, pokemon]
    })
  }, [])

  const isPokemonSelected = useCallback(
    (id: number) => selectedPokemon.some((p) => p.id === id),
    [selectedPokemon],
  )

  const removeSelected = useCallback((id: number) => {
    setSelectedPokemon((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedPokemon([])
  }, [])

  const selectAll = useCallback((list: PokemonSummary[]) => {
    setSelectedPokemon(list.slice(0, MAX_SELECTED))
  }, [])

  // Favorites handlers
  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id],
    )
  }, [])

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  )

  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  // Recently Viewed handlers
  const addRecentlyViewed = useCallback((id: number) => {
    setRecentViewed((prev) => {
      const filtered = prev.filter((rId) => rId !== id)
      return [id, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  const clearRecentlyViewed = useCallback(() => {
    setRecentViewed([])
  }, [])

  const value: PokemonContextValue = {
    selectedPokemon,
    toggleSelect,
    isPokemonSelected,
    removeSelected,
    clearSelection,
    selectAll,
    maxSelected: MAX_SELECTED,
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    recentViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
  }

  return <PokemonContext.Provider value={value}>{children}</PokemonContext.Provider>
}

export function usePokemonContext(): PokemonContextValue {
  const context = useContext(PokemonContext)
  if (!context) {
    throw new Error('usePokemonContext must be used within a PokemonProvider')
  }
  return context
}

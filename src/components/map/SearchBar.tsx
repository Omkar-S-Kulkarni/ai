// ============================================================
// SearchBar Component
// src/components/map/SearchBar.tsx
// ============================================================
// Location search bar with debounce, keyboard navigation, and
// dropdown results list. Uses Nominatim geocoding service.

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin, Loader2, AlertCircle } from 'lucide-react'
import { useLocationSearch } from '@/hooks/useGeocoding'
import type { GeocodingResult } from '@/types'

// ------------------------------------------------------------------
// Simple debounce hook
// ------------------------------------------------------------------
function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debouncedValue
}

// ------------------------------------------------------------------
// Props
// ------------------------------------------------------------------
interface SearchBarProps {
  onLocationSelected: (result: GeocodingResult) => void
  placeholder?: string
  className?: string
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export function SearchBar({
  onLocationSelected,
  placeholder = 'Search for a country, city, or region…',
  className = '',
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce to respect Nominatim 1 req/s policy
  const debouncedQuery = useDebounce(inputValue, 400)

  const {
    data: results = [],
    isFetching,
    isError,
    error,
  } = useLocationSearch(debouncedQuery, isOpen)

  // ------------------------------------------------------------------
  // Handle result selection
  // ------------------------------------------------------------------
  const selectResult = useCallback(
    (result: GeocodingResult) => {
      onLocationSelected(result)
      setInputValue(result.shortName)
      setIsOpen(false)
      setActiveIndex(-1)
    },
    [onLocationSelected],
  )

  // ------------------------------------------------------------------
  // Keyboard navigation in the dropdown
  // ------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false)
          setInputValue('')
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((i) => (i + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((i) => (i - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && results[activeIndex]) {
            selectResult(results[activeIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setActiveIndex(-1)
          inputRef.current?.focus()
          break
        case 'Tab':
          setIsOpen(false)
          break
      }
    },
    [isOpen, results, activeIndex, selectResult],
  )

  // ------------------------------------------------------------------
  // Close on outside click
  // ------------------------------------------------------------------
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // ------------------------------------------------------------------
  // Auto-open dropdown when we have results
  // ------------------------------------------------------------------
  useEffect(() => {
    if (results.length > 0 && inputValue.trim().length >= 3) {
      setIsOpen(true)
    }
  }, [results, inputValue])

  // ------------------------------------------------------------------
  // Scroll active item into view
  // ------------------------------------------------------------------
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const handleClear = () => {
    setInputValue('')
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const errorMessage = isError
    ? ((error as { code?: string; message?: string })?.message ?? 'Search failed')
    : null

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          id="location-search-input"
          type="search"
          role="combobox"
          aria-label="Search for a location"
          aria-expanded={isOpen}
          aria-controls="location-search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
          aria-autocomplete="list"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setActiveIndex(-1)
            if (e.target.value.trim().length < 3) setIsOpen(false)
          }}
          onFocus={() => {
            if (results.length > 0 && inputValue.trim().length >= 3) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-3
            bg-slate-800/90 backdrop-blur-md
            border border-slate-600/60
            rounded-xl
            text-slate-100 placeholder-slate-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/50
            transition-all duration-200
            shadow-xl shadow-black/30
          "
          autoComplete="off"
          spellCheck={false}
        />
        {isFetching && (
          <Loader2 className="absolute right-3.5 h-4 w-4 text-indigo-400 animate-spin" />
        )}
        {!isFetching && inputValue && (
          <button
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (results.length > 0 || isFetching || errorMessage) && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="
              absolute top-full left-0 right-0 mt-2 z-50
              bg-slate-800/95 backdrop-blur-md
              border border-slate-600/60
              rounded-xl overflow-hidden
              shadow-2xl shadow-black/40
            "
          >
            {/* Error */}
            {errorMessage && !isFetching && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Loading */}
            {isFetching && results.length === 0 && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-slate-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-indigo-400" />
                <span>Searching…</span>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && !errorMessage && (
              <ul
                ref={listRef}
                id="location-search-listbox"
                role="listbox"
                aria-label="Location search results"
                className="py-1 max-h-72 overflow-y-auto"
              >
                {results.map((result, index) => (
                  <li
                    key={result.placeId}
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => selectResult(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`
                      flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100
                      ${activeIndex === index
                        ? 'bg-indigo-600/30 text-slate-100'
                        : 'hover:bg-slate-700/60 text-slate-300'
                      }
                    `}
                  >
                    <MapPin className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-snug">
                        {result.shortName}
                      </p>
                      <p className="text-xs text-slate-500 truncate leading-snug mt-0.5">
                        {result.displayName}
                      </p>
                    </div>
                    {result.category && (
                      <span className="text-xs text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded capitalize flex-shrink-0 mt-0.5">
                        {result.type}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Attribution — REQUIRED by Nominatim policy */}
            <div className="px-4 py-1.5 border-t border-slate-700/50 text-xs text-slate-500 flex items-center gap-1">
              <span>Geocoding by</span>
              <a
                href="https://nominatim.openstreetmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Nominatim
              </a>
              <span>·</span>
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                © OpenStreetMap contributors
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

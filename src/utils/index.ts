// ============================================================
// Utility Functions
// src/utils/index.ts
// ============================================================

// ------------------------------------------------------------------
// Pokémon display utilities
// ------------------------------------------------------------------

/** Format Pokémon height from decimetres to metres */
export function formatHeight(decimetres: number): string {
  const metres = decimetres / 10
  return `${metres.toFixed(1)} m`
}

/** Format Pokémon weight from hectograms to kg */
export function formatWeight(hectograms: number): string {
  const kg = hectograms / 10
  return `${kg.toFixed(1)} kg`
}

/** Zero-pad Pokédex number: 1 → "#001", 100 → "#100", 1000 → "#1000" */
export function formatPokedexNumber(id: number): string {
  return `#${String(id).padStart(3, '0')}`
}

/** Convert stat name to readable label */
export function formatStatName(name: string): string {
  const labels: Record<string, string> = {
    hp: 'HP',
    attack: 'Atk',
    defense: 'Def',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed',
  }
  return labels[name] ?? name
}

/** Return a tailwind color class for a stat bar based on value */
export function getStatColor(value: number): string {
  if (value >= 100) return 'bg-green-500'
  if (value >= 70)  return 'bg-lime-400'
  if (value >= 50)  return 'bg-yellow-400'
  if (value >= 30)  return 'bg-orange-400'
  return 'bg-red-500'
}

/** Max base stat is 255 (HP of Blissey); use 255 for the bar max */
export const MAX_BASE_STAT = 255

/** Compute stat percentage for progress bar */
export function statPercent(value: number): number {
  return Math.min(100, (value / MAX_BASE_STAT) * 100)
}

// ------------------------------------------------------------------
// Type colors
// ------------------------------------------------------------------
const TYPE_CLASS_MAP: Record<string, string> = {
  normal:   'type-normal',
  fire:     'type-fire',
  water:    'type-water',
  grass:    'type-grass',
  electric: 'type-electric',
  ice:      'type-ice',
  fighting: 'type-fighting',
  poison:   'type-poison',
  ground:   'type-ground',
  flying:   'type-flying',
  psychic:  'type-psychic',
  bug:      'type-bug',
  rock:     'type-rock',
  ghost:    'type-ghost',
  dragon:   'type-dragon',
  dark:     'type-dark',
  steel:    'type-steel',
  fairy:    'type-fairy',
}

export function getTypeClass(typeName: string): string {
  return TYPE_CLASS_MAP[typeName.toLowerCase()] ?? 'bg-slate-500 text-white'
}

// ------------------------------------------------------------------
// String utilities
// ------------------------------------------------------------------
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function slugToLabel(slug: string): string {
  return slug.split('-').map(capitalize).join(' ')
}

// ------------------------------------------------------------------
// Error extraction
// ------------------------------------------------------------------
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  const e = error as { message?: string }
  return e.message ?? 'An unexpected error occurred'
}

// ------------------------------------------------------------------
// Image fallback helper
// ------------------------------------------------------------------
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackSrc = '/pokeball-placeholder.png',
): void {
  const img = event.currentTarget
  if (img.src !== fallbackSrc) {
    img.src = fallbackSrc
  }
}

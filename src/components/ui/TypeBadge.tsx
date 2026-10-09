// ============================================================
// TypeBadge Component
// src/components/ui/TypeBadge.tsx
// ============================================================

import { getTypeClass, capitalize } from '@/utils'

interface TypeBadgeProps {
  type: string
  size?: 'sm' | 'md' | 'lg'
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size]

  return (
    <span
      className={`badge font-semibold rounded-md ${getTypeClass(type)} ${sizeClass}`}
    >
      {capitalize(type)}
    </span>
  )
}

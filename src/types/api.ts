// ============================================================
// API Shared Types
// src/types/api.ts
// ============================================================

// ------------------------------------------------------------------
// Generic API result wrapper
// ------------------------------------------------------------------
export interface ApiResult<T> {
  data: T | null
  error: ApiError | null
  isLoading: boolean
}

export interface ApiError {
  message: string
  status?: number
  code?: string
  raw?: unknown
}

// ------------------------------------------------------------------
// Pagination params
// ------------------------------------------------------------------
export interface PaginationParams {
  limit: number
  offset: number
}

export interface PaginationMeta {
  count: number
  currentPage: number
  totalPages: number
  limit: number
  offset: number
  hasNext: boolean
  hasPrevious: boolean
}

// ------------------------------------------------------------------
// Deployment configuration (future)
// ------------------------------------------------------------------
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production'
  apiBaseUrl: string
  pokemonApiUrl: string
  geolocationApiUrl: string
  enableDevTools: boolean
  /** Feature flags for progressive rollout */
  features: {
    worldMap: boolean
    competitions: boolean
    simulation: boolean
    socialFeatures: boolean
  }
}

// ============================================================
// Axios HTTP Client
// src/lib/httpClient.ts
// ============================================================

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { POKEAPI_CONFIG } from './config'

// ------------------------------------------------------------------
// PokéAPI client
// ------------------------------------------------------------------
export const pokemonApiClient: AxiosInstance = axios.create({
  baseURL: POKEAPI_CONFIG.baseUrl,
  timeout: POKEAPI_CONFIG.timeoutMs,
  headers: {
    Accept: 'application/json',
  },
})

// Response interceptor — normalize errors
pokemonApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject({ code: 'CANCELLED', message: 'Request cancelled' })
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ code: 'TIMEOUT', message: 'Request timed out' })
    }
    if (error.response) {
      const status = error.response.status as number
      const message =
        status === 404
          ? 'Pokémon not found'
          : status === 429
            ? 'Rate limited — please wait before retrying'
            : `API error: ${status}`
      return Promise.reject({ code: 'API_ERROR', message, status, raw: error.response })
    }
    return Promise.reject({ code: 'NETWORK_ERROR', message: 'Network error — check your connection', raw: error })
  },
)

// ------------------------------------------------------------------
// Generic geolocation client (no default baseURL — set per request)
// ------------------------------------------------------------------
export const geoApiClient: AxiosInstance = axios.create({
  timeout: 8_000,
  headers: {
    Accept: 'application/json',
  },
})

geoApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject({ code: 'CANCELLED', message: 'Request cancelled' })
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ code: 'TIMEOUT', message: 'Geolocation request timed out' })
    }
    if (error.message?.includes('Network Error') || error.message?.includes('Mixed Content')) {
      return Promise.reject({
        code: 'MIXED_CONTENT',
        message:
          'Cannot reach IP geolocation API from this origin. ' +
          'The ip-api.com free endpoint is HTTP-only and will be blocked on HTTPS pages. ' +
          'Switch to a paid plan or proxy requests through your backend.',
        raw: error,
      })
    }
    return Promise.reject({ code: 'NETWORK_ERROR', message: 'Geolocation network error', raw: error })
  },
)

// ------------------------------------------------------------------
// Utility: create a cancelable request config
// ------------------------------------------------------------------
export function makeCancelable(signal?: AbortSignal): AxiosRequestConfig {
  return signal ? { signal } : {}
}

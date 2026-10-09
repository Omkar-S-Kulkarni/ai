// ============================================================
// Service Worker Registration
// src/reliability/serviceWorker/registerServiceWorker.ts
// ============================================================

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: Error) => void
}

export function registerServiceWorker(config: ServiceWorkerConfig = {}): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // Register only in production or when explicitly enabled
  window.addEventListener('load', () => {
    const swUrl = '/sw.js'

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available; please refresh.
                console.info('PokéVerse update available. Ready to reload.')
                if (config.onUpdate) config.onUpdate(registration)
              } else {
                // Content is cached for offline use.
                console.info('PokéVerse is cached for offline use.')
                if (config.onSuccess) config.onSuccess(registration)
              }
            }
          }
        }
      })
      .catch((error) => {
        console.warn('Error during service worker registration:', error)
        if (config.onError) config.onError(error)
      })
  })
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

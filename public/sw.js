// ============================================================
// PokéVerse Service Worker
// public/sw.js
// ============================================================

const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `pokeverse-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `pokeverse-runtime-${CACHE_VERSION}`
const SPRITES_CACHE = `pokeverse-sprites-${CACHE_VERSION}`

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
]

// ------------------------------------------------------------
// Install Event: Precache Essential App Shell
// ------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// ------------------------------------------------------------
// Activate Event: Clean Outdated Caches
// ------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, SPRITES_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              return caches.delete(cacheName)
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// ------------------------------------------------------------
// Fetch Event: Caching Strategies
// ------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // 1. Navigation Requests: Network-first with App Shell / offline.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation page
          const responseClone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone))
          return response
        })
        .catch(async () => {
          const cachedPage = await caches.match(request)
          if (cachedPage) return cachedPage
          const shell = await caches.match('/index.html')
          if (shell) return shell
          return caches.match('/offline.html')
        }),
    )
    return
  }

  // 2. Pokémon Sprites & Artwork: Stale-While-Revalidate
  if (url.hostname.includes('raw.githubusercontent.com') && url.pathname.includes('sprites')) {
    event.respondWith(
      caches.open(SPRITES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      }),
    )
    return
  }

  // 3. Static Assets (JS, CSS, Fonts, Icons): Cache-First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2|woff|ttf|ico)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      }),
    )
    return
  }

  // 4. API Requests (PokéAPI, Geocoding): Network-first with cache fallback
  if (url.hostname.includes('pokeapi.co') || url.hostname.includes('openstreetmap.org')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          return new Response(JSON.stringify({ error: 'Offline - resource not cached' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        }),
    )
    return
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request).catch(async () => {
      return caches.match(request)
    }),
  )
})

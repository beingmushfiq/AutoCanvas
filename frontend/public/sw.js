// AutoCanvas Unified Service Worker by DevCenterPoint
// Caches static app shells, fonts, and assets while ensuring resilient offline fallbacks.

const CACHE_NAME = 'autocanvas-v2-cache'
const OFFLINE_URL = '/offline.html'

const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/brand/symbol-dark.svg',
  '/brand/logo-horizontal-dark.svg',
  '/manifest-landing.json',
  '/manifest-app.json',
  '/manifest-master.json',
  OFFLINE_URL
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Navigation requests: Network first with offline HTML fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
    return
  }

  // Static assets (styles, scripts, images, fonts): Cache-first with network background fetch
  const url = new URL(event.request.url)
  const isStatic = url.pathname.startsWith('/assets/') ||
                   url.pathname.startsWith('/brand/') ||
                   url.pathname.endsWith('.svg') ||
                   url.pathname.endsWith('.css') ||
                   url.pathname.endsWith('.js')

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse))
            }
          }).catch(() => {})
          return cachedResponse
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          }
          return networkResponse
        })
      })
    )
    return
  }

  // API endpoints: Network-first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    })
  )
})


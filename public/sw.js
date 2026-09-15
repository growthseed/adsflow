/**
 * ============================================
 * AdsFlow service worker — minimalist PWA shell cache
 * ============================================
 * Strategy:
 *   - Navigation requests: network-first, fall back to the cached
 *     index shell (lets the SPA boot offline, then hydrate from IDB).
 *   - Static assets (js/css/svg/png/woff2): cache-first with
 *     background refresh (stale-while-revalidate).
 *   - Supabase / external API calls: pass-through (never cached).
 *
 * Versioning: bump CACHE_VERSION to invalidate old shells.
 * ============================================
 */

const CACHE_VERSION = 'adsflow-v2'
const SHELL_URLS = ['/', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept cross-origin (Supabase, Meta/Google APIs, etc.)
  if (url.origin !== self.location.origin) return

  // Never cache POST/PUT/DELETE
  if (request.method !== 'GET') return

  // Navigation requests — network-first with shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache a copy of the index shell for offline boot
          const clone = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put('/', clone))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Static assets — network-first. Hashed filenames already provide cache
  // safety; network-first also prevents an old service-worker shell from
  // keeping a previous deployment alive after a hard refresh.
  if (/\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone())
            return res
          })
          .catch(() => cache.match(request)),
      ),
    )
  }
})

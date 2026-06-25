// Smoke Command Service Worker
const CACHE = 'smoke-command-v1'
const OFFLINE_URL = '/offline'

const PRECACHE = [
  '/',
  '/login',
  '/jobs',
  '/crew',
  '/leads',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('supabase.co')) return // never cache API calls

  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return response
      })
      .catch(() => caches.match(e.request).then(r => r || fetch(e.request)))
  )
})

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Smoke Command', {
      body: data.body || 'You have a new update.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/jobs' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const url = e.notification.data?.url || '/jobs'
      const existing = list.find(c => c.url.includes(url))
      return existing ? existing.focus() : clients.openWindow(url)
    })
  )
})

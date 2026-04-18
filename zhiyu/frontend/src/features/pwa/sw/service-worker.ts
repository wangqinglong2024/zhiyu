/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

const CACHE_VERSION = 'v1'
const SHELL_CACHE = `shell-${CACHE_VERSION}`
const FONT_CACHE = `fonts-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`
const API_CACHE = `api-${CACHE_VERSION}`

const MAX_IMAGE_CACHE = 200

const SHELL_FILES = [
  '/',
  '/index.html',
]

// ===== 安装: 预缓存 App Shell =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_FILES))
  )
})

// ===== 激活: 清理旧缓存 =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !key.endsWith(CACHE_VERSION))
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ===== Fetch: 分层缓存策略 =====
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求
  if (request.method !== 'GET') return

  // 跳过含 token 的 API（用户数据不缓存敏感信息）
  if (request.headers.get('Authorization')) return

  // App Shell (HTML/CSS/JS) — Cache First
  if (url.origin === self.location.origin && (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style'
  )) {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // 字体 — Cache First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, FONT_CACHE))
    return
  }

  // 图片 — Cache First + LRU
  if (request.destination === 'image') {
    event.respondWith(cacheFirstLRU(request, IMAGE_CACHE, MAX_IMAGE_CACHE))
    return
  }

  // 语言包 API — Stale While Revalidate
  if (url.pathname.startsWith('/api/v1/i18n/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE))
    return
  }

  // 其他 API — Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }
})

// ===== 推送通知处理 =====
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json() as {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: { url?: string }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-72.png',
      data: data.data,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

// ===== 缓存策略实现 =====

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function cacheFirstLRU(request: Request, cacheName: string, maxEntries: number): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    // LRU 淘汰
    const keys = await cache.keys()
    if (keys.length > maxEntries && keys[0]) {
      await cache.delete(keys[0])
    }
  }
  return response
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  })

  return cached || fetchPromise
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

export {}

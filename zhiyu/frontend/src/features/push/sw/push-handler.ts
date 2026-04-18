// Service Worker 推送处理逻辑
// 此文件的内容需要在 Service Worker 中使用

export function setupPushHandler(self: ServiceWorkerGlobalScope) {
  self.addEventListener('push', (event: PushEvent) => {
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

  self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close()
    const url = event.notification.data?.url || '/'

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        // 复用已有窗口
        for (const client of clients) {
          if ('focus' in client) {
            client.focus()
            client.navigate(url)
            return
          }
        }
        // 打开新窗口
        return self.clients.openWindow(url)
      })
    )
  })
}

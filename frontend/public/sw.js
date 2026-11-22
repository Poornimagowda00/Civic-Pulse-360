self.addEventListener('push', (event) => {
  let data = { title: 'Civic Pulse 360', body: 'You have an important civic update.' }
  try {
    data = event.data ? event.data.json() : data
  } catch {
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: data.url ? { url: data.url } : undefined,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(target))
})

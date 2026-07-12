// Service Worker MemoryLine — mode hors-ligne
// Cache les assets principaux pour permettre la consultation sans connexion

const CACHE_NAME = 'histoire-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
  '/hero-couple.jpg',
];

// Install : pré-cache les assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate : nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch : stratégie cache-first pour les assets, network-first pour le reste
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Ignore les requêtes non-GET (POST, etc.)
  if (req.method !== 'GET') return;

  // Ignore les requêtes vers Supabase / API externes (toujours réseau)
  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('resend.com')) {
    return;
  }

  // Pour les assets statiques (CSS, JS, images) : cache-first
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // Pour les pages (navigation) : network-first, fallback cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/').then(() => caches.match('/dashboard'));
      })
    );
    return;
  }
});

// Push notifications (reçu depuis le serveur)
self.addEventListener('push', (event) => {
  let data = { title: 'MemoryLine', body: 'Nouvelle notification' };
  try {
    data = event.data.json();
  } catch {
    data = { title: 'MemoryLine', body: event.data?.text() ?? 'Notification' };
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/dashboard' },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, focus dessus
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvre une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

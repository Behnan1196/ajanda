const CACHE_NAME = 'ajanda-cache-v2';

// Minimal assets to cache
const PRE_CACHE_ASSETS = [
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/apple-touch-icon-180x180.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRE_CACHE_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle same-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Skip caching for navigation requests to avoid "Response served by service worker has redirections" error in Safari
    if (event.request.mode === 'navigate') return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'Hatırlatıcı';
    const options = {
        body: data.body || 'Bir göreviniz yaklaşıyor.',
        icon: '/icons/icon-512x512.png',
        badge: '/icons/icon-512x512.png',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

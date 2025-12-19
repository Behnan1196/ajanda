const CACHE_NAME = 'ajanda-cache-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['/']);
        })
    );
});

self.addEventListener('fetch', (event) => {
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

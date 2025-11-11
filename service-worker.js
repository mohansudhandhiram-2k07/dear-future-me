const CACHE_NAME = 'selfe-cache-v1';
const assets = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/entry.html',
  '/friends.html',
  '/settings.html',
  '/assets/css/style.css',
  '/assets/audio/reminder.mp3'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets)).catch(()=>{})
  );
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});

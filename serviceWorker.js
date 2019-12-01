const cacheName = 'elektu-pwa';
const filesToCache = [
  '/elektu/index.html',
  '/elektu/style.css',
  '/elektu/elektu.js',
  '/elektu/img/fullscreen-checked.svg',
  '/elektu/img/fullscreen-unchecked.svg',
  '/elektu/img/group-checked.svg',
  '/elektu/img/group-unchecked.svg',
  '/elektu/img/help-checked.svg',
  '/elektu/img/help-unchecked.svg',
  '/elektu/img/ordinate-checked.svg',
  '/elektu/img/ordinate-unchecked.svg',
  '/elektu/img/select-checked.svg',
  '/elektu/img/select-unchecked.svg',
  '/elektu/img/vibration-checked.svg',
  '/elektu/img/vibration-unchecked.svg',
  '/elektu/img/GitHub-Mark-Light-32px.png'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll(filesToCache);
        })
    );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(response) {
            return response || fetch(e.request);
        })
    );
});

const cacheName = "elektu-pwa-v0.9"
const filesToCache = [
  "/index.html",
  "/style.min.css",
  "/elektu.min.js",
  "/img/fullscreen-checked.svg",
  "/img/fullscreen-unchecked.svg",
  "/img/group-checked.svg",
  "/img/group-unchecked.svg",
  "/img/help-checked.svg",
  "/img/help-unchecked.svg",
  "/img/ordinate-checked.svg",
  "/img/ordinate-unchecked.svg",
  "/img/select-checked.svg",
  "/img/select-unchecked.svg",
  "/img/vibration-checked.svg",
  "/img/vibration-unchecked.svg",
  "/img/GitHub-Mark-Light-32px.png"
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        console.log('[Service Worker] Caching all: app shell and content');
        await cache.addAll(filesToCache);
    })());
});

/* Serve cached content when offline */
self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then(function(response) {
            return response || fetch(e.request);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        const r = await caches.match(e.request);
        console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
        if (r) {
            return r;
        }
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
        console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
        cache.put(e.request, response.clone());
        return response;
    })());
});

self.addEventListener("activate", (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        Promise.all(keyList.map((key) => {
            if (key === cacheName) {
                return;
            }
            caches.delete(key);
        }))
    })());
});
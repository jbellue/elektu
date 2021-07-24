const cacheName = "elektu-pwa-v0.9.3";
const filesToCache = [
  "/elektu/index.html",
  "/elektu/style.min.css",
  "/elektu/elektu.min.js",
  "/elektu/img/fullscreen-checked.svg",
  "/elektu/img/fullscreen-unchecked.svg",
  "/elektu/img/group-checked.svg",
  "/elektu/img/group-unchecked.svg",
  "/elektu/img/help-checked.svg",
  "/elektu/img/help-unchecked.svg",
  "/elektu/img/ordinate-checked.svg",
  "/elektu/img/ordinate-unchecked.svg",
  "/elektu/img/select-checked.svg",
  "/elektu/img/select-unchecked.svg",
  "/elektu/img/vibration-checked.svg",
  "/elektu/img/vibration-unchecked.svg",
  "/elektu/img/GitHub-Mark-Light-32px.png"
];

/* Start the service worker and cache all of the app's content */
self.addEventListener("install", (e) => {
    e.waitUntil((async () => {
        /* eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe as no value holds user input */
        const cache = await caches.open(cacheName);
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

self.addEventListener("fetch", (e) => {
    e.respondWith((async () => {
        const r = await caches.match(e.request);
        if (r) {
            return r;
        }
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
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
        }));
    })());
});
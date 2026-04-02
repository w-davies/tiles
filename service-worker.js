const CACHE_NAME = "tiletracker-v1";

const ASSETS = [
  "./",
  "index.html",
  "manifest.json",
];

// Install: cache files
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Fetch: serve from cache, fall back to network
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
``

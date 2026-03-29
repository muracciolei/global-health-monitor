const CACHE_NAME = "medpulse-v2";

const STATIC_FILES = [
  "index.html",
  "css/styles.css",
  "js/app.js",
  "js/rss.js",
  "js/parser.js",
  "js/storage.js",
  "js/charts.js",
  "icons/icon.svg",
  "data/sources.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Network-first for navigation requests (HTML pages)
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request)
      .then(res => res || fetch(e.request))
  );
});

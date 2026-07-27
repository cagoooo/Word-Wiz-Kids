const CACHE_NAME = "vocab-kids-cache-v18";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=9",
  "./icon.png?v=9",
  "./favicon.png?v=9",
  "./favicon.svg?v=9",
  "./og-image.png?v=9"
];

// Force SW skipWaiting on explicit user click message only
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn("Failed to cache some assets during install", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-First for ALL requests to completely eliminate stale cache issues
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude dev tools, Vite client, and node_modules
  if (
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/@react-refresh') ||
    url.pathname.includes('/node_modules')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

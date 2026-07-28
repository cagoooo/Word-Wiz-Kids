// CI 注入「workflow run number + commit hash」；同一 commit 重跑時版本保持不變。
const BUILD_VERSION = "40-269950a43dc6";
const CACHE_NAME = `vocab-kids-${BUILD_VERSION}`;
const ASSETS = [
  "./manifest.webmanifest?v=10",
  "./icon.png?v=10",
  "./favicon.png?v=10",
  "./favicon.svg?v=10",
  "./og-image.png?v=10"
];

// Force SW skipWaiting on explicit user click message only
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0]?.postMessage({ version: BUILD_VERSION });
  } else if (event.data && event.data.type === "SKIP_WAITING") {
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
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SW_ACTIVATED", version: BUILD_VERSION });
        });
      })
  );
});

// Network-First for ALL requests to completely eliminate stale cache issues
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 只處理一般網路 GET；version.json 永遠交給網路，避免輪詢結果被 SW 快取。
  if (
    event.request.method !== "GET" ||
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.pathname.endsWith("/version.json") ||
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
          if (networkResponse.type === "opaque") return networkResponse;
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

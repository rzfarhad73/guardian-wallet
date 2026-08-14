// Guardian Wallet Firewall — Service Worker
// Strategy:
//   /_next/static/** → cache-first (hashed filenames, safe to cache indefinitely)
//   /api/**          → network-only (QVAC requires fresh server response)
//   navigation       → network-first + offline fallback (/offline)
//   everything else  → network-first
//
// Bump CACHE_NAME on deploy to force clients to re-fetch updated assets.

const CACHE_NAME = "guardian-v2";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: "window" }).then((clients) => {
          for (const client of clients) {
            client.postMessage({ type: "SW_UPDATED" });
          }
        })
      )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes: always network — QVAC needs a live server
  if (url.pathname.startsWith("/api/")) return;

  // Next.js static assets: cache-first (filenames are content-hashed)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // Everything else: network-first (favicon, manifest, icon routes)
  event.respondWith(networkFirst(request));
});

// `Cache.put` rejects outright on a response the Cache API refuses to store — `Vary: *` is the
// common one (dev servers send it) — and the rejection surfaces as an unhandled error in the
// page's console, not as a cache miss. Caching is best-effort here, so drop those on the floor.
async function cacheResponse(request, response) {
  if (!response.ok || response.headers.get("Vary") === "*") return;

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch {
    // an uncacheable response is still a perfectly good response to hand back
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await cacheResponse(request, response);
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(request, response);
    return response;
  } catch {
    return (await caches.match(request)) ?? new Response("Network error", { status: 503 });
  }
}

async function networkFirstNavigate(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? new Response("Offline", { status: 503 });
  }
}

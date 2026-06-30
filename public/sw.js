// Offline scanner service worker (ADR-014). Caches same-origin GETs so /scan and
// its assets work offline after first load; APIs always hit the network.
const CACHE = "sb-scan-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const cached = await c.match(req);
      const net = fetch(req)
        .then((r) => { if (r.ok) c.put(req, r.clone()); return r; })
        .catch(() => cached);
      return cached || net;
    })
  );
});

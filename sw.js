// ═══════════════════════════════════════════════════════════
// SERVICE WORKER - ARUNIWAVES PWA
// File ini di-taruh di root folder (sama level dengan index.html)
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = "aruniwaves-v12";

// File yang di-cache untuk offline
const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "aset/index.html",
  "aset/qr.html",
  "aset/info.html",
  "bbm/index.html",
  "helpdesk/index.html",
  "rapat/index.html",
  "humas/index.html",
  "dashboard/dashboard_kendaraan/index.html",
  "dashboard/dashboard_ekspor/index.html",
  "dashboard/dashboard_ews/index.html",
  "dashboard/dashboard_ews/verifikasi.html",
  "dashboard/dashboard_ews/kabupaten-bali.geojson",
];

// ── Install: cache semua file utama ─────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.error("[SW] Precache install failed:", err))
  );
});

// ── Activate: hapus cache lama ───────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first untuk assets, network-first untuk API ─
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Cache Google Fonts (fonts.googleapis.com and fonts.gstatic.com) using Cache-First strategy
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then(response => {
          if (response && (response.status === 200 || response.status === 0)) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clone))
              .catch(err => console.warn("[SW] Font cache put failed:", err));
          }
          return response;
        });
      })
    );
    return;
  }

  // Jangan cache request ke Apps Script / Telegram API (data selalu fresh)
  if (url.hostname.includes("script.google.com") ||
      url.hostname.includes("api.telegram.org")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first untuk file lokal (HTML, CSS, JS) agar update langsung ter-refresh
  if (event.request.method === "GET") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache response baru yang valid
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clone))
              .catch(err => console.warn("[SW] Cache put failed:", err));
          }
          return response;
        })
        .catch(() => {
          // Jika offline/gagal network, gunakan cache (abaikan query parameters seperti ?tab=)
          return caches.match(event.request, { ignoreSearch: true }).then(cached => {
            if (cached) return cached;
            // Offline fallback
            return caches.match("index.html", { ignoreSearch: true });
          });
        })
    );
  }
});

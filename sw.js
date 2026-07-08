// MagicWrite – Service Worker
// Ermöglicht Offline-Start und Installation als PWA (iOS/Android).
// Bump CACHE_VERSION whenever index.html or a cached asset changes,
// so returning users get the new version instead of a stale cache.
const CACHE_VERSION = 'magicwrite-v3';

// App shell — same-origin files needed to render the app at all.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

// Third-party static assets (fonts, icon lib, Firebase SDK scripts) that
// never change per-request and must be cached so the app still renders
// with no network at all. Fetched with mode:'no-cors' since these are
// cross-origin; the resulting opaque responses can still be cached and
// replayed later.
const CDN_SHELL = [
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@400;500&display=swap',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js',
];

// Hosts that must always go straight to the network — live auth/data
// endpoints, never cached, never used offline.
const NETWORK_ONLY_HOSTS = [
  'firebaseio.com',
  'googleapis.com',
  'google.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      // Best-effort: don't fail install if a CDN asset is briefly unreachable.
      await Promise.all(
        CDN_SHELL.map((url) =>
          fetch(url, { mode: 'no-cors' })
            .then((res) => cache.put(url, res))
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Live Firebase auth/database calls: never intercept, always network.
  if (NETWORK_ONLY_HOSTS.some((host) => url.hostname.endsWith(host))) {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isKnownCdn = CDN_SHELL.some((cdnUrl) => cdnUrl.startsWith(url.origin) || request.url === cdnUrl);

  // Fonts served from fonts.gstatic.com are referenced indirectly by the
  // fonts.googleapis.com stylesheet with URLs we can't know in advance —
  // cache them opportunistically too so they're available offline after
  // the first successful online load.
  const isFontFile = url.hostname === 'fonts.gstatic.com';

  if (!isSameOrigin && !isKnownCdn && !isFontFile) {
    return; // anything else cross-origin: let the browser handle it normally
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(isSameOrigin ? request : new Request(request.url, { mode: 'no-cors' }))
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      // Serve cached shell instantly if available, refresh cache in background.
      return cached || network;
    })
  );
});

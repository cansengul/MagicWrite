// MagicWrite – Service Worker
// Offline-PWA + Firebase/Google Analytics

const CACHE_VERSION = 'magicwrite-v5';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',

  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/logo-mark.png',
];

const CDN_SHELL = [
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@400;500&display=swap',

  'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',

  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics-compat.js',
];


// --------------------------------------------------
// INSTALL
// --------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {

      // Eigene Dateien
      await cache.addAll(APP_SHELL);

      // CDN-Dateien best effort cachen
      await Promise.all(
        CDN_SHELL.map((url) =>
          fetch(url, { mode: 'no-cors' })
            .then((response) => cache.put(url, response))
            .catch(() => {})
        )
      );
    })
  );

  self.skipWaiting();
});


// --------------------------------------------------
// ACTIVATE
// --------------------------------------------------

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});


// --------------------------------------------------
// FETCH
// --------------------------------------------------

self.addEventListener('fetch', (event) => {

  const request = event.request;

  // Nur GET-Anfragen behandeln
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);


  // ------------------------------------------------
  // FIREBASE / GOOGLE ANALYTICS
  // ------------------------------------------------
  //
  // Analytics niemals cachen.
  // Die Requests müssen bei bestehender Verbindung
  // direkt ins Internet gehen.
  //

  const isAnalyticsRequest =
    url.hostname === 'www.google-analytics.com' ||
    url.hostname === 'analytics.google.com' ||
    url.hostname === 'region1.google-analytics.com' ||
    url.hostname === 'region1.analytics.google.com' ||
    url.hostname === 'firebase.googleapis.com';

  if (isAnalyticsRequest) {
    return;
  }


  // ------------------------------------------------
  // LIVE FIREBASE
  // ------------------------------------------------

  const isFirebaseRequest =
    url.hostname.endsWith('firebaseio.com') ||
    url.hostname.endsWith('googleapis.com') ||
    url.hostname.endsWith('google.com');

  if (isFirebaseRequest) {
    return;
  }


  // ------------------------------------------------
  // SAME ORIGIN
  // ------------------------------------------------

  const isSameOrigin =
    url.origin === self.location.origin;


  // ------------------------------------------------
  // BEKANNTE CDN-DATEIEN
  // ------------------------------------------------

  const isKnownCdn =
    CDN_SHELL.some((cdnUrl) =>
      request.url === cdnUrl
    );


  // Google Fonts
  const isFontFile =
    url.hostname === 'fonts.gstatic.com';


  // Andere externe Requests nicht anfassen
  if (
    !isSameOrigin &&
    !isKnownCdn &&
    !isFontFile
  ) {
    return;
  }


  // ------------------------------------------------
  // CACHE FIRST + NETWORK FALLBACK
  // ------------------------------------------------

  event.respondWith(

    caches.match(request).then((cached) => {

      const network = fetch(
        isSameOrigin
          ? request
          : new Request(request.url, {
              mode: 'no-cors'
            })
      )
        .then((response) => {

          if (
            response &&
            (
              response.ok ||
              response.type === 'opaque'
            )
          ) {

            const clone = response.clone();

            caches.open(CACHE_VERSION)
              .then((cache) =>
                cache.put(request, clone)
              );
          }

          return response;
        })
        .catch(() => cached);


      // Offline → Cache
      // Online → Cache sofort + Netzwerk im Hintergrund
      return cached || network;

    })
  );
});

const CACHE_NAME = "modudraft-pwa-v46-overlay-zfix-v1";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./modudraft_fixed.html",
  "./system-cabinet-prototype/",
  "./system-cabinet-prototype/index.html",
  "./system-cabinet-prototype/styles.css",
  "./system-cabinet-prototype/mobile.css",
  "./system-cabinet-prototype/app.js",
  "./system-cabinet-prototype/mobile.js",
  "./shared/modudraft-core.js",
  "./shared/product-suite.js",
  "./shared/mobile-workbench.js",
  "./shared/design-system.css",
  "./shared/product-suite.css",
  "./shared/help-system.js",
  "./shared/help-system.css",
  "./shared/render-workflow.js",
  "./shared/render-workflow.css",
  "./shared/kitchen-assist.js",
  "./shared/kitchen-assist.css",
  "./shared/kitchen-mobile.js",
  "./shared/kitchen-mobile.css",
  "./shared/estimate.js",
  "./shared/estimate.css",
  "./shared/kitchen-workflow.js",
  "./shared/kitchen-workflow.css",
  "./shared/modudraft-ui-v2.css",
  "./assets/kitchen-workbench.png",
  "./assets/system-workbench.png",
  "./manifest.webmanifest",
  "./icons/modudraft-logo-refined.png",
  "./icons/modudraft-192-refined.png",
  "./icons/modudraft-512-refined.png",
  "./icons/mobile-access-qr.png",
  "./icons/tutorial-mobile.png",
  "./icons/tutorial-elevation.png",
  "./icons/tutorial-3d.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request)
          .then((cached) => cached || caches.match("./index.html") || caches.match("./modudraft_fixed.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => new Response("", { status: 503, statusText: "Offline" }));
    })
  );
});

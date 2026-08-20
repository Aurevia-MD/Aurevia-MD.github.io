const CACHE_NAME = "aurevia-demo-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cachedResponse = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/index.html", cachedResponse));

          return response;
        })
        .catch(() => caches.match("/index.html")),
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        const requestUrl = new URL(event.request.url);

        if (response.ok && requestUrl.origin === self.location.origin) {
          const cachedResponse = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, cachedResponse));
        }

        return response;
      });
    }),
  );
});

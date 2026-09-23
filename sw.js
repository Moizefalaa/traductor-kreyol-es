var CACHE = "kreol-es-v39";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./core.js?v=39",
  "./styles.css?v=39",
  "./app.js?v=39",
  "./textos-chile.json?v=39",
  "./vendor/pdf.min.js?v=39",
  "./vendor/pdf.worker.min.js?v=39",
  "./vendor/mammoth.browser.min.js?v=39",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // Best-effort: si un recurso falla (404, timeout), igual se instala el SW
      // con los que sí se pudieron cachear. Antes, un solo fallo rompía todo.
      return Promise.allSettled(ARCHIVOS.map(function (url) { return cache.add(url); }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(
        claves.filter(function (clave) { return clave !== CACHE; })
          .map(function (clave) { return caches.delete(clave); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (evento) {
  if (evento.data && evento.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") return;

  var url = new URL(evento.request.url);
  if (url.origin === location.origin) {
    // Cache-first: los recursos llevan ?v=NN y cambian con cada versión, así
    // que lo cacheado nunca queda obsoleto. Arranque instantáneo y offline real.
    evento.respondWith(
      caches.match(evento.request).then(function (enCache) {
        if (enCache) return enCache;
        return fetch(evento.request).then(function (respuesta) {
          if (respuesta && respuesta.ok) {
            var clon = respuesta.clone();
            caches.open(CACHE).then(function (cache) { cache.put(evento.request, clon); });
          }
          return respuesta;
        }).catch(function () {
          return caches.match(evento.request).then(function (copia) {
            if (copia) return copia;
            if (evento.request.mode === "navigate") {
              return caches.match("./index.html");
            }
            return new Response("Sin conexión", { status: 503, statusText: "Sin conexión" });
          });
        });
      })
    );
  } else {
    evento.respondWith(
      fetch(evento.request).catch(function () {
        return new Response("Sin conexión", { status: 503, statusText: "Sin conexión" });
      })
    );
  }
});



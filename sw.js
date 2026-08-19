var CACHE = "kreol-es-v4";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARCHIVOS);
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

self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") return;

  var url = new URL(evento.request.url);
  if (url.origin === location.origin) {
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
          if (evento.request.mode === "navigate") {
            return caches.match("./index.html");
          }
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
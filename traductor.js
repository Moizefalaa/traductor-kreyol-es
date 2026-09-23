/* Motor de traducción en línea: proveedores, timeout y respaldo.
   Sin DOM ni estado global. Se usa en el navegador (window.KreyolTraductor)
   y en Node (require) para pruebas con un fetch simulado. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.KreyolTraductor = fabrica();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function conTimeout(fetchFn, url, ms) {
    if (typeof AbortController === "undefined") return fetchFn(url);
    var control = new AbortController();
    var temporizador = setTimeout(function () { control.abort(); }, ms || 10000);
    return fetchFn(url, { signal: control.signal }).then(function (resp) {
      clearTimeout(temporizador);
      return resp;
    }, function (err) {
      clearTimeout(temporizador);
      throw err;
    });
  }

  function porGoogle(fetchFn, texto, origen, destino, timeoutMs) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
      origen + "&tl=" + destino + "&dt=t&q=" + encodeURIComponent(texto);
    return conTimeout(fetchFn, url, timeoutMs || 10000)
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (datos) {
        var segmentos = datos && datos[0];
        if (!Array.isArray(segmentos) || !segmentos.length) {
          throw new Error("Respuesta vacía");
        }
        var t = segmentos.map(function (s) { return (s && s[0]) || ""; }).join("");
        if (!t || t === texto) throw new Error("Sin traducción");
        return t;
      });
  }

  function porMyMemory(fetchFn, texto, origen, destino, timeoutMs) {
    var url = "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(texto) +
      "&langpair=" + origen + "%7C" + destino;
    return conTimeout(fetchFn, url, timeoutMs || 15000)
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (datos) {
        var traducido = (datos.responseData && datos.responseData.translatedText) || "";
        if (traducido === "QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED QUERY : 500 CHARS") {
          throw new Error("El texto supera los 500 caracteres permitidos.");
        }
        if (!traducido) throw new Error("Sin traducción");
        return traducido;
      });
  }

  // Proveedores en orden de preferencia. Para añadir uno nuevo, agrégalo aquí.
  var PROVEEDORES = [
    { id: "google", fn: porGoogle },
    { id: "mymemory", fn: porMyMemory }
  ];

  // Devuelve una promesa con { texto, motor }.
  function traducir(texto, opciones) {
    opciones = opciones || {};
    var fetchFn = opciones.fetch || (typeof fetch !== "undefined" ? fetch : null);
    if (!fetchFn) return Promise.reject(new Error("No hay fetch disponible"));
    if (opciones.onLine === false) {
      return Promise.reject(new Error("Sin conexión: la traducción en línea no está disponible."));
    }
    var origen = opciones.origen;
    var destino = opciones.destino;
    var i = 0;
    function intentar() {
      var motor = PROVEEDORES[i++];
      if (!motor) return Promise.reject(new Error("Ningún motor disponible"));
      return motor.fn(fetchFn, texto, origen, destino, opciones.timeoutMs)
        .then(function (t) { return { texto: t, motor: motor.id }; })
        .catch(function (err) {
          if (i >= PROVEEDORES.length) throw err;
          return intentar();
        });
    }
    return intentar();
  }

  return {
    traducir: traducir,
    porGoogle: porGoogle,
    porMyMemory: porMyMemory,
    conTimeout: conTimeout
  };
});

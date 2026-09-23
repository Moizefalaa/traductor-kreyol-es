/* Capa de almacenamiento: centraliza localStorage. Sin DOM.
   Se usa en el navegador (window.KreyolStore) y en Node (require) para pruebas. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.KreyolStore = fabrica();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CLAVES = {
    historial: "kreolEs_historial_v1",
    direccion: "kreolEs_direccion_v1",
    voz: "kreolEs_voz_v1",
    tema: "kreolEs_tema_v1",
    paleta: "kreolEs_paleta_v1",
    feedback: "kreolEs_feedback_v1",
    chile: "kreolEs_chile_user_v1",
    cache: "kreolEs_cache_trad_v1"
  };

  function leerJson(clave, porDefecto) {
    try {
      var raw = localStorage.getItem(clave);
      if (raw === null) return porDefecto;
      var valor = JSON.parse(raw);
      return valor === null || valor === undefined ? porDefecto : valor;
    } catch (e) {
      return porDefecto;
    }
  }

  function escribirJson(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Texto plano (tema, paleta, dirección, voz): se guardan sin JSON para
  // mantener compatibilidad con los datos ya existentes en los dispositivos.
  function leerTexto(clave, porDefecto) {
    try {
      var v = localStorage.getItem(clave);
      return v === null ? porDefecto : v;
    } catch (e) {
      return porDefecto;
    }
  }

  function escribirTexto(clave, valor) {
    try {
      localStorage.setItem(clave, valor);
      return true;
    } catch (e) {
      return false;
    }
  }

  function cargarHistorial() {
    var v = leerJson(CLAVES.historial, []);
    return Array.isArray(v) ? v : [];
  }
  function guardarHistorial(items) { return escribirJson(CLAVES.historial, items); }

  function cargarFeedback() {
    var v = leerJson(CLAVES.feedback, []);
    return Array.isArray(v) ? v : [];
  }
  function guardarFeedback(lista) { return escribirJson(CLAVES.feedback, lista); }

  function cargarChileUsuario() {
    var v = leerJson(CLAVES.chile, {});
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  }
  function guardarChileUsuario(map) { return escribirJson(CLAVES.chile, map); }

  function cargarTema() {
    var v = leerTexto(CLAVES.tema, "claro");
    return v || "claro";
  }
  function guardarTema(t) { return escribirTexto(CLAVES.tema, t); }

  function cargarPaleta() {
    var v = leerTexto(CLAVES.paleta, "haiti");
    return v || "haiti";
  }
  function guardarPaleta(p) { return escribirTexto(CLAVES.paleta, p); }

  function cargarDireccion() {
    return leerTexto(CLAVES.direccion, "ht-es") === "es-ht" ? "es-ht" : "ht-es";
  }
  function guardarDireccion(d) { return escribirTexto(CLAVES.direccion, d); }

  function cargarVoz() {
    var v = leerTexto(CLAVES.voz, "auto");
    return v || "auto";
  }
  function guardarVoz(v) { return escribirTexto(CLAVES.voz, v); }

  // Caché de traducciones en memoria (Map) con persistencia diferida.
  var MAX_CACHE = 300;
  var cache = null;
  var temporizador = null;

  function cargarCacheTraduccion() {
    if (cache) return cache;
    cache = new Map();
    var pares = leerJson(CLAVES.cache, []);
    if (Array.isArray(pares)) {
      pares.forEach(function (par) {
        if (Array.isArray(par) && par.length === 2) cache.set(par[0], par[1]);
      });
    }
    return cache;
  }

  function persistirCacheTraduccion() {
    if (temporizador) return;
    temporizador = setTimeout(function () {
      temporizador = null;
      escribirJson(CLAVES.cache, Array.from(cargarCacheTraduccion().entries()));
    }, 1000);
  }

  function leerCacheTraduccion(clave) {
    var m = cargarCacheTraduccion();
    return m.has(clave) ? m.get(clave) : null;
  }

  function guardarCacheTraduccion(clave, valor) {
    var m = cargarCacheTraduccion();
    if (m.has(clave)) m.delete(clave);
    m.set(clave, valor);
    while (m.size > MAX_CACHE) {
      m.delete(m.keys().next().value);
    }
    persistirCacheTraduccion();
  }

  return {
    CLAVES: CLAVES,
    leerJson: leerJson,
    escribirJson: escribirJson,
    leerTexto: leerTexto,
    escribirTexto: escribirTexto,
    cargarHistorial: cargarHistorial,
    guardarHistorial: guardarHistorial,
    cargarFeedback: cargarFeedback,
    guardarFeedback: guardarFeedback,
    cargarChileUsuario: cargarChileUsuario,
    guardarChileUsuario: guardarChileUsuario,
    cargarTema: cargarTema,
    guardarTema: guardarTema,
    cargarPaleta: cargarPaleta,
    guardarPaleta: guardarPaleta,
    cargarDireccion: cargarDireccion,
    guardarDireccion: guardarDireccion,
    cargarVoz: cargarVoz,
    guardarVoz: guardarVoz,
    cargarCacheTraduccion: cargarCacheTraduccion,
    persistirCacheTraduccion: persistirCacheTraduccion,
    leerCacheTraduccion: leerCacheTraduccion,
    guardarCacheTraduccion: guardarCacheTraduccion
  };
});

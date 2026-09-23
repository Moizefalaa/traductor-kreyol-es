/* Capa de voz (TTS): selección de la mejor voz del dispositivo y lectura con
   speechSynthesis. La reproducción con Google TTS (cola de Audio) vive en app.js.
   Se usa en el navegador (window.KreyolVoz) y en Node (require) para pruebas. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.KreyolVoz = fabrica();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function vocesSistema() {
    if (typeof window === "undefined" || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices() || [];
  }

  function puntajeVoz(v) {
    var nombre = (v && v.name ? v.name : "").toLowerCase();
    var puntos = 0;
    if (/natural|neural|online|premium|enhanced/.test(nombre)) puntos += 4;
    if (/google/.test(nombre)) puntos += 2;
    if (/microsoft|iona|nuance/.test(nombre)) puntos += 1;
    return puntos;
  }

  function ordenLengua(lang) {
    var l = (lang || "").toLowerCase();
    if (l.indexOf("ht") === 0) return 0;
    if (l.indexOf("es-mx") === 0) return 1;
    if (l.indexOf("es-us") === 0) return 2;
    if (l.indexOf("es-419") === 0) return 3;
    if (l.indexOf("es-es") === 0) return 4;
    if (l.indexOf("es") === 0) return 5;
    if (l.indexOf("fr-ca") === 0) return 6;
    if (l.indexOf("fr") === 0) return 7;
    return 8;
  }

  function compararVoces(a, b) {
    var diff = ordenLengua(a.lang) - ordenLengua(b.lang);
    if (diff !== 0) return diff;
    return puntajeVoz(b) - puntajeVoz(a);
  }

  // Mejor voz para el idioma pedido. Para criollo prefiere ht y, si no hay,
  // francés (pronunciación parecida); para español, variantes latinas.
  function elegirMejorVoz(voces, lang) {
    voces = voces || [];
    var objetivo = (lang || "").toLowerCase();
    var esPreferida = objetivo === "es";
    var candidatas = voces.filter(function (v) {
      var l = (v.lang || "").toLowerCase();
      if (esPreferida) return l.indexOf("es") === 0;
      return l.indexOf("ht") === 0 || l.indexOf("fr") === 0;
    });
    if (!candidatas.length && !esPreferida) {
      candidatas = voces.filter(function (v) {
        return (v.lang || "").toLowerCase().indexOf("es") === 0;
      });
    }
    candidatas.sort(compararVoces);
    return candidatas[0] || null;
  }

  // Voces útiles (es/ht/fr) sin duplicados, ordenadas por preferencia.
  function listarVocesUtiles(voces) {
    voces = voces || [];
    var unicas = {};
    voces.forEach(function (v) {
      var lang = (v.lang || "").toLowerCase();
      if ((lang.indexOf("es") === 0 || lang.indexOf("ht") === 0 || lang.indexOf("fr") === 0) && !unicas[v.name]) {
        unicas[v.name] = v;
      }
    });
    return Object.keys(unicas).map(function (nombre) { return unicas[nombre]; }).sort(compararVoces);
  }

  function dividirFragmentos(texto, max) {
    var limpio = texto.replace(/\s+/g, " ").trim();
    if (!limpio) return [];
    var trozos = limpio.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [limpio];
    var partes = [];
    var actual = "";
    trozos.forEach(function (t) {
      var candidato = actual ? actual + " " + t : t;
      if (candidato.length > max && actual) {
        partes.push(actual);
        actual = t;
      } else {
        actual = candidato;
      }
    });
    if (actual) partes.push(actual);
    if (!partes.length) partes = [limpio.slice(0, max)];
    return partes;
  }

  function langParaGoogle(lang) {
    return lang === "es" ? "es-419" : lang;
  }

  function detenerSistema() {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  // Lee con la voz del dispositivo. eleccion: "auto" | "google" | "sys|<nombre>".
  function hablarConSistema(texto, lang, eleccion, alTerminar) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alTerminar();
      return;
    }
    var voces = vocesSistema();
    var voz = null;
    if (eleccion && eleccion.indexOf("sys|") === 0) {
      var nombre = eleccion.slice(4);
      voz = voces.filter(function (v) { return v.name === nombre; })[0] || null;
    }
    if (!voz) voz = elegirMejorVoz(voces, lang);
    var u = new SpeechSynthesisUtterance(texto);
    u.lang = lang;
    u.rate = 1;
    if (voz) {
      u.voice = voz;
      u.lang = voz.lang;
    }
    u.onend = function () { alTerminar(); };
    u.onerror = function () { alTerminar(); };
    window.speechSynthesis.speak(u);
  }

  return {
    vocesSistema: vocesSistema,
    puntajeVoz: puntajeVoz,
    ordenLengua: ordenLengua,
    elegirMejorVoz: elegirMejorVoz,
    listarVocesUtiles: listarVocesUtiles,
    dividirFragmentos: dividirFragmentos,
    langParaGoogle: langParaGoogle,
    detenerSistema: detenerSistema,
    hablarConSistema: hablarConSistema
  };
});

/* Núcleo puro del traductor: sin DOM, sin red, sin estado global.
   Se usa en el navegador (window.KreyolCore) y en Node (require) para pruebas. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.KreyolCore = fabrica();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Glosario aplicado en tiempo de traducción para corregir errores sistemáticos
  // del motor (kreyòl -> español). tipo "fuente": reescribe la fuente antes del motor.
  // tipo "salida": corrige la traducción cuando la fuente contiene el lema indicado.
  var GLOSARIO = [
    {
      tipo: "salida",
      fuente: /\bfi?g\b/i,
      salida: { de: /\bhigo(s)?\b/gi, a: function (m, p) { return p ? "plátanos" : "plátano"; } }
    },
    {
      tipo: "salida",
      fuente: /\beg\b/i,
      salida: { de: /\boveja(s)?\b/gi, a: function (m, p) { return p ? "águilas" : "águila"; } }
    },
    {
      tipo: "salida",
      fuente: /\bofiyamezi\b/i,
      salida: { de: /\bofiyamezi\b/gi, a: "poco a poco" }
    },
    {
      tipo: "fuente",
      fuente: /\benpi\b/gi,
      salida: { a: "epi" }
    },
    {
      tipo: "salida",
      fuente: /\bgadyen bi\b/i,
      salida: { de: /\bcorredor\b/gi, a: "portero" }
    }
  ];

  function normalizarClave(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function dividirEnOraciones(texto) {
    var limpio = (texto || "").replace(/\s+/g, " ").trim();
    if (!limpio) return [];
    return (limpio.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [limpio])
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
  }

  function aEspanolLatino(texto) {
    if (!texto) return { texto: texto, normalizado: false };
    var pares = [
      [/\bvosotros\b/gi, "ustedes"],
      [/\bvosotras\b/gi, "ustedes"],
      [/\bos\b/gi, "les"],
      [/\bhabéis\b/gi, "han"],
      [/\bestáis\b/gi, "están"],
      [/\bsois\b/gi, "son"],
      [/\btenéis\b/gi, "tienen"],
      [/\bhacéis\b/gi, "hacen"],
      [/\bqueréis\b/gi, "quieren"],
      [/\bpodéis\b/gi, "pueden"],
      [/\bdecís\b/gi, "dicen"],
      [/\bvais\b/gi, "van"],
      [/\bcoméis\b/gi, "comen"],
      [/\bvenís\b/gi, "vienen"],
      [/\bsabéis\b/gi, "saben"]
    ];
    var resultado = texto;
    var cambio = false;
    pares.forEach(function (par) {
      if (par[0].test(resultado)) {
        resultado = resultado.replace(par[0], par[1]);
        cambio = true;
      }
    });
    return { texto: resultado, normalizado: cambio };
  }

  function limitarHistorial(items, max) {
    max = max || 200;
    if (items.length <= max) return items;
    var favoritos = items.filter(function (i) { return i.favorito; });
    var resto = items.filter(function (i) { return !i.favorito; });
    var mantener = Math.max(0, max - favoritos.length);
    var recortado = favoritos.concat(resto.slice(resto.length - mantener));
    recortado.sort(function (a, b) { return (a.fecha < b.fecha) ? -1 : 1; });
    return recortado;
  }

  function normalizarVariantesKreyol(texto) {
    var t = " " + texto + " ";
    var cliticos = {
      "m'": "mwen", "w'": "ou", "l'": "li", "y'": "yo", "t'": "te",
      "p'": "pa", "s'": "sa", "d'": "de", "k'": "ki", "n'": "nou"
    };
    Object.keys(cliticos).forEach(function (c) {
      var re = new RegExp("(^|\\s)(" + c.replace("'", "\\'") + ")", "gi");
      t = t.replace(re, function (m, pre) { return pre + cliticos[c] + " "; });
    });
    t = t.replace(/\bsh/gi, "ch");
    t = t.replace(/\s+([.,!?;:])/g, "$1");
    t = t.replace(/\s{2,}/g, " ");
    return t.trim();
  }

  function prepararFuenteKreyol(texto, glosario) {
    var g = glosario || GLOSARIO;
    var t = normalizarVariantesKreyol(texto);
    g.forEach(function (r) {
      if (r.tipo === "fuente") t = t.replace(r.fuente, r.salida.a);
    });
    return t;
  }

  function aplicarGlosario(fuente, traduccion, glosario) {
    if (!fuente || !traduccion) return traduccion;
    var g = glosario || GLOSARIO;
    var res = traduccion;
    g.forEach(function (r) {
      if (r.tipo !== "salida") return;
      if (!r.fuente.test(fuente)) return;
      res = res.replace(r.salida.de, r.salida.a);
    });
    return res;
  }

  function construirDiccionario(datos) {
    datos = datos || {};
    var d = {};
    function agregar(ht, es) {
      if (!ht || !es) return;
      d[normalizarClave(ht)] = { ht: ht, es: es };
      d[normalizarClave(es)] = { ht: ht, es: es };
    }
    (datos.frases || []).forEach(function (g) { g.frases.forEach(function (f) { agregar(f.ht, f.es); }); });
    (datos.emergencia || []).forEach(function (f) { agregar(f.ht, f.es); });
    (datos.correcciones || []).forEach(function (c) { agregar(c.ht, c.es); });
    (datos.vocabulario || []).forEach(function (g) { g.items.forEach(function (i) { agregar(i.ht, i.es); }); });
    return d;
  }

  function buscarEnDiccionario(dic, texto, esSalida) {
    var par = dic[normalizarClave(texto)];
    if (!par) return null;
    return esSalida ? par.es : par.ht;
  }

  return {
    GLOSARIO: GLOSARIO,
    normalizarClave: normalizarClave,
    dividirEnOraciones: dividirEnOraciones,
    aEspanolLatino: aEspanolLatino,
    limitarHistorial: limitarHistorial,
    normalizarVariantesKreyol: normalizarVariantesKreyol,
    prepararFuenteKreyol: prepararFuenteKreyol,
    aplicarGlosario: aplicarGlosario,
    construirDiccionario: construirDiccionario,
    buscarEnDiccionario: buscarEnDiccionario
  };
});

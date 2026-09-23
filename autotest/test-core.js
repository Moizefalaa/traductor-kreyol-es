// Pruebas del núcleo puro (core.js). Uso: node autotest/test-core.js
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../core.js");

test("normalizarClave: minúsculas, sin acentos ni signos", () => {
  assert.equal(core.normalizarClave("  ¡Hola,  Múndo! "), "hola mundo");
  assert.equal(core.normalizarClave("MÈSI"), "mesi");
  assert.equal(core.normalizarClave(""), "");
  assert.equal(core.normalizarClave(null), "");
});

test("dividirEnOraciones: separa y recorta oraciones", () => {
  assert.deepEqual(core.dividirEnOraciones("Hola. Mundo!"), ["Hola.", "Mundo!"]);
  assert.deepEqual(core.dividirEnOraciones("Una sola frase sin punto"), ["Una sola frase sin punto"]);
  assert.deepEqual(core.dividirEnOraciones("   "), []);
  assert.deepEqual(core.dividirEnOraciones(""), []);
});

test("aEspanolLatino: neutraliza formas de España", () => {
  const r1 = core.aEspanolLatino("Vosotros habéis comido");
  assert.equal(r1.texto, "ustedes han comido");
  assert.equal(r1.normalizado, true);

  const r2 = core.aEspanolLatino("Esto ya es neutro");
  assert.equal(r2.texto, "Esto ya es neutro");
  assert.equal(r2.normalizado, false);

  assert.equal(core.aEspanolLatino("").normalizado, false);
});

test("limitarHistorial: respeta el tope y conserva favoritas", () => {
  const items = [1, 2, 3, 4, 5].map((n) => ({
    fecha: "2020-01-0" + n,
    favorito: false,
  }));
  const corto = core.limitarHistorial(items.slice(0, 2), 3);
  assert.equal(corto.length, 2);

  const recortado = core.limitarHistorial(items, 3);
  assert.deepEqual(recortado.map((i) => i.fecha), ["2020-01-03", "2020-01-04", "2020-01-05"]);

  const conFav = items.map((i, idx) => ({ ...i, favorito: idx === 0 }));
  const r2 = core.limitarHistorial(conFav, 3);
  assert.equal(r2.length, 3);
  assert.ok(r2.some((i) => i.favorito), "debe conservar la favorita");
});

test("normalizarVariantesKreyol: clíticos y sh->ch", () => {
  assert.equal(core.normalizarVariantesKreyol("m'ap"), "mwen ap");
  assert.equal(core.normalizarVariantesKreyol("shire"), "chire");
});

test("prepararFuenteKreyol: aplica reglas de fuente (enpi->epi)", () => {
  assert.equal(core.prepararFuenteKreyol("enpi"), "epi");
  assert.equal(core.prepararFuenteKreyol("mwen enpi ou"), "mwen epi ou");
});

test("aplicarGlosario: corrige errores sistemáticos de salida", () => {
  assert.equal(core.aplicarGlosario("fig", "higo"), "plátano");
  assert.equal(core.aplicarGlosario("fig", "higos"), "plátanos");
  assert.equal(core.aplicarGlosario("eg", "oveja"), "águila");
  assert.equal(core.aplicarGlosario("eg", "ovejas"), "águilas");
  assert.equal(core.aplicarGlosario("ofiyamezi", "ofiyamezi"), "poco a poco");
  assert.equal(core.aplicarGlosario("gadyen bi", "corredor"), "portero");
  // Si la fuente no dispara la regla, no cambia nada
  assert.equal(core.aplicarGlosario("bonjou", "higo"), "higo");
  assert.equal(core.aplicarGlosario("", "higo"), "higo");
});

test("construirDiccionario + buscarEnDiccionario: ida y vuelta", () => {
  const datos = {
    frases: [{ cat: "x", frases: [{ ht: "Bonjou", es: "Buenos días" }] }],
    emergencia: [{ ht: "Ede m", es: "Ayúdame" }],
    correcciones: [{ ht: "padon", es: "perdón" }],
    vocabulario: [{ cat: "y", items: [{ ht: "mèsi", es: "gracias" }] }],
  };
  const dic = core.construirDiccionario(datos);
  assert.equal(core.buscarEnDiccionario(dic, "Bonjou", true), "Buenos días");
  assert.equal(core.buscarEnDiccionario(dic, "MESI", true), "gracias");
  assert.equal(core.buscarEnDiccionario(dic, "gracias", false), "mèsi");
  assert.equal(core.buscarEnDiccionario(dic, "no existe", true), null);
});

test("construirDiccionario tolera datos vacíos", () => {
  const dic = core.construirDiccionario({});
  assert.equal(core.buscarEnDiccionario(dic, "x", true), null);
});

function cadaItem(datos, cb) {
  (datos.frases || []).forEach((g) => g.frases.forEach((f) => cb(f)));
  (datos.emergencia || []).forEach((f) => cb(f));
  (datos.correcciones || []).forEach((c) => cb(c));
  (datos.vocabulario || []).forEach((g) => g.items.forEach((i) => cb(i)));
}

const DATOS_REALES = {
  frases: core.FRASES_RAPIDAS,
  emergencia: core.FRASES_EMERGENCIA,
  correcciones: core.CORRECCIONES,
  vocabulario: core.VOCABULARIO,
};

test("datos: todas las entradas tienen ht y es", () => {
  const faltantes = [];
  cadaItem(DATOS_REALES, (it) => {
    if (!it || !it.ht || !it.es) faltantes.push(it);
  });
  assert.deepEqual(faltantes, []);
});

test("datos: no hay colisiones ambiguas en el diccionario", () => {
  // Una colisión es ambigua si dos entradas comparten clave pero NI el ht NI el
  // es coinciden: serían dos significados distintos pisándose. Los sinónimos y
  // las variantes con/sin punto comparten al menos un lado, y son aceptables.
  const ambiguas = core.detectarColisiones(DATOS_REALES).filter((c) => {
    const mismoEs = core.normalizarClave(c.antes.es) === core.normalizarClave(c.ahora.es);
    const mismoHt = core.normalizarClave(c.antes.ht) === core.normalizarClave(c.ahora.ht);
    return !mismoEs && !mismoHt;
  });
  assert.deepEqual(ambiguas, []);
});

test("detectarColisiones: detecta claves compartidas", () => {
  const datos = {
    frases: [{ cat: "x", frases: [{ ht: "Bonjou", es: "Buenos días" }] }],
    vocabulario: [{ cat: "y", items: [{ ht: "Bonjou", es: "Hola" }] }],
  };
  const col = core.detectarColisiones(datos);
  assert.equal(col.length, 1);
  assert.equal(col[0].clave, "bonjou");
  assert.deepEqual(
    core.detectarColisiones({ frases: [{ cat: "x", frases: [{ ht: "a", es: "b" }] }] }),
    []
  );
});

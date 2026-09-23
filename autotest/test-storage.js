// Pruebas de la capa de almacenamiento (storage.js). Uso: node autotest/test-storage.js
const test = require("node:test");
const assert = require("node:assert/strict");

const mem = new Map();
global.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
  clear: () => mem.clear(),
};

const S = require("../storage.js");

test("leerJson/escribirJson: ida y vuelta y valor por defecto", () => {
  mem.clear();
  assert.equal(S.leerJson("noexiste", "def"), "def");
  assert.equal(S.escribirJson("k", { a: 1 }), true);
  assert.deepEqual(S.leerJson("k", null), { a: 1 });
});

test("historial: por defecto vacío, guarda y tolera datos corruptos", () => {
  mem.clear();
  assert.deepEqual(S.cargarHistorial(), []);
  S.guardarHistorial([{ origen: "a", destino: "b" }]);
  assert.deepEqual(S.cargarHistorial(), [{ origen: "a", destino: "b" }]);
  mem.set(S.CLAVES.historial, "no-json");
  assert.deepEqual(S.cargarHistorial(), []);
  mem.set(S.CLAVES.historial, JSON.stringify({ x: 1 }));
  assert.deepEqual(S.cargarHistorial(), []);
});

test("feedback y chile: valores por defecto", () => {
  mem.clear();
  assert.deepEqual(S.cargarFeedback(), []);
  assert.deepEqual(S.cargarChileUsuario(), {});
});

test("tema/paleta/direccion/voz: texto plano y valores por defecto", () => {
  mem.clear();
  assert.equal(S.cargarTema(), "claro");
  assert.equal(S.cargarPaleta(), "haiti");
  assert.equal(S.cargarDireccion(), "ht-es");
  assert.equal(S.cargarVoz(), "auto");

  S.guardarTema("oscuro");
  assert.equal(mem.get(S.CLAVES.tema), "oscuro");
  assert.equal(S.cargarTema(), "oscuro");

  S.guardarPaleta("noche");
  assert.equal(S.cargarPaleta(), "noche");

  S.guardarDireccion("es-ht");
  assert.equal(S.cargarDireccion(), "es-ht");

  S.guardarVoz("sys|Paulina");
  assert.equal(S.cargarVoz(), "sys|Paulina");
});

test("cache: guardar, leer y tope de tamaño", () => {
  const c = S.cargarCacheTraduccion();
  c.clear();
  S.guardarCacheTraduccion("k1", "v1");
  assert.equal(S.leerCacheTraduccion("k1"), "v1");
  assert.equal(S.leerCacheTraduccion("nope"), null);
  for (let i = 0; i < 305; i++) S.guardarCacheTraduccion("k" + i, "v" + i);
  assert.ok(S.cargarCacheTraduccion().size <= 300);
  assert.equal(S.leerCacheTraduccion("k304"), "v304");
});

test("cache: se persiste con retardo", async () => {
  S.guardarCacheTraduccion("persistida", "si");
  await new Promise((r) => setTimeout(r, 1200));
  const guardado = JSON.parse(mem.get(S.CLAVES.cache) || "[]");
  assert.ok(guardado.some((p) => p[0] === "persistida" && p[1] === "si"));
});

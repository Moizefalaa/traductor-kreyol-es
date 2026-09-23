// Pruebas de la capa de voz (voz.js): selección y utilidades puras.
const test = require("node:test");
const assert = require("node:assert/strict");
const VOZ = require("../voz.js");

const VOCES = [
  { name: "Google español de México", lang: "es-MX" },
  { name: "Google español de España", lang: "es-ES" },
  { name: "Google français du Canada", lang: "fr-CA" },
  { name: "Google français", lang: "fr-FR" },
  { name: "English US", lang: "en-US" },
];

test("langParaGoogle: español latino y criollo", () => {
  assert.equal(VOZ.langParaGoogle("es"), "es-419");
  assert.equal(VOZ.langParaGoogle("ht"), "ht");
});

test("puntajeVoz: premia voces naturales", () => {
  assert.ok(VOZ.puntajeVoz({ name: "Google US English Natural" }) > VOZ.puntajeVoz({ name: "Basic" }));
});

test("ordenLengua: ht < es-MX < es-ES < fr", () => {
  assert.ok(VOZ.ordenLengua("ht-HT") < VOZ.ordenLengua("es-MX"));
  assert.ok(VOZ.ordenLengua("es-MX") < VOZ.ordenLengua("es-ES"));
  assert.ok(VOZ.ordenLengua("es-ES") < VOZ.ordenLengua("fr-FR"));
});

test("elegirMejorVoz: español prefiere variante latina", () => {
  assert.equal(VOZ.elegirMejorVoz(VOCES, "es").lang, "es-MX");
});

test("elegirMejorVoz: criollo cae a francés si no hay ht", () => {
  assert.equal(VOZ.elegirMejorVoz(VOCES, "ht").lang, "fr-CA");
});

test("elegirMejorVoz: criollo cae a español si no hay ht ni fr", () => {
  assert.equal(VOZ.elegirMejorVoz([{ name: "X", lang: "es-ES" }], "ht").lang, "es-ES");
});

test("elegirMejorVoz: sin voces devuelve null", () => {
  assert.equal(VOZ.elegirMejorVoz([], "es"), null);
  assert.equal(VOZ.elegirMejorVoz(undefined, "ht"), null);
});

test("listarVocesUtiles: filtra en/otras, deduplica y ordena", () => {
  const lista = VOZ.listarVocesUtiles(VOCES).map((v) => v.lang);
  assert.deepEqual(lista, ["es-MX", "es-ES", "fr-CA", "fr-FR"]);
});

test("dividirFragmentos: agrupa oraciones sin pasar del máximo", () => {
  const texto = "Uno. Dos. Tres. Cuatro. Cinco.";
  const partes = VOZ.dividirFragmentos(texto, 12);
  assert.ok(partes.length > 1);
  assert.ok(partes.every((p) => p.length <= 12));
  assert.equal(partes.join(" ").replace(/\s+/g, " ").trim(), texto);
  assert.deepEqual(VOZ.dividirFragmentos("   ", 30), []);
  // Una oración larga no se parte (comportamiento actual)
  const larga = "Una sola oración bastante más larga que el máximo permitido.";
  assert.deepEqual(VOZ.dividirFragmentos(larga, 10), [larga]);
});

test("vocesSistema: sin speechSynthesis devuelve []", () => {
  assert.deepEqual(VOZ.vocesSistema(), []);
});

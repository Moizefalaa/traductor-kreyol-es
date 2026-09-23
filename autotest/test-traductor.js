// Pruebas del motor de traducción (traductor.js) con fetch simulado.
const test = require("node:test");
const assert = require("node:assert/strict");
const TRAD = require("../traductor.js");

function resp(obj, ok = true, status = 200) {
  return Promise.resolve({ ok: ok, status: status, json: () => Promise.resolve(obj) });
}
const googleOk = (t) => [[[t, "", null, null]]];
const mmOk = (t) => ({ responseData: { translatedText: t } });

test("google: traduce y devuelve el motor", async () => {
  const urls = [];
  const fakeFetch = (url) => { urls.push(url); return resp(googleOk("Hola")); };
  const r = await TRAD.traducir("Bonjou", { origen: "ht", destino: "es", fetch: fakeFetch });
  assert.deepEqual(r, { texto: "Hola", motor: "google" });
  assert.ok(urls[0].indexOf("sl=ht") >= 0 && urls[0].indexOf("tl=es") >= 0);
});

test("si google falla, usa mymemory", async () => {
  const fakeFetch = (url) =>
    url.indexOf("translate.googleapis.com") >= 0 ? resp(null, false, 500) : resp(mmOk("Hola"));
  const r = await TRAD.traducir("Bonjou", { origen: "ht", destino: "es", fetch: fakeFetch });
  assert.deepEqual(r, { texto: "Hola", motor: "mymemory" });
});

test("si google devuelve vacío, cae a mymemory", async () => {
  const fakeFetch = (url) =>
    url.indexOf("translate.googleapis.com") >= 0 ? resp([[]]) : resp(mmOk("Hola"));
  const r = await TRAD.traducir("Bonjou", { origen: "ht", destino: "es", fetch: fakeFetch });
  assert.equal(r.motor, "mymemory");
});

test("si ambos fallan, rechaza", async () => {
  const fakeFetch = () => resp(null, false, 503);
  await assert.rejects(() => TRAD.traducir("Bonjou", { origen: "ht", destino: "es", fetch: fakeFetch }));
});

test("mymemory con límite de 500 caracteres devuelve error", async () => {
  const fakeFetch = (url) =>
    url.indexOf("translate.googleapis.com") >= 0
      ? resp(null, false, 500)
      : resp({ responseData: { translatedText: "QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED QUERY : 500 CHARS" } });
  await assert.rejects(() => TRAD.traducir("x", { origen: "ht", destino: "es", fetch: fakeFetch }));
});

test("sin conexión: rechaza sin llamar a fetch", async () => {
  let llamado = false;
  const fakeFetch = () => { llamado = true; return resp(googleOk("Hola")); };
  await assert.rejects(() =>
    TRAD.traducir("x", { origen: "ht", destino: "es", fetch: fakeFetch, onLine: false })
  );
  assert.equal(llamado, false);
});

// Aplica el GLOSARIO de app.js sobre un reporte ya generado (run-completo.json)
// para reflejar la salida real del motor, sin volver a llamar a la red (excepto
// las reglas de tipo "fuente" como enpi, que requieren re-traducir).
// Uso: node autotest/reprocesar-glosario.js

const fs = require("fs");
const path = require("path");
const https = require("https");

const DIR = __dirname;
const REPORTES = path.join(DIR, "reportes");
const ENTRADA = path.join(REPORTES, "run-completo.json");
const SALIDA = path.join(REPORTES, "run-completo-glosario.json");

const UMBRAL_EXACTO = 0.9, UMBRAL_PARECIDO = 0.5, UMBRAL_SENTIDO = 0.6;

function limpiar(t) {
  return (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + costo);
      prev = tmp;
    }
  }
  return dp[n];
}
function similitud(a, b) {
  const na = limpiar(a), nb = limpiar(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  return 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);
}
function nivel(s) { return s >= UMBRAL_EXACTO ? "exacto" : s >= UMBRAL_PARECIDO ? "parecido" : "distinto"; }

const GLOSARIO = [
  { tipo: "salida", fuente: /\bfi?g\b/i, salida: { de: /\bhigo(s)?\b/gi, a: (m, p) => (p ? "plátanos" : "plátano") } },
  { tipo: "salida", fuente: /\beg\b/i, salida: { de: /\boveja(s)?\b/gi, a: (m, p) => (p ? "águilas" : "águila") } },
  { tipo: "salida", fuente: /\bofiyamezi\b/i, salida: { de: /\bofiyamezi\b/gi, a: "poco a poco" } },
  { tipo: "fuente", fuente: /\benpi\b/gi, salida: { a: "epi" } },
  { tipo: "salida", fuente: /\bgadyen bi\b/i, salida: { de: /\bcorredor\b/gi, a: "portero" } },
];
function aplicarGlosarioSalida(fuente, traduccion) {
  if (!fuente || !traduccion) return traduccion;
  let res = traduccion;
  GLOSARIO.forEach((r) => {
    if (r.tipo !== "salida") return;
    if (!r.fuente.test(fuente)) return;
    res = res.replace(r.salida.de, r.salida.a);
  });
  return res;
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (resp) => {
      let d = ""; resp.on("data", (c) => (d += c));
      resp.on("end", () => resolve({ status: resp.statusCode, body: d }));
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
  });
}
async function traducir(texto, sl, tl) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sl + "&tl=" + tl + "&dt=t&q=" + encodeURIComponent(texto);
  const r = await httpsGet(url);
  if (r.status !== 200) throw new Error("HTTP " + r.status);
  const datos = JSON.parse(r.body);
  return (datos[0] || []).map((s) => (s && s[0]) || "").join("");
}

function reclasificar(f) {
  f.simDirecto = similitud(f.google, f.esEsperado);
  f.nivelDirecto = nivel(f.simDirecto);
  if (!(f.esEsperado || "").trim()) { f.veredicto = "duda"; f.estado = "sin-referencia"; return; }
  if (f.nivelDirecto === "distinto") {
    if ((f.simRoundtrip || 0) >= UMBRAL_SENTIDO) { f.veredicto = "duda"; f.estado = "parafraseo"; }
    else { f.veredicto = "error"; f.estado = "error"; }
  } else if (f.nivelDirecto === "parecido" || f.nivelRoundtrip !== "exacto") {
    f.veredicto = "duda"; f.estado = "ok";
  } else { f.veredicto = "ok"; f.estado = "ok"; }
}

async function principal() {
  const reporte = JSON.parse(fs.readFileSync(ENTRADA, "utf8"));
  const filas = reporte.filas;
  const enpiPendientes = [];
  for (const f of filas) {
    if (f.corregida || f.veredicto === "ok" || f.estado === "red" || f.estado === "cubierta") continue;
    if (/\benpi\b/i.test(f.ht) && /(impe?i|imperi|impiedad|impías|impí|impios?|impuro|impura)/i.test(f.google || "")) {
      enpiPendientes.push(f);
    } else {
      f.google = aplicarGlosarioSalida(f.ht, f.google || "");
      reclasificar(f);
    }
  }
  // Re-traducir los casos enpi (regla de fuente) con "epi" en lugar de "enpi".
  for (const f of enpiPendientes) {
    try {
      const htEpi = f.ht.replace(/\benpi\b/gi, "epi");
      const directo = await traducir(htEpi, "ht", "es");
      f.google = aplicarGlosarioSalida(f.ht, directo);
      reclasificar(f);
      console.log("enpi re-traducido:", f.ht, "=>", f.google);
    } catch (e) { console.log("enpi fallo red:", f.ht, e.message); }
    await new Promise((r) => setTimeout(r, 300));
  }
  fs.writeFileSync(SALIDA, JSON.stringify({ resumen: reporte.resumen, filas }, null, 2) + "\n", "utf8");
  const restantes = filas.filter((f) => (f.veredicto === "duda" || f.veredicto === "error") && f.estado !== "cubierta" && f.estado !== "red");
  console.log("Reporte glosario guardado:", SALIDA);
  console.log("Dudas/errores residuales tras glosario:", restantes.length, "de", filas.length, "filas.");
}

principal().catch((e) => { console.error(e); process.exit(1); });

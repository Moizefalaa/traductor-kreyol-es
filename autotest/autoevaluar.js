// Autoevaluador del corpus, version Node (usa https en vez de fetch, que el
// sandbox bloquea). Evalua textos.json con el motor de Google y produce un
// reporte igual al de autotest.js, listo para agrupar-dudas.js.
// Uso:
//   node autotest/autoevaluar.js                 # corpus completo
//   node autotest/autoevaluar.js --texto 0001   # solo un texto
//   node autotest/autoevaluar.js --ayuda

const fs = require("fs");
const path = require("path");
const https = require("https");

const DIR = __dirname;
const TEXTOS = path.join(DIR, "textos.json");
const CORRECCIONES_JSON = path.join(DIR, "correcciones.json");
const APP = path.join(DIR, "..", "app.js");
const REPORTES = path.join(DIR, "reportes");

const UMBRAL_EXACTO = 0.9;
const UMBRAL_PARECIDO = 0.5;
const UMBRAL_SENTIDO = 0.6;
const GOOGLE = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=";

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
async function traducirGoogle(texto, sl, tl) {
  const url = GOOGLE + sl + "&tl=" + tl + "&dt=t&q=" + encodeURIComponent(texto);
  const r = await httpsGet(url);
  if (r.status !== 200) throw new Error("HTTP " + r.status);
  const datos = JSON.parse(r.body);
  const seg = datos && datos[0];
  if (!Array.isArray(seg)) throw new Error("Respuesta vacía");
  return seg.map((s) => (s && s[0]) || "").join("");
}

// Cola serializada para no saturar el motor (igual que autotest.js).
let cadena = Promise.resolve();
function encolar(fn) {
  const t = cadena.then(async () => {
    await new Promise((r) => setTimeout(r, 250));
    return fn();
  });
  cadena = t.catch(() => {});
  return t;
}

function cargarCorrecciones() {
  const dict = {};
  const pon = (ht, es) => { if (ht && es) dict[limpiar(ht)] = es; };
  try {
    const cj = JSON.parse(fs.readFileSync(CORRECCIONES_JSON, "utf8"));
    cj.forEach((c) => pon(c.ht, c.es));
  } catch (e) {}
  try {
    const app = fs.readFileSync(APP, "utf8");
    const re = /\{ ht: ("(?:[^"\\]|\\.)*"), es: ("(?:[^"\\]|\\.)*") \}/g;
    let m;
    while ((m = re.exec(app)) !== null) pon(JSON.parse(m[1]), JSON.parse(m[2]));
  } catch (e) {}
  return dict;
}

function dividirEnOraciones(t) {
  const limpio = (t || "").replace(/\s+/g, " ").trim();
  if (!limpio) return [];
  return (limpio.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [limpio]).map((x) => x.trim()).filter(Boolean);
}

async function verificarOracion(ht, es, dict) {
  const fila = { tipo: "texto", ht, esEsperado: es, corregida: false, google: null,
    roundtrip: null, simDirecto: null, simRoundtrip: null, nivelDirecto: null,
    nivelRoundtrip: null, veredicto: "ok", estado: "ok" };
  const corr = dict[limpiar(ht)];
  if (corr) { fila.esEsperado = corr; fila.corregida = true; fila.veredicto = "ok"; fila.estado = "cubierta"; return fila; }
  try {
    const directo = await encolar(() => traducirGoogle(ht, "ht", "es"));
    fila.google = directo;
    fila.simDirecto = similitud(directo, fila.esEsperado);
    fila.nivelDirecto = nivel(fila.simDirecto);
    try {
      const reversa = await encolar(() => traducirGoogle(directo, "es", "ht"));
      fila.roundtrip = reversa;
      fila.simRoundtrip = similitud(reversa, ht);
      fila.nivelRoundtrip = nivel(fila.simRoundtrip);
    } catch (e) { fila.nivelRoundtrip = "distinto"; fila.simRoundtrip = 0; }
  } catch (e) { fila.estado = "red"; fila.error = e.message; return fila; }

  if (fila.tipo === "texto" && !(fila.esEsperado || "").trim()) {
    fila.veredicto = "duda"; fila.estado = "sin-referencia"; return fila;
  }
  if (fila.nivelDirecto === "distinto") {
    if (fila.tipo === "texto" && (fila.simRoundtrip || 0) >= UMBRAL_SENTIDO) {
      fila.veredicto = "duda"; fila.estado = "parafraseo";
    } else { fila.veredicto = "error"; }
  } else if (fila.nivelDirecto === "parecido" || fila.nivelRoundtrip !== "exacto") {
    fila.veredicto = "duda";
  }
  return fila;
}

function idSeg(titulo, i, j) {
  return (titulo || "t") + "-seg" + (i + 1) + "-or" + (j + 1);
}

function resumenDe(filas) {
  return {
    total: filas.length,
    ok: filas.filter((f) => f.veredicto === "ok").length,
    duda: filas.filter((f) => f.veredicto === "duda").length,
    error: filas.filter((f) => f.veredicto === "error").length,
    cubierta: filas.filter((f) => f.estado === "cubierta").length,
  };
}

async function evaluar(textos, dict, soloId, desdeId, rutaLatest) {
  const filas = [];
  let usados = textos;
  if (soloId) usados = textos.filter((t) => t.id === soloId);
  else if (desdeId) { const k = textos.findIndex((t) => t.id === desdeId); if (k >= 0) usados = textos.slice(k); }

  const guardar = () => fs.writeFileSync(rutaLatest, JSON.stringify({ resumen: resumenDe(filas), filas, parcial: true }, null, 2) + "\n", "utf8");
  for (const texto of usados) {
    for (let i = 0; i < (texto.segmentos || []).length; i++) {
      const seg = texto.segmentos[i];
      const oraciones = dividirEnOraciones(seg.ht);
      for (let j = 0; j < oraciones.length; j++) {
        const f = await verificarOracion(oraciones[j], seg.es, dict);
        f.id = idSeg(texto.id, i, j);
        f.titulo = texto.id;
        f.nivel = texto.nivel;
        filas.push(f);
        guardar();
      }
    }
  }
  return filas;
}

async function principal() {
  const args = process.argv.slice(2);
  if (args.includes("--ayuda")) { console.log("Uso: node autotest/autoevaluar.js [--texto ID] [--desde ID]"); return; }
  const ti = args.indexOf("--texto");
  const soloId = ti >= 0 ? args[ti + 1] : null;
  const di = args.indexOf("--desde");
  const desdeId = di >= 0 ? args[di + 1] : null;
  const textos = JSON.parse(fs.readFileSync(TEXTOS, "utf8"));
  const dict = cargarCorrecciones();
  fs.mkdirSync(REPORTES, { recursive: true });
  const rutaLatest = path.join(REPORTES, "run-latest.json");
  if (desdeId && fs.existsSync(rutaLatest)) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "");
    fs.copyFileSync(rutaLatest, path.join(REPORTES, "run-respaldo-" + ts + "Z.json"));
    console.log("Respaldo del reporte previo guardado (run-respaldo-" + ts + "Z.json).");
  }
  console.log("Evaluando corpus (" + (soloId ? "texto " + soloId : textos.length + " textos") + ")...");
  const filas = await evaluar(textos, dict, soloId, desdeId, rutaLatest);
  const resumen = resumenDe(filas);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "");
  const nombre = "run-" + ts + "Z.json";
  fs.writeFileSync(path.join(REPORTES, nombre), JSON.stringify({ resumen, filas }, null, 2) + "\n", "utf8");
  console.log("Resumen:", JSON.stringify(resumen));
  console.log("Reporte:", path.join("autotest", "reportes", nombre));
}

principal().catch((e) => { console.error(e); process.exit(1); });

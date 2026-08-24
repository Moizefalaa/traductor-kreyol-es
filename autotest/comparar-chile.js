// Mide la fidelidad ES->HT del corpus chileno una vez corregido a mano.
// Uso:
//   node autotest/comparar-chile.js                 # solo reporte BLEU/chrF
//   node autotest/comparar-chile.js --fold          # además añade los pares (ht,es)
//                                                a textos.json como referencia dorada
// Requiere autotest/chile-gold.json (copia de chile-draft.json con "ht" corregido).

const fs = require("fs");
const path = require("path");
const https = require("https");

const DIR = __dirname;
const GOLD = path.join(DIR, "chile-gold.json");
const TEXTOS = path.join(DIR, "textos.json");
const GOOGLE = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=";

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
async function traducirMyMemory(texto, sl, tl) {
  const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(texto) + "&langpair=" + encodeURIComponent(sl + "|" + tl);
  const r = await httpsGet(url);
  if (r.status !== 200) throw new Error("HTTP " + r.status);
  const datos = JSON.parse(r.body);
  const t = datos && datos.responseData && datos.responseData.translatedText;
  if (!t) throw new Error("Respuesta vacía");
  return t;
}
async function traducir(texto, sl, tl) {
  try { return await traducirGoogle(texto, sl, tl); }
  catch (e) { if (e.message && e.message.indexOf("429") !== -1) return await traducirMyMemory(texto, sl, tl); throw e; }
}
let cadena = Promise.resolve();
function encolar(fn) {
  const t = cadena.then(async () => { await new Promise((r) => setTimeout(r, 300)); return fn(); });
  cadena = t.catch(() => {});
  return t;
}

// --- métricas BLEU/chrF (1-4 gramas / 6-gramas) ---
function ngrams(s, n) { const g = {}; for (let i = 0; i + n <= s.length; i++) { const k = s.slice(i, i + n); g[k] = (g[k] || 0) + 1; } return g; }
function bleu(ref, hip, maxn) {
  ref = ref.toLowerCase(); hip = hip.toLowerCase();
  if (!hip) return 0;
  if (hip === ref) return 1;
  let p = 0, w = 0;
  for (let n = 1; n <= maxn; n++) {
    const rg = ngrams(ref, n), hg = ngrams(hip, n);
    let c = 0, t = 0;
    for (const k in hg) { t += hg[k]; c += Math.min(hg[k], rg[k] || 0); }
    if (t) { p += Math.log((c + 1e-9) / (t + 1e-9)); w++; }
  }
  const bp = hip.length >= ref.length ? 1 : Math.exp(1 - ref.length / hip.length);
  return bp * Math.exp(p / w);
}
function chrF(ref, hip) {
  const n = 6;
  ref = ref.toLowerCase(); hip = hip.toLowerCase();
  if (!hip) return 0;
  if (hip === ref) return 1;
  const rg = ngrams(ref, n), hg = ngrams(hip, n);
  let tp = 0, fp = 0, fn = 0;
  for (const k in hg) { const o = Math.min(hg[k], rg[k] || 0); tp += o; fp += hg[k] - o; }
  for (const k in rg) { if (!hg[k]) fn += rg[k]; else fn += Math.max(0, rg[k] - hg[k]); }
  const prec = tp / (tp + fp), rec = tp / (tp + fn);
  if (!prec && !rec) return 0;
  const beta = 1; const num = (1 + beta * beta) * prec * rec;
  return num / (beta * beta * prec + rec);
}
function limpiar(s) { return (s || "").replace(/\s+/g, " ").trim(); }

async function main() {
  const fold = process.argv.indexOf("--fold") !== -1;
  if (!fs.existsSync(GOLD)) {
    console.log("Falta " + GOLD + ". Copia chile-draft.json, corrige el campo 'ht' y guárdalo como chile-gold.json.");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(GOLD, "utf8"));
  let total = 0; data.grados.forEach((g) => (total += g.textos.length));

  const paresNuevos = [];
  let sumB = 0, sumC = 0, n = 0;
  for (const g of data.grados) {
    for (const t of g.textos) {
      process.stdout.write("[" + g.id + "] " + t.titulo + " ... ");
      const ht = limpiar(t.ht);
      const es = limpiar(t.es);
      try {
        const round = await encolar(() => traducir(ht, "ht", "es"));
        const b = bleu(es, round, 4), c = chrF(es, round);
        sumB += b; sumC += c; n++;
        console.log("BLEU=" + (b * 100).toFixed(1) + " chrF=" + (c * 100).toFixed(1));
        paresNuevos.push({ titulo: t.titulo, ht: ht, es: es, fuente: "chile:" + g.id + ":" + (t.fuente || "") });
      } catch (e) {
        console.log("FALLO: " + e.message);
      }
    }
  }
  if (n) {
    console.log("\nFidelidad ES->HT (roundtrip HT->ES vs original):");
    console.log("  BLEU  = " + ((sumB / n) * 100).toFixed(2));
    console.log("  chrF  = " + ((sumC / n) * 100).toFixed(2));
  }
  if (fold && paresNuevos.length) {
    const raw = JSON.parse(fs.readFileSync(TEXTOS, "utf8"));
    const esArray = Array.isArray(raw);
    const base = esArray ? raw.length : (raw.textos ? raw.textos.length : 0);
    const nuevos = paresNuevos.map((p, i) => ({
      id: "chile" + String(base + i + 1).padStart(4, "0"),
      titulo: p.titulo, nivel: "chile", tipo: "texto", ht: p.ht, es: p.es, fuente: p.fuente
    }));
    let salida, total;
    if (esArray) { salida = raw.concat(nuevos); total = salida.length; }
    else { raw.textos = (raw.textos || []).concat(nuevos); salida = raw; total = raw.textos.length; }
    fs.writeFileSync(TEXTOS, JSON.stringify(salida, null, 2));
    console.log("\nAñadidos " + paresNuevos.length + " pares a textos.json (ahora " + total + " textos).");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

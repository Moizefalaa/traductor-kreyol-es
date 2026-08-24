// Alinea un texto en kreyòl (HT) con su traducción al español (ES) oración por
// oración para generar una entrada de corpus paralelo (textos.json).
// Uso:
//   node autotest/alinear-libro.js --ht libro.ht.txt --es libro.es.txt --id mi-libro
//   node autotest/alinear-libro.js --ht libro.ht.txt --id mi-libro   # traduce el ES con el motor
// Opcional: --out textos.json (por defecto autotest/textos.json), --nivel N

const fs = require("fs");
const path = require("path");
const https = require("https");

const DIR = __dirname;
const TEXTOS = path.join(DIR, "textos.json");

function dividirEnOraciones(t) {
  const limpio = (t || "").replace(/\s+/g, " ").trim();
  if (!limpio) return [];
  return (limpio.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [limpio]).map((x) => x.trim()).filter(Boolean);
}
function leer(p) { return fs.readFileSync(p, "utf8"); }

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
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sl + "&tl=" + tl + "&dt=t&q=" + encodeURIComponent(texto);
  const r = await httpsGet(url);
  if (r.status !== 200) throw new Error("HTTP " + r.status);
  const datos = JSON.parse(r.body);
  return (datos[0] || []).map((s) => (s && s[0]) || "").join("");
}

// Alineación 1:1 distribuida por longitud (robusta cuando los conteos difieren).
function alinear(htOr, esOr) {
  const pares = [];
  const nH = htOr.length, nE = esOr.length;
  let j = 0;
  for (let i = 0; i < nH; i++) {
    let target = nE === nH ? i : Math.min(nE - 1, Math.round(((i + 1) * nE) / nH) - 1);
    if (target < j) target = j;
    const htAqui = [];
    while (j <= target && j < nE) { htAqui.push(htOr[i]); break; }
    pares.push({ ht: htOr[i], es: esOr[target] });
    j = target + 1;
  }
  if (nE > nH) {
    for (let k = nH; k < nE; k++) pares.push({ ht: "", es: esOr[k] });
  }
  return pares;
}

async function principal() {
  const args = process.argv.slice(2);
  const get = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
  const htPath = get("--ht"), esPath = get("--es"), id = get("--id") || "libro-alineado";
  const out = get("--out") || TEXTOS;
  const nivel = parseInt(get("--nivel") || "1", 10);
  if (!htPath) { console.log("Uso: node autotest/alinear-libro.js --ht HT.txt [--es ES.txt] --id ID [--out textos.json]"); return; }

  const htOr = dividirEnOraciones(leer(htPath));
  let esOr;
  if (esPath) {
    esOr = dividirEnOraciones(leer(esPath));
  } else {
    console.log("Sin --es: traduciendo el kreyòl con el motor para generar el español...");
    esOr = [];
    for (const o of htOr) { esOr.push(await traducirGoogle(o, "ht", "es")); await new Promise((r) => setTimeout(r, 250)); }
  }

  const pares = alinear(htOr, esOr);
  const texto = { id, nivel, segmentos: pares.map((p) => ({ ht: p.ht, es: p.es })) };

  const textos = JSON.parse(fs.readFileSync(out, "utf8"));
  const existente = textos.findIndex((t) => t.id === id);
  if (existente >= 0) textos[existente] = texto; else textos.push(texto);
  fs.writeFileSync(out, JSON.stringify(textos, null, 2) + "\n", "utf8");
  console.log("Alineado: " + htOr.length + " oraciones HT <-> " + esOr.length + " ES.");
  console.log("Entrada '" + id + "' guardada en " + out + " (" + textos.length + " textos).");
}

principal().catch((e) => { console.error(e); process.exit(1); });

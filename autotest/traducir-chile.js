// Traduce las lecturas de textos-chile.json (español -> kreyòl) con el motor de
// Google y produce un BORRADOR correctable: autotest/chile-draft.json.
// Uso: node autotest/traducir-chile.js
// El borrador tiene { grados:[{ id, nombre, textos:[{ titulo, es, ht, fuente }] }] }.
// Corrige el campo "ht" a mano y guárdalo como autotest/chile-gold.json para
// convertirlo en corpus de referencia (ver comparar-chile.js).

const fs = require("fs");
const path = require("path");
const https = require("https");

const DIR = __dirname;
const CHILE = path.join(DIR, "..", "textos-chile.json");
const SALIDA = path.join(DIR, "chile-draft.json");
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
  const langpair = sl + "|" + tl;
  const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(texto) + "&langpair=" + encodeURIComponent(langpair);
  const r = await httpsGet(url);
  if (r.status !== 200) throw new Error("HTTP " + r.status);
  const datos = JSON.parse(r.body);
  const t = datos && datos.responseData && datos.responseData.translatedText;
  if (!t) throw new Error("Respuesta vacía");
  return t;
}

// Google primero (más fiel al motor de la app); si está limitado (429), cae a
// MyMemory para no bloquear la generación del borrador.
async function traducir(texto, sl, tl) {
  try {
    return await traducirGoogle(texto, sl, tl);
  } catch (e) {
    if (e.message && e.message.indexOf("429") !== -1) {
      return await traducirMyMemory(texto, sl, tl);
    }
    throw e;
  }
}

// Cola serializada para no saturar el motor.
let cadena = Promise.resolve();
function encolar(fn) {
  const t = cadena.then(async () => {
    await new Promise((r) => setTimeout(r, 300));
    return fn();
  });
  cadena = t.catch(() => {});
  return t;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(CHILE, "utf8"));
  const out = { grados: [] };
  let total = 0, hechos = 0;
  data.grados.forEach((g) => (total += g.textos.length));

  for (const g of data.grados) {
    const grados = { id: g.id, nombre: g.nombre, textos: [] };
    for (const t of g.textos) {
      process.stdout.write("[" + g.id + "] " + t.titulo + " ... ");
      try {
        const ht = await encolar(() => traducir(t.texto, "es", "ht"));
        grados.textos.push({ titulo: t.titulo, es: t.texto, ht, fuente: t.fuente });
        console.log("OK");
      } catch (e) {
        grados.textos.push({ titulo: t.titulo, es: t.texto, ht: "", fuente: t.fuente, error: String(e.message || e) });
        console.log("FALLO: " + e.message);
      }
      hechos++;
    }
    out.grados.push(grados);
  }

  fs.writeFileSync(SALIDA, JSON.stringify(out, null, 2));
  console.log("\nBorrador guardado en " + SALIDA + " (" + hechos + "/" + total + " textos).");
  console.log("Corrige el campo 'ht' a mano y guárdalo como chile-gold.json.");
}

main().catch((e) => { console.error(e); process.exit(1); });

// Mineria de pares kreyol<->espanol desde Tatoeba (api.tatoeba.org).
// Requiere Node 18+ (modulo https). Uso:
//   node autotest/minar-tatoeba.js
// Actualiza textos.json (agrega grupo "tatoeba") y correcciones.json
// (agrega las traducciones humanas de Tatoeba como correcciones).

const fs = require("fs");
const path = require("path");
const https = require("https");

const DIR = __dirname;
const TEXTOS = path.join(DIR, "textos.json");
const CORRECCIONES = path.join(DIR, "correcciones.json");
const PARES = path.join(DIR, "tatoeba-pares.json");

const TATOEBASENTENCES = "https://api.tatoeba.org/v1/sentences?lang=hat&sort=random&limit=50&showtrans:lang=spa";

function limpiar(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dormir(ms) { return new Promise((r) => setTimeout(r, ms)); }

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (resp) => {
      let d = "";
      resp.on("data", (c) => (d += c));
      resp.on("end", () => resolve({ status: resp.statusCode, body: d }));
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(new Error("timeout")); });
  });
}

async function obtenerPagina(url) {
  const r = await httpsGet(url);
  if (r.status !== 200) throw new Error("HTTP " + r.status + " en " + url);
  return JSON.parse(r.body);
}

async function minar() {
  const vistos = new Set();
  const pares = [];
  let url = TATOEBASENTENCES;
  let paginas = 0;
  while (url && paginas < 12) {
    paginas++;
    const data = await obtenerPagina(url);
    const lista = (data && data.data) || [];
    for (const s of lista) {
      if (vistos.has(s.id)) continue;
      vistos.add(s.id);
      const trans = (s.translations || []).filter((t) => t.lang === "spa");
      if (!trans.length) continue;
      trans.sort((a, b) => (b.is_direct ? 1 : 0) - (a.is_direct ? 1 : 0));
      pares.push({
        id: s.id,
        ht: s.text,
        es: trans[0].text,
        licencia: s.license || "CC BY 2.0 FR",
        autor: s.owner || "",
      });
    }
    const paging = data && data.paging;
    url = paging && paging.has_next ? paging.next : null;
    await dormir(400);
  }
  return pares;
}

async function principal() {
  console.log("Minando pares hat->spa desde Tatoeba...");
  const pares = await minar();
  console.log("Pares encontrados:", pares.length);
  fs.writeFileSync(PARES, JSON.stringify(pares, null, 2) + "\n", "utf8");
  console.log("Reporte guardado en", PARES);

  // Grupo en textos.json (corpus)
  const textos = JSON.parse(fs.readFileSync(TEXTOS, "utf8"));
  const grupo = {
    id: "tatoeba",
    titulo: "Tatoeba (kreyòl↔espanyol)",
    tituloEs: "Tatoeba (criollo haitiano↔español)",
    nivel: 3,
    fuente: "Tatoeba (CC BY 2.0 FR / CC0)",
    licencia: "CC BY 2.0 FR",
    urlHt: "https://tatoeba.org",
    urlEs: "https://tatoeba.org",
    segmentos: pares.map((p) => ({ ht: p.ht, es: p.es })),
  };
  const i = textos.findIndex((t) => t.id === "tatoeba");
  if (i >= 0) textos[i] = grupo; else textos.push(grupo);
  fs.writeFileSync(TEXTOS, JSON.stringify(textos, null, 2) + "\n", "utf8");
  console.log("textos.json: grupo 'tatoeba' con", grupo.segmentos.length, "segmentos");

  // Mezclar correcciones (traducciones humanas de Tatoeba)
  const correcciones = JSON.parse(fs.readFileSync(CORRECCIONES, "utf8"));
  const claves = new Set(correcciones.map((c) => limpiar(c.ht)));
  let agregadas = 0;
  for (const p of pares) {
    const clave = limpiar(p.ht);
    if (claves.has(clave)) continue;
    claves.add(clave);
    correcciones.push({
      ht: p.ht,
      es: p.es,
      motivo: "Tatoeba ht→es (id " + p.id + ", " + p.licencia + ", @" + p.autor + "): traducción humana de referencia.",
    });
    agregadas++;
  }
  fs.writeFileSync(CORRECCIONES, JSON.stringify(correcciones, null, 2) + "\n", "utf8");
  console.log("correcciones.json: +" + agregadas + " (pares humanos de Tatoeba). Total:", correcciones.length);
}

principal().then(() => console.log("Listo.")).catch((e) => { console.error("Error:", e); process.exit(1); });

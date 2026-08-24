// Convierte las "Correcciones sugeridas" exportadas desde la app (feedback de
// traducciones incorrectas) en candidatos para correcciones.json, cerrando el
// ciclo de mejora. Por defecto solo genera candidatos (revisión humana).
// Uso:
//   node autotest/feedback-a-correcciones.js --in correcciones-sugeridas.json
//   node autotest/feedback-a-correcciones.js --in feedback.json --aplicar
//   node autotest/feedback-a-correcciones.js --in feedback.json --aplicar-app

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const CORR = path.join(DIR, "correcciones.json");
const APP = path.join(DIR, "..", "app.js");
const SW = path.join(DIR, "..", "sw.js");
const HTML = path.join(DIR, "..", "index.html");
const OUT = path.join(DIR, "correcciones-candidatas.json");

function limpiar(t) {
  return (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function cargarCorr() { try { return JSON.parse(fs.readFileSync(CORR, "utf8")); } catch (e) { return []; } }
function cargarAppCorr() {
  const app = fs.readFileSync(APP, "utf8");
  const re = /\{ ht: ("(?:[^"\\]|\\.)*"), es: ("(?:[^"\\]|\\.)*") \}/g;
  const m = {}; let x;
  while ((x = re.exec(app)) !== null) m[limpiar(JSON.parse(x[1]))] = JSON.parse(x[2]);
  return m;
}
function extraerFeedback(ruta) {
  const d = JSON.parse(fs.readFileSync(ruta, "utf8"));
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.correcciones)) return d.correcciones;
  if (Array.isArray(d.feedback)) return d.feedback;
  return [];
}
function subirVersion() {
  const app = fs.readFileSync(APP, "utf8");
  const vm = app.match(/var VERSION = "v(\d+)";/);
  const v = parseInt(vm[1], 10) + 1;
  const nv = "v" + v;
  fs.writeFileSync(APP, app.replace(/var VERSION = "v\d+";/, 'var VERSION = "' + nv + '";'));
  let sw = fs.readFileSync(SW, "utf8").replace(/kreol-es-v\d+/g, "kreol-es-" + nv)
    .replace(/(styles\.css\?v=)\d+/g, "$1" + v).replace(/(app\.js\?v=)\d+/g, "$1" + v);
  fs.writeFileSync(SW, sw);
  let html = fs.readFileSync(HTML, "utf8").replace(/(styles\.css\?v=)\d+/g, "$1" + v)
    .replace(/(app\.js\?v=)\d+/g, "$1" + v);
  fs.writeFileSync(HTML, html);
  return nv;
}

function principal() {
  const args = process.argv.slice(2);
  const inIdx = args.indexOf("--in");
  if (inIdx < 0) { console.log("Uso: node autotest/feedback-a-correcciones.js --in feedback.json [--aplicar] [--aplicar-app]"); return; }
  const inPath = args[inIdx + 1];
  const aplicar = args.includes("--aplicar");
  const aplicarApp = args.includes("--aplicar-app");

  const fb = extraerFeedback(inPath);
  const candidatos = fb.map((it) => {
    const dir = it.direccion || "ht-es";
    let ht, es;
    if (dir === "es-ht") { ht = it.sugerido; es = it.origen; }
    else { ht = it.origen; es = it.sugerido; }
    return { ht: (ht || "").trim(), es: (es || "").trim(),
      motivo: "Reporte de usuario" + (it.fecha ? " (" + it.fecha + ")" : ""), fuente: "feedback" };
  }).filter((c) => c.ht && c.es);

  const existentes = new Set();
  cargarCorr().forEach((c) => existentes.add(limpiar(c.ht)));
  Object.keys(cargarAppCorr()).forEach((k) => existentes.add(k));
  const vistos = new Set();
  const unicos = candidatos.filter((c) => {
    const k = limpiar(c.ht);
    if (existentes.has(k) || vistos.has(k)) return false;
    vistos.add(k); return true;
  });

  fs.writeFileSync(OUT, JSON.stringify(unicos, null, 2) + "\n", "utf8");
  console.log("Feedback leído :", fb.length);
  console.log("Candidatos nuevos:", unicos.length, "-> " + path.relative(process.cwd(), OUT));

  if (!unicos.length) return;

  if (aplicar) {
    const corr = cargarCorr();
    const base = new Set(corr.map((c) => limpiar(c.ht)));
    unicos.forEach((c) => { if (!base.has(limpiar(c.ht))) corr.push({ ht: c.ht, es: c.es, motivo: c.motivo }); });
    fs.writeFileSync(CORR, JSON.stringify(corr, null, 2) + "\n", "utf8");
    console.log("Añadido a correcciones.json:", unicos.length);
  }
  if (aplicarApp) {
    const entries = unicos.map((c) => "  { ht: " + JSON.stringify(c.ht) + ", es: " + JSON.stringify(c.es) + " },").join("\n");
    let app = fs.readFileSync(APP, "utf8").replace(/(var CORRECCIONES = \[)(\n)/, "$1\n" + entries + "\n");
    fs.writeFileSync(APP, app);
    const nv = subirVersion();
    console.log("Inyectado en app.js CORRECCIONES y version subida a " + nv + " (sw.js/index.html actualizados).");
  }
}

principal();

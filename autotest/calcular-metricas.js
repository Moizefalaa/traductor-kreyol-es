// Calcula BLEU y chrF del corpus a partir de un reporte de autoevaluar.
// Uso: node autotest/calcular-metricas.js [ruta-reporte.json]
// Por defecto usa el reporte mas reciente run-completo*.json en reportes/.

const fs = require("fs");
const path = require("path");
const { metricasCorpus } = require("./metricas");

const DIR = __dirname;
const REP = path.join(DIR, "reportes");

function cargar(ruta) {
  if (ruta) return ruta;
  const f = fs.readdirSync(REP).filter((x) => x.endsWith(".json") && /run-completo/.test(x)).sort();
  if (!f.length) throw new Error("No hay reportes run-completo*.json en " + REP);
  return path.join(REP, f[f.length - 1]);
}

const ruta = cargar(process.argv[2]);
const rep = JSON.parse(fs.readFileSync(ruta, "utf8"));
const pares = rep.filas
  .filter((f) => f.estado !== "red" && (f.esEsperado || "").trim() && (f.google || "").trim())
  .map((f) => ({ hyp: f.google, ref: f.esEsperado }));

const m = metricasCorpus(pares);
console.log("Reporte:", ruta);
console.log("Oraciones evaluadas:", pares.length);
console.log("BLEU corpus : " + (m.bleu * 100).toFixed(2));
console.log("chrF corpus : " + (m.chrf * 100).toFixed(2));

const base = {
  reporte: ruta, fecha: new Date().toISOString(),
  oraciones: pares.length, bleu: m.bleu, chrf: m.chrf,
};
fs.writeFileSync(path.join(DIR, "metricas-baseline.json"), JSON.stringify(base, null, 2) + "\n", "utf8");
console.log("Baseline guardado en autotest/metricas-baseline.json");

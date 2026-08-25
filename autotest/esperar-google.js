// Poller: espera a que Google Translate (endpoint gtx) deje de responder 429 y,
// en cuanto vuelva (200), corre el autoevaluar completo limpio.
// Uso: node autotest/esperar-google.js   (puede dejarse corriendo en segundo plano)
// Revisa cada 2 min hasta por 2 h. Escribe autotest/_google-unblocked.txt al disparar.

const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DIR = __dirname;
const MAX_MS = 2 * 60 * 60 * 1000;
const INTERVALO = 2 * 60 * 1000;
const GOOGLE = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ht&tl=es&dt=t&q=";

function checkGoogle() {
  return new Promise((resolve) => {
    const req = https.get(GOOGLE + encodeURIComponent("ti nourit"), (r) => {
      r.resume();
      r.on("end", () => resolve(r.statusCode === 200));
    });
    req.on("error", () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  const inicio = Date.now();
  while (Date.now() - inicio < MAX_MS) {
    try {
      if (await checkGoogle()) {
        const ts = new Date().toISOString();
        console.log("[" + ts + "] Google responde 200. Corriendo autoevaluar completo...");
        const r = spawnSync("node", [path.join(DIR, "autoevaluar.js")], { stdio: "inherit" });
        fs.writeFileSync(path.join(DIR, "_google-unblocked.txt"), ts + " (exit " + r.status + ")\n");
        console.log("[" + ts + "] autoevaluar terminó (exit " + r.status + ").");
        return;
      }
    } catch (e) { /* reintenta */ }
    const falta = ((MAX_MS - (Date.now() - inicio)) / 60000).toFixed(0);
    console.log("[" + new Date().toISOString() + "] Google aún 429. Reintentando en 2 min (quedan ~" + falta + " min).");
    await new Promise((r) => setTimeout(r, INTERVALO));
  }
  console.log("Tiempo agotado esperando a Google (2 h). Vuelve a correr este script más tarde.");
}
main();

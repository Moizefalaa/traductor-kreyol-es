// Actualiza la versión de la app en todos los sitios a la vez.
// Uso:
//   node autotest/bump-version.js          # sube 1 (v34 -> v35)
//   node autotest/bump-version.js 40       # fija la versión 40
// Toca: app.js (VERSION y ?v=), sw.js (CACHE y ?v=), index.html (?v=) y version.txt.

const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const APP = path.join(RAIZ, "app.js");
const SW = path.join(RAIZ, "sw.js");
const INDEX = path.join(RAIZ, "index.html");
const VERSIONTXT = path.join(RAIZ, "version.txt");

const app = fs.readFileSync(APP, "utf8");
const m = app.match(/var VERSION = "v(\d+)";/);
if (!m) {
  console.error("No encontré `var VERSION = \"vNN\";` en app.js");
  process.exit(1);
}
const viejo = parseInt(m[1], 10);
const nuevo = process.argv[2] ? parseInt(process.argv[2], 10) : viejo + 1;
if (!Number.isInteger(nuevo) || nuevo <= viejo) {
  console.error("Número de versión inválido: " + process.argv[2]);
  process.exit(1);
}

function reemplazar(ruta, pares) {
  let s = fs.readFileSync(ruta, "utf8");
  pares.forEach(function (par) { s = s.split(par[0]).join(par[1]); });
  fs.writeFileSync(ruta, s);
  console.log("  actualizado: " + path.relative(RAIZ, ruta));
}

console.log("Versión v" + viejo + " -> v" + nuevo);
reemplazar(APP, [['"v' + viejo + '"', '"v' + nuevo + '"'], ["?v=" + viejo, "?v=" + nuevo]]);
reemplazar(SW, [["kreol-es-v" + viejo, "kreol-es-v" + nuevo], ["?v=" + viejo, "?v=" + nuevo]]);
reemplazar(INDEX, [["?v=" + viejo, "?v=" + nuevo]]);
fs.writeFileSync(VERSIONTXT, "v" + nuevo);
console.log("  actualizado: version.txt");
console.log("Listo. Revisa con `node --check` y sube los cambios.");

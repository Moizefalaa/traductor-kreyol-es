// Verifica la sintaxis de todos los JS del proyecto con `node --check`.
// Uso: node autotest/check-syntax.js   (o: npm run check)

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const archivos = ["app.js", "sw.js"];

fs.readdirSync(__dirname).forEach(function (f) {
  if (f.endsWith(".js")) archivos.push(path.join("autotest", f));
});
const vendor = path.join(RAIZ, "vendor");
if (fs.existsSync(vendor)) {
  fs.readdirSync(vendor).forEach(function (f) {
    if (f.endsWith(".js")) archivos.push(path.join("vendor", f));
  });
}

let fallos = 0;
archivos.forEach(function (rel) {
  const abs = path.join(RAIZ, rel);
  try {
    execFileSync(process.execPath, ["--check", abs], { stdio: "pipe" });
    console.log("OK   " + rel);
  } catch (e) {
    fallos++;
    console.error("ERR  " + rel);
    if (e.stderr) console.error(e.stderr.toString());
  }
});

if (fallos) {
  console.error("\n" + fallos + " archivo(s) con errores de sintaxis.");
  process.exit(1);
}
console.log("\nTodo OK (" + archivos.length + " archivos).");

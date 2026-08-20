const fs = require("fs");
const path = require("path");

const BASE = "https://global-asp.github.io/storybooks-spanish/stories/ht/";

const CUENTOS = [
  { id: "0087", titulo: "Mwen renmen li!", nivel: 1 },
  { id: "0327", titulo: "Konte bèt yo", nivel: 1 },
  { id: "0030", titulo: "Santiman", nivel: 1 },
  { id: "0302", titulo: "Dife", nivel: 1 },
  { id: "0156", titulo: "Yon kwokodil ki te grangou", nivel: 1 },
  { id: "0002", titulo: "Gade bèt yo", nivel: 1 },
  { id: "0003", titulo: "Rad lekòl", nivel: 1 },
  { id: "0120", titulo: "Cheve", nivel: 1 },
  { id: "0271", titulo: "De", nivel: 1 },
  { id: "0231", titulo: "Liv meteo", nivel: 1 },
  { id: "0129", titulo: "Yon ti frè parese", nivel: 1 },
  { id: "0067", titulo: "Kizin", nivel: 1 },
  { id: "0008", titulo: "Kisa wap fè", nivel: 1 },
  { id: "0009", titulo: "Kote chat mwen?", nivel: 1 },
  { id: "0112", titulo: "Kò mwen", nivel: 1 },
  { id: "0111", titulo: "Poukisa Ipopotam pa gen plim sou kò yo", nivel: 2 },
  { id: "0337", titulo: "Timoun lasi", nivel: 2 },
  { id: "0210", titulo: "Tingi ak bèf yo", nivel: 2 },
  { id: "0296", titulo: "Tom machann fig lan", nivel: 2 },
  { id: "0027", titulo: "Desizyon", nivel: 2 },
  { id: "0342", titulo: "Pinisyon", nivel: 2 },
  { id: "0089", titulo: "Khalai ap pale ak plant", nivel: 2 },
  { id: "0234", titulo: "Andiswa gwo jwèz foutbòl", nivel: 2 },
  { id: "0001", titulo: "Yon gason ki wo anpil", nivel: 2 },
  { id: "0095", titulo: "Zama se yon pakèt moun", nivel: 2 },
  { id: "0004", titulo: "Yon kabrit, yon chen ak yon bèf", nivel: 2 },
  { id: "0201", titulo: "Timoun bourik la", nivel: 3 },
  { id: "0006", titulo: "Anansi ak Lasajès", nivel: 3 },
  { id: "0110", titulo: "Yon ti grenn: Istwa Wangari Maathai", nivel: 3 },
  { id: "0158", titulo: "Poul ak Eg", nivel: 3 },
  { id: "0324", titulo: "Jou mwen kite lakay mwen pou'm ale lavil", nivel: 3 },
  { id: "0141", titulo: "Poul ak Annipye", nivel: 3 },
  { id: "0066", titulo: "Nozibèl ak twa cheve li yo", nivel: 3 },
  { id: "0315", titulo: "Chante Sakima", nivel: 3 },
  { id: "0291", titulo: "Kisa sè Vuzi pral di", nivel: 4 },
  { id: "0072", titulo: "Vanjans gid siwo myèl la", nivel: 4 },
  { id: "0294", titulo: "Fig grann mwen", nivel: 4 },
  { id: "0243", titulo: "Vakans kay grann nou", nivel: 4 },
  { id: "0052", titulo: "Simbegwire", nivel: 5 },
  { id: "0262", titulo: "Magozwe", nivel: 5 }
];

const SOLO = process.argv[2];
const ids = SOLO ? SOLO.split(",") : CUENTOS.map(function (c) { return c.id; });

function limpiar(texto) {
  return texto
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function descargar(id) {
  const resp = await fetch(BASE + id + "/");
  if (!resp.ok) throw new Error("HTTP " + resp.status + " para " + id);
  const html = await resp.text();

  const meta = CUENTOS.find(function (c) { return c.id === id; });

  const tituloHtMatch = html.match(/<span class="def">([^<]*)<\/span>/);
  const tituloEsMatch = html.match(/<span class="l1">([^<]*)<\/span>/);

  const hts = [];
  const reHt = /<(?:span|div) class="[^"]*def"[^>]*><h3>([\s\S]*?)<\/h3><\/(?:span|div)>/g;
  let m;
  while ((m = reHt.exec(html)) !== null) hts.push(limpiar(m[1]));

  const ess = [];
  const reEs = /<div class="[^"]*l1"[^>]*><h3>([\s\S]*?)<\/h3><\/div>/g;
  while ((m = reEs.exec(html)) !== null) ess.push(limpiar(m[1]));

  if (hts.length !== ess.length) {
    console.warn("[ADVERTENCIA] " + id + ": " + hts.length + " segmentos ht vs " + ess.length + " es");
  }

  return {
    id: id,
    titulo: tituloHtMatch ? limpiar(tituloHtMatch[1]) : meta.titulo,
    tituloEs: tituloEsMatch ? limpiar(tituloEsMatch[1]) : "",
    nivel: meta.nivel,
    fuente: "African Storybook / Global Storybooks",
    licencia: "CC BY",
    urlHt: BASE + id + "/",
    urlEs: "https://global-asp.github.io/storybooks-spanish/stories/es/" + id + "/",
    segmentos: hts.map(function (ht, i) {
      return { ht: ht, es: ess[i] || "" };
    })
  };
}

async function main() {
  const salida = [];
  for (const id of ids) {
    try {
      const cuento = await descargar(id);
      const segs = cuento.segmentos.length;
      console.log("OK  " + id + "  nivel " + cuento.nivel + "  " + cuento.titulo + "  (" + segs + " páginas)");
      salida.push(cuento);
    } catch (e) {
      console.error("ERR " + id + "  " + e.message);
    }
    await new Promise(function (r) { setTimeout(r, 300); });
  }

  const ruta = path.join(__dirname, "textos.json");
  const prev = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : [];
  const mapa = {};
  salida.forEach(function (c) { mapa[c.id] = c; });
  prev.forEach(function (c) { if (!mapa[c.id]) mapa[c.id] = c; });
  const todos = Object.keys(mapa).sort().map(function (id) { return mapa[id]; });

  fs.writeFileSync(ruta, JSON.stringify(todos, null, 2) + "\n", "utf8");
  console.log("\ntextos.json: " + todos.length + " cuentos (" + salida.length + " nuevos/actualizados).");
}

main().catch(function (e) {
  console.error("Falló descargar-cuentos:", e);
  process.exit(1);
});
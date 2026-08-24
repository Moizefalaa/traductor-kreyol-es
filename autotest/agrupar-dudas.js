// Analiza un reporte de autotest y agrupa las dudas/errores por patron de error
// del motor, para sugerir correcciones en lote (workflow #4).
// Uso: node autotest/agrupar-dudas.js [ruta-reporte.json]
// Si no se pasa ruta, usa el reporte mas reciente en autotest/reportes/.

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const REPORTES = path.join(DIR, "reportes");
const SALIDA = path.join(DIR, "sugerencias.json");

function normalizar(t) {
  return (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Detectores: cada uno devuelve true si la fila encaja en ese patron de error.
const DETECTORES = [
  {
    key: "enpi_improper",
    titulo: "Enpi leido como nombre/absurdo (Impi, impiedad, imperi…)",
    descripcion: "El motor confunde la conjuncion kreyol 'enpi' (y / entonces / despues) con un nombre propio.",
    sugerencia: "Agregar regla de glosario: fuente /\\benpi\\b/i -> 'epi' y/o salida que reemplace las formas absurdas por 'entonces'.",
    test: (f) => /\benpi\b/i.test(f.ht) && /(impe?i|imperi|impiedad|impías|impí|impios?|impuro|impura)/i.test(f.google || ""),
  },
  {
    key: "fig_higo",
    titulo: "fig (platano) traducido como 'higo'",
    descripcion: "En kreyol 'fig' significa platano; el motor lo traduce como 'higo' (fruta).",
    sugerencia: "Regla de glosario: si la fuente tiene /\\bfi?g\\b/i y la salida trae 'higo(s)', reemplazar por 'platano(s)'.",
    test: (f) => /\bfi?g\b/i.test(f.ht) && /\bhigo/i.test(f.google || ""),
  },
  {
    key: "eg_oveja",
    titulo: "Eg (Aguila) traducido como 'oveja'",
    descripcion: "La palabra 'Eg' (el Aguila, personaje) es leida como 'oveja'.",
    sugerencia: "Regla de glosario: si la fuente tiene /\\beg\\b/i y la salida trae 'oveja(s)', reemplazar por 'aguila(s)'.",
    test: (f) => /\beg\b/i.test(f.ht) && /\boveja/i.test(f.google || ""),
  },
  {
    key: "ofiyamezi",
    titulo: "Ofiyamezi queda como nombre",
    descripcion: "'Ofiyamezi' (= poco a poco) se deja sin traducir como nombre propio.",
    sugerencia: "Regla de glosario (salida): /\\bofiyamezi\\b/i -> 'poco a poco'.",
    test: (f) => /\bofiyamezi\b/i.test(f.ht) && /\bofiyamezi\b/i.test(f.google || ""),
  },
  {
    key: "rejim_dieta",
    titulo: "rejim fig (racimo de platano) como 'dieta de higos'",
    descripcion: "'rejim' (racimo/atalaya) mal traducido como 'dieta'.",
    sugerencia: "Correccion de frase o glosario para 'yon rejim fig' -> 'un racimo de platanos'.",
    test: (f) => /\brejim\b/i.test(f.ht) && /\bdieta/i.test(f.google || ""),
  },
  {
    key: "piki_fotos",
    titulo: "piki (picaduras) como 'fotos'",
    descripcion: "'pran piki' (recibir picaduras) traducido como 'hacer fotos'.",
    sugerencia: "Correccion de frase: '... ki pran tout piki yo' -> '... quien recibe todas las picaduras'.",
    test: (f) => /\bpiki\b/i.test(f.ht) && /\bfoto/i.test(f.google || ""),
  },
  {
    key: "gadyen_corredor",
    titulo: "gadyen bi (portero) como 'corredor'",
    descripcion: "'gadyen bi' (el portero) traducido como 'el corredor'.",
    sugerencia: "Correccion de frase: 'gadyen bi' -> 'portero'.",
    test: (f) => /gadyen bi/i.test(f.ht) && /corredor/i.test(f.google || ""),
  },
  {
    key: "bwi_impio",
    titulo: "bwi (ruido) como 'impio'",
    descripcion: "'bwi' (ruido) leido como 'impio'.",
    sugerencia: "Correccion de frase o glosario: 'ak yon gwo bwi' -> 'con un gran ruido'.",
    test: (f) => /\bbwi\b/i.test(f.ht) && /impí|impio/i.test(f.google || ""),
  },
  {
    key: "po_vasija",
    titulo: "po (vasija/cascara) como 'piel'",
    descripcion: "'po' (vasija, cascara) traducido como 'piel'.",
    sugerencia: "Correccion de frase para 'po tè kwit' -> 'olla de barro cocido'.",
    test: (f) => /(po t[èe]|po bwa|po t[èe] kwit)/i.test(f.ht) && /piel/i.test(f.google || ""),
  },
];

function cargarReporte(ruta) {
  if (ruta) return ruta;
  const archivos = fs.readdirSync(REPORTES).filter((x) => x.endsWith(".json")).sort();
  if (!archivos.length) throw new Error("No hay reportes en " + REPORTES);
  return path.join(REPORTES, archivos[archivos.length - 1]);
}

function principal() {
  const ruta = cargarReporte(process.argv[2]);
  const reporte = JSON.parse(fs.readFileSync(ruta, "utf8"));
  const filas = reporte.filas || [];
  const dudas = filas.filter(
    (f) => (f.veredicto === "duda" || f.veredicto === "error") &&
           (f.estado === "parafraseo" || f.estado === "sin-referencia" || f.estado === "error")
  );
  console.log("Reporte:", ruta);
  console.log("Filas totales:", filas.length, "| Dudas/errores a agrupar:", dudas.length);

  const grupos = {};
  DETECTORES.forEach((d) => (grupos[d.key] = { meta: d, ejemplos: [], total: 0 }));
  let sinGrupo = { meta: { key: "otros", titulo: "Otros (sin patron conocido)", descripcion: "Requiere revision manual.", sugerencia: "" }, ejemplos: [], total: 0 };
  let sinRef = { meta: { key: "sin_referencia", titulo: "Sin referencia (esEsperado vacio)", descripcion: "El texto de destino esperado esta vacio; revisar si la frase es valida.", sugerencia: "" }, ejemplos: [], total: 0 };

  for (const f of dudas) {
    if (f.estado === "sin-referencia") { sinRef.total++; if (sinRef.ejemplos.length < 5) sinRef.ejemplos.push(f); continue; }
    let asignado = false;
    for (const d of DETECTORES) {
      if (d.test(f)) { grupos[d.key].total++; if (grupos[d.key].ejemplos.length < 5) grupos[d.key].ejemplos.push(f); asignado = true; break; }
    }
    if (!asignado) { sinGrupo.total++; if (sinGrupo.ejemplos.length < 5) sinGrupo.ejemplos.push(f); }
  }

  const resultado = {
    reporte: ruta,
    totalDudas: dudas.length,
    grupos: Object.values(grupos).filter((g) => g.total > 0).map((g) => ({
      patron: g.meta.key, titulo: g.meta.titulo, descripcion: g.meta.descripcion,
      sugerencia: g.meta.sugerencia, total: g.total,
      ejemplos: g.ejemplos.map((f) => ({ id: f.id, ht: f.ht, google: f.google, esEsperado: f.esEsperado })),
    })),
    sinReferencia: { total: sinRef.total, ejemplos: sinRef.ejemplos.map((f) => ({ id: f.id, ht: f.ht, google: f.google })) },
    otros: { total: sinGrupo.total, ejemplos: sinGrupo.ejemplos.map((f) => ({ id: f.id, ht: f.ht, google: f.google, esEsperado: f.esEsperado })) },
  };

  fs.writeFileSync(SALIDA, JSON.stringify(resultado, null, 2) + "\n", "utf8");
  console.log("\n=== Patrones detectados ===");
  resultado.grupos.forEach((g) => console.log("  [" + g.patron + "] " + g.total + "  - " + g.titulo));
  console.log("  [sin_referencia] " + resultado.sinReferencia.total);
  console.log("  [otros] " + resultado.otros.total);
  console.log("\nSugerencias guardadas en", SALIDA);
}

principal();

const path = require("path");
const a = require("./autotest.js");

const DIR = __dirname;
const CORRECCIONES = a.leerJson(path.join(DIR, "correcciones.json"), []);
const TEXTOS = a.leerJson(path.join(DIR, "textos.json"), []);
const DIR_SALIDAS = path.join(DIR, "libros");

const ID = process.argv[2] || "0262";

function normalizarClave(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buscarEnDiccionario(texto) {
  const clave = normalizarClave(texto);
  for (const c of CORRECCIONES) {
    if (normalizarClave(c.ht) === clave || normalizarClave(c.es) === clave) return c;
  }
  return null;
}

async function traducirOracion(oracion, salidaEs) {
  const par = buscarEnDiccionario(oracion);
  if (par) return salidaEs ? par.es : par.ht;
  if (salidaEs) {
    return a.traducirConGoogle(oracion, "ht", "es")
      .catch(function () { return a.traducirConMyMemory(oracion, "ht", "es"); });
  }
  return a.traducirConGoogle(oracion, "es", "ht")
    .catch(function () { return a.traducirConMyMemory(oracion, "es", "ht"); });
}

async function traducirLibro(cuento, salidaEs) {
  const texto = cuento.segmentos.map(function (s) { return salidaEs ? s.ht : s.es; }).join(" ");
  const oraciones = a.dividirEnOraciones(texto);
  const traducidas = [];
  for (const oracion of oraciones) {
    traducidas.push(await traducirOracion(oracion, salidaEs));
  }
  return {
    oraciones: oraciones.length,
    texto: traducidas.join(" "),
    usadasMemoria: oraciones.filter(function (o) { return buscarEnDiccionario(o); }).length
  };
}

async function main() {
  const cuento = TEXTOS.find(function (t) { return t.id === ID; });
  if (!cuento) {
    console.error("Cuento no encontrado: " + ID);
    process.exit(1);
  }
  console.log("Traduciendo «" + cuento.titulo + "» (nivel " + cuento.nivel + ", " + cuento.segmentos.length + " páginas)…");

  const ht = await traducirLibro(cuento, false);
  const es = await traducirLibro(cuento, true);

  const nombre = cuento.id + "-" + cuento.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  a.escribirJson(path.join(DIR_SALIDAS, nombre + "-es.json"), {
    cuento: cuento.titulo,
    nivel: cuento.nivel,
    memoria: es.usadasMemoria,
    texto: es.texto
  });
  a.escribirJson(path.join(DIR_SALIDAS, nombre + "-ht.json"), {
    cuento: cuento.titulo,
    nivel: cuento.nivel,
    memoria: ht.usadasMemoria,
    texto: ht.texto
  });

  console.log("ht -> es: " + es.oraciones + " oraciones, " + es.usadasMemoria + " de la memoria.");
  console.log("es -> ht: " + ht.oraciones + " oraciones, " + ht.usadasMemoria + " de la memoria.");
  console.log("Guardado en " + DIR_SALIDAS);
}

main().catch(function (e) {
  console.error("Falló la traducción del libro:", e);
  process.exit(1);
});
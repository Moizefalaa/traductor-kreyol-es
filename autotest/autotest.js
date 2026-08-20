const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const RUTA_CORPUS = path.join(DIR, "corpus.json");
const RUTA_CORRECCIONES = path.join(DIR, "correcciones.json");
const RUTA_RESUMEN = path.join(DIR, "resumen.json");
const DIR_REPORTES = path.join(DIR, "reportes");

const UMBRAL_EXACTO = 0.9;
const UMBRAL_PARECIDO = 0.5;

function leerJson(archivo, porDefecto) {
  try {
    return JSON.parse(fs.readFileSync(archivo, "utf8"));
  } catch (e) {
    return porDefecto;
  }
}

function escribirJson(archivo, datos) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(datos, null, 2), "utf8");
}

function limpiar(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + costo);
      prev = tmp;
    }
  }
  return dp[n];
}

function similitud(a, b) {
  const na = limpiar(a), nb = limpiar(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  return 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);
}

function nivelDeSimilitud(sim) {
  if (sim >= UMBRAL_EXACTO) return "exacto";
  if (sim >= UMBRAL_PARECIDO) return "parecido";
  return "distinto";
}

async function conReintento(fn, intentos, esperaMs) {
  let ultimoError;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimoError = e;
      if (i < intentos - 1) await new Promise(function (r) { setTimeout(r, esperaMs); });
    }
  }
  throw ultimoError;
}

async function pedirFetch(url, tiempoMaximo) {
  const control = new AbortController();
  const temporizador = setTimeout(function () { control.abort(); }, tiempoMaximo || 20000);
  try {
    const resp = await fetch(url, { signal: control.signal });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    return await resp.json();
  } finally {
    clearTimeout(temporizador);
  }
}

let cadenaGoogle = Promise.resolve();

function agendarGoogle(fn) {
  const tarea = cadenaGoogle.then(async function () {
    const resultado = await fn();
    await new Promise(function (r) { setTimeout(r, 400); });
    return resultado;
  });
  cadenaGoogle = tarea.catch(function () {});
  return tarea;
}

async function traducirConGoogle(texto, sl, tl) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    sl + "&tl=" + tl + "&dt=t&q=" + encodeURIComponent(texto);
  return agendarGoogle(function () {
    return conReintento(async function () {
      const datos = await pedirFetch(url);
      const segmentos = datos && datos[0];
      if (!Array.isArray(segmentos) || !segmentos.length) throw new Error("Respuesta vacía");
      const t = segmentos.map(function (s) { return (s && s[0]) || ""; }).join("");
      if (!t) throw new Error("Sin traducción");
      return t;
    }, 4, 1500);
  });
}

async function traducirConMyMemory(texto, sl, tl) {
  const url = "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(texto) + "&langpair=" + sl + "%7C" + tl;
  const datos = await pedirFetch(url);
  const t = (datos.responseData && datos.responseData.translatedText) || "";
  if (!t || t.indexOf("QUERY LENGTH LIMIT") === 0) throw new Error("Sin traducción");
  return t;
}

function corregidaPara(ht, correcciones) {
  const clave = limpiar(ht);
  const encontrada = correcciones.find(function (c) { return limpiar(c.ht) === clave; });
  return encontrada ? encontrada : null;
}

async function verificar(entrada, correcciones) {
  const fila = {
    id: entrada.id,
    categoria: entrada.categoria,
    ht: entrada.ht,
    esEsperado: entrada.es,
    corregida: false,
    google: null,
    mymemory: null,
    roundtrip: null,
    simDirecto: null,
    simRoundtrip: null,
    nivelDirecto: null,
    nivelRoundtrip: null,
    desacuerdo: false,
    veredicto: "ok",
    estado: "ok"
  };

  const correccion = corregidaPara(entrada.ht, correcciones);
  if (correccion) {
    fila.esEsperado = correccion.es;
    fila.corregida = true;
    fila.veredicto = "ok";
    fila.estado = "cubierta";
    return fila;
  }

  try {
    const directo = await traducirConGoogle(entrada.ht, "ht", "es");
    fila.google = directo;
    fila.simDirecto = similitud(directo, fila.esEsperado);
    fila.nivelDirecto = nivelDeSimilitud(fila.simDirecto);

    try {
      const reversa = await traducirConGoogle(directo, "es", "ht");
      fila.roundtrip = reversa;
      fila.simRoundtrip = similitud(reversa, entrada.ht);
      fila.nivelRoundtrip = nivelDeSimilitud(fila.simRoundtrip);
    } catch (e) {
      fila.roundtrip = null;
      fila.nivelRoundtrip = "distinto";
      fila.simRoundtrip = 0;
    }

    try {
      const otroMotor = await traducirConMyMemory(entrada.ht, "ht", "es");
      fila.mymemory = otroMotor;
      fila.desacuerdo = similitud(otroMotor, directo) < UMBRAL_PARECIDO;
    } catch (e) {
      fila.mymemory = null;
    }
  } catch (e) {
    fila.estado = "red";
    fila.error = e.message;
    return fila;
  }

  if (fila.nivelDirecto === "distinto") {
    fila.veredicto = "error";
  } else if (fila.nivelDirecto === "parecido" || fila.nivelRoundtrip !== "exacto") {
    fila.veredicto = "duda";
  }
  return fila;
}

async function enParalelo(lista, limite, tarea) {
  const resultados = new Array(lista.length);
  let cursor = 0;
  const trabajadores = [];
  for (let i = 0; i < Math.min(limite, lista.length); i++) {
    trabajadores.push((async function () {
      while (cursor < lista.length) {
        const indice = cursor++;
        resultados[indice] = await tarea(lista[indice], indice);
      }
    })());
  }
  await Promise.all(trabajadores);
  return resultados;
}

function resumenDe(filas) {
  const conteo = { ok: 0, duda: 0, error: 0, red: 0, cubierta: 0 };
  filas.forEach(function (f) {
    if (f.estado === "red") { conteo.red++; return; }
    if (f.estado === "cubierta") { conteo.cubierta++; conteo.ok++; return; }
    if (f.veredicto === "error") { conteo.error++; return; }
    if (f.veredicto === "duda") { conteo.duda++; return; }
    conteo.ok++;
  });
  const evaluadas = conteo.ok + conteo.duda + conteo.error;
  return {
    fecha: new Date().toISOString(),
    total: filas.length,
    ok: conteo.ok,
    duda: conteo.duda,
    error: conteo.error,
    red: conteo.red,
    cubierta: conteo.cubierta,
    tasaError: evaluadas ? Math.round((conteo.error / evaluadas) * 100) / 100 : 0
  };
}

function imprimirResumen(resumen) {
  const lineas = [
    "RESUMEN DE LA CORRIDA",
    "  Total testeadas: " + resumen.total,
    "  OK:             " + resumen.ok,
    "  Dudas:          " + resumen.duda,
    "  Errores:        " + resumen.error,
    "  Cubiertas:      " + resumen.cubierta + " (por correcciones.json)",
    "  Fallos de red:  " + resumen.red,
    "  Tasa de error:  " + (resumen.tasaError * 100).toFixed(1) + "%"
  ];
  console.log(lineas.join("\n"));
}

function imprimirErrores(filas) {
  const problemas = filas.filter(function (f) {
    return f.estado !== "red" && f.veredicto !== "ok";
  });
  if (!problemas.length) return;
  console.log("\nCANDIDATOS A REVISION");
  problemas.forEach(function (f) {
    console.log("- [" + f.veredicto.toUpperCase() + "] " + f.id + "  " + f.ht);
    console.log("    esperado: " + f.esEsperado);
    console.log("    google:   " + f.google);
    if (f.roundtrip) console.log("    roundtrip (" + f.ht + "): " + f.roundtrip);
    if (f.desacuerdo && f.mymemory) console.log("    mymemory: " + f.mymemory);
    if (f.corregida) console.log("    (corregida por correcciones.json)");
  });
}

const UMBRAL_REGRESION = 0.02;

function compararConAnterior(actual, anterior) {
  if (!anterior) return { comparable: false, motivo: "primera corrida" };
  if (actual.total !== anterior.total) {
    return {
      comparable: false,
      motivo: "el corpus cambió (" + anterior.total + " -> " + actual.total + "), no hay comparación justa"
    };
  }
  const delta = actual.tasaError - anterior.tasaError;
  return {
    comparable: true,
    delta: delta,
    regresion: delta > UMBRAL_REGRESION,
    mejora: delta < -UMBRAL_REGRESION,
    anterior: anterior.tasaError,
    actual: actual.tasaError
  };
}

function imprimirComparacion(cmp) {
  console.log("\nCOMPARACION CON LA CORRIDA ANTERIOR");
  if (!cmp.comparable) {
    console.log("  Sin comparación: " + cmp.motivo + ".");
    return;
  }
  const pp = (cmp.delta * 100).toFixed(1);
  if (cmp.regresion) {
    console.log("  !!! REGRESION DETECTADA !!!");
    console.log("  La tasa de error subió de " + (cmp.anterior * 100).toFixed(1) + "% a " +
      (cmp.actual * 100).toFixed(1) + "% (+" + pp + " puntos). Revisa reportes/.");
  } else if (cmp.mejora) {
    console.log("  Mejora: la tasa bajó de " + (cmp.anterior * 100).toFixed(1) + "% a " +
      (cmp.actual * 100).toFixed(1) + "% (" + pp + " puntos).");
  } else {
    console.log("  Sin cambios significativos (delta " + (cmp.delta >= 0 ? "+" : "") + pp + " puntos, umbral " +
      (UMBRAL_REGRESION * 100).toFixed(0) + "%).");
  }
}

async function main() {
  console.log("Autotest kreyol-es: verifica el traductor contra un corpus conocido.\n" +
    "  - Directo:  motor(ht -> es) vs esperado\n" +
    "  - Ida y vuelta: motor(es -> ht) vs original\n" +
    "  - MyMemory se registra como dato, sin influir en el veredicto (poco fiable en kreyol)\n" +
    "Las frases en correcciones.json se marcan como cubiertas por el diccionario\n" +
    "local (como en la app real) y no se vuelven a enviar al motor.\n");

  const corpus = leerJson(RUTA_CORPUS, []);
  if (!corpus.length) {
    console.error("corpus.json vacío o inválido.");
    process.exit(1);
  }
  const correcciones = leerJson(RUTA_CORRECCIONES, []);

  const filas = await enParalelo(corpus, 3, function (entrada) {
    return verificar(entrada, correcciones);
  });

  const resumen = resumenDe(filas);
  imprimirResumen(resumen);
  imprimirErrores(filas);

  const historial = leerJson(RUTA_RESUMEN, []);
  const anterior = historial.length ? historial[historial.length - 1] : null;
  const comparacion = compararConAnterior(resumen, anterior);
  imprimirComparacion(comparacion);
  if (comparacion.comparable) {
    resumen.regresion = comparacion.regresion;
    resumen.deltaTasa = comparacion.delta;
  }

  const nombre = "run-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  escribirJson(path.join(DIR_REPORTES, nombre), { resumen: resumen, filas: filas });

  historial.push(resumen);
  escribirJson(RUTA_RESUMEN, historial);

  console.log("\nReporte guardado en: " + path.join(DIR_REPORTES, nombre));
  console.log("Tendencia acumulada en: " + RUTA_RESUMEN);

  if (comparacion.comparable && comparacion.regresion) {
    process.exitCode = 2;
  }
}

main().catch(function (e) {
  console.error("Falló el autotest:", e);
  process.exit(1);
});
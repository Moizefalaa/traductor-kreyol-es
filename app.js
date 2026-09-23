(function () {
  "use strict";

  var CORE = window.KreyolCore;
  var STORE = window.KreyolStore;
  var TRAD = window.KreyolTraductor;
  var VOZ = window.KreyolVoz;
  var aEspanolLatino = CORE.aEspanolLatino;
  var prepararFuenteKreyol = CORE.prepararFuenteKreyol;
  var aplicarGlosario = CORE.aplicarGlosario;
  var dividirEnOraciones = CORE.dividirEnOraciones;
  var cargarHistorial = STORE.cargarHistorial;
  var guardarHistorial = STORE.guardarHistorial;
  var cargarFeedback = STORE.cargarFeedback;
  var guardarFeedback = STORE.guardarFeedback;
  var cargarChileUsuario = STORE.cargarChileUsuario;
  var guardarChileUsuario = STORE.guardarChileUsuario;
  var cargarTema = STORE.cargarTema;
  var cargarPaleta = STORE.cargarPaleta;
  var cargarCacheTraduccion = STORE.cargarCacheTraduccion;
  var persistirCacheTraduccion = STORE.persistirCacheTraduccion;
  var leerCacheTraduccion = STORE.leerCacheTraduccion;
  var guardarCacheTraduccion = STORE.guardarCacheTraduccion;

  var SCHEMA_VERSION = 1;
  var VERSION = "v48";
  var GOOGLE_TTS = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&ttsspeed=1&q=";

  var origen = document.getElementById("textoOrigen");
  var destino = document.getElementById("textoDestino");
  var docArchivo = document.getElementById("docArchivo");
  var docTexto = document.getElementById("docTexto");
  var docSalida = document.getElementById("docSalida");
  var btnDocTraducir = document.getElementById("btnDocTraducir");
  var docProgreso = document.getElementById("docProgreso");
  var docProgresoBarra = document.getElementById("docProgresoBarra");
  var docProgresoTexto = document.getElementById("docProgresoTexto");
  var seccionSalida = document.getElementById("seccionSalida");
  var chipOrigen = document.getElementById("chipOrigen");
  var chipDestino = document.getElementById("chipDestino");
  var btnDirHT = document.getElementById("btnDirHT");
  var btnDirES = document.getElementById("btnDirES");
  var btnEscuchar = document.getElementById("btnEscuchar");
  var btnTraducir = document.getElementById("btnTraducir");
  var btnLeerOrigen = document.getElementById("btnLeerOrigen");
  var btnLeerDestino = document.getElementById("btnLeerDestino");
  var btnCopiar = document.getElementById("btnCopiar");
  var btnFavorito = document.getElementById("btnFavorito");
  var btnLimpiar = document.getElementById("btnLimpiar");
  var btnExportar = document.getElementById("btnExportar");
  var btnBorrarHistorial = document.getElementById("btnBorrarHistorial");
  var btnProbarVoz = document.getElementById("btnProbarVoz");
  var selectVoz = document.getElementById("selectVoz");
  var estadoVoz = document.getElementById("estadoVoz");
  var avisoNeutral = document.getElementById("avisoNeutral");
  var avisoInverso = document.getElementById("avisoInverso");
  var listaHistorial = document.getElementById("listaHistorial");
  var historialVacio = document.getElementById("historialVacio");
  var btnEmergencia = document.getElementById("btnEmergencia");
  var btnConvHT = document.getElementById("btnConvHT");
  var btnConvES = document.getElementById("btnConvES");
  var categoriasFrases = document.getElementById("categoriasFrases");
  var listaFrases = document.getElementById("listaFrases");
  var categoriasVocab = document.getElementById("categoriasVocab");
  var gridVocab = document.getElementById("gridVocab");
  var listaEmergencia = document.getElementById("listaEmergencia");
  var modalEmergencia = document.getElementById("modalEmergencia");
  var modalQR = document.getElementById("modalQR");
  var modalImportar = document.getElementById("modalImportar");
  var contenedorQR = document.getElementById("contenedorQR");
  var btnCopiarJSON = document.getElementById("btnCopiarJSON");
  var btnImportar = document.getElementById("btnImportar");
  var btnCompartirQR = document.getElementById("btnCompartirQR");
  var textoImportar = document.getElementById("textoImportar");
  var btnConfirmarImportar = document.getElementById("btnConfirmarImportar");
  var resultadoImportar = document.getElementById("resultadoImportar");
  var btnApariencia = document.getElementById("btnApariencia");
  var modalApariencia = document.getElementById("modalApariencia");
  var opcionesTema = document.getElementById("opcionesTema");
  var opcionesPaleta = document.getElementById("opcionesPaleta");
  var btnReportar = document.getElementById("btnReportar");
  var modalReportar = document.getElementById("modalReportar");
  var repOrigen = document.getElementById("repOrigen");
  var repDestino = document.getElementById("repDestino");
  var repSugerido = document.getElementById("repSugerido");
  var btnConfirmarReporte = document.getElementById("btnConfirmarReporte");
  var listaFeedback = document.getElementById("listaFeedback");
  var feedbackVacio = document.getElementById("feedbackVacio");
  var btnExportarFeedback = document.getElementById("btnExportarFeedback");
  var btnBorrarFeedback = document.getElementById("btnBorrarFeedback");
  var selGrado = document.getElementById("selGrado");
  var listaChile = document.getElementById("listaChile");
  var chileVacio = document.getElementById("chileVacio");
  var btnAgregarTextoChile = document.getElementById("btnAgregarTextoChile");
  var modalAgregarChile = document.getElementById("modalAgregarChile");
  var agregarTitulo = document.getElementById("agregarTitulo");
  var selGradoModal = document.getElementById("selGradoModal");
  var agregarTexto = document.getElementById("agregarTexto");
  var btnGuardarChile = document.getElementById("btnGuardarChile");
  var contadorCaracteres = document.getElementById("contadorCaracteres");
  var avisoMotor = document.getElementById("avisoMotor");
  var avisoCache = document.getElementById("avisoCache");
  var avisoOffline = document.getElementById("avisoOffline");
  var avisoError = document.getElementById("avisoError");
  var avisoErrorTexto = document.getElementById("avisoErrorTexto");
  var btnReintentar = document.getElementById("btnReintentar");
  var modalConfirmar = document.getElementById("modalConfirmar");
  var confirmarTitulo = document.getElementById("confirmarTitulo");
  var confirmarMensaje = document.getElementById("confirmarMensaje");
  var btnConfirmarSi = document.getElementById("btnConfirmarSi");
  var btnConfirmarNo = document.getElementById("btnConfirmarNo");

  var reconocedor = null;
  var escuchando = false;
  var ultimaTraduccion = null;
  var botonSonando = null;
  var colaAudio = [];
  var catFrasesActual = 0;
  var idTraduccion = 0;
  var idDocumento = 0;
  var fallbackReconocimientoHt = null;
  var modoConversacion = false;
  var hablarAlTraducir = false;

  var direccion = STORE.cargarDireccion();

  // Los datos viven en core.js
  var FRASES_RAPIDAS = CORE.FRASES_RAPIDAS;
  var FRASES_EMERGENCIA = CORE.FRASES_EMERGENCIA;
  var CORRECCIONES = CORE.CORRECCIONES;
  var VOCABULARIO = CORE.VOCABULARIO;

  function esSalidaEspañol() {
    return direccion === "ht-es";
  }

  function idiomaOrigen() { return esSalidaEspañol() ? "ht" : "es"; }
  function idiomaDestino() { return esSalidaEspañol() ? "es" : "ht"; }

  function formatearFecha(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  }

  function actualizarEtiquetas() {
    if (esSalidaEspañol()) {
      chipOrigen.textContent = "Criollo haitiano";
      chipDestino.textContent = "Español latino";
      origen.placeholder = "Escribe o dicta en criollo haitiano…";
      btnDirHT.classList.add("activo");
      btnDirES.classList.remove("activo");
    } else {
      chipOrigen.textContent = "Español latino";
      chipDestino.textContent = "Criollo haitiano";
      origen.placeholder = "Escribe o dicta en español…";
      btnDirHT.classList.remove("activo");
      btnDirES.classList.add("activo");
    }
    destino.lang = idiomaDestino();
    origen.lang = idiomaOrigen();
    renderFrases(catFrasesActual);
  }

  function renderHistorial() {
    var items = cargarHistorial();
    listaHistorial.innerHTML = "";
    historialVacio.classList.toggle("oculto", items.length > 0);
    items.slice().reverse().forEach(function (item) {
      var li = document.createElement("li");
      li.className = "item";

      var origenP = document.createElement("p");
      origenP.className = "origen";
      origenP.textContent = item.origen;
      origenP.lang = item.idiomaOrigen || "ht";

      var destinoP = document.createElement("p");
      destinoP.className = "destino";
      destinoP.textContent = item.destino;
      destinoP.lang = item.idiomaDestino || "es";

      var meta = document.createElement("div");
      meta.className = "meta";

      var fecha = document.createElement("span");
      fecha.textContent = formatearFecha(item.fecha);

      var estrella = document.createElement("button");
      estrella.type = "button";
      estrella.className = "estrella" + (item.favorito ? " favorita" : "");
      estrella.textContent = "\u2605";
      estrella.title = item.favorito ? "Quitar de favoritas" : "Marcar como favorita";
      estrella.setAttribute("aria-label", estrella.title);
      estrella.addEventListener("click", function () {
        toggleFavorito(item.id);
      });

      meta.appendChild(fecha);
      meta.appendChild(estrella);

      li.appendChild(origenP);
      li.appendChild(destinoP);
      li.appendChild(meta);
      listaHistorial.appendChild(li);
    });
  }

  function toggleFavorito(id) {
    var items = cargarHistorial();
    var item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.favorito = !item.favorito;
    guardarHistorial(items);
    renderHistorial();
    if (ultimaTraduccion && ultimaTraduccion.id === id) {
      btnFavorito.classList.toggle("activo", item.favorito);
    }
  }

  var MAX_HISTORIAL = 200;
  var MAX_FEEDBACK = 500;

  function agregarTraduccion(origenTexto, destinoTexto, normalizado) {
    var items = cargarHistorial();
    var entrada = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      origen: origenTexto,
      destino: destinoTexto,
      normalizado: !!normalizado,
      favorito: false,
      fecha: new Date().toISOString(),
      idiomaOrigen: idiomaOrigen(),
      idiomaDestino: idiomaDestino()
    };
    items.push(entrada);
    guardarHistorial(CORE.limitarHistorial(items, MAX_HISTORIAL));
    renderHistorial();
    return entrada;
  }

  var accionReintentar = null;

  function mostrarError(mensaje, reintentar) {
    avisoErrorTexto.textContent = mensaje;
    accionReintentar = typeof reintentar === "function" ? reintentar : null;
    btnReintentar.classList.toggle("oculto", !accionReintentar);
    avisoError.classList.remove("oculto");
  }

  function limpiarError() {
    avisoError.classList.add("oculto");
    accionReintentar = null;
  }

  btnReintentar.addEventListener("click", function () {
    var accion = accionReintentar;
    limpiarError();
    if (typeof accion === "function") accion();
  });

  var ultimoMotor = "google";
  var LIMITE_MYMEMORY = 500;

  function actualizarContador() {
    if (!contadorCaracteres) return;
    var n = origen.value.length;
    if (!n) {
      contadorCaracteres.classList.add("oculto");
      return;
    }
    contadorCaracteres.classList.remove("oculto");
    if (n > LIMITE_MYMEMORY) {
      contadorCaracteres.textContent = n + " caracteres · el motor de respaldo acepta máx. " + LIMITE_MYMEMORY;
      contadorCaracteres.classList.add("limite");
    } else {
      contadorCaracteres.textContent = n + " caracteres";
      contadorCaracteres.classList.remove("limite");
    }
  }

  function traducirTextoMotor(texto) {
    var textoMotor = esSalidaEspañol() ? texto : prepararFuenteKreyol(texto);
    var clave = VERSION + "|" + idiomaOrigen() + "|" + idiomaDestino() + "|" + textoMotor;
    // Primero la caché: así una frase ya traducida funciona aunque no haya internet.
    var cacheado = leerCacheTraduccion(clave);
    if (cacheado !== null) {
      ultimoMotor = "cache";
      return Promise.resolve(aplicarGlosario(texto, cacheado));
    }
    if (!navigator.onLine) return Promise.reject(new Error("Sin conexión: la traducción en línea no está disponible."));
    return TRAD.traducir(textoMotor, { origen: idiomaOrigen(), destino: idiomaDestino() })
      .then(function (res) {
        ultimoMotor = res.motor;
        guardarCacheTraduccion(clave, res.texto);
        return aplicarGlosario(texto, res.texto);
      });
  }

  var DICCIONARIO = CORE.construirDiccionario({
    frases: FRASES_RAPIDAS,
    emergencia: FRASES_EMERGENCIA,
    correcciones: CORRECCIONES,
    vocabulario: VOCABULARIO
  });

  function buscarEnDiccionario(texto) {
    return CORE.buscarEnDiccionario(DICCIONARIO, texto, esSalidaEspañol());
  }

  function mostrarResultado(traducido) {
    var resultado = traducido;
    var normalizado = false;
    if (esSalidaEspañol()) {
      var norm = aEspanolLatino(traducido);
      resultado = norm.texto;
      normalizado = norm.normalizado;
    }
    destino.textContent = resultado;
    avisoNeutral.classList.toggle("oculto", !normalizado);
    avisoInverso.classList.toggle("oculto", esSalidaEspañol());
    if (avisoMotor) avisoMotor.classList.toggle("oculto", ultimoMotor !== "mymemory");
    if (avisoCache) avisoCache.classList.toggle("oculto", ultimoMotor !== "cache");
    seccionSalida.hidden = false;

    ultimaTraduccion = agregarTraduccion(origen.value.trim(), resultado, normalizado);
    btnFavorito.classList.toggle("activo", false);
    seccionSalida.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (hablarAlTraducir) {
      hablarAlTraducir = false;
      leer(resultado, idiomaDestino(), function () {});
    }
  }

  function traducir() {
    var texto = origen.value.trim();
    if (!texto) {
      origen.focus();
      return;
    }

    var miId = ++idTraduccion;
    btnTraducir.disabled = true;
    btnTraducir.textContent = "Traduciendo…";
    limpiarError();

    var local = buscarEnDiccionario(texto);
    if (local) {
      ultimoMotor = "local";
      mostrarResultado(local);
      btnTraducir.disabled = false;
      btnTraducir.textContent = "Traducir";
      return;
    }

    if (traducirTextoLargo(miId)) return;

    traducirTextoMotor(texto)
      .then(function (t) { if (miId === idTraduccion) mostrarResultado(t); })
      .catch(function (err) {
        if (miId === idTraduccion) mostrarError("No se pudo traducir: " + err.message, traducir);
      })
      .finally(function () {
        if (miId === idTraduccion) {
          btnTraducir.disabled = false;
          btnTraducir.textContent = "Traducir";
        }
      });
  }

  function traducirTextoLargo(miId) {
    var texto = origen.value.trim();
    var oraciones = dividirEnOraciones(texto);
    if (oraciones.length <= 1) return false;

    traducirLote(oraciones, 4, miId)
      .then(function (traducidas) {
        if (miId === idTraduccion) mostrarResultado(traducidas.join(" "));
      })
      .catch(function (err) {
        if (miId === idTraduccion) mostrarError("No se pudo traducir el texto: " + err.message, traducir);
      })
      .finally(function () {
        if (miId === idTraduccion) {
          btnTraducir.disabled = false;
          btnTraducir.textContent = "Traducir";
        }
      });
    return true;
  }

  // Traduce oraciones con concurrencia limitada para no saturar las APIs
  // gratuitas (evita ráfagas de peticiones simultáneas y errores HTTP 429).
  // Se detiene solo si la petición quedó obsoleta (miId !== idTraduccion).
  function traducirLote(oraciones, limite, miId) {
    var resultados = new Array(oraciones.length);
    var indice = 0;
    function trabajador() {
      if (indice >= oraciones.length || miId !== idTraduccion) return Promise.resolve();
      var i = indice++;
      var oracion = oraciones[i];
      var local = buscarEnDiccionario(oracion);
      var p = local ? Promise.resolve(local) : traducirTextoMotor(oracion);
      return p.then(function (t) {
        resultados[i] = t;
        return trabajador();
      });
    }
    var n = Math.max(1, Math.min(limite || 4, oraciones.length));
    var arranques = [];
    for (var k = 0; k < n; k++) arranques.push(trabajador());
    return Promise.all(arranques).then(function () { return resultados; });
  }

  function traducirUnaFrase(texto) {
    texto = (texto || "").trim();
    if (!texto) return Promise.resolve("");
    var local = buscarEnDiccionario(texto);
    if (local) return Promise.resolve(local);
    if (!navigator.onLine) return Promise.reject(new Error("Sin conexión: la traducción en línea no está disponible."));
    return traducirTextoMotor(texto).then(function (t) {
      if (esSalidaEspañol()) return aEspanolLatino(t).texto;
      return t;
    });
  }

  function agregarFilaDoc(textoOrigen, textoTraducido, esError) {
    var fila = document.createElement("div");
    fila.className = "doc-fila";
    var celdaO = document.createElement("div");
    celdaO.className = "doc-origen";
    celdaO.textContent = textoOrigen;
    var celdaT = document.createElement("div");
    celdaT.className = "doc-traducido" + (esError ? " doc-error" : "");
    celdaT.textContent = textoTraducido;
    fila.appendChild(celdaO);
    fila.appendChild(celdaT);
    docSalida.appendChild(fila);
  }

  function actualizarProgresoDoc(hechas, total) {
    if (!docProgreso) return;
    if (!total) {
      docProgreso.classList.add("oculto");
      return;
    }
    docProgreso.classList.remove("oculto");
    docProgresoTexto.textContent = "Traduciendo " + hechas + " de " + total + " oración" + (total === 1 ? "" : "es") + "…";
    docProgresoBarra.style.width = Math.round((hechas / total) * 100) + "%";
  }

  function ocultarProgresoDoc() {
    if (!docProgreso) return;
    docProgreso.classList.add("oculto");
    docProgresoBarra.style.width = "0%";
  }

  function traducirDocumento() {
    var texto = docTexto.value.trim();
    if (!texto) {
      mostrarError("Pega o extrae el texto del documento antes de traducir.");
      return;
    }
    var miId = ++idDocumento;
    btnDocTraducir.disabled = true;
    btnDocTraducir.textContent = "Traduciendo…";
    docSalida.innerHTML = "";
    limpiarError();

    var oraciones = dividirEnOraciones(texto);
    var indice = 0;
    var hechas = 0;
    actualizarProgresoDoc(0, oraciones.length);

    function terminar() {
      if (miId === idDocumento) {
        btnDocTraducir.disabled = false;
        btnDocTraducir.textContent = "Traducir documento";
        ocultarProgresoDoc();
      }
    }

    function procesarSiguiente() {
      if (miId !== idDocumento) return;
      if (indice >= oraciones.length) {
        terminar();
        return;
      }
      var oracion = oraciones[indice++];
      traducirUnaFrase(oracion)
        .then(function (traducida) {
          if (miId === idDocumento) agregarFilaDoc(oracion, traducida, false);
        })
        .catch(function (err) {
          if (miId === idDocumento) agregarFilaDoc(oracion, "[no traducido: " + err.message + "]", true);
        })
        .then(function () {
          if (miId !== idDocumento) return;
          hechas++;
          actualizarProgresoDoc(hechas, oraciones.length);
          procesarSiguiente();
        });
    }
    procesarSiguiente();
  }

  var scriptsCargados = {};
  function cargarScript(ruta) {
    if (!scriptsCargados[ruta]) {
      scriptsCargados[ruta] = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = ruta;
        s.onload = function () { resolve(); };
        s.onerror = function () {
          delete scriptsCargados[ruta];
          reject(new Error("No se pudo cargar " + ruta));
        };
        document.head.appendChild(s);
      });
    }
    return scriptsCargados[ruta];
  }

  async function extraerTextoPdf(archivo) {
    try {
      await cargarScript("vendor/pdf.min.js?v=48");
    } catch (e) { /* sigue y reporta abajo */ }
    if (!window.pdfjsLib) {
      throw new Error("No se pudo cargar el lector de PDF (¿sin conexión?). Pega el texto manualmente.");
    }
    try {
      if (window.pdfjsLib.GlobalWorkerOptions && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js?v=48";
      }
    } catch (e) { /* dejar que falle al usar */ }
    var buf = await archivo.arrayBuffer();
    var pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    var partes = [];
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var contenido = await page.getTextContent();
      var lineas = [];
      var ultimaY = null;
      contenido.items.forEach(function (item) {
        if (item.str === "") return;
        if (ultimaY !== null && item.transform && Math.abs(item.transform[5] - ultimaY) > 5) {
          lineas.push("\n");
        }
        lineas.push(item.str);
        if (item.transform) ultimaY = item.transform[5];
      });
      partes.push(lineas.join(" ").replace(/\s+/g, " ").trim());
    }
    return partes.filter(function (t) { return t.trim(); }).join("\n\n");
  }

  function extraerTextoWord(archivo) {
    return cargarScript("vendor/mammoth.browser.min.js?v=48").then(function () {
      if (!window.mammoth) {
        throw new Error("No se pudo cargar el lector de Word (¿sin conexión?). Pega el texto manualmente.");
      }
      return archivo.arrayBuffer().then(function (buf) {
        return window.mammoth.extractRawText({ arrayBuffer: buf }).then(function (res) {
          return (res.value || "").trim();
        });
      });
    }, function () {
      throw new Error("No se pudo cargar el lector de Word (¿sin conexión?). Pega el texto manualmente.");
    });
  }

  function elegirLangReconocimiento() {
    if (!esSalidaEspañol()) return "es-ES";
    return fallbackReconocimientoHt || "ht-HT";
  }

  function configurarVoz() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      btnEscuchar.disabled = true;
      btnEscuchar.title = "Reconocimiento de voz no disponible en este navegador";
      return;
    }
    reconocedor = new SR();
    reconocedor.lang = elegirLangReconocimiento();
    reconocedor.interimResults = false;
    reconocedor.maxAlternatives = 1;

    reconocedor.onstart = function () {
      escuchando = true;
      btnEscuchar.classList.add("escuchando");
      btnEscuchar.textContent = "\uD83C\uDF99 Detener";
      limpiarError();
      estadoVoz.textContent = "Escuchando…";
      estadoVoz.classList.remove("oculto");
    };

    reconocedor.onresult = function (evento) {
      var transcrito = "";
      for (var i = evento.resultIndex; i < evento.results.length; i++) {
        transcrito += evento.results[i][0].transcript;
      }
      origen.value = transcrito.trim();
    };

    reconocedor.onerror = function (evento) {
      // Web Speech no tiene modelo de criollo haitiano. Si el dispositivo lo
      // rechaza, caemos a francés (pronunciación parecida) en vez de fallar.
      if (evento.error === "language-not-supported" && esSalidaEspañol() && fallbackReconocimientoHt !== "fr-FR") {
        fallbackReconocimientoHt = "fr-FR";
        reconocedor.lang = fallbackReconocimientoHt;
        mostrarError("Este teléfono no tiene dictado en criollo. Usaremos francés (sonido parecido): toca de nuevo «Escuchar».");
        return;
      }
      var mensajes = {
        "no-speech": "No se detectó voz. Intenta de nuevo.",
        "audio-capture": "No se encontró micrófono.",
        "not-allowed": "Permiso de micrófono denegado.",
        "language-not-supported": "El reconocimiento de voz no está soportado para este idioma en este navegador."
      };
      mostrarError(mensajes[evento.error] || "Error de voz: " + evento.error);
    };

    reconocedor.onend = function () {
      escuchando = false;
      btnEscuchar.classList.remove("escuchando");
      btnEscuchar.textContent = "\uD83C\uDF99 Escuchar";
      estadoVoz.classList.add("oculto");
      hablarAlTraducir = modoConversacion;
      modoConversacion = false;
      if (origen.value.trim()) traducir();
    };

    btnEscuchar.disabled = false;
  }

  function poblarSelectVoz() {
    var eleccion = STORE.cargarVoz();
    selectVoz.innerHTML = "";
    var opciones = [["auto", "Auto (mejor voz disponible)"], ["google", "Voz en línea (Google)"]];

    VOZ.listarVocesUtiles(VOZ.vocesSistema()).forEach(function (v) {
      var lang = (v.lang || "").toLowerCase();
      var nota = "";
      if (lang.indexOf("ht") === 0) nota = " · criollo";
      else if (lang.indexOf("fr") === 0) nota = " · útil para criollo";
      opciones.push(["sys|" + v.name, "Sistema: " + v.name + " (" + v.lang + ")" + nota]);
    });

    opciones.forEach(function (par) {
      var op = document.createElement("option");
      op.value = par[0];
      op.textContent = par[1];
      selectVoz.appendChild(op);
    });

    var valido = opciones.some(function (par) { return par[0] === eleccion; });
    selectVoz.value = valido ? eleccion : "auto";
  }

  function detenerAudio() {
    colaAudio.forEach(function (a) {
      a.onended = null;
      a.onerror = null;
      try { a.pause(); } catch (e) {}
      a.src = "";
    });
    colaAudio = [];
  }

  function detenerSistema() {
    VOZ.detenerSistema();
  }

  function detenerLectura() {
    detenerAudio();
    detenerSistema();
  }

  function marcarSonando(btn) {
    if (botonSonando && botonSonando !== btn) botonSonando.classList.remove("sonando");
    botonSonando = btn;
    if (btn) btn.classList.add("sonando");
  }

  function terminarSonido() {
    if (botonSonando) botonSonando.classList.remove("sonando");
    botonSonando = null;
  }

  function reproducirConGoogle(texto, lang, alTerminar) {
    if (!navigator.onLine || lang === "ht") return false;
    var partes = VOZ.dividirFragmentos(texto, 190);
    if (!partes.length) return false;

    colaAudio = [];
    var indice = 0;
    var fallo = false;

    function pasarAlSistema() {
      if (fallo) return;
      fallo = true;
      detenerAudio();
      VOZ.hablarConSistema(texto, lang, selectVoz.value, alTerminar);
    }

    function siguiente() {
      if (indice >= partes.length) {
        alTerminar();
        return;
      }
      var url = GOOGLE_TTS + encodeURIComponent(partes[indice]) + "&tl=" + VOZ.langParaGoogle(lang);
      var audio = new Audio(url);
      colaAudio.push(audio);
      audio.onended = function () {
        if (fallo) return;
        indice++;
        siguiente();
      };
      audio.onerror = function () { pasarAlSistema(); };
      audio.play().catch(function () { pasarAlSistema(); });
    }

    siguiente();
    return true;
  }

  function leer(texto, lang, alTerminar) {
    if (!texto) {
      alTerminar();
      return;
    }
    detenerLectura();
    var eleccion = selectVoz.value;
    if (navigator.onLine && (eleccion === "google" || eleccion === "auto")) {
      if (reproducirConGoogle(texto, lang, alTerminar)) return;
    }
    VOZ.hablarConSistema(texto, lang, eleccion, alTerminar);
  }

  function configurarBotonVoz(btn, obtenerTexto, obtenerLang) {
    btn.addEventListener("click", function () {
      if (btn.classList.contains("sonando")) {
        detenerLectura();
        terminarSonido();
        return;
      }
      detenerLectura();
      var texto = obtenerTexto();
      if (!texto) {
        terminarSonido();
        origen.focus();
        return;
      }
      marcarSonando(btn);
      leer(texto, obtenerLang(), function () {
        if (botonSonando === btn) terminarSonido();
      });
    });
  }

  function cambiarDireccion(nueva) {
    if (nueva === direccion) return;
    if (escuchando && reconocedor) {
      try { reconocedor.stop(); } catch (e) {}
    }
    direccion = nueva;
    idTraduccion++;
    idDocumento++;
    hablarAlTraducir = false;
    modoConversacion = false;
    STORE.guardarDireccion(nueva);
    actualizarEtiquetas();
    seccionSalida.hidden = true;
    ultimaTraduccion = null;
    configurarVoz();
  }

  btnDirHT.addEventListener("click", function () { cambiarDireccion("ht-es"); });
  btnDirES.addEventListener("click", function () { cambiarDireccion("es-ht"); });

  btnEscuchar.addEventListener("click", function () {
    if (!reconocedor) return;
    modoConversacion = false;
    hablarAlTraducir = false;
    if (escuchando) {
      reconocedor.stop();
    } else {
      try {
        reconocedor.start();
      } catch (e) {
        mostrarError("No se pudo iniciar el micrófono: " + e.message);
      }
    }
  });

  btnTraducir.addEventListener("click", function () {
    hablarAlTraducir = false;
    modoConversacion = false;
    traducir();
  });

  if (docArchivo && docTexto && docSalida && btnDocTraducir) {
    docArchivo.addEventListener("change", function () {
      var archivo = docArchivo.files && docArchivo.files[0];
      if (!archivo) return;
      btnDocTraducir.disabled = true;
      docSalida.innerHTML = "";
      var nombre = (archivo.name || "").toLowerCase();
      var esPdf = /\.pdf$/.test(nombre) || archivo.type === "application/pdf";
      docTexto.value = esPdf ? "Extrayendo texto del PDF…" : "Extrayendo texto del documento…";
      var promesa = esPdf ? extraerTextoPdf(archivo) : extraerTextoWord(archivo);
      promesa
        .then(function (txt) {
          docTexto.value = txt;
          btnDocTraducir.disabled = false;
        })
        .catch(function (err) {
          docTexto.value = "";
          var tipo = esPdf ? "el PDF" : "el documento Word";
          mostrarError("No se pudo leer " + tipo + ": " + err.message + " Puedes pegar el texto manualmente.");
          btnDocTraducir.disabled = false;
        });
    });

    docTexto.addEventListener("input", function () {
      btnDocTraducir.disabled = !docTexto.value.trim();
    });

    btnDocTraducir.addEventListener("click", traducirDocumento);
    btnDocTraducir.disabled = !docTexto.value.trim();
  }

  origen.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") traducir();
  });

  origen.addEventListener("input", actualizarContador);

  btnLimpiar.addEventListener("click", function () {
    origen.value = "";
    seccionSalida.hidden = true;
    ultimaTraduccion = null;
    actualizarContador();
    origen.focus();
  });

  btnCopiar.addEventListener("click", function () {
    var texto = destino.textContent;
    if (!texto) return;
    var accion = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(texto)
      : Promise.reject(new Error("sin clipboard"));
    accion
      .then(function () {
        btnCopiar.textContent = "\u2713";
        setTimeout(function () { btnCopiar.textContent = "\uD83D\uDCCB"; }, 1200);
      })
      .catch(function () {
        var rango = document.createRange();
        rango.selectNodeContents(destino);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rango);
      });
  });

  btnFavorito.addEventListener("click", function () {
    if (!ultimaTraduccion) return;
    toggleFavorito(ultimaTraduccion.id);
  });

  btnBorrarHistorial.addEventListener("click", function () {
    if (!cargarHistorial().length) return;
    pedirConfirmacion(
      "Borrar historial",
      "¿Seguro que quieres borrar todo el historial? Esta acción no se puede deshacer.",
      "Borrar",
      function () {
        guardarHistorial([]);
        renderHistorial();
        seccionSalida.hidden = true;
        ultimaTraduccion = null;
      }
    );
  });

  btnExportar.addEventListener("click", function () {
    var datos = {
      app: "traductor-kreyol-es",
      schemaVersion: SCHEMA_VERSION,
      exportadoEl: new Date().toISOString(),
      direccionPorDefecto: direccion,
      motor: "mymemory",
      motorVoz: "google-tts + web-speech",
      notasParaAndroid: "Este JSON es la fuente de datos para migrar a la app nativa: historial, favoritas y frecuencia de frases.",
      frecuencia: (function () {
        var mapa = {};
        cargarHistorial().forEach(function (item) {
          var clave = item.origen.toLowerCase();
          mapa[clave] = mapa[clave] || { origen: item.origen, destino: item.destino, veces: 0, normalizado: item.normalizado };
          mapa[clave].veces++;
        });
        return Object.values(mapa).sort(function (a, b) { return b.veces - a.veces; });
      })(),
      favoritas: cargarHistorial().filter(function (i) { return i.favorito; }),
      historial: cargarHistorial()
    };

    var blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "traducciones-kreyol-es.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  selectVoz.addEventListener("change", function () {
    STORE.guardarVoz(selectVoz.value);
  });

  btnProbarVoz.addEventListener("click", function () {
    detenerLectura();
    var es = esSalidaEspañol();
    var texto = es
      ? "Hola, ¿cómo estás? Mi nombre es Aida. ¿Puedes ayudarme, por favor?"
      : "Bonjou, koman ou ye? Mwen rele Aida. Èske ou ka ede m, tanpri?";
    marcarSonando(btnProbarVoz);
    leer(texto, idiomaDestino(), function () {
      if (botonSonando === btnProbarVoz) terminarSonido();
    });
  });

  configurarBotonVoz(btnLeerOrigen, function () {
    return origen.value.trim();
  }, idiomaOrigen);

  configurarBotonVoz(btnLeerDestino, function () {
    return destino.textContent.trim();
  }, idiomaDestino);

  function botonHablar(texto, lang) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "boton-icono hablar";
    b.textContent = "\uD83D\uDD0A";
    b.title = "Escuchar";
    b.setAttribute("aria-label", "Escuchar");
    b.addEventListener("click", function () {
      if (b.classList.contains("sonando")) {
        detenerLectura();
        terminarSonido();
        return;
      }
      detenerLectura();
      marcarSonando(b);
      leer(texto, lang, function () {
        if (botonSonando === b) terminarSonido();
      });
    });
    return b;
  }

  function usarFrase(ht, es) {
    var texto = esSalidaEspañol() ? ht : es;
    origen.value = texto;
    seccionSalida.hidden = true;
    ultimaTraduccion = null;
    hablarAlTraducir = false;
    traducir();
  }

  function renderCategoriasFrases() {
    categoriasFrases.innerHTML = "";
    FRASES_RAPIDAS.forEach(function (grupo, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "categoria" + (i === 0 ? " activo" : "");
      b.textContent = grupo.cat;
      b.addEventListener("click", function () {
        categoriasFrases.querySelectorAll(".categoria").forEach(function (c) { c.classList.remove("activo"); });
        b.classList.add("activo");
        catFrasesActual = i;
        renderFrases(i);
      });
      categoriasFrases.appendChild(b);
    });
    renderFrases(0);
  }

  function renderFrases(indice) {
    var grupo = FRASES_RAPIDAS[indice] || FRASES_RAPIDAS[0];
    listaFrases.innerHTML = "";
    grupo.frases.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "frase-boton";
      var fuerte = document.createElement("strong");
      fuerte.textContent = esSalidaEspañol() ? f.ht : f.es;
      fuerte.lang = esSalidaEspañol() ? "ht" : "es";
      var debil = document.createElement("span");
      debil.textContent = esSalidaEspañol() ? f.es : f.ht;
      debil.lang = esSalidaEspañol() ? "es" : "ht";
      b.appendChild(fuerte);
      b.appendChild(debil);
      b.addEventListener("click", function () { usarFrase(f.ht, f.es); });
      listaFrases.appendChild(b);
    });
  }

  function renderCategoriasVocab() {
    categoriasVocab.innerHTML = "";
    VOCABULARIO.forEach(function (grupo, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "categoria" + (i === 0 ? " activo" : "");
      b.textContent = grupo.cat;
      b.addEventListener("click", function () {
        categoriasVocab.querySelectorAll(".categoria").forEach(function (c) { c.classList.remove("activo"); });
        b.classList.add("activo");
        renderVocab(i);
      });
      categoriasVocab.appendChild(b);
    });
    renderVocab(0);
  }

  function renderVocab(indice) {
    var grupo = VOCABULARIO[indice] || VOCABULARIO[0];
    gridVocab.innerHTML = "";
    grupo.items.forEach(function (item) {
      var tarjeta = document.createElement("button");
      tarjeta.type = "button";
      tarjeta.className = "vocab-card";

      var emoji = document.createElement("span");
      emoji.className = "vocab-emoji";
      emoji.textContent = item.emoji || "";

      var ht = document.createElement("span");
      ht.className = "vocab-ht";
      ht.textContent = item.ht;
      ht.lang = "ht";

      var es = document.createElement("span");
      es.className = "vocab-es";
      es.textContent = item.es;
      es.lang = "es";

      var acciones = document.createElement("div");
      acciones.className = "vocab-acciones";
      acciones.appendChild(botonHablar(item.ht, "ht"));
      acciones.appendChild(botonHablar(item.es, "es"));

      tarjeta.appendChild(emoji);
      tarjeta.appendChild(ht);
      tarjeta.appendChild(es);
      tarjeta.appendChild(acciones);
      tarjeta.addEventListener("click", function (e) {
        if (e.target.closest(".hablar")) return;
        usarFrase(item.ht, item.es);
      });
      gridVocab.appendChild(tarjeta);
    });
  }

  function renderEmergencia() {
    listaEmergencia.innerHTML = "";
    FRASES_EMERGENCIA.forEach(function (f) {
      var item = document.createElement("div");
      item.className = "emergencia-item";

      var ht = document.createElement("p");
      ht.className = "ht";
      ht.textContent = f.ht;
      ht.lang = "ht";

      var es = document.createElement("p");
      es.className = "es";
      es.textContent = f.es;
      es.lang = "es";

      var acciones = document.createElement("div");
      acciones.className = "emergencia-acciones";
      acciones.appendChild(botonHablar(f.ht, "ht"));
      acciones.appendChild(botonHablar(f.es, "es"));

      item.appendChild(ht);
      item.appendChild(es);
      item.appendChild(acciones);
      listaEmergencia.appendChild(item);
    });
  }

  var ultimoFocoAntesDeModal = null;

  function elementosEnfocables(modal) {
    return Array.prototype.slice.call(modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return !el.disabled; });
  }

  function abrirModal(modal) {
    ultimoFocoAntesDeModal = document.activeElement;
    modal.classList.remove("oculto");
    var objetivo = modal.querySelector("textarea, input") || elementosEnfocables(modal)[0];
    if (objetivo) setTimeout(function () { objetivo.focus(); }, 30);
  }

  function cerrarModal(modal) {
    modal.classList.add("oculto");
    if (ultimoFocoAntesDeModal && ultimoFocoAntesDeModal.focus) {
      ultimoFocoAntesDeModal.focus();
    }
    ultimoFocoAntesDeModal = null;
  }

  document.addEventListener("keydown", function (e) {
    var modal = document.querySelector(".modal-overlay:not(.oculto)");
    if (!modal) return;
    if (e.key === "Escape") {
      cerrarModal(modal);
      return;
    }
    if (e.key === "Tab") {
      var enfocables = elementosEnfocables(modal);
      if (!enfocables.length) return;
      var primero = enfocables[0];
      var ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
  });

  document.querySelectorAll(".modal-overlay").forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m) cerrarModal(m);
    });
  });

  document.querySelectorAll(".boton-cerrar").forEach(function (b) {
    b.addEventListener("click", function () {
      var modal = b.closest(".modal-overlay");
      if (modal) cerrarModal(modal);
    });
  });

  var accionConfirmar = null;

  function pedirConfirmacion(titulo, mensaje, textoSi, accion) {
    confirmarTitulo.textContent = titulo;
    confirmarMensaje.textContent = mensaje;
    btnConfirmarSi.textContent = textoSi;
    accionConfirmar = accion;
    abrirModal(modalConfirmar);
  }

  btnConfirmarSi.addEventListener("click", function () {
    var accion = accionConfirmar;
    accionConfirmar = null;
    cerrarModal(modalConfirmar);
    if (typeof accion === "function") accion();
  });

  btnConfirmarNo.addEventListener("click", function () {
    accionConfirmar = null;
    cerrarModal(modalConfirmar);
  });

  btnEmergencia.addEventListener("click", function () {
    renderEmergencia();
    abrirModal(modalEmergencia);
  });

  function aplicarTema(t) {
    document.documentElement.setAttribute("data-theme", t);
    STORE.guardarTema(t);
  }

  function aplicarPaleta(p) {
    document.documentElement.setAttribute("data-paleta", p);
    STORE.guardarPaleta(p);
  }

  function marcarOpcion(contenedor, atributo, valor) {
    contenedor.querySelectorAll(".opcion").forEach(function (o) {
      o.classList.toggle("activo", o.getAttribute(atributo) === valor);
    });
  }

  if (btnApariencia && modalApariencia) {
    aplicarTema(cargarTema());
    aplicarPaleta(cargarPaleta());
    marcarOpcion(opcionesTema, "data-tema", cargarTema());
    marcarOpcion(opcionesPaleta, "data-paleta", cargarPaleta());

    btnApariencia.addEventListener("click", function () {
      abrirModal(modalApariencia);
    });

    opcionesTema.querySelectorAll(".opcion").forEach(function (o) {
      o.addEventListener("click", function () {
        aplicarTema(o.getAttribute("data-tema"));
        marcarOpcion(opcionesTema, "data-tema", cargarTema());
      });
    });

    opcionesPaleta.querySelectorAll(".opcion").forEach(function (o) {
      o.addEventListener("click", function () {
        aplicarPaleta(o.getAttribute("data-paleta"));
        marcarOpcion(opcionesPaleta, "data-paleta", cargarPaleta());
      });
    });
  }

  function iniciarConversacion(dir) {
    cambiarDireccion(dir);
    origen.value = "";
    seccionSalida.hidden = true;
    ultimaTraduccion = null;
    if (!reconocedor) {
      mostrarError("Reconocimiento de voz no disponible en este navegador.");
      return;
    }
    modoConversacion = true;
    try {
      reconocedor.start();
    } catch (e) {
      modoConversacion = false;
      mostrarError("No se pudo iniciar el micrófono: " + e.message);
    }
  }

  btnConvHT.addEventListener("click", function () { iniciarConversacion("ht-es"); });
  btnConvES.addEventListener("click", function () { iniciarConversacion("es-ht"); });

  function construirPayloadCompartir() {
    var items = cargarHistorial();
    var mapa = {};
    items.forEach(function (item) {
      var clave = item.origen.toLowerCase();
      mapa[clave] = mapa[clave] || { origen: item.origen, destino: item.destino, veces: 0, normalizado: item.normalizado };
      mapa[clave].veces++;
    });
    return {
      app: "traductor-kreyol-es",
      schemaVersion: SCHEMA_VERSION,
      exportadoEl: new Date().toISOString(),
      favoritas: items.filter(function (i) { return i.favorito; }).slice(-15),
      frecuencia: Object.values(mapa).sort(function (a, b) { return b.veces - a.veces; }).slice(0, 25),
      historial: items.slice(-10),
      correccionesSugeridas: cargarFeedback()
    };
  }

  // QR generado en el propio dispositivo (vendor/qrcode.js). Así no se envían
  // los datos del usuario a ningún servicio externo.
  var MAX_QR_CHARS = 1500;

  function construirPayloadQR() {
    var datos = construirPayloadCompartir();
    var json = JSON.stringify(datos);
    if (json.length > MAX_QR_CHARS) {
      json = JSON.stringify({
        app: datos.app,
        schemaVersion: datos.schemaVersion,
        favoritas: datos.favoritas.slice(0, 10),
        correccionesSugeridas: (datos.correccionesSugeridas || []).slice(0, 10)
      });
    }
    return json;
  }

  function mostrarAvisoQR(texto) {
    contenedorQR.innerHTML = "";
    var p = document.createElement("p");
    p.className = "aviso";
    p.textContent = texto;
    contenedorQR.appendChild(p);
  }

  btnCompartirQR.addEventListener("click", function () {
    var json = construirPayloadQR();
    btnCopiarJSON.dataset.json = json;
    abrirModal(modalQR);
    mostrarAvisoQR("Generando código QR…");
    cargarScript("vendor/qrcode.js?v=" + VERSION.replace("v", "")).then(function () {
      if (typeof qrcode !== "function") throw new Error("sin librería");
      var qr = qrcode(0, "L");
      qr.addData(json);
      qr.make();
      var svg = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
      var img = document.createElement("img");
      img.className = "qr-img";
      img.alt = "Código QR con datos para compartir";
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      contenedorQR.innerHTML = "";
      contenedorQR.appendChild(img);
    }).catch(function () {
      mostrarAvisoQR("No se pudo generar el código QR. Usa el botón «Copiar datos».");
    });
  });

  btnCopiarJSON.addEventListener("click", function () {
    var json = btnCopiarJSON.dataset.json || "";
    if (!json) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function () {
        btnCopiarJSON.textContent = "Copiado ✓";
        setTimeout(function () { btnCopiarJSON.textContent = "Copiar datos"; }, 1500);
      });
    }
  });

  function normalizarEntrada(e) {
    e = e || {};
    return {
      id: e.id || Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      origen: String(e.origen || ""),
      destino: String(e.destino || ""),
      normalizado: !!e.normalizado,
      favorito: !!e.favorito,
      fecha: e.fecha || new Date().toISOString(),
      idiomaOrigen: e.idiomaOrigen || "ht",
      idiomaDestino: e.idiomaDestino || "es"
    };
  }

  function importarDatos(json) {
    if (typeof json !== "string" || json.length > 300000) {
      throw new Error("Los datos son demasiado grandes para importar (máx. 300 KB).");
    }
    var datos = JSON.parse(json);
    if (!datos || datos.app !== "traductor-kreyol-es" || !Array.isArray(datos.historial)) {
      throw new Error("El JSON no parece de esta aplicación.");
    }
    var actual = cargarHistorial();
    var existentes = {};
    actual.forEach(function (e) { existentes[e.origen + "|||" + e.destino] = true; });
    var agregados = 0;
    datos.historial.slice(0, MAX_HISTORIAL).forEach(function (e) {
      e = e || {};
      var clave = (e.origen || "") + "|||" + (e.destino || "");
      if (!existentes[clave]) {
        existentes[clave] = true;
        actual.push(normalizarEntrada(e));
        agregados++;
      }
    });
    guardarHistorial(CORE.limitarHistorial(actual, MAX_HISTORIAL));
    renderHistorial();
    if (Array.isArray(datos.correccionesSugeridas)) {
      var fb = cargarFeedback();
      var claves = {};
      fb.forEach(function (f) { claves[f.origen + "|||" + f.destino + "|||" + f.sugerido] = true; });
      datos.correccionesSugeridas.slice(0, MAX_FEEDBACK).forEach(function (f) {
        f = f || {};
        var origen = String(f.origen || "");
        var destino = String(f.destino || "");
        var sugerido = String(f.sugerido || "");
        var c = origen + "|||" + destino + "|||" + sugerido;
        if (!sugerido || claves[c]) return;
        claves[c] = true;
        fb.push({
          id: f.id || Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          origen: origen,
          destino: destino,
          sugerido: sugerido,
          direccion: f.direccion === "es-ht" ? "es-ht" : "ht-es",
          fecha: f.fecha || new Date().toISOString()
        });
      });
      guardarFeedback(fb.slice(-MAX_FEEDBACK));
      renderFeedback();
    }
    return agregados;
  }

  btnImportar.addEventListener("click", function () {
    textoImportar.value = "";
    resultadoImportar.classList.add("oculto");
    abrirModal(modalImportar);
  });

  btnConfirmarImportar.addEventListener("click", function () {
    try {
      var agregados = importarDatos(textoImportar.value.trim());
      resultadoImportar.textContent = "Importación exitosa: " + agregados + " frase(s) nueva(s).";
      resultadoImportar.className = "estado resultado-importar ok";
      resultadoImportar.classList.remove("oculto");
    } catch (e) {
      resultadoImportar.textContent = "No se pudo importar: " + e.message;
      resultadoImportar.className = "estado resultado-importar error";
      resultadoImportar.classList.remove("oculto");
    }
  });

  actualizarEtiquetas();
  configurarVoz();
  poblarSelectVoz();
  renderHistorial();
  renderCategoriasFrases();
  renderCategoriasVocab();

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function () {
      poblarSelectVoz();
    };
  }

  var promptInstalacion = null;
  var btnInstalar = document.getElementById("btnInstalar");
  var modalInstalar = document.getElementById("modalInstalar");

  function ocultarInstalar() {
    if (btnInstalar) btnInstalar.classList.add("oculto");
  }

  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    ocultarInstalar();
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    promptInstalacion = e;
  });

  window.addEventListener("appinstalled", function () {
    promptInstalacion = null;
    ocultarInstalar();
  });

  if (btnInstalar) {
    btnInstalar.addEventListener("click", function () {
      if (promptInstalacion) {
        promptInstalacion.prompt();
        promptInstalacion.userChoice.then(function () {
          promptInstalacion = null;
        });
      } else {
        abrirModal(modalInstalar);
      }
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (reg) {
      comprobarActualizacion(reg);
    }).catch(function (e) {
      console.warn("Service worker no registrado", e);
    });
  }

  function comprobarActualizacion(reg) {
    fetch("version.txt?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("Sin version.txt");
        return r.text();
      })
      .then(function (txt) {
        var servidor = (txt || "").trim().toLowerCase();
        if (servidor && servidor !== VERSION.toLowerCase()) {
          mostrarBannerActualizacion(reg);
        }
      })
      .catch(function () {});
  }

  function limpiarCacheYRecargar() {
    function recargar() {
      window.location.replace(location.origin + location.pathname + "?v=" + VERSION);
    }
    if (!("caches" in window) || !navigator.onLine) {
      recargar();
      return;
    }
    caches.keys()
      .then(function (claves) {
        return Promise.all(claves.map(function (c) { return caches.delete(c); }));
      })
      .catch(function () {})
      .then(recargar);
  }

  function mostrarBannerActualizacion(reg) {
    var banner = document.getElementById("bannerActualizar");
    var btn = document.getElementById("btnActualizar");
    banner.classList.remove("oculto");
    btn.addEventListener("click", function () {
      banner.classList.add("oculto");
      if (reg.waiting) {
        try { reg.waiting.postMessage({ type: "SKIP_WAITING" }); } catch (e) {}
      }
      limpiarCacheYRecargar();
    });
  }

  var versionEl = document.getElementById("versionApp");
  if (versionEl) versionEl.textContent = "Versión de la app: " + VERSION;

  // --- Correcciones sugeridas (feedback de traducciones incorrectas) ---
  function renderFeedback() {
    var items = cargarFeedback();
    listaFeedback.innerHTML = "";
    feedbackVacio.classList.toggle("oculto", items.length > 0);
    items.forEach(function (it, idx) {
      var li = document.createElement("li");
      li.className = "feedback-item";

      var cabeza = document.createElement("div");
      cabeza.className = "feedback-cabeza";

      var chip = document.createElement("span");
      chip.className = "chip chip-ayuda";
      chip.textContent = it.direccion === "es-ht" ? "ES→HT" : "HT→ES";

      var borrar = document.createElement("button");
      borrar.type = "button";
      borrar.className = "boton-icono btn-borrar-feedback";
      borrar.title = "Eliminar";
      borrar.setAttribute("aria-label", "Eliminar");
      borrar.textContent = "\uD83D\uDDD1";
      borrar.addEventListener("click", function () {
        var lista = cargarFeedback();
        lista.splice(idx, 1);
        guardarFeedback(lista);
        renderFeedback();
      });

      cabeza.appendChild(chip);
      cabeza.appendChild(borrar);

      var pOrigen = document.createElement("p");
      pOrigen.className = "feedback-origen";
      pOrigen.textContent = "Original: " + (it.origen || "");

      var pDestino = document.createElement("p");
      pDestino.className = "feedback-traduccion";
      pDestino.textContent = "Traducción actual: " + (it.destino || "");

      var pSugerido = document.createElement("p");
      pSugerido.className = "feedback-sugerido";
      pSugerido.textContent = "Correcta: " + (it.sugerido || "");

      li.appendChild(cabeza);
      li.appendChild(pOrigen);
      li.appendChild(pDestino);
      li.appendChild(pSugerido);
      listaFeedback.appendChild(li);
    });
  }

  function abrirReporte() {
    if (!destino.textContent) {
      mostrarError("Traduce algo primero para poder reportarlo.");
      return;
    }
    repOrigen.textContent = origen.value.trim();
    repDestino.textContent = destino.textContent;
    repSugerido.value = "";
    abrirModal(modalReportar);
    repSugerido.focus();
  }

  btnReportar.addEventListener("click", abrirReporte);

  btnConfirmarReporte.addEventListener("click", function () {
    var sugerido = repSugerido.value.trim();
    if (!sugerido) { repSugerido.focus(); return; }
    var lista = cargarFeedback();
    lista.push({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      origen: origen.value.trim(),
      destino: destino.textContent,
      sugerido: sugerido,
      direccion: direccion,
      fecha: new Date().toISOString()
    });
    guardarFeedback(lista);
    cerrarModal(modalReportar);
    renderFeedback();
  });

  btnBorrarFeedback.addEventListener("click", function () {
    if (!cargarFeedback().length) return;
    pedirConfirmacion(
      "Borrar reportes",
      "¿Seguro que quieres borrar todos los reportes de traducción? Esta acción no se puede deshacer.",
      "Borrar",
      function () {
        guardarFeedback([]);
        renderFeedback();
      }
    );
  });

  btnExportarFeedback.addEventListener("click", function () {
    var lista = cargarFeedback();
    var datos = { app: "traductor-kreyol-es", tipo: "correcciones-sugeridas", exportadoEl: new Date().toISOString(), correcciones: lista };
    var json = JSON.stringify(datos, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "correcciones-sugeridas.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  renderFeedback();

  function actualizarConexion() {
    if (avisoOffline) avisoOffline.classList.toggle("oculto", navigator.onLine);
  }

  window.addEventListener("online", function () {
    limpiarError();
    actualizarConexion();
  });
  window.addEventListener("offline", actualizarConexion);
  actualizarConexion();

  // ---- Lecturas escolares (Chile) ----
  var TEXTOS_CHILE_URL = "textos-chile.json?v=" + VERSION.replace("v", "");
  var chileData = { grados: [] };

  function poblarGrados() {
    selGrado.innerHTML = "";
    selGradoModal.innerHTML = "";
    chileData.grados.forEach(function (g) {
      var o1 = document.createElement("option");
      o1.value = g.id; o1.textContent = g.nombre;
      selGrado.appendChild(o1);
      var o2 = document.createElement("option");
      o2.value = g.id; o2.textContent = g.nombre;
      selGradoModal.appendChild(o2);
    });
  }

  function textosDeGrado(id) {
    var base = [];
    var g = chileData.grados.filter(function (x) { return x.id === id; })[0];
    if (g) base = g.textos.slice();
    var usuario = cargarChileUsuario()[id] || [];
    return base.concat(usuario.map(function (t) {
      return { titulo: t.titulo, texto: t.texto, fuente: t.fuente || "Texto agregado (este dispositivo)", usuario: true };
    }));
  }

  function renderChile() {
    var id = selGrado.value;
    var textos = textosDeGrado(id);
    listaChile.innerHTML = "";
    if (!textos.length) {
      chileVacio.classList.remove("oculto");
      return;
    }
    chileVacio.classList.add("oculto");
    textos.forEach(function (t) {
      var li = document.createElement("li");
      li.className = "item-chile";
      var h = document.createElement("div");
      h.className = "item-chile-titulo";
      h.textContent = t.titulo + (t.usuario ? " (tuyo)" : "");
      var p = document.createElement("p");
      p.className = "item-chile-texto";
      p.textContent = t.texto;
      p.lang = "es";
      p.title = "Toca para ver el texto completo";
      p.addEventListener("click", function () {
        li.classList.toggle("expandido");
      });
      var f = document.createElement("p");
      f.className = "item-chile-fuente";
      f.textContent = "Fuente: " + t.fuente;
      var b = document.createElement("button");
      b.className = "boton pequeno";
      b.type = "button";
      b.textContent = "Traducir al kreyòl";
      b.addEventListener("click", function () {
        cambiarDireccion("es-ht");
        origen.value = t.texto;
        b.disabled = true;
        b.textContent = "Traduciendo…";
        traducir();
        setTimeout(function () {
          b.disabled = false;
          b.textContent = "Traducir al kreyòl";
        }, 3000);
        seccionSalida.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      li.appendChild(h);
      li.appendChild(p);
      li.appendChild(f);
      li.appendChild(b);
      listaChile.appendChild(li);
    });
  }

  function initChile() {
    fetch(TEXTOS_CHILE_URL).then(function (r) { return r.json(); }).then(function (d) {
      chileData = d && d.grados ? d : { grados: [] };
      poblarGrados();
      renderChile();
    }).catch(function () {
      chileData = { grados: [] };
      poblarGrados();
      renderChile();
      mostrarError("No se pudo cargar textos-chile.json.", initChile);
    });
  }

  selGrado.addEventListener("change", renderChile);

  btnAgregarTextoChile.addEventListener("click", function () {
    agregarTitulo.value = "";
    agregarTexto.value = "";
    selGradoModal.value = selGrado.value;
    abrirModal(modalAgregarChile);
    agregarTitulo.focus();
  });

  btnGuardarChile.addEventListener("click", function () {
    var titulo = agregarTitulo.value.trim();
    var texto = agregarTexto.value.trim();
    var id = selGradoModal.value;
    if (!titulo || !texto) {
      agregarTitulo.focus();
      return;
    }
    var map = cargarChileUsuario();
    if (!map[id]) map[id] = [];
    map[id].push({ titulo: titulo, texto: texto, fuente: "Agregado por ti" });
    guardarChileUsuario(map);
    cerrarModal(modalAgregarChile);
    selGrado.value = id;
    renderChile();
  });

  initChile();
})();

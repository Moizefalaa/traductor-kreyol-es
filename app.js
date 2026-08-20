(function () {
  "use strict";

  var CLAVE_HISTORIAL = "kreolEs_historial_v1";
  var CLAVE_DIRECCION = "kreolEs_direccion_v1";
  var CLAVE_VOZ = "kreolEs_voz_v1";
  var SCHEMA_VERSION = 1;
  var VERSION = "v18";
  var GOOGLE_TTS = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&ttsspeed=1&q=";

  var origen = document.getElementById("textoOrigen");
  var destino = document.getElementById("textoDestino");
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

  var reconocedor = null;
  var escuchando = false;
  var ultimaTraduccion = null;
  var botonSonando = null;
  var colaAudio = [];
  var catFrasesActual = 0;

  var direccion = localStorage.getItem(CLAVE_DIRECCION) === "es-ht" ? "es-ht" : "ht-es";

  var FRASES_RAPIDAS = [
    {
      cat: "Saludos",
      frases: [
        { ht: "Bonjou", es: "Buenos días" },
        { ht: "Bonswa", es: "Buenas tardes / noches" },
        { ht: "Koman ou ye?", es: "¿Cómo estás?" },
        { ht: "Mwen byen, mèsi", es: "Estoy bien, gracias" },
        { ht: "Mwen rele…", es: "Me llamo…" },
        { ht: "Ki non ou?", es: "¿Cómo te llamas?" },
        { ht: "Orevwa", es: "Adiós" }
      ]
    },
    {
      cat: "Clases",
      frases: [
        { ht: "Mwen pa konprann", es: "No entiendo" },
        { ht: "Èske ou ka repete?", es: "¿Puedes repetir?" },
        { ht: "Mwen gen yon kesyon", es: "Tengo una pregunta" },
        { ht: "Kisa sa vle di?", es: "¿Qué significa eso?" },
        { ht: "Mwen bezwen ed", es: "Necesito ayuda" },
        { ht: "Kote pwofesè a?", es: "¿Dónde está el profesor?" },
        { ht: "Ki lè kou a kòmanse?", es: "¿A qué hora empieza la clase?" }
      ]
    },
    {
      cat: "Necesidades",
      frases: [
        { ht: "Mwen swaf", es: "Tengo sed" },
        { ht: "Mwen grangou", es: "Tengo hambre" },
        { ht: "Mwen bezwen ale nan twalèt", es: "Necesito ir al baño" },
        { ht: "Mwen fatige", es: "Estoy cansada" },
        { ht: "Mwen frèt", es: "Tengo frío" },
        { ht: "Mwen pa ka jwenn liv mwen", es: "No encuentro mi libro" }
      ]
    },
    {
      cat: "Salud y emociones",
      frases: [
        { ht: "Mwen malad", es: "Estoy enferma" },
        { ht: "Tèt mwen fè mal", es: "Me duele la cabeza" },
        { ht: "Vant mwen fè mal", es: "Me duele la guata / el estómago" },
        { ht: "Mwen pè", es: "Tengo miedo" },
        { ht: "Mwen tris", es: "Estoy triste" },
        { ht: "Mwen kontan", es: "Estoy contenta" }
      ]
    }
  ];

  var FRASES_EMERGENCIA = [
    { ht: "Ede m, tanpri!", es: "¡Ayúdame, por favor!" },
    { ht: "Mwen gen yon ijans", es: "Tengo una emergencia" },
    { ht: "Mwen bezwen yon doktè", es: "Necesito un doctor" },
    { ht: "Mwen blese", es: "Estoy herida" },
    { ht: "Rele anbilans", es: "Llama una ambulancia" },
    { ht: "Mwen santi m move", es: "Me siento muy mal" }
  ];

  var CORRECCIONES = [
    { ht: "Bonjou", es: "Buenos días" },
    { ht: "Mwen pè", es: "Tengo miedo" },
    { ht: "padon", es: "perdón" },
    { ht: "tablo", es: "pizarra" },
    { ht: "pwofesè", es: "profesor" },
    { ht: "Mwen fatige", es: "Estoy cansada" },
    { ht: "Mwen blese", es: "Estoy herida" },
    { ht: "Mwen kontan", es: "Estoy contenta" },
    { ht: "Mwen rele…", es: "Me llamo…" },
    { ht: "Kote pwofesè a?", es: "¿Dónde está el profesor?" },
    { ht: "Mwen ta renmen ale lakay mwen", es: "Quisiera ir a mi casa" },
    { ht: "Ki lè ou fini?", es: "¿A qué hora terminas?" },
    { ht: "Mwen ap vini", es: "Voy para allá" },
    { ht: "Èske m ka rantre?", es: "¿Puedo entrar?" },
    { ht: "Mwen bezwen travay", es: "Necesito trabajo" },
    { ht: "Yo te fè tout travay sa yo nan lannwit paske yo te fèt ak lasi!", es: "Tenían que hacer todo su trabajo por las noches. ¡Porque eran niños de cera!" },
    { ht: "Yo pran lasi, yo fonn lasi a enpi yo fè'l tounen yon zwazo.", es: "Tomaron los restos de cera derretida y le dieron la forma de un ave." },
    { ht: "Frè li avèti'l …", es: "Sus hermanos le advirtieron que no lo hiciera…" },
    { ht: "Mayo sa a gwo.", es: "Este suéter es grande." },
    { ht: "Bèl ti kouvèti manman an ki te pandye sou yon klou shire an de tibout.", es: "La manta tan preciada de Simbegwire que había quedado enganchada en un clavo, se rasgó en dos." },
    { ht: "Kilè wap tounen manman ?", es: "Madre, ¿cuándo regresarás?" },
    { ht: "Mwen leve enpi mwen fè dife.", es: "Despierto y enciendo el fuego." },
    { ht: "Mwen fann bwadife.", es: "Corto la leña." },
    { ht: "Enpi ….", es: "Hasta que…" },
    { ht: "Dife kwit manje.", es: "El fuego cocina." },
    { ht: "Dife bèl.", es: "El fuego es maravilloso." },
    { ht: "Hi han?", es: "¿Hiaaa?" },
    { ht: "Li mete kò li tankou yon boul enpi li tonbe dòmi ajite.", es: "Se enroscó como una pelota y se quedó dormido." },
    { ht: "Lap rele « Achte fig mwen yo…", es: "Sigue gritando, \"¡Compren mis plátanos!" },
    { ht: "Li pati kouri sou vye pye an.", es: "Aunque se torció el tobillo, cojeó lo más rápido que pudo para poder escapar." },
    { ht: "Li goute nan tout fwi yo enpi lo manje anpil nan yo.", es: "Prueba toda la fruta." },
    { ht: "Mwen ta vle ke ou ale chache yon ti manje la?", es: "Ojalá vayas pronto a buscar comida" },
    { ht: "Chen an kase tèt tounen epi yo pa janm wè li ankò.", es: "El perro se fue corriendo y nunca nadie lo ha visto aparecerse de nuevo." },
    { ht: "Gingile kouri desann pyebwa anvan Leyopa a bay li yon kout pat.", es: "Antes de que el leopardo pudiera atacar a Gingile, él bajó muy rápidamente del árbol." },
    { ht: "Chè l' se chè mwen.", es: "Su carne es mi carne." },
    { ht: "Premye branch lan te rele Pichon.", es: "La primera rama se llamaba Pisón." },
    { ht: "Tè a va kale tout kalite pikan ak pengwen ba ou.", es: "La tierra te producirá espinos y cardos." },
    { ht: "Se swe kouraj ou ki pou fè ou mete yon moso pen nan bouch ou jouk lè wa tounen nan tè kote ou soti a.", es: "Con el sudor de tu frente comerás el pan hasta que vuelvas a la tierra de donde saliste." },
    { ht: "Poukisa ou move konsa?", es: "¿Por qué estás tan enojado?" },
    { ht: "Poukisa ou mare figi ou konsa?", es: "¿Por qué ha decaído tu semblante?" },
    { ht: "Li move, li mare figi l' byen mare.", es: "Estaba muy enojado, y su semblante decayó." },
    { ht: "W'ap tounen yon vakabon k'ap plede mache toupatou sou latè san rete.", es: "Andarás errante y vagabundo por la tierra, sin descanso." },
    { ht: "M'ap tounen yon vakabon k'ap plede mache toupatou sou latè san rete.", es: "Andaré errante y vagabundo por la tierra, sin descanso." },
    { ht: "Adan te gen santrantan (130 an) lè li vin gen yon pitit gason ki te sanble avè l' tèt koupe, li rele l' Sèt.", es: "Adán tenía ciento treinta años cuando tuvo un hijo que se parecía exactamente a él, y lo llamó Set." },
    { ht: "Apre nesans Enòk, Sèt viv witsansetan (807 an).", es: "Después del nacimiento de Enós, Set vivió ochocientos siete años." },
    { ht: "Apre nesans Kenan, Enòk viv witsankenzan (815 an).", es: "Después del nacimiento de Cainán, Enós vivió ochocientos quince años." },
    { ht: "Lè Kenan mouri, li te gen nèfsandizan (910 an).", es: "Cuando Cainán murió, tenía novecientos diez años." },
    { ht: "Malaleyèl te gen swasannsenkan lè li vin gen yon pitit gason yo rele Jerèd.", es: "Mahalaleel tenía sesenta y cinco años cuando tuvo un hijo llamado Jared." },
    { ht: "Jerèd te gen sanswanndezan (162 an) lè li vin gen yon pitit gason yo rele Enòk.", es: "Jared tenía ciento sesenta y dos años cuando tuvo un hijo llamado Enoc." },
    { ht: "Lè Jerèd mouri, li te gen nèfsanswasanndezan (962 an).", es: "Cuando Jared murió, tenía novecientos sesenta y dos años." },
    { ht: "Enòk te gen swasannsenkan lè li vin gen yon pitit gason yo rele Metouchela.", es: "Enoc tenía sesenta y cinco años cuando tuvo un hijo llamado Matusalén." },
    { ht: "Apre nesans Lemèk, Metouchela viv sètsankatrevendezan (782 an).", es: "Después del nacimiento de Lamec, Matusalén vivió setecientos ochenta y dos años." },
    { ht: "Li te gen twasanswasannsenkan (365 an) lè l' disparèt, paske Bondye te pran l' avè l'.", es: "Tenía trescientos sesenta y cinco años cuando desapareció, porque Dios se lo llevó consigo." },
    { ht: "Lemèk te gen sankatrevendezan (182 an) lè li vin gen yon pitit gason.", es: "Lamec tenía ciento ochenta y dos años cuando tuvo un hijo." },
    { ht: "Ofiyamezi, yo kòmanse santi yo byen san manman an.", es: "Poco a poco, empezaron a sentirse bien sin la madre." },
    { ht: "Enpi li pa te kapab wè plant yo nan fè nwa a.", es: "Entonces ya no podía ver las plantas en la oscuridad." },
    { ht: "Enpi, li deside kite Andiswa jwe.", es: "Entonces decidió dejar jugar a Andiswa." },
    { ht: "Andiswa ranmase bou lanak pye li, li tonbe kouri ak boul lan nan direksyhon filè an.", es: "Andiswa recogió el balón con el pie y echó a correr con él hacia la portería." },
    { ht: "Sou wout la yo travèse mòn ak plantasyon enpi yo kwaze bèt sovaj.", es: "En el camino atravesaron montañas y plantaciones, y se cruzaron con animales salvajes." },
    { ht: "Ti gason yo te regrèt anpil deske yo te pase Vuzi nan jwèt.", es: "Los chicos lamentaron mucho haberse burlado de Vusi." },
    { ht: "Enpi li gen fòs.", es: "Y es poderoso." },
    { ht: "Lè’m louvri pòt la, mwen pran yo gwo lodè fig mi.", es: "Cuando abrí la puerta, sentí el fuerte aroma de los plátanos maduros." },
    { ht: "Yon madanm deside achte yon rejim fig nan men Tom.", es: "Una mujer decidió comprarle a Tom un racimo de plátanos." },
    { ht: "” enpi gwo flanm kòmanse boule plim Ipo.", es: "Entonces una gran llama comenzó a quemar las plumas de Ipo." },
    { ht: "Men se mwen ki fè tout travay la enpi ki pran tout piki yo.", es: "¡Pero soy yo quien hace todo el trabajo y quien recibe todas las picaduras!" },
    { ht: "Lè yal rekòlte myèl yo toujou kite pigwo mòso a pour Gid siwo myèl la.", es: "Cuando van a recolectar miel, siempre dejan la parte más grande para el Pájaro Miel." },
    { ht: "Eg lan te blije mache byen lwen pou’l jwenn manje.", es: "El Águila tuvo que caminar muy lejos para encontrar comida." },
    { ht: "Nan prese li te manke yon branch, li ateri ak yon gwo bwi enpi li foule pye li.", es: "En su prisa, falló en una rama, aterrizó con un gran ruido y se torció el pie." },
    { ht: "Tom ap mache ak yon panyen fig sou tèt li.", es: "Tom camina con una cesta de plátanos en la cabeza." },
    { ht: "Achte fig mwen yo.", es: "¡Compren mis plátanos!" },
    { ht: "Tom pral vann fig li yo nan mache a.", es: "Tom venderá sus plátanos en el mercado." }
  ];

  var VOCABULARIO = [
    {
      cat: "Cortesía",
      items: [
        { ht: "mèsi", es: "gracias" },
        { ht: "tanpri", es: "por favor" },
        { ht: "padon", es: "perdón" },
        { ht: "wi", es: "sí" },
        { ht: "non", es: "no" },
        { ht: "eskize m", es: "disculpe" }
      ]
    },
    {
      cat: "Números",
      items: [
        { ht: "youn", es: "uno" },
        { ht: "de", es: "dos" },
        { ht: "twa", es: "tres" },
        { ht: "kat", es: "cuatro" },
        { ht: "senk", es: "cinco" },
        { ht: "dis", es: "diez" }
      ]
    },
    {
      cat: "Colores",
      items: [
        { ht: "wouj", es: "rojo" },
        { ht: "ble", es: "azul" },
        { ht: "vèt", es: "verde" },
        { ht: "jòn", es: "amarillo" },
        { ht: "nwa", es: "negro" },
        { ht: "blan", es: "blanco" }
      ]
    },
    {
      cat: "La clase",
      items: [
        { ht: "liv", es: "libro" },
        { ht: "kreyon", es: "lápiz" },
        { ht: "papye", es: "papel" },
        { ht: "tablo", es: "pizarra" },
        { ht: "chèz", es: "silla" },
        { ht: "pwofesè", es: "profesor" }
      ]
    },
    {
      cat: "Días",
      items: [
        { ht: "lendi", es: "lunes" },
        { ht: "madi", es: "martes" },
        { ht: "mèkredi", es: "miércoles" },
        { ht: "jedi", es: "jueves" },
        { ht: "vandredi", es: "viernes" },
        { ht: "samdi", es: "sábado" }
      ]
    }
  ];

  function esSalidaEspañol() {
    return direccion === "ht-es";
  }

  function idiomaOrigen() { return esSalidaEspañol() ? "ht" : "es"; }
  function idiomaDestino() { return esSalidaEspañol() ? "es" : "ht"; }

  function cargarHistorial() {
    try {
      var raw = localStorage.getItem(CLAVE_HISTORIAL);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function guardarHistorial(items) {
    try {
      localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(items));
    } catch (e) {
      console.warn("No se pudo guardar el historial", e);
    }
  }

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

      var destinoP = document.createElement("p");
      destinoP.className = "destino";
      destinoP.textContent = item.destino;

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
    guardarHistorial(items);
    renderHistorial();
    return entrada;
  }

  function aEspanolLatino(texto) {
    if (!texto) return texto;
    var pares = [
      [/\bvosotros\b/gi, "ustedes"],
      [/\bvosotras\b/gi, "ustedes"],
      [/\bos\b/gi, "les"],
      [/\bhabéis\b/gi, "han"],
      [/\bestáis\b/gi, "están"],
      [/\bsois\b/gi, "son"],
      [/\btenéis\b/gi, "tienen"],
      [/\bhacéis\b/gi, "hacen"],
      [/\bqueréis\b/gi, "quieren"],
      [/\bpodéis\b/gi, "pueden"],
      [/\bdecís\b/gi, "dicen"],
      [/\bvais\b/gi, "van"],
      [/\bcoméis\b/gi, "comen"],
      [/\bvenís\b/gi, "vienen"],
      [/\bsabéis\b/gi, "saben"]
    ];
    var resultado = texto;
    var cambio = false;
    pares.forEach(function (par) {
      if (par[0].test(resultado)) {
        resultado = resultado.replace(par[0], par[1]);
        cambio = true;
      }
    });
    return { texto: resultado, normalizado: cambio };
  }

  function mostrarError(mensaje) {
    estadoVoz.textContent = mensaje;
    estadoVoz.classList.remove("oculto");
    estadoVoz.classList.add("error");
  }

  function limpiarError() {
    estadoVoz.classList.add("oculto");
    estadoVoz.classList.remove("error");
  }

  function traducirConGoogle(texto) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
      idiomaOrigen() + "&tl=" + idiomaDestino() + "&dt=t&q=" + encodeURIComponent(texto);
    return fetch(url)
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (datos) {
        var segmentos = datos && datos[0];
        if (!Array.isArray(segmentos) || !segmentos.length) {
          throw new Error("Respuesta vacía");
        }
        var t = segmentos.map(function (s) { return (s && s[0]) || ""; }).join("");
        if (!t || t === texto) throw new Error("Sin traducción");
        return t;
      });
  }

  function traducirConMyMemory(texto) {
    var url = "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(texto) +
      "&langpair=" + idiomaOrigen() + "%7C" + idiomaDestino();
    return fetch(url)
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (datos) {
        var traducido = (datos.responseData && datos.responseData.translatedText) || "";
        if (traducido === "QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED QUERY : 500 CHARS") {
          throw new Error("El texto supera los 500 caracteres permitidos.");
        }
        if (!traducido) throw new Error("Sin traducción");
        return traducido;
      });
  }

  function normalizarClave(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function dividirEnOraciones(texto) {
    var limpio = (texto || "").replace(/\s+/g, " ").trim();
    if (!limpio) return [];
    return (limpio.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [limpio])
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
  }

  function construirDiccionario() {
    var d = {};
    function agregar(ht, es) {
      if (!ht || !es) return;
      d[normalizarClave(ht)] = { ht: ht, es: es };
      d[normalizarClave(es)] = { ht: ht, es: es };
    }
    FRASES_RAPIDAS.forEach(function (g) { g.frases.forEach(function (f) { agregar(f.ht, f.es); }); });
    FRASES_EMERGENCIA.forEach(function (f) { agregar(f.ht, f.es); });
    CORRECCIONES.forEach(function (c) { agregar(c.ht, c.es); });
    VOCABULARIO.forEach(function (g) { g.items.forEach(function (i) { agregar(i.ht, i.es); }); });
    return d;
  }

  var DICCIONARIO = construirDiccionario();

  function buscarEnDiccionario(texto) {
    var par = DICCIONARIO[normalizarClave(texto)];
    if (!par) return null;
    return esSalidaEspañol() ? par.es : par.ht;
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
    seccionSalida.hidden = false;

    ultimaTraduccion = agregarTraduccion(origen.value.trim(), resultado, normalizado);
    btnFavorito.classList.toggle("activo", false);
    seccionSalida.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function traducir() {
    var texto = origen.value.trim();
    if (!texto) {
      origen.focus();
      return;
    }

    btnTraducir.disabled = true;
    btnTraducir.textContent = "Traduciendo…";
    limpiarError();

    var local = buscarEnDiccionario(texto);
    if (local) {
      mostrarResultado(local);
      btnTraducir.disabled = false;
      btnTraducir.textContent = "Traducir";
      return;
    }

    if (!navigator.onLine) {
      btnTraducir.disabled = false;
      btnTraducir.textContent = "Traducir";
      mostrarError("Sin conexión: la traducción en línea no está disponible. Revisa tu internet.");
      return;
    }

    if (traducirTextoLargo()) return;

    traducirConGoogle(texto)
      .catch(function () { return traducirConMyMemory(texto); })
      .then(mostrarResultado)
      .catch(function (err) {
        mostrarError("No se pudo traducir: " + err.message);
      })
      .finally(function () {
        btnTraducir.disabled = false;
        btnTraducir.textContent = "Traducir";
      });
  }

  function traducirTextoLargo() {
    var texto = origen.value.trim();
    var oraciones = dividirEnOraciones(texto);
    if (oraciones.length <= 1) return false;

    var promesas = oraciones.map(function (oracion) {
      var local = buscarEnDiccionario(oracion);
      if (local) return Promise.resolve(local);
      if (!navigator.onLine) {
        return Promise.reject(new Error("Sin conexión: la traducción en línea no está disponible."));
      }
      return traducirConGoogle(oracion)
        .catch(function () { return traducirConMyMemory(oracion); });
    });

    Promise.all(promesas)
      .then(function (traducidas) { mostrarResultado(traducidas.join(" ")); })
      .catch(function (err) {
        mostrarError("No se pudo traducir el texto: " + err.message);
      })
      .finally(function () {
        btnTraducir.disabled = false;
        btnTraducir.textContent = "Traducir";
      });
    return true;
  }

  function configurarVoz() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      btnEscuchar.disabled = true;
      btnEscuchar.title = "Reconocimiento de voz no disponible en este navegador";
      return;
    }
    reconocedor = new SR();
    reconocedor.lang = esSalidaEspañol() ? "ht-HT" : "es-ES";
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
      if (origen.value.trim()) traducir();
    };

    btnEscuchar.disabled = false;
  }

  function cargarVocesSistema() {
    if (!window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices() || [];
  }

  function puntajeVoz(v) {
    var nombre = (v.name || "").toLowerCase();
    var lang = (v.lang || "").toLowerCase();
    var puntos = 1;
    if (/natural|neural|online|premium/.test(nombre)) puntos += 3;
    if (/google/.test(nombre)) puntos += 2;
    if (lang.indexOf("es") === 0 || lang.indexOf("ht") === 0) puntos += 1;
    return puntos;
  }

  function mejorVozPara(langObjetivo) {
    var voces = cargarVocesSistema();
    var pre = langObjetivo;
    var candidatas = voces.filter(function (v) {
      return v.lang.toLowerCase().indexOf(pre) === 0;
    });
    if (!candidatas.length && (langObjetivo === "ht" || langObjetivo === "es")) {
      candidatas = voces.filter(function (v) {
        return v.lang.toLowerCase().indexOf(langObjetivo) === 0;
      });
    }
    candidatas.sort(function (a, b) { return puntajeVoz(b) - puntajeVoz(a); });
    return candidatas[0] || null;
  }

  function poblarSelectVoz() {
    var voces = cargarVocesSistema();
    var eleccion = localStorage.getItem(CLAVE_VOZ) || "auto";
    selectVoz.innerHTML = "";
    var opciones = [["auto", "Auto (voz natural en línea)"], ["google", "Voz en línea (Google)"]];

    var unicas = {};
    voces.forEach(function (v) {
      var lang = v.lang.toLowerCase();
      if ((lang.indexOf("es") === 0 || lang.indexOf("ht") === 0) && !unicas[v.name]) {
        unicas[v.name] = v;
      }
    });
    var sistema = Object.keys(unicas).map(function (nombre) { return unicas[nombre]; });
    sistema.sort(function (a, b) { return puntajeVoz(b) - puntajeVoz(a); });
    sistema.forEach(function (v) {
      opciones.push(["sys|" + v.name, "Sistema: " + v.name + " (" + v.lang + ")"]);
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
    if (window.speechSynthesis) window.speechSynthesis.cancel();
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

  function dividirFragmentos(texto, max) {
    var limpio = texto.replace(/\s+/g, " ").trim();
    if (!limpio) return [];
    var trozos = limpio.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [limpio];
    var partes = [];
    var actual = "";
    trozos.forEach(function (t) {
      var candidato = actual ? actual + " " + t : t;
      if (candidato.length > max && actual) {
        partes.push(actual);
        actual = t;
      } else {
        actual = candidato;
      }
    });
    if (actual) partes.push(actual);
    if (!partes.length) partes = [limpio.slice(0, max)];
    return partes;
  }

  function langParaGoogle(lang) {
    return lang === "es" ? "es-419" : lang;
  }

  function reproducirConGoogle(texto, lang, alTerminar) {
    if (!navigator.onLine || lang === "ht") return false;
    var partes = dividirFragmentos(texto, 190);
    if (!partes.length) return false;

    colaAudio = [];
    var indice = 0;
    var fallo = false;

    function pasarAlSistema() {
      if (fallo) return;
      fallo = true;
      detenerAudio();
      leerConSistema(texto, lang, selectVoz.value, alTerminar);
    }

    function siguiente() {
      if (indice >= partes.length) {
        alTerminar();
        return;
      }
      var url = GOOGLE_TTS + encodeURIComponent(partes[indice]) + "&tl=" + langParaGoogle(lang);
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

  function leerConSistema(texto, lang, eleccion, alTerminar) {
    if (!window.speechSynthesis) {
      alTerminar();
      return;
    }
    var voz = null;
    if (eleccion && eleccion.indexOf("sys|") === 0) {
      var nombre = eleccion.slice(4);
      voz = cargarVocesSistema().find(function (v) { return v.name === nombre; }) || null;
    }
    if (!voz) voz = mejorVozPara(lang);
    var u = new SpeechSynthesisUtterance(texto);
    u.lang = lang;
    u.rate = 1;
    if (voz) {
      u.voice = voz;
      u.lang = voz.lang;
    }
    u.onend = function () { alTerminar(); };
    u.onerror = function () { alTerminar(); };
    window.speechSynthesis.speak(u);
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
    leerConSistema(texto, lang, eleccion, alTerminar);
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
    localStorage.setItem(CLAVE_DIRECCION, nueva);
    actualizarEtiquetas();
    origen.value = "";
    seccionSalida.hidden = true;
    ultimaTraduccion = null;
    configurarVoz();
  }

  btnDirHT.addEventListener("click", function () { cambiarDireccion("ht-es"); });
  btnDirES.addEventListener("click", function () { cambiarDireccion("es-ht"); });

  btnEscuchar.addEventListener("click", function () {
    if (!reconocedor) return;
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

  btnTraducir.addEventListener("click", traducir);

  origen.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") traducir();
  });

  btnLimpiar.addEventListener("click", function () {
    origen.value = "";
    seccionSalida.hidden = true;
    ultimaTraduccion = null;
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
    if (confirm("¿Borrar todo el historial?")) {
      guardarHistorial([]);
      renderHistorial();
      seccionSalida.hidden = true;
      ultimaTraduccion = null;
    }
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
    localStorage.setItem(CLAVE_VOZ, selectVoz.value);
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
      var debil = document.createElement("span");
      debil.textContent = esSalidaEspañol() ? f.es : f.ht;
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

      var ht = document.createElement("span");
      ht.className = "vocab-ht";
      ht.textContent = item.ht;

      var es = document.createElement("span");
      es.className = "vocab-es";
      es.textContent = item.es;

      var acciones = document.createElement("div");
      acciones.className = "vocab-acciones";
      acciones.appendChild(botonHablar(item.ht, "ht"));
      acciones.appendChild(botonHablar(item.es, "es"));

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

      var es = document.createElement("p");
      es.className = "es";
      es.textContent = f.es;

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

  function abrirModal(modal) {
    modal.classList.remove("oculto");
  }

  function cerrarModal(modal) {
    modal.classList.add("oculto");
  }

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

  btnEmergencia.addEventListener("click", function () {
    renderEmergencia();
    abrirModal(modalEmergencia);
  });

  function iniciarConversacion(dir) {
    cambiarDireccion(dir);
    origen.value = "";
    seccionSalida.hidden = true;
    ultimaTraduccion = null;
    if (!reconocedor) {
      mostrarError("Reconocimiento de voz no disponible en este navegador.");
      return;
    }
    try {
      reconocedor.start();
    } catch (e) {
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
      historial: items.slice(-10)
    };
  }

  btnCompartirQR.addEventListener("click", function () {
    var datos = construirPayloadCompartir();
    var json = JSON.stringify(datos);
    contenedorQR.innerHTML = "";
    var img = document.createElement("img");
    img.className = "qr-img";
    img.alt = "Código QR con datos para compartir";
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=280x280&qzone=1&data=" + encodeURIComponent(json);
    img.onerror = function () {
      contenedorQR.innerHTML = "<p class='aviso'>No se pudo generar el c\u00f3digo QR (requiere internet). Usa el bot\u00f3n \u201cCopiar datos\u201d.</p>";
    };
    contenedorQR.appendChild(img);
    btnCopiarJSON.dataset.json = json;
    abrirModal(modalQR);
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
    return {
      id: e.id || Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      origen: e.origen || "",
      destino: e.destino || "",
      normalizado: !!e.normalizado,
      favorito: !!e.favorito,
      fecha: e.fecha || new Date().toISOString(),
      idiomaOrigen: e.idiomaOrigen || "ht",
      idiomaDestino: e.idiomaDestino || "es"
    };
  }

  function importarDatos(json) {
    var datos = JSON.parse(json);
    if (!datos || datos.app !== "traductor-kreyol-es" || !Array.isArray(datos.historial)) {
      throw new Error("El JSON no parece de esta aplicación.");
    }
    var actual = cargarHistorial();
    var existentes = {};
    actual.forEach(function (e) { existentes[e.origen + "|||" + e.destino] = true; });
    var agregados = 0;
    datos.historial.forEach(function (e) {
      var clave = (e.origen || "") + "|||" + (e.destino || "");
      if (!existentes[clave]) {
        existentes[clave] = true;
        actual.push(normalizarEntrada(e));
        agregados++;
      }
    });
    guardarHistorial(actual);
    renderHistorial();
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
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      if (navigator.serviceWorker.controller) {
        reg.addEventListener("updatefound", function () {
          var nuevo = reg.installing;
          if (!nuevo) return;
          nuevo.addEventListener("statechange", function () {
            if (nuevo.state === "installed") {
              mostrarBannerActualizacion(reg);
            }
          });
        });
      }
    }).catch(function (e) {
      console.warn("Service worker no registrado", e);
    });
  }

  function limpiarCacheYRecargar() {
    function recargar() { window.location.reload(); }
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
      if (reg.waiting) {
        try { reg.waiting.postMessage({ type: "SKIP_WAITING" }); } catch (e) {}
      }
      limpiarCacheYRecargar();
    });
  }

  var versionEl = document.getElementById("versionApp");
  if (versionEl) versionEl.textContent = "Versión de la app: " + VERSION;

  window.addEventListener("online", function () {
    limpiarError();
  });
})();
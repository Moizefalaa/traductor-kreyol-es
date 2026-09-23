/* Núcleo puro del traductor: sin DOM, sin red, sin estado global.
   Se usa en el navegador (window.KreyolCore) y en Node (require) para pruebas. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.KreyolCore = fabrica();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Glosario aplicado en tiempo de traducción para corregir errores sistemáticos
  // del motor (kreyòl -> español). tipo "fuente": reescribe la fuente antes del motor.
  // tipo "salida": corrige la traducción cuando la fuente contiene el lema indicado.
  var GLOSARIO = [
    {
      tipo: "salida",
      fuente: /\bfi?g\b/i,
      salida: { de: /\bhigo(s)?\b/gi, a: function (m, p) { return p ? "plátanos" : "plátano"; } }
    },
    {
      tipo: "salida",
      fuente: /\beg\b/i,
      salida: { de: /\boveja(s)?\b/gi, a: function (m, p) { return p ? "águilas" : "águila"; } }
    },
    {
      tipo: "salida",
      fuente: /\bofiyamezi\b/i,
      salida: { de: /\bofiyamezi\b/gi, a: "poco a poco" }
    },
    {
      tipo: "fuente",
      fuente: /\benpi\b/gi,
      salida: { a: "epi" }
    },
    {
      tipo: "salida",
      fuente: /\bgadyen bi\b/i,
      salida: { de: /\bcorredor\b/gi, a: "portero" }
    }
  ];

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

  function aEspanolLatino(texto) {
    if (!texto) return { texto: texto, normalizado: false };
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

  function limitarHistorial(items, max) {
    max = max || 200;
    if (items.length <= max) return items;
    var favoritos = items.filter(function (i) { return i.favorito; });
    var resto = items.filter(function (i) { return !i.favorito; });
    var mantener = Math.max(0, max - favoritos.length);
    var recortado = favoritos.concat(resto.slice(resto.length - mantener));
    recortado.sort(function (a, b) { return (a.fecha < b.fecha) ? -1 : 1; });
    return recortado;
  }

  function normalizarVariantesKreyol(texto) {
    var t = " " + texto + " ";
    var cliticos = {
      "m'": "mwen", "w'": "ou", "l'": "li", "y'": "yo", "t'": "te",
      "p'": "pa", "s'": "sa", "d'": "de", "k'": "ki", "n'": "nou"
    };
    Object.keys(cliticos).forEach(function (c) {
      var re = new RegExp("(^|\\s)(" + c.replace("'", "\\'") + ")", "gi");
      t = t.replace(re, function (m, pre) { return pre + cliticos[c] + " "; });
    });
    t = t.replace(/\bsh/gi, "ch");
    t = t.replace(/\s+([.,!?;:])/g, "$1");
    t = t.replace(/\s{2,}/g, " ");
    return t.trim();
  }

  function prepararFuenteKreyol(texto, glosario) {
    var g = glosario || GLOSARIO;
    var t = normalizarVariantesKreyol(texto);
    g.forEach(function (r) {
      if (r.tipo === "fuente") t = t.replace(r.fuente, r.salida.a);
    });
    return t;
  }

  function aplicarGlosario(fuente, traduccion, glosario) {
    if (!fuente || !traduccion) return traduccion;
    var g = glosario || GLOSARIO;
    var res = traduccion;
    g.forEach(function (r) {
      if (r.tipo !== "salida") return;
      if (!r.fuente.test(fuente)) return;
      res = res.replace(r.salida.de, r.salida.a);
    });
    return res;
  }

  function recorrerItems(datos, visitar) {
    datos = datos || {};
    (datos.frases || []).forEach(function (g) { g.frases.forEach(function (f) { visitar(f.ht, f.es); }); });
    (datos.emergencia || []).forEach(function (f) { visitar(f.ht, f.es); });
    (datos.correcciones || []).forEach(function (c) { visitar(c.ht, c.es); });
    (datos.vocabulario || []).forEach(function (g) { g.items.forEach(function (i) { visitar(i.ht, i.es); }); });
  }

  function construirDiccionario(datos) {
    var d = {};
    recorrerItems(datos, function (ht, es) {
      if (!ht || !es) return;
      d[normalizarClave(ht)] = { ht: ht, es: es };
      d[normalizarClave(es)] = { ht: ht, es: es };
    });
    return d;
  }

  // Claves que comparten dos entradas distintas (una pisa a la otra en silencio).
  function detectarColisiones(datos) {
    var vistos = {};
    var colisiones = [];
    function registrar(clave, par) {
      if (!clave) return;
      var anterior = vistos[clave];
      if (!anterior) {
        vistos[clave] = par;
      } else if (anterior.ht !== par.ht || anterior.es !== par.es) {
        colisiones.push({ clave: clave, antes: anterior, ahora: par });
      }
    }
    recorrerItems(datos, function (ht, es) {
      if (!ht || !es) return;
      var par = { ht: ht, es: es };
      registrar(normalizarClave(ht), par);
      registrar(normalizarClave(es), par);
    });
    return colisiones;
  }

  function buscarEnDiccionario(dic, texto, esSalida) {
    var par = dic[normalizarClave(texto)];
    if (!par) return null;
    return esSalida ? par.es : par.ht;
  }

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
    { ht: "Tom pral vann fig li yo nan mache a.", es: "Tom venderá sus plátanos en el mercado." },
    { ht: "Moun Filipin yo pa tankou moun Swis.", es: "Los filipinos no son como los suizos." },
    { ht: "Èske ou pale angle?", es: "¿Habla usted inglés?" },
    { ht: "Ki lè lekòl la fini?", es: "¿Cuándo se acaba la escuela?" },
    { ht: "Byen veni.", es: "Bienvenida." },
    { ht: "Mwen vle ale.", es: "Quiero ir." },
    { ht: "Mwen pral jwe tenis.", es: "Voy a jugar al tenis." },
    { ht: "Yon revolisyon se pa yon dine de gala.", es: "Una revolución no es una cena de gala." },
    { ht: "Kijan ou di \"yuri\" an angle?", es: "¿Cómo se dice \"yuri\" en inglés?" },
    { ht: "Pote'l pi pre.", es: "Acércalo." },
    { ht: "\"Eske w pale franse?\" \"Non.\"", es: "\"¿Habla usted francés?\" \"No.\"" },
    { ht: "Felisitasyon!", es: "¡Felicitaciones!" },
    { ht: "Mwen renmen chat nou yo.", es: "Quiero mucho a nuestros gatos." },
    { ht: "M pa vlè alè nan lekòl.", es: "No quiero ir a la escuela." },
    { ht: "Kiyès Bondye ye?", es: "¿Quién es Dios?" },
    { ht: "Mwen renmen'w.", es: "Te quiero." },
    { ht: "Mwen pa renmen sab la.", es: "No me gusta la arena." },
    { ht: "Nou bezwen konkou li.", es: "Necesitamos su ayuda." },
    { ht: "Ou pa pral genyen pwoblèm sa a.", es: "No tendrá ese problema." },
    { ht: "Bon maten!", es: "¡Buenos días!" },
    { ht: "Li avèk li.", es: "Ella está con ella." },
    { ht: "M renmen fim sa a.", es: "Me gusta esa película." },
    { ht: "Burj Khalifa aktyelman se gratsyél ki pi wo nan mond.", es: "El Burj Khalifa es actualmente el rascacielos más alto del mundo." },
    { ht: "Lanmò se yon bagay natirèl.", es: "La muerte es natural." },
    { ht: "Non, se mwen papa w.", es: "No, yo soy tu padre." },
    { ht: "Li te mouri pou nou ka viv.", es: "Él murió para que nosotros podamos vivir." },
    { ht: "Nou manje vyann.", es: "Coméis carne." },
    { ht: "Mwen ap ale nan London.", es: "Voy a Londres." },
    { ht: "Tom se yon non.", es: "Tom es un nombre." },
    { ht: "Mwen renmen manje pikant.", es: "Me encanta comer picante." },
    { ht: "Kote kle yo?", es: "¿Dónde están las llaves?" },
    { ht: "Anpil gèp se polinizatè.", es: "Muchas avispas son polinizadoras." },
    { ht: "Yo a konprann nou.", es: "Nos van a entender." },
    { ht: "An ki lanné ou wè jou ?", es: "¿En qué año naciste?" },
    { ht: "Yo a ka kanpe w.", es: "Ellos no te pueden detener." },
    { ht: "Lapè san jistis se sèlman yon sispann-tire.", es: "La paz sin justicia es solo un alto el fuego." },
    { ht: "Fèmen pòt sa a!", es: "¡Cierra esa puerta!" },
    { ht: "Ou, nou papa ki dan lesyel, Fer ou ganny rekonnet konman Bondye.", es: "Padre nuestro que estás en el cielo, santificado sea tu nombre." },
    { ht: "Li pa renmen pwason.", es: "A ella no le gusta el pescado." },
    { ht: "Chak pèp se yon pèp chwazi.", es: "Cada pueblo es elegido." },
    { ht: "Non mwen sè Tom", es: "Mi nombre es Tom." },
    { ht: "Nou bezwen èd li.", es: "Necesitamos su ayuda." },
    { ht: "Mwen te timid.", es: "Era tímido." },
    { ht: "Ki non'w ?", es: "¿Cómo te llamas?" },
    { ht: "Mwen se yon fanm.", es: "Soy una mujer." },
    { ht: "Mwen rele Tom.", es: "Me llamo Tom." },
    { ht: "Sami se yon Mizilman.", es: "Sami es musulmán." },
    { ht: "Mwen pa renmen manje tomat.", es: "No me gusta comer tomates." },
    { ht: "Bon maten. Koman ou ye?", es: "Buenos días. ¿Cómo está usted?" },
    { ht: "Kijan ou di \"fromaj\" an alman?", es: "¿Cómo se dice «queso» en alemán?" },
    { ht: "Bon maten, Mike.", es: "Buenos días, Mike." },
    { ht: "Tom se yon ranmasè fatra.", es: "Tomás es un basurero." },
    { ht: "Èske ou pale fransè?", es: "¿Usted habla francés?" },
    { ht: "Vant mwen fè mal.", es: "Me duele el estómago." },
    { ht: "Poukisa tout gason yo oblije tonbe damou pou mwen? Mwen pa vle sa.", es: "¿Por qué todos los hombres tienen que enamorarse de mí? No quiero eso." },
    { ht: "Mwen pa mò.", es: "No estoy muerta." },
    { ht: "Kiyès mwen ye?", es: "¿Quién soy yo?" },
    { ht: "Ou se yon fanm wo.", es: "Eres una mujer alta." },
    { ht: "Lanmò natirèl.", es: "La muerte es natural." },
    { ht: "Ou jòn.", es: "Estás amarillento." },
    { ht: "Ki kote ou ye?", es: "¿Dónde estás?" },
    { ht: "Ki bò ou ye?", es: "¿Dónde estás?" },
    { ht: "Li ansanm avè l.", es: "Ella está con ella." },
    { ht: "Aprann angle.", es: "Aprende inglés." },
    { ht: "Bonjou! Bon maten!", es: "¡Hola! ¡Buenos días!" },
    { ht: "Konbyen pedofil ki gen nan gouvènman an?", es: "¿Cuántos pedófilos hay en el gobierno?" },
    { ht: "Disfori sèks an konn kòmanse pandan anfans.", es: "La disforia de género suele comenzar en la niñez." },
    { ht: "Ou se yon vòlè, Tom.", es: "Eres un ladrón, Tom." },
    { ht: "\"Mesi.\" \"De ryen.\"", es: "\"Gracias.\" \"De nada.\"" },
    { ht: "Toujou sensè.", es: "Sé siempre franco." },
    { ht: "Mwen rayi epi mwen renmen.", es: "Odio y amo." },
    { ht: "Pèsonn pa te konen kote li te ale.", es: "Nadie sabía adónde fue." },
    { ht: "Ki kote ou rete?", es: "¿Dónde vives?" },
    { ht: "Ki kote ou soti?", es: "¿De dónde venís?" },
    { ht: "Mwen pa pale angle.", es: "No hablo inglés." },
    { ht: "Tanpri ban m youn.", es: "Por favor, dame uno." },
    { ht: "Se kay Anita.", es: "Es la casa de Anita." },
    { ht: "Mwen se yon chat.", es: "Soy un gato." },
    { ht: "Se fen yon anpi.", es: "Es el fin de un imperio." },
    { ht: "Pe bouch ou, fachis.", es: "Cállate, fascista." },
    { ht: "Ki lè li fè?", es: "¿Qué hora es?" },
    { ht: "Mwen renmen mont sa a.", es: "Me gusta este reloj." },
    { ht: "Tom te wè yon reken.", es: "Tom vio un tiburón." },
    { ht: "Kiyès ou ye?", es: "¿Quiénes son ustedes?" },
    { ht: "Kimoun mwen ye?", es: "¿Quién soy yo?" },
    { ht: "Pòm sa a pi wouj.", es: "Esta manzana es más roja." },
    { ht: "Machin nan piti.", es: "El coche es pequeño." },
    { ht: "Parès se manman envansyon.", es: "La haraganería es la madre de la invención." },
    { ht: "Tom pa ka fè fòt.", es: "Tom no puede cometer errores." },
    { ht: "Tom sanble terib.", es: "Tom se ve terrible." },
    { ht: "Kijan ou di...?", es: "¿Cómo se dice...?" },
    { ht: "Ki laj-ou ?", es: "¿Cuántos años tienes?" },
    { ht: "Konbyen li koute?", es: "¿Cuánto cuesta?" },
    { ht: "Aktyelman Burj Khalifa se gratsyél ki pi wo nan mond lan.", es: "El Burj Khalifa es actualmente el rascacielos más alto del mundo." },
    { ht: "Aprann franse.", es: "¡Aprende francés!" },
    { ht: "Burj Khalifa kounye a se gratsyél ki pi wo nan mond.", es: "El Burj Khalifa es actualmente el rascacielos más alto del mundo." },
    { ht: "Mwen gen yon amstè.", es: "Tengo un hámster." },
    { ht: "Mwen se yon gason.", es: "Soy un hombre." },
    { ht: "Lanmò pa solisyon an.", es: "La muerte no es la solución." },
    { ht: "Jodi a se 26 jiyè 2023: Bòn Jounen Esperanto! Sa fè 136 ane, 1887-2023. Sonje ke pandan plizyè deseni, pa te gen okenn Entènèt, ki kounye a ede gaye nan lang tankou Esperanto, atravè lemond.", es: "Hoy es 26 de julio de 2023: ¡Feliz Día del Esperanto! Han pasado 136 años, 1887-2023. Recuerde que durante muchas décadas no hubo Internet, lo que ahora ayuda a la propagación de idiomas como del esperanto, en todo el mundo." },
    { ht: "Ki sa yo te di ou?", es: "¿Qué te han dicho?" },
    { ht: "Mwen renmen madanm mwen.", es: "Amo a mi esposa." },
    { ht: "Ki bò w ye?", es: "¿Dónde estás?" },
    { ht: "Bon apre-midi!", es: "¡Buenas tardes!" },
    { ht: "Matant mwen renmen kreyòl mizik.", es: "A mi tía le gusta la música criolla." },
    { ht: "Ki kote nou ye?", es: "¿Dónde están?" },
    { ht: "Mwen pa konprann.", es: "No entiendo." },
    { ht: "Mwen pè areye.", es: "Le tengo miedo a las arañas." },
    { ht: "Tom fè plis lajan pase paran li yo.", es: "Tom gana más que sus padres." },
    { ht: "Nou pa vole.", es: "No volamos." },
    { ht: "Mwen te vote kont ou.", es: "Voté en tu contra." },
    { ht: "Mwen ap ekri yon lèt.", es: "Estoy escribiendo una carta." },
    { ht: "Modpas la se \"modpas\".", es: "La contraseña es «contraseña»." },
    { ht: "Kijan ou di \"Mwen renmen w\" an franse?", es: "¿Cómo se dice \"te amo\" en francés?" },
    { ht: "M a rete lakay mwen an demen.", es: "Mañana me quedaré en mi casa." },
    { ht: "Mwen pa konnen.", es: "No sé." },
    { ht: "Bonjou, Tom. Bon maten.", es: "Hola Tom. Buenos días." },
    { ht: "M te vini, m te wè, m te vannen.", es: "Vine, vi, vencí." },
    { ht: "Mwen pa janm pral konprann.", es: "Nunca lo entenderé." },
    { ht: "Mond lan an danje.", es: "El mundo está en peligro." },
    { ht: "Kisa mwen ye?", es: "¿Yo soy qué?" },
    { ht: "Ki kote w ye?", es: "¿Dónde estás?" },
    { ht: "Nou te vwazen.", es: "Éramos vecinos." },
    { ht: "Entèlijans atifisyèl pa egziste.", es: "No existe tal cosa como la inteligencia artificial." },
    { ht: "Mwen gen yon ti chen.", es: "Tengo un perro pequeño." },
    { ht: "Èske yo bezwen lajan?", es: "¿Necesitan dinero?" },
  ];

  var VOCABULARIO = [
    {
      cat: "Cortesía",
      items: [
        { ht: "mèsi", es: "gracias", emoji: "🤝" },
        { ht: "tanpri", es: "por favor", emoji: "🙏" },
        { ht: "padon", es: "perdón", emoji: "🙇" },
        { ht: "wi", es: "sí", emoji: "👍" },
        { ht: "non", es: "no", emoji: "👎" },
        { ht: "eskize m", es: "disculpe", emoji: "😅" }
      ]
    },
    {
      cat: "Números",
      items: [
        { ht: "youn", es: "uno", emoji: "1️⃣" },
        { ht: "de", es: "dos", emoji: "2️⃣" },
        { ht: "twa", es: "tres", emoji: "3️⃣" },
        { ht: "kat", es: "cuatro", emoji: "4️⃣" },
        { ht: "senk", es: "cinco", emoji: "5️⃣" },
        { ht: "dis", es: "diez", emoji: "🔟" }
      ]
    },
    {
      cat: "Colores",
      items: [
        { ht: "wouj", es: "rojo", emoji: "🔴" },
        { ht: "ble", es: "azul", emoji: "🔵" },
        { ht: "vèt", es: "verde", emoji: "🟢" },
        { ht: "jòn", es: "amarillo", emoji: "🟡" },
        { ht: "nwa", es: "negro", emoji: "⚫" },
        { ht: "blan", es: "blanco", emoji: "⚪" }
      ]
    },
    {
      cat: "La clase",
      items: [
        { ht: "liv", es: "libro", emoji: "📘" },
        { ht: "kreyon", es: "lápiz", emoji: "✏️" },
        { ht: "papye", es: "papel", emoji: "📄" },
        { ht: "tablo", es: "pizarra", emoji: "📋" },
        { ht: "chèz", es: "silla", emoji: "🪑" },
        { ht: "pwofesè", es: "profesor", emoji: "👨‍🏫" }
      ]
    },
    {
      cat: "Días",
      items: [
        { ht: "lendi", es: "lunes", emoji: "🌙" },
        { ht: "madi", es: "martes", emoji: "🔥" },
        { ht: "mèkredi", es: "miércoles", emoji: "💧" },
        { ht: "jedi", es: "jueves", emoji: "⚡" },
        { ht: "vandredi", es: "viernes", emoji: "💛" },
        { ht: "samdi", es: "sábado", emoji: "🎉" }
      ]
    }
  ];

  return {
    FRASES_RAPIDAS: FRASES_RAPIDAS,
    FRASES_EMERGENCIA: FRASES_EMERGENCIA,
    CORRECCIONES: CORRECCIONES,
    VOCABULARIO: VOCABULARIO,
    GLOSARIO: GLOSARIO,
    normalizarClave: normalizarClave,
    dividirEnOraciones: dividirEnOraciones,
    aEspanolLatino: aEspanolLatino,
    limitarHistorial: limitarHistorial,
    normalizarVariantesKreyol: normalizarVariantesKreyol,
    prepararFuenteKreyol: prepararFuenteKreyol,
    aplicarGlosario: aplicarGlosario,
    construirDiccionario: construirDiccionario,
    buscarEnDiccionario: buscarEnDiccionario,
    detectarColisiones: detectarColisiones
  };
});

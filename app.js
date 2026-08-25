(function () {
  "use strict";

  var CLAVE_HISTORIAL = "kreolEs_historial_v1";
  var CLAVE_DIRECCION = "kreolEs_direccion_v1";
  var CLAVE_VOZ = "kreolEs_voz_v1";
  var CLAVE_TEMA = "kreolEs_tema_v1";
  var CLAVE_PALETA = "kreolEs_paleta_v1";
  var CLAVE_FEEDBACK = "kreolEs_feedback_v1";
  var CLAVE_CHILE_USER = "kreolEs_chile_user_v1";
  var SCHEMA_VERSION = 1;
  var VERSION = "v35";
  var GOOGLE_TTS = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&ttsspeed=1&q=";

  var origen = document.getElementById("textoOrigen");
  var destino = document.getElementById("textoDestino");
  var docArchivo = document.getElementById("docArchivo");
  var docTexto = document.getElementById("docTexto");
  var docSalida = document.getElementById("docSalida");
  var btnDocTraducir = document.getElementById("btnDocTraducir");
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

  function limitarHistorial(items) {
    if (items.length <= MAX_HISTORIAL) return items;
    var favoritos = items.filter(function (i) { return i.favorito; });
    var resto = items.filter(function (i) { return !i.favorito; });
    var mantener = Math.max(0, MAX_HISTORIAL - favoritos.length);
    var recortado = favoritos.concat(resto.slice(resto.length - mantener));
    recortado.sort(function (a, b) { return (a.fecha < b.fecha) ? -1 : 1; });
    return recortado;
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
    guardarHistorial(limitarHistorial(items));
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

  function prepararFuenteKreyol(texto) {
    var t = normalizarVariantesKreyol(texto);
    GLOSARIO.forEach(function (r) {
      if (r.tipo === "fuente") t = t.replace(r.fuente, r.salida.a);
    });
    return t;
  }

  function aplicarGlosario(fuente, traduccion) {
    if (!fuente || !traduccion) return traduccion;
    var res = traduccion;
    GLOSARIO.forEach(function (r) {
      if (r.tipo !== "salida") return;
      if (!r.fuente.test(fuente)) return;
      res = res.replace(r.salida.de, r.salida.a);
    });
    return res;
  }

  function traducirTextoMotor(texto) {
    var textoMotor = esSalidaEspañol() ? texto : prepararFuenteKreyol(texto);
    if (!navigator.onLine) return Promise.reject(new Error("Sin conexión: la traducción en línea no está disponible."));
    ultimoMotor = "google";
    return traducirConGoogle(textoMotor)
      .catch(function () {
        ultimoMotor = "mymemory";
        return traducirConMyMemory(textoMotor);
      })
      .then(function (t) { return aplicarGlosario(texto, t); });
  }

  function fetchConTimeout(url, ms) {
    if (typeof AbortController === "undefined") return fetch(url);
    var control = new AbortController();
    var temporizador = setTimeout(function () { control.abort(); }, ms || 10000);
    return fetch(url, { signal: control.signal }).then(function (resp) {
      clearTimeout(temporizador);
      return resp;
    }, function (err) {
      clearTimeout(temporizador);
      throw err;
    });
  }

  function traducirConGoogle(texto) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
      idiomaOrigen() + "&tl=" + idiomaDestino() + "&dt=t&q=" + encodeURIComponent(texto);
    return fetchConTimeout(url, 10000)
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
    return fetchConTimeout(url, 15000)
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
    if (avisoMotor) avisoMotor.classList.toggle("oculto", ultimoMotor !== "mymemory");
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
      ultimoMotor = "local";
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

    traducirTextoMotor(texto)
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
      return traducirTextoMotor(oracion);
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

  function traducirDocumento() {
    var texto = docTexto.value.trim();
    if (!texto) {
      mostrarError("Pega o extrae el texto del documento antes de traducir.");
      return;
    }
    btnDocTraducir.disabled = true;
    btnDocTraducir.textContent = "Traduciendo…";
    docSalida.innerHTML = "";
    limpiarError();

    var oraciones = dividirEnOraciones(texto);
    var indice = 0;
    var pendientes = oraciones.length;

    function procesarSiguiente() {
      if (indice >= oraciones.length) {
        btnDocTraducir.disabled = false;
        btnDocTraducir.textContent = "Traducir documento";
        return;
      }
      var oracion = oraciones[indice++];
      traducirUnaFrase(oracion)
        .then(function (traducida) { agregarFilaDoc(oracion, traducida, false); })
        .catch(function (err) { agregarFilaDoc(oracion, "[no traducido: " + err.message + "]", true); })
        .then(function () {
          if (--pendientes >= 0) procesarSiguiente();
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
      await cargarScript("vendor/pdf.min.js?v=35");
    } catch (e) { /* sigue y reporta abajo */ }
    if (!window.pdfjsLib) {
      throw new Error("No se pudo cargar el lector de PDF (¿sin conexión?). Pega el texto manualmente.");
    }
    try {
      if (window.pdfjsLib.GlobalWorkerOptions && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js?v=35";
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
    return cargarScript("vendor/mammoth.browser.min.js?v=35").then(function () {
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
    var puntos = 0;
    if (/natural|neural|online|premium|enhanced/.test(nombre)) puntos += 4;
    if (/google/.test(nombre)) puntos += 2;
    if (/microsoft|iona|nuance/.test(nombre)) puntos += 1;
    return puntos;
  }

  function ordenLengua(lang) {
    var l = (lang || "").toLowerCase();
    if (l.indexOf("ht") === 0) return 0;
    if (l.indexOf("es-mx") === 0) return 1;
    if (l.indexOf("es-us") === 0) return 2;
    if (l.indexOf("es-419") === 0) return 3;
    if (l.indexOf("es-es") === 0) return 4;
    if (l.indexOf("es") === 0) return 5;
    if (l.indexOf("fr-ca") === 0) return 6;
    if (l.indexOf("fr") === 0) return 7;
    return 8;
  }

  function mejorVozPara(langObjetivo) {
    var voces = cargarVocesSistema();
    var objetivo = (langObjetivo || "").toLowerCase();
    var esPreferida = objetivo === "es";
    var candidatas = voces.filter(function (v) {
      var l = (v.lang || "").toLowerCase();
      if (esPreferida) return l.indexOf("es") === 0;
      return l.indexOf("ht") === 0 || l.indexOf("fr") === 0;
    });
    if (!candidatas.length && !esPreferida) {
      candidatas = voces.filter(function (v) {
        return (v.lang || "").toLowerCase().indexOf("es") === 0;
      });
    }
    candidatas.sort(function (a, b) {
      var diff = ordenLengua(a.lang) - ordenLengua(b.lang);
      if (diff !== 0) return diff;
      return puntajeVoz(b) - puntajeVoz(a);
    });
    return candidatas[0] || null;
  }

  function poblarSelectVoz() {
    var voces = cargarVocesSistema();
    var eleccion = localStorage.getItem(CLAVE_VOZ) || "auto";
    selectVoz.innerHTML = "";
    var opciones = [["auto", "Auto (mejor voz disponible)"], ["google", "Voz en línea (Google)"]];

    var unicas = {};
    voces.forEach(function (v) {
      var lang = v.lang.toLowerCase();
      if ((lang.indexOf("es") === 0 || lang.indexOf("ht") === 0 || lang.indexOf("fr") === 0) && !unicas[v.name]) {
        unicas[v.name] = v;
      }
    });
    var sistema = Object.keys(unicas).map(function (nombre) { return unicas[nombre]; });
    sistema.sort(function (a, b) {
      var diff = ordenLengua(a.lang) - ordenLengua(b.lang);
      if (diff !== 0) return diff;
      return puntajeVoz(b) - puntajeVoz(a);
    });
    sistema.forEach(function (v) {
      var lang = v.lang.toLowerCase();
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

  btnEmergencia.addEventListener("click", function () {
    renderEmergencia();
    abrirModal(modalEmergencia);
  });

  function cargarTema() {
    try { return localStorage.getItem(CLAVE_TEMA) || "claro"; } catch (e) { return "claro"; }
  }

  function cargarPaleta() {
    try { return localStorage.getItem(CLAVE_PALETA) || "haiti"; } catch (e) { return "haiti"; }
  }

  function aplicarTema(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(CLAVE_TEMA, t); } catch (e) {}
  }

  function aplicarPaleta(p) {
    document.documentElement.setAttribute("data-paleta", p);
    try { localStorage.setItem(CLAVE_PALETA, p); } catch (e) {}
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
      historial: items.slice(-10),
      correccionesSugeridas: cargarFeedback()
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
    if (Array.isArray(datos.correccionesSugeridas)) {
      var fb = cargarFeedback();
      var claves = {};
      fb.forEach(function (f) { claves[f.origen + "|||" + f.destino + "|||" + f.sugerido] = true; });
      datos.correccionesSugeridas.forEach(function (f) {
        var c = (f.origen || "") + "|||" + (f.destino || "") + "|||" + (f.sugerido || "");
        if (!claves[c]) { claves[c] = true; fb.push(f); }
      });
      guardarFeedback(fb);
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
  function cargarFeedback() {
    try {
      var raw = localStorage.getItem(CLAVE_FEEDBACK);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function guardarFeedback(lista) {
    try { localStorage.setItem(CLAVE_FEEDBACK, JSON.stringify(lista)); } catch (e) {}
  }
  function renderFeedback() {
    var items = cargarFeedback();
    listaFeedback.innerHTML = "";
    feedbackVacio.classList.toggle("oculto", items.length > 0);
    items.forEach(function (it, idx) {
      var li = document.createElement("li");
      li.className = "feedback-item";
      var dir = it.direccion === "es-ht" ? "ES→HT" : "HT→ES";
      li.innerHTML =
        '<div class="feedback-cabeza"><span class="chip chip-ayuda">' + dir + '</span>' +
        '<button class="boton-icono btn-borrar-feedback" type="button" title="Eliminar" aria-label="Eliminar">&#128465;</button></div>' +
        '<p class="feedback-origen"></p>' +
        '<p class="feedback-traduccion"></p>' +
        '<p class="feedback-sugerido"></p>';
      li.querySelector(".feedback-origen").textContent = "Original: " + it.origen;
      li.querySelector(".feedback-traduccion").textContent = "Traducción actual: " + it.destino;
      li.querySelector(".feedback-sugerido").textContent = "Correcta: " + it.sugerido;
      li.querySelector(".btn-borrar-feedback").addEventListener("click", function () {
        var lista = cargarFeedback();
        lista.splice(idx, 1);
        guardarFeedback(lista);
        renderFeedback();
      });
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
    if (confirm("¿Borrar todos los reportes de traducción?")) {
      guardarFeedback([]);
      renderFeedback();
    }
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

  window.addEventListener("online", function () {
    limpiarError();
  });

  // ---- Lecturas escolares (Chile) ----
  var TEXTOS_CHILE_URL = "textos-chile.json?v=" + VERSION.replace("v", "");
  var chileData = { grados: [] };

  function cargarChileUsuario() {
    try {
      var raw = localStorage.getItem(CLAVE_CHILE_USER);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function guardarChileUsuario(map) {
    try { localStorage.setItem(CLAVE_CHILE_USER, JSON.stringify(map)); } catch (e) {}
  }

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
      mostrarError("No se pudo cargar textos-chile.json.");
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

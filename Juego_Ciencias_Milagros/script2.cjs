const fs = require('fs');

const traitsMap = {
    // General
    esPlanta: { p: 3143, e: '🌿', texts: ['¿Está plantado en el suelo, tiene hojas y no puede caminar?'] },

    // Plantas
    esArbolAlto: { p: 2256, e: '🌳', texts: ['¿Es un árbol alto con un tronco grande, de madera dura y marrón?'] },
    esTrepadora: { p: 3143, e: '🧗', texts: ['¿Crece pegada a la pared o se enrosca en un tronco como si trepara?'] },
    tienePinchos: { p: 39007, e: '🌵', texts: ['¿Tiene pinchos o espinas que te pueden hacer daño al tocarlos?'] },
    esAromatica: { p: 3102, e: '👃', texts: ['¿Si frotas sus hojas o te acercas, huelen muy bien (como a colonia o comida)?'] },
    esPequenaSuelo: { p: 3113, e: '🌱', texts: ['¿Es pequeñita, crece muy pegada al suelo y NO tiene flores grandes ni vistosas?'] },

    // specific plants
    hojaAguja: { p: 2256, e: '🌲', texts: ['¿Sus hojas tienen forma de aguja fina y alargada?'] },
    daPinones: { p: 2256, e: '🌰', texts: ['¿Su semilla parece un paraguas abierto y da piñones grandes?'] },
    daHigos: { p: 2256, e: '🍐', texts: ['¿Da frutos redondos y blandos muy dulces que se comen (higos)?'] },
    daAlmendras: { p: 2256, e: '🥜', texts: ['¿Da frutos con cáscara dura que se pueden comer (almendras)?'] },
    daBellotas: { p: 2256, e: '🌰', texts: ['¿Tiene bellotas como fruto?'] },
    hojaLobulada: { p: 2256, e: '🍂', texts: ['¿Tiene la hoja con bordes muy redondeados formando curvas (lóbulos)?'] },
    maderaBlancaAgua: { p: 2256, e: '💧', texts: ['¿Tiene tronco blando grisáceo y suele crecer pegado a ríos y charcas?'] },
    hojasAsimetricas: { p: 2256, e: '🍃', texts: ['¿Tiene hojas asimétricas en la base de la hoja (un lado más largo que el otro)?'] },
    bayasMermelada: { p: 30241, e: '🫐', texts: ['¿Da ramilletes de pequeñas bolitas oscuras (bayas) que huelen peculiar?'] },
    florTuboDulce: { p: 3102, e: '🌸', texts: ['¿Sus flores tienen forma de embudo o tubo y son amarillas/blancas/rosas?'] },
    florVisteria: { p: 3102, e: '🌹', texts: ['¿Da flores con muchísimos pétalos vistosos que se venden en floristerías (Rosas)?'] },
    daMoras: { p: 30241, e: '🫐', texts: ['¿Da unos frutos formados por bolitas pequeñas negras muy dulces (moras)?'] },
    espinasLargasCardo: { p: 39007, e: '🦔', texts: ['¿Es una hierba alta y robusta con una flor morada que parece un pompón encima de una bola de pinchos?'] },
    hueleMenta: { p: 3143, e: '🌿', texts: ['¿Al frotarla huele fuerte y dulce a menta/chicle?'] },
    florMoradaEspigaJabon: { p: 3102, e: '🪻', texts: ['¿Tiene las flores moraditas agrupadas como un bastón y huele a jabón de armario?'] },
    hojasHilosAnis: { p: 3143, e: '🌱', texts: ['¿Sus hojas no son planas, sino como cientos de hilos verdes finísimos, y huele a anís/regaliz?'] },
    florManzanilla: { p: 3102, e: '🌼', texts: ['¿Hace florecillas que parecen margaritas en miniatura y se usa para el dolor de tripa?'] },
    cocinarCarne: { p: 3143, e: '🥩', texts: ['¿Sus hojitas son duras y huelen muy bien, típicamente se echa en los asados de carne?'] },
    tomilloCaracteristico: { p: 3143, e: '🌿', texts: ['¿Es un pequeño arbusto que forma bolas grises-verdosas, con hojas minúsculas y olor súper fuerte?'] },
    alfombraPiedras: { p: 3113, e: '🧽', texts: ['¿Forma una alfombra esponjosa y húmeda, sin tallos verdaderos, creciendo sobre piedras y troncos?'] },
    hojaCorazon: { p: 3143, e: '🍀', texts: ['¿Sus hojas están formadas por 3 (o a veces 4) pequeños corazones unidos por el centro?'] },
    hojaFronde: { p: 3143, e: '🌿', texts: ['¿Sus hojas son muy largas y dentadas ("frondes") y al nacer están enrolladas como un espiral decorativo?'] },
    picaPiel: { p: 39007, e: '🔥', texts: ['¿Si la tocas te empiezan a picar muchísimo las manos y te salen ronchas rojas en la piel?'] },
    pareceOrtigaBlanca: { p: 3102, e: '🤍', texts: ['¿Tiene hojas parecidas pero NO pica nada, y florece con una especie de pequeñas "bocas" blancas?'] },
    florRojaPapel: { p: 3102, e: '🌺', texts: ['¿Suelta flores rojas inconfundibles en primavera de cuatro pétalos muy frágiles (que parecen papel)?'] },
    semillaAbuelo: { p: 3102, e: '🌬️', texts: ['¿Después de florecer en amarillo, da una bola blanca ("abuelo") al que le puedes soplar para pedir un deseo?'] },
    florMargarita: { p: 3102, e: '🌼', texts: ['¿Tiene una flor con el centro amarillo apretado y pétalos blancos que se pueden "deshojar"?'] },
    florAzulCeleste: { p: 3102, e: '💠', texts: ['¿Destaca en los caminos por ser una flor despeluchada de color azul cielo muy intenso?'] },
    florAmarillaSinHojas: { p: 30241, e: '💛', texts: ['¿Es un arbusto que parece hecho de tallos como palitos verdes y largos, casi sin hojas?'] },
    hojasPringosas: { p: 3143, e: '🍯', texts: ['¿Sus hojas son verde oscuro y resbalan, quedándose las manos muy pegajosas ("pringosas") al tocarlas?'] },
    florRosaMoradaAbanico: { p: 3102, e: '🌸', texts: ['¿Las hojas del tallo son redondas como un abanico arrugado y sus flores púrpuras tienen cinco pétalos rayados?'] },
    florVioletaRacimo: { p: 3102, e: '💜', texts: ['¿Da pequeñitas flores color lila agolpadas al final del tallo delgado y duro, sin mucho olor?'] },
    hojaAnchaNervios: { p: 3143, e: '🍃', texts: ['¿Tiene hojas anchas aplastadas en el suelo formando roseta, y con 5 a 9 líneas súper marcadas desde la base a la punta?'] },

    // Animales general
    tieneHuesos: { p: 24913, e: '🦴', texts: ['¿Tiene huesos por dentro del cuerpo (es un animal vertebrado)?'] },

    // Invertebrados general
    vuela: { p: 6246, e: '✈️', texts: ['¿Tiene alas para volar por el aire?'] },
    tienePatas: { p: 8666, e: '🐾', texts: ['¿Tiene patas para caminar?'] },
    muchasPatas: { p: 8666, e: '🐛', texts: ['¿Tiene muchísimas patas, más de 8 (parece un gusano con patas o se hace una bolita)?'] },
    ochoPatas: { p: 8666, e: '🕷️', texts: ['¿Tiene exactamente 8 patas?'] },
    seisPatas: { p: 8666, e: '🐜', texts: ['¿Tiene exactamente 6 patas?'] },

    // Invebrados leaf nodes
    alasMuyGrandesBonitas: { p: 6246, e: '🦋', texts: ['¿Tiene las alas opacas, anchas, de tela muy grandes a cada lado del cuerpo y revolotea ("mariposea")?'] },
    blanca: { p: 5406, e: '⚪', texts: ['¿Es principalmente de color BLANCO?'] },
    amarilla: { p: 5406, e: '🟡', texts: ['¿Es principalmente de color AMARILLO brillante y oscuro?'] },
    saleNoche: { p: 37028, e: '🌙', texts: ['¿Acostumbra a esconderse de día y revolotear por la noche, aturdida junto a las bombillas y la luz?'] },
    comeRopa: { p: 3143, e: '👕', texts: ['¿Es tan chiquitita y beige que suele meterse en los armarios en verano a comerse la ropa de lana?'] },
    haceMiel: { p: 31403, e: '🐝', texts: ['¿Hace miel en colmenas y es peluda de color apagado marrón-amarillo?'] },
    rayasAvispa: { p: 5406, e: '🐝', texts: ['¿Tiene el "culo" (abdomen) picudo, pelado sin pelo, y pintado a rayas neón amarillas y negras de advertencia de veneno?'] },
    nidoBarro: { p: 6978, e: '🏺', texts: ['¿Da muchísimo miedo verla volar grande y negra pero solo hace niditos redondos con forma de ollita de barro cocido bajo las vigas?'] },
    chupaSangrePita: { p: 7281, e: '🦟', texts: ['¿Pita agudo en verano por la noche en la habitación y de pica dejando un grano de sangre horrible?'] },
    cuerpoHelicopteroCazaAgua: { p: 6246, e: '🚁', texts: ['¿Parece un helicóptero brillante volando en línea recta y quieto sobre los estanques y ríos (jamás te pica a ti)?'] },
    cantaVerano: { p: 37028, e: '🎶', texts: ['¿A final de verano hace todo el santo día un ruido fuertísimo metálico oculto arriba del pino o los árboles y no la ves jamás?'] },
    verdeMetalicoAcudeCaca: { p: 5406, e: '💩', texts: ['¿Es redonda de un verde metalizado esmeralda súper bonito... pero no para de posarse asquerosa en la comida basura y excrementos?'] },

    conchaEspiral: { p: 25016, e: '🐌', texts: ['¿Lleva una concha en espiral a cuestas (su casa) para esconder los mofletes y antenas si asustas?'] },
    rastroBaba: { p: 2360, e: '💧', texts: ['¿Echa un rastro de "moco" / baba descarado y está brillante grisácea y blanda como flan?'] },
    seHaceBolita: { p: 7498, e: '🪨', texts: ['¿La tocas, o le da la luz al levantar la piedra... y se hace una bolita perfecta rodante gris que parece metal?'] },
    correRapidoPinzas: { p: 34835, e: '🗡️', texts: ['¿No es gordito ni redondo en tubo, corre desquiciado porque es plano, y lleva "ganchos" en la primera pata y pica muchísimo (venenoso)?'] },

    parasitoSangre: { p: 7281, e: '🧛', texts: ['¿Es plana roja-marrón repulsiva, y se entierra en la piel de tu perro chupándole tanta sangre que engorda como un garbanzo gigante gris?'] },
    telaranaCruz: { p: 25600, e: '🕸️', texts: ['¿Si te acercas a ver a la "tejedora de Milagros", ves que su tripa es muy gorda y naranja amarilla ¡¡TENIENDO UNA CRUZ BLANCA MÁGICA!! en la espalda?'] },

    patasTraserasSaltarinas: { p: 8666, e: '🦘', texts: ['¿Tiene dos patas larguísimas flexionadas apoyadas encima y listas para dar unos brincos que la manden muy lejos?'] },
    cantaNocheOscuro: { p: 37028, e: '🦗', texts: ['¿Negro y brillante de la cabeza a las alas, sale de su agujero cantando "cri... cri... cri" monótono?'] },
    pulgaChupaSangre: { p: 7281, e: '🩸', texts: ['¿Es microscópica saltarina rojiza que ni ves corriendo, y solo la pillas intentando morder detrás en el lomo de un perrito?'] },
    verdeHierbaAlta: { p: 5406, e: '🦗', texts: ['¿Salta volando con la hierba súper mimetizado y tiene cara de caballo pequeño comiendo tallos?'] },

    caparazonDuroDorso: { p: 25016, e: '🛡️', texts: ['¿Las alas no se ven de papel, sino que son duras, lisas o arrugadas protegiéndole la espalda por completo como un "Tanque"? (escarabajos/mariquitas)'] },
    rojaPuntosNegros: { p: 5406, e: '🐞', texts: ['¿Redondita, simpática colorada de advertencia de veneno con pringue naranja ("puntos") que mola tener en los dedos?'] },
    ruedaEstiercol: { p: 7498, e: '💩', texts: ['¿Se la pasa haciendo rodar una caca de caballo haciéndola bola gigante "hacia atrás" con las patas estiradas al sol?'] },
    verdeEsmeraldaFlores: { p: 5406, e: '✨', texts: ['¿Color verde metalizado cegador dorado, paseándose tranquilo bebiendo por encima de las jaras y cardos al solazo de julio?'] },
    cuernoRinoceronte: { p: 4658, e: '🦏', texts: ['¿Es como una nuez negra dura enorme que parece torpe volando como camión, y si miras al macho, ¡tiene en la frente el cuerno de un rinoceronte enorme torcido arriba!?'] },

    hormigueroFila: { p: 7498, e: '🐜', texts: ['¿Va siempre haciendo fila eterna hacia el nido organizadamente para llevar comida de casa en casa y son decenas?'] },
    rojaPica: { p: 39007, e: '🔴', texts: ['¿Se te sube si te sientas en la acera y muerde pellizcando tan fuerte (y te echa como vinagre) que la zona te escuece de color rojo cereza?'] },
    negraPequenita: { p: 4658, e: '🐜', texts: ['¿Es la Hormiga Negra Común, la de toda la vida chiquitita que acude dócil rapidísima al picolete y migajas del pastel por el terrazo?'] },
    patasRezar: { p: 8666, e: '🙏', texts: ['¿Se queda quieta simulando un palo, con hojas, las manos raras en la cabeza... como que parece rezando (y te sigue con los ojos)?'] },
    formaEscudoHueleMal: { p: 3102, e: '🛡️', texts: ['¿Mucha gente las llama "catarinas/chinches del tomate" , y si le das una palmada o lo pisas huele súper desagradable como a químico?'] },
    pinzasTijeraCola: { p: 8666, e: '✂️', texts: ['¿Negro aceitunado largo que en la cola del todo tiene una especie de alicates afilados asustadizos como si las de arriba (tijeras) las usaran?'] },

    // Vertebrados Aves
    tienePlumasPico: { p: 7286, e: '🐦', texts: ['¿Tiene el cuerpo cubierto de plumas y tiene un pico?'] },
    rapazNocturna: { p: 37028, e: '🦉', texts: ['¿Es una rapaz de rapina que "uhu uhu" y tiene ojos que te miran siempre fijamente (nocturna de verdad)?'] },
    caraBlancaFantasma: { p: 5406, e: '👻', texts: ['¿Es grande, cara blanca de corazón espectacular con alas gigantes silencioso chillando por las noches fantasmagóricamente?'] },
    rapazDiurnaV: { p: 6246, e: '🦅', texts: ['¿Rapaz diurna cazadora del cielo con la cola super cortada en forma de punta de dos letras "V" en el aire altísimo como cometa rojiza?'] },
    ciguenaCampanario: { p: 6978, e: '⛪', texts: ['¿Majestuosa blanquísima pesada, patas como palos y pico escarlata, clac-clac chocando en el campanario construyendo montaña nido todo de palos?'] },
    urracaRobabrillos: { p: 5406, e: '🖤', texts: ['¿Chilla asquerosa fuerte saltando por los sembrados como loca roba huevos, listísima, de plumaje negro y blanco larguísimo brillante en ala?'] },
    palomaCiudad: { p: 5406, e: '🕊️', texts: ['¿Ave robusta, andaluza gruesa urbana asustadiza que ensucia ventanas comiendo pipas y pan grisácea cabezona pesada?'] },
    tortolaCollar: { p: 5406, e: '🕊️', texts: ['¿Como una paloma más pequeña, esbelta, beige vainilla cantando arrullos roncos con un bonito "collar" finito negro en la nuca?'] },
    cuervoNegro: { p: 5406, e: '🎩', texts: ['¿Absolutamente y exageradamente de tamaño grande, negro el pico y el cuerpo macizo que grita "¡CRA-CRA...!" desconfiado tremendo volando?'] },
    mirloPicoNaranja: { p: 5406, e: '🥕', texts: ['¿Sale a las seis de la tarde, es negro carboncito asustadizo rapidillo pegado al seto pero tiene... un pico precioso naranja butano de zanahoria?'] },
    estorninoEstrellitas: { p: 5406, e: '✨', texts: ['¿Chilando cientos juntos volando en figura 8 al anochecer como bandada mancha nube, oscuro brillo lila con diminutas estrellas claras?'] },
    nidoTejadoBaberoRojo: { p: 5406, e: '🩸', texts: ['¿Golondrina veloz aerodinámica de ciudad de larga cola ahorquillada pero luce una "barba" o babero rojo intenso garganta?'] },
    culoBlancoVuelo: { p: 5406, e: '🤍', texts: ['¿Caza moscas arriba de ti con las alas afiladas pegadas, oscurísimo cola de pico, y resalta su culito nieve súper blanco al girar?'] },
    gorrionRechoncho: { p: 5406, e: '🍞', texts: ['¿Chiquitín saltando para coger pan miedoso de color terroso pardo marrón súper típico común canturreando por todo pueblo humano?'] },
    pechoLlamaRoja: { p: 5406, e: '🔥', texts: ['¿Bolito invierno descarado que si haces ruido cavando tierra baja a ver el bicho rápido, luciendo una llamarada rojo-naranja intensa barriga cara?'] },
    franjaNegraPecho: { p: 5406, e: '👔', texts: ['¿Pájaro cantando amarillo sulfúrico por la tripa, cabeza monísima oscura que la parte una "corbata" ancha negra por todo medio abajo?'] },
    gorraAzulCabeza: { p: 5406, e: '🧢', texts: ['¿Minusculito acróbata chulo y colgado de cabeza comiendo piñón con máscara antifaz blanca, pio, pecho amarillo, y... ¡un gorrito azul esmeralda vivo en la coronilla!?'] },

    // Mamíferos
    tienePelo: { p: 2392, e: '🦁', texts: ['¿Tiene el cuerpo recubierto de pelo?'] },
    vuelaBocaAbajo: { p: 6246, e: '🦇', texts: ['¿Típico volar noche colgado dormir boca abajo (único mamífero vuela real) chillando en silencio alas grandes de la cara?'] },
    pinchosEspalda: { p: 39007, e: '🦔', texts: ['¿Anda despacito gruñendo hocico de cerdito y a la mínima rueda volviéndose esfera de miles agujas pinchantes dura en la noche campo?'] },
    colaGiganteZorro: { p: 5406, e: '🦊', texts: ['¿Astuto carnívoro naranja marrón largo puntiagudo y es tremendo lo inmenso peludo y gordo que tiene su elegante cola de peluche persiguiendo conejo?'] },
    pareceCiervoPequeno: { p: 4658, e: '🦌', texts: ['¿No es un gran ciervo de la sierra que berrea, es marroncito rojizo "Bambi", sale saltar ágil ladra al monte arbustos blanco de culo de miedo sin cuernazo asombroso?'] },
    orejasLargasMadriguera: { p: 5406, e: '🐰', texts: ['¿Vive súper asustadizo en tierra profunda haciendo túnel laberinto social (madriguera), con pompón cola blanquísimo redondo comiendo de día verde?'] },
    orejasMuyLargasCorreCorto: { p: 34835, e: '🐇', texts: ['¿No excava hondonada sucia en tunel profundo, duerme cama rasa y sus patas/orejas gigantes despistando galgos a velocidad absurdo solitaria por trigales?'] },
    ratonCiegoTierra: { p: 4658, e: '🐭', texts: ['¿Ojos en su lugar chato rechoncho corto oscuro con rabo chiquitín que ni ves apenas... excava surcos de raíles galerías para comer cultivo huerto sin saltar asando vista?'] },
    ratonOjosGrandes: { p: 5406, e: '🐁', texts: ['¿Clásico ratón marrón de grandes ojirris negros preciosos que salta orejudo escapando campo de rabo más largo o igual que su cuerpo asustado gracil?'] },

    // Anfibios/Reptiles
    tiene4Patas: { p: 8666, e: '🦎', texts: ['¿Tiene 4 patas para caminar o trepar/saltar?'] },
    cuerpoHumedoSalta: { p: 2360, e: '🐸', texts: ['¿Siempre lisita mojadísima asustadiza verdecilla al borde del charco haciendo piruetas "Krooac" salpicando para huir en clavados largos lejos?'] },
    pielVerrugosaCamina: { p: 7498, e: '🐸', texts: ['¿No da saltos olímpicos ni bucea esbelta. Va torpón, seco-húmedo de asfalto lluvia gorda lleno de bultitos rugosos oscuros como verrugones tóxicos para que le escupan?'] },
    granDinosaurioVerde: { p: 4658, e: '🦖', texts: ['¿Lagartísimo gordo imponente bellísimo verde asustante enorme que al pasearse asusta casi medio metro por ribazos comiendo con preciosos círculos azules lado ("ocelos") grandes sol de agosto?'] },
    pequenoParedSeltaCola: { p: 6978, e: '🦎', texts: ['¿Trepadorita cotidiana por todos los muros sol calientapiedras, diminuta escurridiza miedosa simpática gris marroón que si le agarras la cola ¡te la rompe en trampa perdiendo músculo viva!?'] },

    culebraLevantaSisea: { p: 39007, e: '🐍', texts: ['¿Es verdosa cabreada si asustas que levanta tercio siseando y bufando imponente gigante agresiva simulando la muerte ("bastarda") por el campo asustona pero huye si pegas suelo?'] },
    culebraDibujaEscalera: { p: 5406, e: '🐍', texts: ['¿Tremenda cazadora ratonerilla gruesita trepadora que jovencita tiene la espalda un patrón calcado dibujo peldaños "via tren / escalerita negra peldaño"?'] },
};

const finalTs = `import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SPECIES_DB, getSpeciesForDifficulty, type Species, type TraitMap, type Difficulty } from '../data/species';
import { fetchWikiImage } from '../utils/wiki';

// ====== VERSION ======
const VERSION = "v2.7.0";

const ARASAAC_URL = (pictoId: number) => \`https://static.arasaac.org/pictograms/\${pictoId}/\${pictoId}_500.png\`;

// ====== QUESTION DEFS ======
// We simply use the exact same text for all difficulties because these are highly specific dichotomous questions
type QuestionDef = { text: string; pictoId: number; fallbackEmoji: string };

const QUESTION_DEFS: Record<string, QuestionDef> = {
${Object.entries(traitsMap).map(([k, v]) => \`  \${k}: { text: "\${v.texts[0]}", pictoId: \${v.p}, fallbackEmoji: "\${v.e}" }\`).join(',\n')}
};

// All traits are valid for all difficulties now, since the questions perfectly branch.
// We map them dynamically
const ALL_TRAITS = new Set(Object.keys(QUESTION_DEFS));

type Question = { key: string; text: string; pictoId: number; fallbackEmoji: string };

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; utterance.rate = 0.85; utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }
};

const DIFFICULTY_CONFIG: { key: Difficulty; label: string; emoji: string; description: string; color: string; hoverColor: string; borderColor: string; bgLight: string; textColor: string }[] = [
  { key: "primaria", label: "Primaria", emoji: "🌱", description: "Clave dicotómica visual 100% natural", color: "bg-emerald-500", hoverColor: "hover:bg-emerald-600", borderColor: "border-emerald-200", bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
  { key: "eso", label: "ESO", emoji: "🔬", description: "Clave estructurada científica adaptada", color: "bg-blue-500", hoverColor: "hover:bg-blue-600", borderColor: "border-blue-200", bgLight: "bg-blue-50", textColor: "text-blue-700" },
  { key: "bachillerato", label: "Bachillerato", emoji: "🎓", description: "Flujo deductivo anatómico avanzado", color: "bg-purple-500", hoverColor: "hover:bg-purple-600", borderColor: "border-purple-200", bgLight: "bg-purple-50", textColor: "text-purple-700" },
];

interface TreeNode { questionText: string; emoji: string; yesSpecies: Species[]; noSpecies: Species[]; yesChild?: TreeNode; noChild?: TreeNode; }

function buildDifficultyTree(species: Species[], usedTraits: Set<string>, maxDepth: number): TreeNode | undefined {
  if (species.length <= 1 || maxDepth <= 0) return undefined;

  let bestKey = "", bestDiff = Infinity;
  let bestYes: Species[] = [], bestNo: Species[] = [];

  // We find the trait that exists in our remaining species
  let keysInRemaining = new Set<string>();
  species.forEach(s => {
    Object.keys(s.traits).forEach(k => {
      if (s.traits[k] !== undefined && ALL_TRAITS.has(k) && !usedTraits.has(k)) keysInRemaining.add(k);
    });
  });

  keysInRemaining.forEach(k => {
    const yes = species.filter(sp => sp.traits[k] === true);
    const no = species.filter(sp => sp.traits[k] === false || sp.traits[k] === undefined);

    if (yes.length > 0 && no.length > 0) {
      const diff = Math.abs(yes.length - no.length);
      if (diff < bestDiff) {
        bestDiff = diff; bestKey = k; bestYes = yes; bestNo = no;
      }
    }
  });

  if (!bestKey) return undefined;

  const def = QUESTION_DEFS[bestKey];
  const nextUsed = new Set(usedTraits);
  nextUsed.add(bestKey);

  return {
    questionText: def.text, emoji: def.fallbackEmoji,
    yesSpecies: bestYes, noSpecies: bestNo,
    yesChild: buildDifficultyTree(bestYes, nextUsed, maxDepth - 1),
    noChild: buildDifficultyTree(bestNo, nextUsed, maxDepth - 1),
  };
}

function SpeciesList({ species, variant }: { species: Species[]; variant: 'yes' | 'no' }) {
  const colors = variant === 'yes' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700';
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {species.map(s => (
        <span key={s.id} className={\`text-xs px-2 py-0.5 border rounded-full font-medium \${colors}\`}>{s.name}</span>
      ))}
    </div>
  );
}

function TreeBranch({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 3);

  return (
    <div className="relative">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 py-1.5 px-3 my-1 rounded-xl hover:bg-blue-50 transition-colors text-left w-full shadow-sm border border-transparent hover:border-blue-100">
        <span className={\`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full transition-all flex-shrink-0 \${expanded ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}\`}>{expanded ? '−' : '+'}</span>
        <span className="text-base flex-shrink-0">{node.emoji}</span>
        <span className="text-sm font-bold text-blue-800 flex-1 leading-tight">{node.questionText}</span>
        <span className="text-xs font-mono text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{node.yesSpecies.length} sí / {node.noSpecies.length} no</span>
      </button>

      {expanded && (
        <div className="ml-6 border-l-2 border-blue-100 pl-3">
          <div className="flex items-start gap-1.5 my-1">
            <span className="text-xs font-bold text-emerald-600 mt-1 flex-shrink-0">✅ SÍ →</span>
            <div className="flex-1">{node.yesChild ? <TreeBranch node={node.yesChild} depth={depth + 1} /> : <SpeciesList species={node.yesSpecies} variant="yes" />}</div>
          </div>
          <div className="flex items-start gap-1.5 my-1">
            <span className="text-xs font-bold text-red-500 mt-1 flex-shrink-0">❌ NO →</span>
            <div className="flex-1">{node.noChild ? <TreeBranch node={node.noChild} depth={depth + 1} /> : <SpeciesList species={node.noSpecies} variant="no" />}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DifficultyTreePanel({ diffKey, config }: { diffKey: Difficulty; config: typeof DIFFICULTY_CONFIG[number]; }) {
  const [showTree, setShowTree] = useState(false);
  const speciesForLevel = useMemo(() => getSpeciesForDifficulty(diffKey), [diffKey]);
  const tree = useMemo(() => buildDifficultyTree(speciesForLevel, new Set(), 50), [speciesForLevel]);

  if (!tree) return null;

  return (
    <div className="w-full mt-3">
      <button onClick={(e) => { e.stopPropagation(); setShowTree(!showTree); }} className={\`w-full flex items-center justify-center gap-2 py-3 px-5 border-2 rounded-2xl transition-all text-sm font-bold shadow-sm \${showTree ? \`\${config.bgLight} \${config.borderColor} \${config.textColor}\` : \`bg-white border-gray-200 text-gray-600 hover:\${config.bgLight} hover:\${config.borderColor} hover:\${config.textColor}\`}\`}>
        <span className="text-lg">🌳</span>
        {showTree ? 'Ocultar árbol dicotómico' : 'Ver árbol dicotómico analítico completo'}
        <span className={\`text-xs font-normal px-2 py-0.5 rounded-full \${showTree ? 'bg-white/60 text-current' : 'bg-gray-100'}\`}>{speciesForLevel.length} especies conectadas</span>
      </button>

      {showTree && (
        <div className="mt-3 bg-white rounded-2xl p-4 md:p-5 shadow-lg border-2 border-gray-100 overflow-x-auto text-left" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-bold text-gray-700 text-lg mb-4" style={{ fontFamily: "'Patrick Hand', cursive" }}>{config.label} — 100 especies</h3>
          <TreeBranch node={tree} />
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// ========================== MAIN COMPONENT =================================
// ===========================================================================
export default function DichotomousKey() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [candidates, setCandidates] = useState<Species[]>([]);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const prevQuestionRef = useRef<string | null>(null);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCandidates(SPECIES_DB);
    setHistory([]);
    setSkippedQuestions(new Set());
    setImageUrl(null);
    setLoadingImage(false);
    prevQuestionRef.current = null;
  }, []);

  const nextQuestion = useMemo<Question | null>(() => {
    if (candidates.length <= 1 || !difficulty) return null;
    let keysInRemaining = new Set<string>();
    candidates.forEach(s => {
      Object.keys(s.traits).forEach(k => {
        if (s.traits[k] !== undefined && ALL_TRAITS.has(k) && !skippedQuestions.has(k)) keysInRemaining.add(k);
      });
    });

    let bestQ: Question | null = null;
    let closestToHalf = Infinity;
    const target = candidates.length / 2;

    keysInRemaining.forEach(k => {
      const yesCount = candidates.filter(sp => sp.traits[k] === true).length;
      const noCount = candidates.filter(sp => sp.traits[k] === false || sp.traits[k] === undefined).length;

      if (yesCount > 0 && noCount > 0) {
        const diff = Math.abs(yesCount - target); // Try to split EXACTLY in half relative to remaining candidates
        if (diff < closestToHalf) { 
          closestToHalf = diff; 
          bestQ = { key: k, text: QUESTION_DEFS[k].text, pictoId: QUESTION_DEFS[k].pictoId, fallbackEmoji: QUESTION_DEFS[k].fallbackEmoji };
        }
      }
    });
    return bestQ;
  }, [candidates, difficulty, skippedQuestions]);

  useEffect(() => {
    if (nextQuestion && nextQuestion.text !== prevQuestionRef.current) {
      prevQuestionRef.current = nextQuestion.text;
      speak(nextQuestion.text);
    }
  }, [nextQuestion]);

  useEffect(() => {
    if (candidates.length === 1 && !nextQuestion) {
      setLoadingImage(true);
      fetchWikiImage(candidates[0].wikiQuery).then(url => { setImageUrl(url); setLoadingImage(false); });
      speak(\`¡Lo encontré! Es un \${candidates[0].name}\`);
    }
  }, [candidates, nextQuestion]);

  const handleYes = useCallback(() => {
    if (!nextQuestion) return;
    setHistory(h => [...h, { question: nextQuestion.text, answer: "sí" }]);
    setCandidates(prev => prev.filter(c => c.traits[nextQuestion.key] === true));
  }, [nextQuestion]);

  const handleNo = useCallback(() => {
    if (!nextQuestion) return;
    setHistory(h => [...h, { question: nextQuestion.text, answer: "no" }]);
    setCandidates(prev => prev.filter(c => c.traits[nextQuestion.key] === false || c.traits[nextQuestion.key] === undefined));
  }, [nextQuestion]);

  const handleSkip = useCallback(() => {
    if (!nextQuestion) return;
    setHistory(h => [...h, { question: nextQuestion.text, answer: "no lo sé" }]);
    setSkippedQuestions(prev => new Set(prev).add(nextQuestion.key));
  }, [nextQuestion]);

  const resetGame = useCallback(() => {
    setDifficulty(null); setCandidates([]); setHistory([]); setSkippedQuestions(new Set());
    setImageUrl(null); setLoadingImage(false); prevQuestionRef.current = null;
    window.speechSynthesis?.cancel();
  }, []);

  const winner = !nextQuestion && candidates.length === 1 ? candidates[0] : null;

  if (!difficulty) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center pb-10">
        <div className="bg-white rounded-2xl p-6 shadow-md border-4 border-amber-100 mb-6 w-full text-center">
          <h2 className="text-3xl font-bold text-amber-600 mb-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>🎯 ¡Desafío 100 Especies!</h2>
          <p className="text-gray-500 text-lg mb-1">Tu misión deductiva con pura lógica natural para descubrir las 100 especies de Milagros.</p>
        </div>
        <div className="flex flex-col gap-6 w-full">
          {DIFFICULTY_CONFIG.map((d) => (
            <div key={d.key} className="w-full">
              <button onClick={() => startGame(d.key)} className={\`\${d.color} \${d.hoverColor} text-white rounded-3xl p-6 shadow-xl border-4 \${d.borderColor} flex flex-col items-center gap-3 active:translate-y-1 transition-all w-full\`}>
                <div className="flex items-center gap-4 w-full">
                  <span className="text-5xl">{d.emoji}</span>
                  <div className="text-left flex-1"><h3 className="text-2xl font-extrabold" style={{ fontFamily: "'Patrick Hand', cursive" }}>{d.label}</h3><p className="text-sm opacity-90">{d.description}</p></div>
                  <span className="text-3xl opacity-70">▶</span>
                </div>
              </button>
              <DifficultyTreePanel diffKey={d.key} config={d} />
            </div>
          ))}
        </div>
        <p className="mt-6 text-gray-400 text-xs">{VERSION}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center pb-10">
      <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-emerald-100 mb-6 w-full text-center">
        <div className="flex items-center justify-between mb-2">
          <button onClick={resetGame} className="text-sm text-gray-400 hover:text-gray-600 font-bold">← Cambiar nivel</button>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
            {DIFFICULTY_CONFIG.find(d => d.key === difficulty)?.emoji} {DIFFICULTY_CONFIG.find(d => d.key === difficulty)?.label}
          </span>
        </div>
        <h2 className="text-3xl font-bold text-emerald-600 mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>🌿 Piensa en un ser vivo de Milagros...</h2>
        {candidates.length > 1 && nextQuestion && <div className="mt-3 text-sm font-bold bg-blue-50 text-blue-700 py-1 px-3 rounded-full inline-block uppercase tracking-wider">Investigando {candidates.length} especies</div>}
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-blue-100 w-full flex flex-col items-center min-h-[420px]">
        {winner ? (
          <div className="text-center flex flex-col items-center w-full">
            <h3 className="text-4xl md:text-5xl font-extrabold text-emerald-500 mb-6" style={{ fontFamily: "'Patrick Hand', cursive" }}>¡Es \${winner.category === 'Planta' ? 'una' : 'un'} {winner.name}! 🎉</h3>
            <div className="w-64 h-64 md:w-80 md:h-80 bg-gray-100 rounded-3xl overflow-hidden shadow-inner border-4 border-emerald-100 flex items-center justify-center mb-8">
              {loadingImage ? <span className="text-gray-400 font-bold animate-pulse text-lg">Buscando foto...</span>
                : imageUrl ? <img src={imageUrl} alt={winner.name} className="w-full h-full object-cover" />
                : <span className="text-gray-400 font-bold text-lg">Sin foto</span>}
            </div>
            <button onClick={resetGame} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xl shadow-lg active:translate-y-1 transition-all">🔄 Jugar otra vez</button>
          </div>
        ) : (!nextQuestion && candidates.length > 1) ? (
          <div className="text-center w-full">
              <h3 className="text-3xl font-bold text-amber-500 mb-4" style={{ fontFamily: "'Patrick Hand', cursive" }}>🤔 ¡Me quede sin pistas! ¿Cuál es?</h3>
              <p className="text-lg text-gray-600 mb-6">Ayúdame eligiendo de los {candidates.length} que quedan:</p>
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                  {candidates.map(c => (
                      <button key={c.id} onClick={() => setCandidates([c])}
                          className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-full text-amber-800 font-bold text-sm active:translate-y-1 transition-all"
                      >{c.name}</button>
                  ))}
              </div>
              <button onClick={resetGame} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl font-bold text-sm shadow active:translate-y-1 transition-all">🔄 Empezar de nuevo</button>
          </div>
        ) : (!nextQuestion && candidates.length === 0) ? (
          <div className="text-center">
             <h3 className="text-4xl font-bold text-red-500 mb-4" style={{ fontFamily: "'Patrick Hand', cursive" }}>¡Imposible! 😵</h3>
             <p className="text-xl text-gray-600 mb-8">Esa combinación de pistas no existe en las 100 especies de Milagros.</p>
             <button onClick={resetGame} className="px-8 py-3 bg-red-400 hover:bg-red-500 text-white rounded-xl font-bold text-xl shadow-lg active:translate-y-1 transition-all">Jugar de nuevo</button>
          </div>
        ) : nextQuestion ? (
          <div className="flex flex-col items-center w-full mt-4">
            <div className="bg-blue-50/50 rounded-2xl p-4 md:p-6 border-2 border-blue-100 mb-10 w-full flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-inner">
              <div className="w-28 h-28 bg-white rounded-2xl border-4 border-blue-200 flex items-center justify-center flex-shrink-0 shadow-md">
                <img src={ARASAAC_URL(nextQuestion.pictoId)} alt="picto" className="w-24 h-24 object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <span className="text-6xl hidden drop-shadow-sm">{nextQuestion.fallbackEmoji}</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-blue-900 text-center md:text-left leading-relaxed" style={{ fontFamily: "'Patrick Hand', cursive" }}>{nextQuestion.text}</h3>
              <button onClick={() => speak(nextQuestion.text)} className="ml-auto flex-shrink-0 w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center text-2xl transition-all" title="Escuchar">🔊</button>
            </div>
            <div className="flex gap-4 w-full max-w-xl justify-center">
              <button onClick={handleYes} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-5 font-black text-2xl shadow-xl active:translate-y-1 transition-all border-b-4 border-emerald-700">SÍ</button>
              <button onClick={handleNo} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl py-5 font-black text-2xl shadow-xl active:translate-y-1 transition-all border-b-4 border-red-700">NO</button>
            </div>
            <button onClick={handleSkip} className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full font-bold text-sm transition-all border-2 border-gray-200">🤷 No lo sé seguro</button>
          </div>
        ) : null}
      </div>

      {history.length > 0 && (
        <div className="w-full mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-400 mb-3 text-xs tracking-widest uppercase">Historial deductivo:</h4>
          <div className="flex flex-col gap-2">
            {history.map((h, i) => (
              <div key={i} className={\`flex items-start gap-2 p-2 rounded-lg \${h.answer === "sí" ? 'bg-emerald-50/50' : h.answer === "no" ? 'bg-red-50/50' : 'bg-gray-50'}\`}>
                <span className={\`font-black text-lg \${h.answer === "sí" ? 'text-emerald-500' : h.answer === "no" ? 'text-red-400' : 'text-gray-400'}\`}>{h.answer === "sí" ? '✅' : h.answer === "no" ? '❌' : '❔'}</span>
                <span className="text-sm font-medium text-gray-700 mt-1">{h.question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-gray-400 font-mono text-xs opacity-50">{VERSION}</p>
    </div>
  );
}
\`;

fs.writeFileSync('C:\\\\Users\\\\VALIMANA\\\\Desktop\\\\Proyectos\\\\Tico.AI\\\\Juego_Ciencias_Milagros\\\\src\\\\games\\\\DichotomousKey.tsx', finalTs);
console.log('Done dich key');

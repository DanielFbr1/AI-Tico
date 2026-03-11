export type Category = "Planta" | "Invertebrado" | "Vertebrado";
export type TrophicLevel = "Productor" | "Consumidor Primario" | "Consumidor Secundario" | "Consumidor Terciario" | "Descomponedor";

export interface TraitMap {
  [key: string]: string | boolean | undefined;
}

export type Difficulty = "primaria" | "eso" | "bachillerato";

export interface Species {
  id: string;
  name: string;
  category: Category;
  trophicLevel: TrophicLevel;
  wikiQuery: string;
  imageUrl?: string;
  traits: TraitMap;
}

export const QUESTION_DEFS: Record<string, { text: { primaria: string; eso: string; bachillerato: string }; pictoId: number; fallbackEmoji: string }> = {

  // ============================
  // NIVEL 1: El Gran Filtro
  // ============================
  "esPlanta": {
    "text": {
      "primaria": "¿Es una planta (está sujeta a la tierra y no camina)?",
      "eso": "¿Es un organismo sésil fijado al suelo (planta)?",
      "bachillerato": "¿Es un organismo autótrofo sésil (Reino Plantae)?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🌿"
  },

  // ============================
  // NIVEL 2A: Rama PLANTAS
  // ============================
  "esArbolAlto": {
    "text": {
      "primaria": "¿Tiene un solo tronco duro de madera marrón (árbol)?",
      "eso": "¿Posee un tronco central leñoso (árbol)?",
      "bachillerato": "¿Presenta biotipo arbóreo con tronco leñoso principal?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🌳"
  },
  "esTrepadora": {
    "text": {
      "primaria": "¿Crece trepando o enrollándose por otras superficies?",
      "eso": "¿Presenta tallos trepadores que se apoyan en otras estructuras?",
      "bachillerato": "¿Es una planta de hábito escandente o trepador?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🧗"
  },
  "tienePinchos": {
    "text": {
      "primaria": "¿Tiene pinchos o espinas duras?",
      "eso": "¿Posee formaciones punzantes o espinas?",
      "bachillerato": "¿Presenta estructuras defensivas lignificadas (espinas)?"
    },
    "pictoId": 39007,
    "fallbackEmoji": "🌵"
  },
  "esAromatica": {
    "text": {
      "primaria": "¿Desprende un olor fuerte al frotar sus hojas?",
      "eso": "¿Exhala un aroma intenso al frotar alguna de sus partes?",
      "bachillerato": "¿Secreto compuestos volátiles aromáticos perceptibles?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "👃"
  },
  "esPequenaSuelo": {
    "text": {
      "primaria": "¿Crece pegada al suelo midiendo menos de 10 cm?",
      "eso": "¿Es una planta de porte rastrero menor a 10 cm?",
      "bachillerato": "¿Es una especie herbácea rastrera de escasa altura?"
    },
    "pictoId": 3113,
    "fallbackEmoji": "🌱"
  },
  "hojaAguja": {
    "text": {
      "primaria": "¿Tienen sus hojas forma de aguja fina?",
      "eso": "¿Presenta hojas muy estrechas y alargadas (forma de aguja)?",
      "bachillerato": "¿Desarrolla hojas aciculares?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🌲"
  },
  "daPinones": {
    "text": {
      "primaria": "¿Da piñas duras que contienen semillas llamadas piñones?",
      "eso": "¿Produce conos grandes que albergan semillas (piñones)?",
      "bachillerato": "¿Desarrolla estróbilos ovoides con grandes semillas comestibles?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🌰"
  },
  "daHigos": {
    "text": {
      "primaria": "¿Produce frutos blandos llamados higos?",
      "eso": "¿Desarrolla frutos carnosos conocidos como higos?",
      "bachillerato": "¿Produce infrutescencias denominadas siconos (higos)?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🍐"
  },
  "daAlmendras": {
    "text": {
      "primaria": "¿Su semilla está dentro de una cáscara dura?",
      "eso": "¿Produce un fruto con dura envuelta protegiendo la semilla?",
      "bachillerato": "¿Desarrolla drupas con endocarpio leñoso surcado?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🥜"
  },
  "daBellotas": {
    "text": {
      "primaria": "¿Su fruto tiene un \"sombrerito\" rugoso (bellota)?",
      "eso": "¿Produce bellotas cubiertas parcialmente por una cúpula?",
      "bachillerato": "¿Desarrolla aquenios encajados en cúpula escamosa (bellota)?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🌰"
  },
  "hojaLobulada": {
    "text": {
      "primaria": "¿El borde de su hoja tiene curvas profundas (lóbulos)?",
      "eso": "¿El margen de la hoja presenta curvas pronunciadas?",
      "bachillerato": "¿Posee lámina foliar profundamente pinnatilobada o sinuada?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🍂"
  },
  "maderaBlancaAgua": {
    "text": {
      "primaria": "¿Tiene la corteza gris pálida y crece junto al agua?",
      "eso": "¿Presenta corteza clara y es propia de zonas de agua?",
      "bachillerato": "¿Posee corteza lisa blanca y es típica de bosque de galería?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "💧"
  },
  "hojasAsimetricas": {
    "text": {
      "primaria": "¿La base de su hoja es más larga de un lado que del otro?",
      "eso": "¿La base de la hoja es claramente asimétrica?",
      "bachillerato": "¿Presenta lámina foliar con asimetría basal evidente?"
    },
    "pictoId": 2256,
    "fallbackEmoji": "🍃"
  },
  "bayasMermelada": {
    "text": {
      "primaria": "¿Produce ramilletes muy juntos de bolitas oscuras (bayas)?",
      "eso": "¿Da infrutescencias formadas por diminutas bayas oscuras?",
      "bachillerato": "¿Desarrolla densos corimbos de pequeñas drupas violáceas?"
    },
    "pictoId": 30241,
    "fallbackEmoji": "🫐"
  },
  "florTuboDulce": {
    "text": {
      "primaria": "¿Sus flores tienen forma de tubo alargado?",
      "eso": "¿Tienen sus flores forma tubular estrecha?",
      "bachillerato": "¿Presenta corolas marcadamente tubulares zigomorfas?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🌸"
  },
  "florVisteria": {
    "text": {
      "primaria": "¿Sus flores tienen muchas capas de pétalos (rosas)?",
      "eso": "¿Sus flores disponen de numerosos pétalos solapados?",
      "bachillerato": "¿Manifiesta flores con estambres hipertrofiados petaloideos?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🌹"
  },
  "daMoras": {
    "text": {
      "primaria": "¿Da frutos formados por bolitas agrupadas (moras)?",
      "eso": "¿Produce frutos compuestos por pequeñas esferitas?",
      "bachillerato": "¿Desarrolla infrutescencias de tipo eterio con drupéolas negras?"
    },
    "pictoId": 30241,
    "fallbackEmoji": "🫐"
  },
  "espinasLargasCardo": {
    "text": {
      "primaria": "¿Su flor es redonda, seca y de color morado (cardo)?",
      "eso": "¿Remata su tallo espinoso en una cabezuela floral morada?",
      "bachillerato": "¿Presenta prominentes capítulos flosculosos púrpuras con brácteas duras?"
    },
    "pictoId": 39007,
    "fallbackEmoji": "🦔"
  },
  "hueleMenta": {
    "text": {
      "primaria": "¿Huele de forma muy parecida al chicle de menta?",
      "eso": "¿Desprende intenso olor mentolado al frotar sus hojas?",
      "bachillerato": "¿Exuda altos niveles de aceites esenciales ricos en mentol?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🌿"
  },
  "florMoradaEspigaJabon": {
    "text": {
      "primaria": "¿Sus pequeñas flores moradas forman grupitos en vertical (espiga)?",
      "eso": "¿Las flores moradas se agrupan en estrechas espigas altas?",
      "bachillerato": "¿Muestra densas espigas verticiladas de corolas purpúreas?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🪻"
  },
  "hojasHilosAnis": {
    "text": {
      "primaria": "¿Sus hojas parecen cabellos verdes muy finos y huelen a anís?",
      "eso": "¿Posee hojas extremadamente finas con olor anisado?",
      "bachillerato": "¿Presenta frondes multi-pinnatisectas finísimas ricas en anetol?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🌱"
  },
  "florManzanilla": {
    "text": {
      "primaria": "¿Da flores menores de 2 cm parecidas a margaritas?",
      "eso": "¿Produce diminutas flores tipo margarita de botón amarillo?",
      "bachillerato": "¿Genera reducidos capítulos estradiados con flósculos amarillos?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🌼"
  },
  "cocinarCarne": {
    "text": {
      "primaria": "¿Sus hojas parecen agujas y huelen muy bien (romero)?",
      "eso": "¿Son sus hojas lineares duras con el envés muy blanco?",
      "bachillerato": "¿Desarrolla denso follaje esclerófilo con tricomas glandulares alifáticos?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🥩"
  },
  "tomilloCaracteristico": {
    "text": {
      "primaria": "¿Sus hojas miden menos de medio centímetro agrupadas?",
      "eso": "¿Tiene hojas minúsculas (menores a 5 mm) en matas densas?",
      "bachillerato": "¿Es un subcaméfito densamente foliado por hojas simples menores a 5mm?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🌿"
  },
  "alfombraPiedras": {
    "text": {
      "primaria": "¿Crece pegado a rocas o troncos sin tener grandes raíces?",
      "eso": "¿Forma tapices sobre piedras o superficies sin generar troncos?",
      "bachillerato": "¿Trátase de briófitos formadores de densos tapices sobre sustrato duro?"
    },
    "pictoId": 3113,
    "fallbackEmoji": "🧽"
  },
  "hojaCorazon": {
    "text": {
      "primaria": "¿Cada de sus hojas está formada por 3 o 4 piececitas en forma de corazón?",
      "eso": "¿La hoja principal se divide en 3 foliolos en forma de corazón?",
      "bachillerato": "¿Muestra hojas característicamente trifoliadas con foliolos obcordados?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🍀"
  },
  "hojaFronde": {
    "text": {
      "primaria": "¿Sus hojas nuevas nacen enrolladas en forma de espiral?",
      "eso": "¿Las primeras hojas de los brotes se desarrollan enrolladas?",
      "bachillerato": "¿Presenta característica vernación circinada en el desarrollo de frondes jóvenes?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🌿"
  },
  "picaPiel": {
    "text": {
      "primaria": "¿Rozar sus hojas produce mucho picor u orticaria?",
      "eso": "¿Causa escozor rápido e inflamación cutánea si la tocas?",
      "bachillerato": "¿Posee numerosos tricomas urticantes secretores de histamina exógena epidérmica?"
    },
    "pictoId": 39007,
    "fallbackEmoji": "🔥"
  },
  "pareceOrtigaBlanca": {
    "text": {
      "primaria": "¿Tiene flores blancas pequeñas y su contacto NO causa picor?",
      "eso": "¿Desarrolla flores blancas de dos \"labios\", careciendo totalmente de pelos urticantes?",
      "bachillerato": "¿Trátase de dicotiledóneas inermes y de destacadas corolas bilabiadas blanquecinas?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🤍"
  },
  "florRojaPapel": {
    "text": {
      "primaria": "¿Su única flor tiene 4 pétalos rojos arrugados muy finos?",
      "eso": "¿Posee llamativas flores solitarias de 4 pétalos rojos frágiles?",
      "bachillerato": "¿Desarrolla flores tetrámeras de pétalos papiráceos efímeros pigmentados de rojo?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🌺"
  },
  "semillaAbuelo": {
    "text": {
      "primaria": "¿Sus semillas forman un globo de pelitos blancos (abuelo)?",
      "eso": "¿Desarrolla una esfera volátil completa de finos pelos blancos al semillar?",
      "bachillerato": "¿Los aquenios desarrollan extensos vilanos plumosos dispersos anemocoramente en globo?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🌬️"
  },
  "florMargarita": {
    "text": {
      "primaria": "¿Su flor mide más de 2 cm con el centro todo amarillo y pétalos blancos?",
      "eso": "¿Da flores clásicas mayores de 2 cm tipo margarita de extenso disco central?",
      "bachillerato": "¿Exhiba cabezuelas capítulos radiados superiores a 20 mm con lígulas blancas evidentes?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🌼"
  },
  "florAzulCeleste": {
    "text": {
      "primaria": "¿Tiene flores de un color azul clarito vivo o cielo vivo?",
      "eso": "¿Emite flores de forma deshilachada y brillante color azul celeste?",
      "bachillerato": "¿Elabora notables cabezuelas inflorescencias con presencia de lígulas cromáticas azul-cielo?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "💠"
  },
  "florAmarillaSinHojas": {
    "text": {
      "primaria": "¿Sus tallos verdes apenas tienen hojas y crecen como palos delgados?",
      "eso": "¿Es un matorral espeso con largas varas cilíndricas verdes casi carentes de hojas?",
      "bachillerato": "¿Biotipo consistente principalmente en brotes caulinares asimiladores de clorofila y hojas mermadas?"
    },
    "pictoId": 30241,
    "fallbackEmoji": "💛"
  },
  "hojasPringosas": {
    "text": {
      "primaria": "¿Tocar sus oscuras hojas te deja una sensación muy pegajosa (pringosa)?",
      "eso": "¿Exuda en gran abundancia una densa y perceptible capa de resina pegajosa foliar?",
      "bachillerato": "¿La epidermis presenta copiosa excreción resino-mucilaginosa de adherencia activa pronunciada?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🍯"
  },
  "florRosaMoradaAbanico": {
    "text": {
      "primaria": "¿Tiene hoja con bordes arrugados redondos parecida a un abanico verde?",
      "eso": "¿Ostenta láminas foliares achatadas redondas, similar a un abanico plegado?",
      "bachillerato": "¿Sus hojas poseen una morfología típicamente reniforme-orbicular o abiertamente palmatilobada?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "🌸"
  },
  "florVioletaRacimo": {
    "text": {
      "primaria": "¿Las flores violetas tienen distintos tamaños en sus 5 pétalos?",
      "eso": "¿Florece con pequeñas corolas irregulares de matiz violáceo y forma despareja?",
      "bachillerato": "¿Desarrolla estructuralismo de corolas netamente zigomorfas, dotadas típicamente de espolones lila?"
    },
    "pictoId": 3102,
    "fallbackEmoji": "💜"
  },
  "hojaAnchaNervios": {
    "text": {
      "primaria": "¿La hoja sale a ras del suelo y tiene rayas paralelas de base a punta muy gruesas?",
      "eso": "¿Sus hojas bajas achatadas exhiben gruesos y numerosos nervios rectos longitudinales prominentes?",
      "bachillerato": "¿Trátase de un fenotipo herbáceo acaule provisto fuertemente de patentes venaciones paralelinervias?"
    },
    "pictoId": 3143,
    "fallbackEmoji": "🍃"
  },

  // ============================
  // NIVEL 2B: Rama ANIMALES
  // ============================
  "tieneHuesos": {
    "text": {
      "primaria": "¿Es un animal grande con huesos por dentro (como un pájaro o un ratón)?",
      "eso": "¿Posee un esqueleto óseo interno (vertebrado)?",
      "bachillerato": "¿Se caracteriza por la presencia de columna vertebral endoesquelética?"
    },
    "pictoId": 24913,
    "fallbackEmoji": "🦴"
  },

  // ============================
  // NIVEL 3A: INVERTEBRADOS
  // ============================
  "vuela": {
    "text": {
      "primaria": "¿Tiene alas para volar por el aire?",
      "eso": "¿Posee alas funcionales para el vuelo?",
      "bachillerato": "¿Presenta apéndices alares funcionales para locomoción aerodinámica?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "✈️"
  },
  "alasGrandesColores": {
    "text": {
      "primaria": "¿Tiene las alas muy grandes y cubiertas de colores o dibujos (como si fueran de tela pintada)?",
      "eso": "¿Sus alas son grandes y están cubiertas de escamas con dibujos de colores?",
      "bachillerato": "¿Presenta alas de gran envergadura tapizadas de escamas lepidópteras pigmentadas?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🦋"
  },
  "cierraAlasLibro": {
    "text": {
      "primaria": "Cuando se posa a descansar, ¿cierra las alas hacia arriba juntándolas como un libro cerrado?",
      "eso": "¿Al posarse, pliega las alas verticalmente sobre el dorso?",
      "bachillerato": "¿En reposo, mantiene las alas en posición vertical adosadas dorsalmente (Rhopalocera)?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🦋"
  },
  "rayasAmarillasNegras": {
    "text": {
      "primaria": "¿Tiene el cuerpo pintado con rayas amarillas y negras?",
      "eso": "¿Presenta franjas alternantes amarillas y negras en el cuerpo?",
      "bachillerato": "¿Exhibe patrón aposemático con fascías amarillas y negras?"
    },
    "pictoId": 5406,
    "fallbackEmoji": "🐝"
  },
  "cuerpoGorditoPelitos": {
    "text": {
      "primaria": "¿Tiene el cuerpo gordito y cubierto de pelitos?",
      "eso": "¿Su cuerpo es robusto y densamente piloso?",
      "bachillerato": "¿Presenta un cuerpo compacto con densa cobertura de setas corporales (Apidae)?"
    },
    "pictoId": 31403,
    "fallbackEmoji": "🐝"
  },
  "cinturaLarguisimaHilo": {
    "text": {
      "primaria": "¿Tiene una \"cintura\" larguísima y muy fina (como un hilo) que separa su cuerpo?",
      "eso": "¿Posee un pecíolo abdominal extremadamente fino y alargado?",
      "bachillerato": "¿Presenta un pedicelo abdominal filiforme notablemente elongado (Eumeninae)?"
    },
    "pictoId": 6978,
    "fallbackEmoji": "🏺"
  },
  "cuerpoLargoPalito4Alas": {
    "text": {
      "primaria": "¿Tiene el cuerpo súper largo y fino (como un palito) y cuatro alas transparentes que parecen las de un helicóptero?",
      "eso": "¿Posee un cuerpo alargado con cuatro alas transparentes de tipo helicóptero?",
      "bachillerato": "¿Odonato de cuerpo estilizado con dos pares de alas membranosas no plegables?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🚁"
  },
  "patasLargasFinasTubito": {
    "text": {
      "primaria": "¿Tiene las patas muy largas y finas, y un \"tubito\" en la boca como una aguja para picar?",
      "eso": "¿Presenta patas filiformes y un aparato bucal tipo probóscide perforante?",
      "bachillerato": "¿Díptero culícido de patas filiformes y probóscide perforante-succionadora?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🦟"
  },
  "grandeAlasTransparentesTejado": {
    "text": {
      "primaria": "¿Es bastante grande (más que una moneda) y sus alas transparentes tapan su cuerpo como si fueran el tejado de una casa?",
      "eso": "¿Es un insecto grande cuyas alas transparentes cubren el cuerpo en forma de tejado?",
      "bachillerato": "¿Homóptero cigárido de tamaño notable con alas hialinas dispuestas tectiformemente?"
    },
    "pictoId": 37028,
    "fallbackEmoji": "🎶"
  },
  "verdeMetalicoBrilla": {
    "text": {
      "primaria": "¿Su cuerpo es de color verde y brilla muchísimo (como si estuviera hecho de metal)?",
      "eso": "¿Presenta coloración verde metálica iridiscente en todo el cuerpo?",
      "bachillerato": "¿Calliphoridae con intenso brillo estructural verde cromo metálico iridiscente?"
    },
    "pictoId": 5406,
    "fallbackEmoji": "✨"
  },
  "tienePatas": {
    "text": {
      "primaria": "¿Tiene patas para caminar?",
      "eso": "¿Posee extremidades articuladas para la locomoción?",
      "bachillerato": "¿Presenta apéndices locomotores articulados?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🐾"
  },
  "casitaDuraConcha": {
    "text": {
      "primaria": "¿Lleva una \"casita\" dura o concha en la espalda?",
      "eso": "¿Transporta una concha calcárea enrollada sobre el dorso?",
      "bachillerato": "¿Gasterópodo provisto de concha helicoidal calcificada externa?"
    },
    "pictoId": 25016,
    "fallbackEmoji": "🐌"
  },
  "largoBajoTierra": {
    "text": {
      "primaria": "¿Es largo y vive debajo de la tierra (como un fideo rosa)?",
      "eso": "¿Es un organismo vermiforme alargado que habita en la tierra?",
      "bachillerato": "¿Anélido oligoqueto edáfico de cuerpo cilíndrico segmentado?"
    },
    "pictoId": 2360,
    "fallbackEmoji": "🪱"
  },
  "muchasPatas": {
    "text": {
      "primaria": "¿Tiene muchísimas patas (parece un gusano con patas o se hace una bolita)?",
      "eso": "¿Posee numerosos pares de patas a lo largo de un cuerpo segmentado?",
      "bachillerato": "¿Miriápodo con metamerismo provisto de múltiples pares de apéndices locomotores?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🐛"
  },
  "seHaceBolita": {
    "text": {
      "primaria": "¿Se hace una bolita perfecta cuando tiene miedo o lo tocas?",
      "eso": "¿Es capaz de enrollarse formando una esfera defensiva?",
      "bachillerato": "¿Crustáceo isópodo terrestre con capacidad de conglobación esférica?"
    },
    "pictoId": 7498,
    "fallbackEmoji": "🪨"
  },
  "cuatroPatasPorAnillo": {
    "text": {
      "primaria": "¿Tiene 4 patas (dos a cada lado) en cada anillo de su cuerpo?",
      "eso": "¿Presenta dos pares de patas por segmento corporal?",
      "bachillerato": "¿Diplópodo con diplosomitos provistos de dos pares de apéndices cada uno?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🐛"
  },
  "ochoPatas": {
    "text": {
      "primaria": "¿Tiene exactamente 8 patas (como las arañas)?",
      "eso": "¿Presenta exactamente 4 pares de patas (8 en total)?",
      "bachillerato": "¿Arácnido con fórmula apendicular estricta de 4 pares de patas?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🕷️"
  },
  "cuerpoDosPartes": {
    "text": {
      "primaria": "¿Tiene el cuerpo dividido en dos partes (una cabeza y una barriga separadas)?",
      "eso": "¿Su cuerpo está claramente dividido en dos tagmas (cefalotórax y abdomen)?",
      "bachillerato": "¿Presenta tagmosis bipartita con prosoma y opistosoma claramente diferenciados?"
    },
    "pictoId": 25600,
    "fallbackEmoji": "🕷️"
  },
  "dibujoCruzBlanca": {
    "text": {
      "primaria": "¿Tiene un dibujo de una cruz blanca o puntos blancos en la espalda?",
      "eso": "¿Presenta un patrón en forma de cruz o manchas blancas en el abdomen?",
      "bachillerato": "¿Araneidae con maculación dorsal en forma de cruz leucocromática (Araneus diadematus)?"
    },
    "pictoId": 25600,
    "fallbackEmoji": "🕸️"
  },
  "rojoPuntosNegros": {
    "text": {
      "primaria": "¿Es de color rojo con puntos negros en la espalda?",
      "eso": "¿Presenta élitros rojos con puntos negros (mariquita)?",
      "bachillerato": "¿Coccinélido con élitros rojos maculados de puntos melánicos?"
    },
    "pictoId": 25016,
    "fallbackEmoji": "🐞"
  },
  "pinzasFinalCuerpo": {
    "text": {
      "primaria": "¿Tiene unas \"pinzas\" al final de su cuerpo (en la cola)?",
      "eso": "¿Posee cercos en forma de pinza al final del abdomen?",
      "bachillerato": "¿Dermáptero provisto de cercos abdominales terminales forcipulados?"
    },
    "pictoId": 34835,
    "fallbackEmoji": "✂️"
  },
  "patasTraserasLargas": {
    "text": {
      "primaria": "¿Tiene las patas de atrás mucho más largas que las demás (como si fueran muelles)?",
      "eso": "¿Sus patas posteriores están notablemente más desarrolladas para el salto?",
      "bachillerato": "¿Presenta metafémures hipertrofiados adaptados al salto (Orthoptera)?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🦘"
  },
  "verdeAlargado": {
    "text": {
      "primaria": "¿Es de color verde y tiene el cuerpo alargado?",
      "eso": "¿Presenta coloración verde críptica y cuerpo estilizado?",
      "bachillerato": "¿Ortóptero de coloración verde mimética isocrómico con la vegetación?"
    },
    "pictoId": 5406,
    "fallbackEmoji": "🦗"
  },
  "patasDelanteRezando": {
    "text": {
      "primaria": "¿Tiene las patas de delante muy largas y las dobla como si estuviera rezando?",
      "eso": "¿Posee patas delanteras raptoras plegadas en posición de plegaria?",
      "bachillerato": "¿Mantodea con patas protorácicas raptoras de tipo mantípodo?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🙏"
  },
  "cinturaFinaTresPartes": {
    "text": {
      "primaria": "¿Tiene una \"cintura\" muy fina que separa su cuerpo en tres partes?",
      "eso": "¿Presenta un pecíolo estrecho que separa claramente tórax y abdomen?",
      "bachillerato": "¿Himenóptero formícido con pecíolo constricto diferenciando tres tagmas?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🐜"
  },
  "caparazonDuroBrilla": {
    "text": {
      "primaria": "¿Tiene un caparazón duro en la espalda que brilla?",
      "eso": "¿Presenta élitros duros y brillantes cubriendo el abdomen?",
      "bachillerato": "¿Coleóptero con élitros esclerotizados de brillo especular?"
    },
    "pictoId": 25016,
    "fallbackEmoji": "🪲"
  },

  // ============================
  // NIVEL 3B: VERTEBRADOS
  // ============================
  "tienePlumasPico": {
    "text": {
      "primaria": "¿Tiene plumas y pico?",
      "eso": "¿Su cuerpo está cubierto de plumas y presenta un pico córneo?",
      "bachillerato": "¿Posee un cuerpo cubierto de plumas y mandíbulas revestidas por rhamphotheca?"
    },
    "pictoId": 6248,
    "fallbackEmoji": "🪶"
  },
  "1MetroPicoLargoBlaNeg": {
    "text": {
      "primaria": "¿Mide aproximadamente 1 metro de altura (como un niño), tiene el pico más largo que su cabeza y es de color blanco y negro?",
      "eso": "¿Es un ave zancuda de ~1 metro, con largo pico rojo y plumaje blanco y negro?",
      "bachillerato": "¿Ciconiforme de gran porte (~1m), plumaje pío y pico/tarsos elongados rojizos?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🦢"
  },
  "caraPlanaOjosGrandes": {
    "text": {
      "primaria": "¿Tiene la cara plana y redonda con ojos muy grandes que miran hacia adelante (como un búho)?",
      "eso": "¿Posee disco facial plano con ojos frontales de gran tamaño (rapaz nocturna)?",
      "bachillerato": "¿Estrigiforme con disco facial desarrollado y ojos frontales de gran diámetro?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🦉"
  },
  "caraBlancaCorazon": {
    "text": {
      "primaria": "¿Su cara es de color blanco y tiene forma de corazón?",
      "eso": "¿Presenta disco facial blanco cordiforme (lechuza)?",
      "bachillerato": "¿Tytonidae con disco facial cordiforme blanquecino sin penachos auriculares?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🦉"
  },
  "alas1MetroColaV": {
    "text": {
      "primaria": "¿Sus alas abiertas miden más de 1 metro de punta a punta y su cola termina con forma de \"V\" (como unas tijeras)?",
      "eso": "¿Gran rapaz diurna con envergadura >1m y cola ahorquillada?",
      "bachillerato": "¿Accipitriforme de gran envergadura con rectrices externas elongadas formando cola emarginada?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🦅"
  },
  "plumasNegrasBlaNeg": {
    "text": {
      "primaria": "¿Tiene las plumas casi todas negras, o pintadas solo de blanco y negro?",
      "eso": "¿Su plumaje es predominantemente negro o blanco y negro?",
      "bachillerato": "¿Presenta plumaje predominantemente melánico o pío (blanco-negro)?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦‍⬛"
  },
  "barrigaBlancaColaLarga": {
    "text": {
      "primaria": "¿Tiene la barriga blanca y una cola más larga que el resto de su cuerpo?",
      "eso": "¿Córvido de barriga blanca con cola más larga que el cuerpo (urraca)?",
      "bachillerato": "¿Pica pica con plumaje pío y rectrices caudales notablemente elongadas?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐧"
  },
  "grandeComoGallinaPicoGordo": {
    "text": {
      "primaria": "¿Es tan grande como una gallina y tiene el pico muy gordo y negro?",
      "eso": "¿Córvido de gran tamaño, similar a una gallina, con pico grueso y negro?",
      "bachillerato": "¿Corvus corax de gran porte con pico robusto y plumaje uniformemente melánico?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦‍⬛"
  },
  "picoNaranjaAmarillo": {
    "text": {
      "primaria": "¿Tiene el pico de color naranja o amarillo muy llamativo y no tiene manchas?",
      "eso": "¿Presenta pico de color naranja/amarillo sin manchas en el plumaje (mirlo)?",
      "bachillerato": "¿Túrdido melánico con pico y anillo ocular marcadamente amarillo-anaranjados?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦‍⬛"
  },
  "tamanoZapato": {
    "text": {
      "primaria": "¿Tiene casi el mismo tamaño que el zapato de un adulto (unos 30 centímetros)?",
      "eso": "¿Tiene un tamaño medio, comparable a un zapato de adulto?",
      "bachillerato": "¿Ave de tamaño medio (~25-35cm), significativamente mayor que un paseriforme común?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🕊️"
  },
  "rayaNegraCollar": {
    "text": {
      "primaria": "¿Tiene una raya negra en el cuello como si llevara un collar puesto?",
      "eso": "¿Presenta un collar melánico en la nuca (tórtola)?",
      "bachillerato": "¿Columbídeo con semianillo nucal melánico distintivo (Streptopelia)?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🕊️"
  },
  "colaDosPuntasManchaRoja": {
    "text": {
      "primaria": "¿Su cola termina en dos puntas muy largas (como un tenedor) y tiene una mancha de color rojo oscuro debajo del pico?",
      "eso": "¿Presenta cola profundamente ahorquillada y garganta rojiza (golondrina)?",
      "bachillerato": "¿Hirundínido con rectrices externas muy elongadas y garganta de color castaño-rojizo?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦"
  },
  "manchaBlancaEspalda": {
    "text": {
      "primaria": "¿Tiene una mancha muy blanca en la espalda, justo por encima de la cola?",
      "eso": "¿Presenta obispillo blanco destacado sobre el dorso (avión común)?",
      "bachillerato": "¿Hirundínido con obispillo leucocromático y región ventral blanca uniforme?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦"
  },
  "manchaNaranjaPecho": {
    "text": {
      "primaria": "¿Tiene una mancha de color naranja muy brillante en el pecho y la cara?",
      "eso": "¿Presenta amplia placa naranja en pecho y cara (petirrojo)?",
      "bachillerato": "¿Erithacus rubecula con placa pectoral-facial anaranjada-rojiza inconfundible?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦"
  },
  "barrigaAmarilloBrillante": {
    "text": {
      "primaria": "¿Tiene la barriga entera de color amarillo brillante?",
      "eso": "¿Presenta toda la región ventral de color amarillo vivo?",
      "bachillerato": "¿Párido con región ventral uniformemente xántica (amarillo brillante)?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦"
  },
  "rayaNegraBarrigaCorbata": {
    "text": {
      "primaria": "¿Tiene una raya negra que le cruza la barriga amarilla de arriba a abajo (como una corbata)?",
      "eso": "¿Presenta línea melánica vertical cruzando la barriga amarilla (carbonero)?",
      "bachillerato": "¿Parus major con banda ventral melánica longitudinal sobre fondo xántico?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🐦"
  },
  "tienePelo": {
    "text": {
      "primaria": "¿Tiene el cuerpo cubierto de pelo?",
      "eso": "¿Su cuerpo está recubierto de pelo (mamífero)?",
      "bachillerato": "¿Presenta el cuerpo recubierto de folículos pilosos (mamífero)?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🐻"
  },
  "alasPielVuela": {
    "text": {
      "primaria": "¿Tiene alas hechas de piel y puede volar por el aire?",
      "eso": "¿Posee alas membranosas formadas por piel para el vuelo (quiróptero)?",
      "bachillerato": "¿Chiroptera con patagio membranoso interdigital para vuelo activo?"
    },
    "pictoId": 6246,
    "fallbackEmoji": "🦇"
  },
  "espaldaPinchosDuros": {
    "text": {
      "primaria": "¿Tiene la espalda cubierta de pinchos muy duros en lugar de pelo suave?",
      "eso": "¿Su dorso está cubierto de púas rígidas en lugar de pelo?",
      "bachillerato": "¿Erinaceidae con dorso cubierto de espinas queratinizadas rígidas?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🦔"
  },
  "muyGrandePezunas": {
    "text": {
      "primaria": "¿Es muy grande (más alto que tu cintura) y tiene pezuñas duras en los pies?",
      "eso": "¿Mamífero de gran tamaño con pezuñas y aspecto cervino?",
      "bachillerato": "¿Artiodáctilo cérvido de porte mediano con pezuñas bisulcas?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🦌"
  },
  "tamanoPerroColaPeluda": {
    "text": {
      "primaria": "¿Tiene el tamaño de un perro mediano y una cola peluda más gorda que su propio cuerpo?",
      "eso": "¿Mamífero tamaño perro con cola peluda muy voluminosa (zorro)?",
      "bachillerato": "¿Vulpes vulpes con cola densamente pilosa de gran volumen proporcional?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🦊"
  },
  "orejasLargas": {
    "text": {
      "primaria": "¿Tiene unas orejas muy largas (más largas que su cabeza) y da saltos muy grandes?",
      "eso": "¿Presenta orejas notablemente más largas que la cabeza y locomoción saltatorial?",
      "bachillerato": "¿Lagomorfo con pabellones auriculares elongados superiores a la longitud craneal?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🐰"
  },
  "manchaNegraOrejas": {
    "text": {
      "primaria": "¿Tiene una mancha negra en la punta de las orejas y es casi tan grande como un gato?",
      "eso": "¿Presenta manchas apicales negras en las orejas y tamaño similar a un gato (liebre)?",
      "bachillerato": "¿Lepus con mechas apicales melánicas en pabellones auriculares y mayor porte que Oryctolagus?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🐇"
  },
  "colaLargaCuerpo": {
    "text": {
      "primaria": "¿Tiene una cola finita que es más larga que todo su propio cuerpo?",
      "eso": "¿Presenta una cola fina más larga que el propio cuerpo (ratón)?",
      "bachillerato": "¿Múrido con cola caudal proporcionalmente más larga que la longitud corporal?"
    },
    "pictoId": 7281,
    "fallbackEmoji": "🐭"
  },
  "tiene4Patas": {
    "text": {
      "primaria": "¿Tiene 4 patas para caminar o saltar?",
      "eso": "¿Es un tetrápodo con cuatro extremidades?",
      "bachillerato": "¿Tetrápodo con cuatro extremidades quiridias funcionales?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🦎"
  },
  "pielEscamasSecas": {
    "text": {
      "primaria": "¿Tiene la piel cubierta de escamas secas?",
      "eso": "¿Presenta la piel recubierta de escamas córneas secas (reptil)?",
      "bachillerato": "¿Saurópsido con tegumento cubierto de escamas queratinizadas no mucosas?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🦎"
  },
  "manchasAzulCostados": {
    "text": {
      "primaria": "¿Tiene unas manchas redondas de color azul brillante en los costados (los lados de la barriga)?",
      "eso": "¿Presenta ocelos azules brillantes en los flancos (lagarto ocelado)?",
      "bachillerato": "¿Timon lepidus con ocelos laterales azul-cian diagnósticos en los flancos?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🦎"
  },
  "pielBultitosVerrugas": {
    "text": {
      "primaria": "¿Tiene la piel llena de bultitos (como verrugas) y sus patas de atrás son muy cortas?",
      "eso": "¿Presenta piel verrugosa y patas traseras cortas (sapo)?",
      "bachillerato": "¿Bufónido con glándulas parotídeas prominentes y miembros posteriores relativamente cortos?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🐸"
  },
  "dibujoEscaleraEspalda": {
    "text": {
      "primaria": "¿Tiene dibujadas dos rayas oscuras paralelas (o una forma de escalera) a lo largo de toda su espalda?",
      "eso": "¿Presenta patrón dorsal en forma de dos líneas paralelas o escalera (culebra de escalera)?",
      "bachillerato": "¿Zamenis scalaris con diseño dorsal diagnóstico de bandas paralelas o patrón escaleriforme?"
    },
    "pictoId": 8666,
    "fallbackEmoji": "🐍"
  }
};

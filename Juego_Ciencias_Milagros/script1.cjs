const fs = require('fs');

const traits = [
    'esPlanta', 'esArbolAlto', 'esTrepadora', 'tienePinchos', 'esAromatica', 'esPequenaSuelo',
    // Arboles
    'hojaAguja', 'daPinones', 'daHigos', 'daAlmendras', 'daBellotas', 'hojaLobulada', 'maderaBlancaAgua', 'hojasAsimetricas', 'bayasMermelada',
    // Trepadoras
    'florTuboDulce',
    // Pinchos
    'florVisteria', 'daMoras', 'espinasLargasCardo',
    // Aromaticas
    'hueleMenta', 'florMoradaEspigaJabon', 'hojasHilosAnis', 'florManzanilla', 'cocinarCarne', 'tomilloCaracteristico',
    // Pequeñas suelo
    'alfombraPiedras', 'hojaCorazon', 'hojaFronde',
    // Flores / hierbas altas
    'picaPiel', 'pareceOrtigaBlanca', 'florRojaPapel', 'semillaAbuelo', 'florMargarita', 'florAzulCeleste', 'florAmarillaSinHojas', 'hojasPringosas', 'florRosaMoradaAbanico', 'florVioletaRacimo', 'hojaAnchaNervios',

    // Animales (esPlanta = false)
    'tieneHuesos', 'vuela', 'tienePatas', 'muchasPatas', 'ochoPatas', 'seisPatas', 'tienePlumasPico', 'tienePelo', 'tiene4Patas',
    // Voladores
    'alasMuyGrandesBonitas', 'blanca', 'amarilla', 'saleNoche', 'comeRopa', 'haceMiel', 'rayasAvispa', 'nidoBarro', 'chupaSangrePita', 'cuerpoHelicopteroCazaAgua', 'cantaVerano', 'verdeMetalicoAcudeCaca',
    // Sin patas
    'conchaEspiral', 'rastroBaba',
    // >8 Patas
    'seHaceBolita', 'correRapidoPinzas',
    // 8 Patas
    'parasitoSangre', 'telaranaCruz',
    // 6 Patas no voladoras
    'patasTraserasSaltarinas', 'cantaNocheOscuro', 'pulgaChupaSangre', 'verdeHierbaAlta', 'caparazonDuroDorso', 'rojaPuntosNegros', 'ruedaEstiercol', 'verdeEsmeraldaFlores', 'cuernoRinoceronte', 'hormigueroFila', 'rojaPica', 'negraPequenita', 'patasRezar', 'formaEscudoHueleMal', 'pinzasTijeraCola',
    // Aves
    'rapazNocturna', 'caraBlancaFantasma', 'rapazDiurnaV', 'ciguenaCampanario', 'urracaRobabrillos', 'palomaCiudad', 'tortolaCollar', 'cuervoNegro', 'mirloPicoNaranja', 'estorninoEstrellitas', 'nidoTejadoBaberoRojo', 'culoBlancoVuelo', 'gorrionRechoncho', 'pechoLlamaRoja', 'franjaNegraPecho', 'gorraAzulCabeza',
    // Mamíferos
    'vuelaBocaAbajo', 'pinchosEspalda', 'colaGiganteZorro', 'pareceCiervoPequeno', 'orejasLargasMadriguera', 'orejasMuyLargasCorreCorto', 'ratonCiegoTierra',
    // Anfibios / Reptiles 4 patas
    'cuerpoHumedoSalta', 'pielVerrugosaCamina', 'granDinosaurioVerde', 'pequenoParedSeltaCola',
    // Reptiles sin patas
    'culebraLevantaSisea', 'culebraDibujaEscalera'
];

// Helper to easily define a species with a single specific trait string
let currentId = 1;
function S(prefix, name, cat, level, query, traitObj) {
    let finalTraits = { ...traitObj };
    // the core branch logic defined by user
    return `{ id: "${prefix}${currentId++}", name: "${name}", category: "${cat}", trophicLevel: "${level}", wikiQuery: "${query}", traits: ${JSON.stringify(finalTraits)} }`;
}

// User specified EXACT branches:
// esPlanta = true -> esArbolAlto, esTrepadora, tienePinchos, esAromatica, esPequenaSuelo

const plants = [
    S('p', 'Encina', 'Planta', 'Productor', 'Quercus ilex', { esPlanta: true, esArbolAlto: true, daBellotas: true, hojaLobulada: false }),
    S('p', 'Pino piñonero', 'Planta', 'Productor', 'Pinus pinea', { esPlanta: true, esArbolAlto: true, hojaAguja: true, daPinones: true }),
    S('p', 'Pino carrasco', 'Planta', 'Productor', 'Pinus halepensis', { esPlanta: true, esArbolAlto: true, hojaAguja: true, daPinones: false }),
    S('p', 'Roble', 'Planta', 'Productor', 'Quercus robur', { esPlanta: true, esArbolAlto: true, daBellotas: true, hojaLobulada: true }),
    S('p', 'Chopo', 'Planta', 'Productor', 'Populus', { esPlanta: true, esArbolAlto: true, maderaBlancaAgua: true }),
    S('p', 'Olmo', 'Planta', 'Productor', 'Ulmus', { esPlanta: true, esArbolAlto: true, hojasAsimetricas: true }),
    S('p', 'Higuera', 'Planta', 'Productor', 'Ficus carica', { esPlanta: true, esArbolAlto: true, daHigos: true }),
    S('p', 'Almendro', 'Planta', 'Productor', 'Prunus dulcis', { esPlanta: true, esArbolAlto: true, daAlmendras: true }),
    S('p', 'Sauco', 'Planta', 'Productor', 'Sambucus nigra', { esPlanta: true, esArbolAlto: true, bayasMermelada: true }),

    S('p', 'Hiedra', 'Planta', 'Productor', 'Hedera helix', { esPlanta: true, esArbolAlto: false, esTrepadora: true, florTuboDulce: false }),
    S('p', 'Madreselva', 'Planta', 'Productor', 'Lonicera', { esPlanta: true, esArbolAlto: false, esTrepadora: true, florTuboDulce: true }),

    S('p', 'Rosal', 'Planta', 'Productor', 'Rosa', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: true, florVisteria: true }),
    S('p', 'Zarza', 'Planta', 'Productor', 'Rubus ulmifolius', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: true, daMoras: true }),
    S('p', 'Cardo', 'Planta', 'Productor', 'Cynara cardunculus', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: true, espinasLargasCardo: true }),

    S('p', 'Tomillo', 'Planta', 'Productor', 'Thymus', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: true, tomilloCaracteristico: true }),
    S('p', 'Romero', 'Planta', 'Productor', 'Salvia rosmarinus', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: true, cocinarCarne: true }),
    S('p', 'Lavanda', 'Planta', 'Productor', 'Lavandula', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: true, florMoradaEspigaJabon: true }),
    S('p', 'Menta silvestre', 'Planta', 'Productor', 'Mentha longifolia', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: true, hueleMenta: true }),
    S('p', 'Hinojo silvestre', 'Planta', 'Productor', 'Foeniculum vulgare', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: true, hojasHilosAnis: true }),
    S('p', 'Manzanilla', 'Planta', 'Productor', 'Chamaemelum nobile', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: true, florManzanilla: true }),

    S('p', 'Musgo', 'Planta', 'Productor', 'Bryophyta', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: true, alfombraPiedras: true }),
    S('p', 'Hierba común', 'Planta', 'Productor', 'Poaceae', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: true, alfombraPiedras: false, hojaCorazon: false, hojaFronde: false }), // generic small
    S('p', 'Trébol', 'Planta', 'Productor', 'Trifolium', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: true, hojaCorazon: true }),
    S('p', 'Helecho', 'Planta', 'Productor', 'Polypodiopsida', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: true, hojaFronde: true }),

    S('p', 'Diente de león', 'Planta', 'Productor', 'Taraxacum officinale', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, semillaAbuelo: true }),
    S('p', 'Amapola', 'Planta', 'Productor', 'Papaver rhoeas', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, florRojaPapel: true }),
    S('p', 'Margarita', 'Planta', 'Productor', 'Bellis perennis', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, florMargarita: true }),
    S('p', 'Ortiga', 'Planta', 'Productor', 'Urtica dioica', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, picaPiel: true }),
    S('p', 'Malva', 'Planta', 'Productor', 'Malva sylvestris', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, florRosaMoradaAbanico: true }),
    S('p', 'Verbena', 'Planta', 'Productor', 'Verbena officinalis', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, florVioletaRacimo: true }),
    S('p', 'Llantén', 'Planta', 'Productor', 'Plantago major', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, hojaAnchaNervios: true }),
    S('p', 'Ortiga blanca', 'Planta', 'Productor', 'Lamium album', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, pareceOrtigaBlanca: true }),
    S('p', 'Achicoria', 'Planta', 'Productor', 'Cichorium intybus', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, florAzulCeleste: true }),
    S('p', 'Jara', 'Planta', 'Productor', 'Cistus', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, hojasPringosas: true }),
    S('p', 'Retama', 'Planta', 'Productor', 'Retama sphaerocarpa', { esPlanta: true, esArbolAlto: false, esTrepadora: false, tienePinchos: false, esAromatica: false, esPequenaSuelo: false, florAmarillaSinHojas: true }),
];

currentId = 1;
const inverts = [
    S('i', 'Abeja', 'Invertebrado', 'Consumidor Primario', 'Anthophila', { esPlanta: false, tieneHuesos: false, vuela: true, haceMiel: true }),
    S('i', 'Avispa', 'Invertebrado', 'Consumidor Secundario', 'Vespidae', { esPlanta: false, tieneHuesos: false, vuela: true, rayasAvispa: true, nidoBarro: false }),
    S('i', 'Mosca', 'Invertebrado', 'Descomponedor', 'Musca domestica', { esPlanta: false, tieneHuesos: false, vuela: true }), // generic
    S('i', 'Mosquito', 'Invertebrado', 'Consumidor Primario', 'Culicidae', { esPlanta: false, tieneHuesos: false, vuela: true, chupaSangrePita: true }),
    S('i', 'Mariposa blanca', 'Invertebrado', 'Consumidor Primario', 'Pieris rapae', { esPlanta: false, tieneHuesos: false, vuela: true, alasMuyGrandesBonitas: true, blanca: true }),
    S('i', 'Mariposa amarilla', 'Invertebrado', 'Consumidor Primario', 'Colias croceus', { esPlanta: false, tieneHuesos: false, vuela: true, alasMuyGrandesBonitas: true, amarilla: true }),
    S('i', 'Mariposa nocturna', 'Invertebrado', 'Consumidor Primario', 'Noctuidae', { esPlanta: false, tieneHuesos: false, vuela: true, alasMuyGrandesBonitas: true, blanca: false, amarilla: false, saleNoche: true, comeRopa: false }),
    S('i', 'Polilla', 'Invertebrado', 'Consumidor Primario', 'Heterocera', { esPlanta: false, tieneHuesos: false, vuela: true, alasMuyGrandesBonitas: true, blanca: false, amarilla: false, saleNoche: true, comeRopa: true }),
    S('i', 'Libélula', 'Invertebrado', 'Consumidor Secundario', 'Anisoptera', { esPlanta: false, tieneHuesos: false, vuela: true, cuerpoHelicopteroCazaAgua: true }),
    S('i', 'Cigarra', 'Invertebrado', 'Consumidor Primario', 'Cicadidae', { esPlanta: false, tieneHuesos: false, vuela: true, cantaVerano: true }),
    S('i', 'Mosca verde', 'Invertebrado', 'Descomponedor', 'Lucilia sericata', { esPlanta: false, tieneHuesos: false, vuela: true, verdeMetalicoAcudeCaca: true }),
    S('i', 'Avispa alfarera', 'Invertebrado', 'Consumidor Secundario', 'Eumeninae', { esPlanta: false, tieneHuesos: false, vuela: true, rayasAvispa: true, nidoBarro: true }),

    S('i', 'Caracol', 'Invertebrado', 'Consumidor Primario', 'Helix aspersa', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: false, conchaEspiral: true }),
    S('i', 'Babosa', 'Invertebrado', 'Consumidor Primario', 'Deroceras reticulatum', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: false, conchaEspiral: false, rastroBaba: true }),
    S('i', 'Lombriz de tierra', 'Invertebrado', 'Descomponedor', 'Lumbricidae', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: false, conchaEspiral: false, rastroBaba: false }),

    S('i', 'Cochinilla de la humedad', 'Invertebrado', 'Descomponedor', 'Oniscidea', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: true, seHaceBolita: true }),
    S('i', 'Milpiés', 'Invertebrado', 'Descomponedor', 'Diplopoda', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: true, seHaceBolita: false, correRapidoPinzas: false }),
    S('i', 'Ciempiés', 'Invertebrado', 'Consumidor Secundario', 'Chilopoda', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: true, seHaceBolita: false, correRapidoPinzas: true }),

    S('i', 'Araña', 'Invertebrado', 'Consumidor Secundario', 'Araneae', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: true, parasitoSangre: false, telaranaCruz: false }),
    S('i', 'Araña de jardín', 'Invertebrado', 'Consumidor Secundario', 'Araneus diadematus', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: true, parasitoSangre: false, telaranaCruz: true }),
    S('i', 'Garrapata', 'Invertebrado', 'Consumidor Secundario', 'Ixodoidea', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: true, parasitoSangre: true }),

    S('i', 'Hormiga', 'Invertebrado', 'Consumidor Primario', 'Formicidae', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, hormigueroFila: true, rojaPica: false, negraPequenita: false }), // generic
    S('i', 'Hormiga roja', 'Invertebrado', 'Consumidor Primario', 'Solenopsis', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, hormigueroFila: true, rojaPica: true }),
    S('i', 'Hormiga negra', 'Invertebrado', 'Consumidor Primario', 'Lasius niger', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, hormigueroFila: true, rojaPica: false, negraPequenita: true }),
    S('i', 'Mariquita', 'Invertebrado', 'Consumidor Secundario', 'Coccinellidae', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, caparazonDuroDorso: true, rojaPuntosNegros: true }),
    S('i', 'Saltamontes', 'Invertebrado', 'Consumidor Primario', 'Caelifera', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, patasTraserasSaltarinas: true, verdeHierbaAlta: true }),
    S('i', 'Grillo', 'Invertebrado', 'Consumidor Primario', 'Gryllidae', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, patasTraserasSaltarinas: true, verdeHierbaAlta: false, cantaNocheOscuro: true }),
    S('i', 'Escarabajo', 'Invertebrado', 'Consumidor Primario', 'Coleoptera', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, caparazonDuroDorso: true, rojaPuntosNegros: false, ruedaEstiercol: false, verdeEsmeraldaFlores: false, cuernoRinoceronte: false }),
    S('i', 'Escarabajo pelotero', 'Invertebrado', 'Descomponedor', 'Scarabaeidae', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, caparazonDuroDorso: true, rojaPuntosNegros: false, ruedaEstiercol: true }),
    S('i', 'Escarabajo verde', 'Invertebrado', 'Consumidor Primario', 'Cetonia aurata', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, caparazonDuroDorso: true, verdeEsmeraldaFlores: true }),
    S('i', 'Escarabajo rinoceronte', 'Invertebrado', 'Consumidor Primario', 'Oryctes nasicornis', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, caparazonDuroDorso: true, cuernoRinoceronte: true }),
    S('i', 'Mantis religiosa', 'Invertebrado', 'Consumidor Secundario', 'Mantis religiosa', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, patasRezar: true }),
    S('i', 'Chinche', 'Invertebrado', 'Consumidor Primario', 'Hemiptera', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, formaEscudoHueleMal: true }),
    S('i', 'Tijereta', 'Invertebrado', 'Descomponedor', 'Dermaptera', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, pinzasTijeraCola: true }),
    S('i', 'Pulga', 'Invertebrado', 'Consumidor Secundario', 'Siphonaptera', { esPlanta: false, tieneHuesos: false, vuela: false, tienePatas: true, muchasPatas: false, ochoPatas: false, patasTraserasSaltarinas: true, pulgaChupaSangre: true }),
];

currentId = 1;
const verts = [
    S('v', 'Gorrión común', 'Vertebrado', 'Consumidor Primario', 'Passer domesticus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, gorrionRechoncho: true }),
    S('v', 'Paloma', 'Vertebrado', 'Consumidor Primario', 'Columba livia', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, palomaCiudad: true }),
    S('v', 'Tórtola', 'Vertebrado', 'Consumidor Primario', 'Streptopelia', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, tortolaCollar: true }),
    S('v', 'Urraca', 'Vertebrado', 'Consumidor Secundario', 'Pica pica', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, urracaRobabrillos: true }),
    S('v', 'Cuervo', 'Vertebrado', 'Consumidor Secundario', 'Corvus corax', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, cuervoNegro: true }),
    S('v', 'Mirlo', 'Vertebrado', 'Consumidor Primario', 'Turdus merula', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, mirloPicoNaranja: true }),
    S('v', 'Estornino', 'Vertebrado', 'Consumidor Primario', 'Sturnus vulgaris', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, estorninoEstrellitas: true }),
    S('v', 'Golondrina', 'Vertebrado', 'Consumidor Secundario', 'Hirundo rustica', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, nidoTejadoBaberoRojo: true }),
    S('v', 'Avión común', 'Vertebrado', 'Consumidor Secundario', 'Delichon urbicum', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, culoBlancoVuelo: true }),
    S('v', 'Petirrojo', 'Vertebrado', 'Consumidor Secundario', 'Erithacus rubecula', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, pechoLlamaRoja: true }),
    S('v', 'Carbonero', 'Vertebrado', 'Consumidor Secundario', 'Parus major', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, franjaNegraPecho: true }),
    S('v', 'Herrerillo', 'Vertebrado', 'Consumidor Secundario', 'Cyanistes caeruleus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, gorraAzulCabeza: true }),
    S('v', 'Mochuelo', 'Vertebrado', 'Consumidor Terciario', 'Athene noctua', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, rapazNocturna: true, caraBlancaFantasma: false }),
    S('v', 'Lechuza', 'Vertebrado', 'Consumidor Terciario', 'Tyto alba', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, rapazNocturna: true, caraBlancaFantasma: true }),
    S('v', 'Cigüeña blanca', 'Vertebrado', 'Consumidor Terciario', 'Ciconia ciconia', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, ciguenaCampanario: true }),
    S('v', 'Milano real', 'Vertebrado', 'Consumidor Terciario', 'Milvus milvus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: true, rapazDiurnaV: true }),

    S('v', 'Ratón de campo', 'Vertebrado', 'Consumidor Primario', 'Apodemus sylvaticus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, ratonOjosGrandes: true }),
    S('v', 'Topillo', 'Vertebrado', 'Consumidor Primario', 'Microtus arvalis', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, ratonCiegoTierra: true }),
    S('v', 'Erizo', 'Vertebrado', 'Consumidor Secundario', 'Erinaceus europaeus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, pinchosEspalda: true }),
    S('v', 'Conejo', 'Vertebrado', 'Consumidor Primario', 'Oryctolagus cuniculus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, orejasLargasMadriguera: true }),
    S('v', 'Liebre', 'Vertebrado', 'Consumidor Primario', 'Lepus granatensis', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, orejasMuyLargasCorreCorto: true }),
    S('v', 'Zorro', 'Vertebrado', 'Consumidor Terciario', 'Vulpes vulpes', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, colaGiganteZorro: true }),
    S('v', 'Corzo', 'Vertebrado', 'Consumidor Primario', 'Capreolus capreolus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, pareceCiervoPequeno: true }),
    S('v', 'Murciélago', 'Vertebrado', 'Consumidor Secundario', 'Chiroptera', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: true, vuelaBocaAbajo: true }),

    S('v', 'Lagartija', 'Vertebrado', 'Consumidor Secundario', 'Podarcis hispanica', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: false, tiene4Patas: true, pequenoParedSeltaCola: true }),
    S('v', 'Lagarto ocelado', 'Vertebrado', 'Consumidor Secundario', 'Timon lepidus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: false, tiene4Patas: true, granDinosaurioVerde: true }),
    S('v', 'Rana', 'Vertebrado', 'Consumidor Secundario', 'Pelophylax perezi', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: false, tiene4Patas: true, cuerpoHumedoSalta: true }),
    S('v', 'Sapo', 'Vertebrado', 'Consumidor Secundario', 'Bufo bufo', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: false, tiene4Patas: true, pielVerrugosaCamina: true }),

    S('v', 'Culebra de escalera', 'Vertebrado', 'Consumidor Terciario', 'Zamenis scalaris', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: false, tiene4Patas: false, culebraDibujaEscalera: true }),
    S('v', 'Culebra bastarda', 'Vertebrado', 'Consumidor Terciario', 'Malpolon monspessulanus', { esPlanta: false, tieneHuesos: true, tienePlumasPico: false, tienePelo: false, tiene4Patas: false, culebraLevantaSisea: true }),
];

// Verify we have 100 species
const all = [...plants, ...inverts, ...verts];

const tsOutput = `export type Category = "Planta" | "Invertebrado" | "Vertebrado";
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

// Return 100 species for EVERY difficulty as requested by the user
export function getSpeciesForDifficulty(difficulty: Difficulty): Species[] {
    return SPECIES_DB;
}

export const SPECIES_DB: Species[] = [\n    ${all.join(',\n    ')}\n];
`;

fs.writeFileSync('C:\\Users\\VALIMANA\\Desktop\\Proyectos\\Tico.AI\\Juego_Ciencias_Milagros\\src\\data\\species.ts', tsOutput);
console.log('Done species');

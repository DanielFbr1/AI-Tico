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

// Return 100 species for EVERY difficulty as requested by the user
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSpeciesForDifficulty(_difficulty: Difficulty): Species[] {
    return SPECIES_DB;
}

export const SPECIES_DB: Species[] = [
    // ===========================
    // PLANTAS (35 especies) — Traits sin cambios
    // ===========================
    { id: "p1", name: "Encina", category: "Planta", trophicLevel: "Productor", wikiQuery: "Quercus ilex", traits: { "esPlanta": true, "esArbolAlto": true, "daBellotas": true, "hojaLobulada": false } },
    { id: "p2", name: "Pino piñonero", category: "Planta", trophicLevel: "Productor", wikiQuery: "Pinus pinea", traits: { "esPlanta": true, "esArbolAlto": true, "hojaAguja": true, "daPinones": true } },
    { id: "p3", name: "Pino carrasco", category: "Planta", trophicLevel: "Productor", wikiQuery: "Pinus halepensis", traits: { "esPlanta": true, "esArbolAlto": true, "hojaAguja": true, "daPinones": false } },
    { id: "p4", name: "Roble", category: "Planta", trophicLevel: "Productor", wikiQuery: "Quercus robur", traits: { "esPlanta": true, "esArbolAlto": true, "daBellotas": true, "hojaLobulada": true } },
    { id: "p5", name: "Chopo", category: "Planta", trophicLevel: "Productor", wikiQuery: "Populus", traits: { "esPlanta": true, "esArbolAlto": true, "maderaBlancaAgua": true } },
    { id: "p6", name: "Olmo", category: "Planta", trophicLevel: "Productor", wikiQuery: "Ulmus", traits: { "esPlanta": true, "esArbolAlto": true, "hojasAsimetricas": true } },
    { id: "p7", name: "Higuera", category: "Planta", trophicLevel: "Productor", wikiQuery: "Ficus carica", traits: { "esPlanta": true, "esArbolAlto": true, "daHigos": true } },
    { id: "p8", name: "Almendro", category: "Planta", trophicLevel: "Productor", wikiQuery: "Prunus dulcis", traits: { "esPlanta": true, "esArbolAlto": true, "daAlmendras": true } },
    { id: "p9", name: "Sauco", category: "Planta", trophicLevel: "Productor", wikiQuery: "Sambucus nigra", traits: { "esPlanta": true, "esArbolAlto": true, "bayasMermelada": true } },
    { id: "p10", name: "Hiedra", category: "Planta", trophicLevel: "Productor", wikiQuery: "Hedera helix", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": true, "florTuboDulce": false } },
    { id: "p11", name: "Madreselva", category: "Planta", trophicLevel: "Productor", wikiQuery: "Lonicera", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": true, "florTuboDulce": true } },
    { id: "p12", name: "Rosal", category: "Planta", trophicLevel: "Productor", wikiQuery: "Rosa", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": true, "florVisteria": true } },
    { id: "p13", name: "Zarza", category: "Planta", trophicLevel: "Productor", wikiQuery: "Rubus ulmifolius", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": true, "daMoras": true } },
    { id: "p14", name: "Cardo", category: "Planta", trophicLevel: "Productor", wikiQuery: "Cynara cardunculus", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": true, "espinasLargasCardo": true } },
    { id: "p15", name: "Tomillo", category: "Planta", trophicLevel: "Productor", wikiQuery: "Thymus", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": true, "tomilloCaracteristico": true } },
    { id: "p16", name: "Romero", category: "Planta", trophicLevel: "Productor", wikiQuery: "Salvia rosmarinus", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": true, "cocinarCarne": true } },
    { id: "p17", name: "Lavanda", category: "Planta", trophicLevel: "Productor", wikiQuery: "Lavandula", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": true, "florMoradaEspigaJabon": true } },
    { id: "p18", name: "Menta silvestre", category: "Planta", trophicLevel: "Productor", wikiQuery: "Mentha longifolia", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": true, "hueleMenta": true } },
    { id: "p19", name: "Hinojo silvestre", category: "Planta", trophicLevel: "Productor", wikiQuery: "Foeniculum vulgare", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": true, "hojasHilosAnis": true } },
    { id: "p20", name: "Manzanilla", category: "Planta", trophicLevel: "Productor", wikiQuery: "Chamaemelum nobile", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": true, "florManzanilla": true } },
    { id: "p21", name: "Musgo", category: "Planta", trophicLevel: "Productor", wikiQuery: "Bryophyta", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": true, "alfombraPiedras": true } },
    { id: "p22", name: "Hierba común", category: "Planta", trophicLevel: "Productor", wikiQuery: "Poaceae", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": true, "alfombraPiedras": false, "hojaCorazon": false, "hojaFronde": false } },
    { id: "p23", name: "Trébol", category: "Planta", trophicLevel: "Productor", wikiQuery: "Trifolium", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": true, "hojaCorazon": true } },
    { id: "p24", name: "Helecho", category: "Planta", trophicLevel: "Productor", wikiQuery: "Polypodiopsida", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": true, "hojaFronde": true } },
    { id: "p25", name: "Diente de león", category: "Planta", trophicLevel: "Productor", wikiQuery: "Taraxacum officinale", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "semillaAbuelo": true } },
    { id: "p26", name: "Amapola", category: "Planta", trophicLevel: "Productor", wikiQuery: "Papaver rhoeas", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "florRojaPapel": true } },
    { id: "p27", name: "Margarita", category: "Planta", trophicLevel: "Productor", wikiQuery: "Bellis perennis", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "florMargarita": true } },
    { id: "p28", name: "Ortiga", category: "Planta", trophicLevel: "Productor", wikiQuery: "Urtica dioica", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "picaPiel": true } },
    { id: "p29", name: "Malva", category: "Planta", trophicLevel: "Productor", wikiQuery: "Malva sylvestris", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "florRosaMoradaAbanico": true } },
    { id: "p30", name: "Verbena", category: "Planta", trophicLevel: "Productor", wikiQuery: "Verbena officinalis", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "florVioletaRacimo": true } },
    { id: "p31", name: "Llantén", category: "Planta", trophicLevel: "Productor", wikiQuery: "Plantago major", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "hojaAnchaNervios": true } },
    { id: "p32", name: "Ortiga blanca", category: "Planta", trophicLevel: "Productor", wikiQuery: "Lamium album", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "pareceOrtigaBlanca": true } },
    { id: "p33", name: "Achicoria", category: "Planta", trophicLevel: "Productor", wikiQuery: "Cichorium intybus", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "florAzulCeleste": true } },
    { id: "p34", name: "Jara", category: "Planta", trophicLevel: "Productor", wikiQuery: "Cistus", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "hojasPringosas": true } },
    { id: "p35", name: "Retama", category: "Planta", trophicLevel: "Productor", wikiQuery: "Retama sphaerocarpa", traits: { "esPlanta": true, "esArbolAlto": false, "esTrepadora": false, "tienePinchos": false, "esAromatica": false, "esPequenaSuelo": false, "florAmarillaSinHojas": true } },

    // ===========================
    // INVERTEBRADOS (30 especies) — Traits NUEVOS según árbol dicotómico v4
    // ===========================
    // --- Voladores con alas grandes y colores (Mariposa / Polilla) ---
    { id: "i1", name: "Mariposa", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Rhopalocera", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": true, "cierraAlasLibro": true } },
    { id: "i2", name: "Polilla", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Heterocera", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": true, "cierraAlasLibro": false } },
    // --- Voladores con rayas amarillas y negras (Abeja / Avispas) ---
    { id: "i3", name: "Abeja", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Anthophila", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": true, "cuerpoGorditoPelitos": true } },
    { id: "i4", name: "Avispa alfarera", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Eumeninae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": true, "cuerpoGorditoPelitos": false, "cinturaLarguisimaHilo": true } },
    { id: "i5", name: "Avispa", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Vespidae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": true, "cuerpoGorditoPelitos": false, "cinturaLarguisimaHilo": false } },
    // --- Voladores sin rayas: Libélula ---
    { id: "i6", name: "Libélula", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Anisoptera", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": false, "cuerpoLargoPalito4Alas": true } },
    // --- Voladores sin rayas: Mosquito ---
    { id: "i7", name: "Mosquito", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Culicidae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": false, "cuerpoLargoPalito4Alas": false, "patasLargasFinasTubito": true } },
    // --- Voladores sin rayas: Cigarra ---
    { id: "i8", name: "Cigarra", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Cicadidae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": false, "cuerpoLargoPalito4Alas": false, "patasLargasFinasTubito": false, "grandeAlasTransparentesTejado": true } },
    // --- Voladores sin rayas: Mosca verde ---
    { id: "i9", name: "Mosca verde", category: "Invertebrado", trophicLevel: "Descomponedor", wikiQuery: "Lucilia sericata", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": false, "cuerpoLargoPalito4Alas": false, "patasLargasFinasTubito": false, "grandeAlasTransparentesTejado": false, "verdeMetalicoBrilla": true } },
    // --- Voladores sin rayas: Mosca común ---
    { id: "i10", name: "Mosca", category: "Invertebrado", trophicLevel: "Descomponedor", wikiQuery: "Musca domestica", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": true, "alasGrandesColores": false, "rayasAmarillasNegras": false, "cuerpoLargoPalito4Alas": false, "patasLargasFinasTubito": false, "grandeAlasTransparentesTejado": false, "verdeMetalicoBrilla": false } },

    // --- No vuela, sin patas ---
    { id: "i11", name: "Caracol", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Helix aspersa", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": false, "casitaDuraConcha": true } },
    { id: "i12", name: "Lombriz de tierra", category: "Invertebrado", trophicLevel: "Descomponedor", wikiQuery: "Lumbricidae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": false, "casitaDuraConcha": false, "largoBajoTierra": true } },
    { id: "i13", name: "Babosa", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Deroceras reticulatum", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": false, "casitaDuraConcha": false, "largoBajoTierra": false } },

    // --- No vuela, con patas, muchas patas ---
    { id: "i14", name: "Cochinilla de la humedad", category: "Invertebrado", trophicLevel: "Descomponedor", wikiQuery: "Oniscidea", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": true, "seHaceBolita": true } },
    { id: "i15", name: "Milpiés", category: "Invertebrado", trophicLevel: "Descomponedor", wikiQuery: "Diplopoda", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": true, "seHaceBolita": false, "cuatroPatasPorAnillo": true } },
    { id: "i16", name: "Ciempiés", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Chilopoda", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": true, "seHaceBolita": false, "cuatroPatasPorAnillo": false } },

    // --- No vuela, con patas, 8 patas ---
    { id: "i17", name: "Garrapata", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Ixodoidea", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": true, "cuerpoDosPartes": false } },
    { id: "i18", name: "Araña de jardín", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Araneus diadematus", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": true, "cuerpoDosPartes": true, "dibujoCruzBlanca": true } },
    { id: "i19", name: "Araña", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Araneae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": true, "cuerpoDosPartes": true, "dibujoCruzBlanca": false } },

    // --- No vuela, con patas, 6 patas (insectos de tierra) ---
    { id: "i20", name: "Mariquita", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Coccinellidae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": true } },
    { id: "i21", name: "Tijereta", category: "Invertebrado", trophicLevel: "Descomponedor", wikiQuery: "Dermaptera", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": false, "pinzasFinalCuerpo": true } },
    { id: "i22", name: "Saltamontes", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Caelifera", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": false, "pinzasFinalCuerpo": false, "patasTraserasLargas": true, "verdeAlargado": true } },
    { id: "i23", name: "Grillo", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Gryllidae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": false, "pinzasFinalCuerpo": false, "patasTraserasLargas": true, "verdeAlargado": false } },
    { id: "i24", name: "Mantis religiosa", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Mantis religiosa", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": false, "pinzasFinalCuerpo": false, "patasTraserasLargas": false, "patasDelanteRezando": true } },
    { id: "i25", name: "Hormiga", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Formicidae", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": false, "pinzasFinalCuerpo": false, "patasTraserasLargas": false, "patasDelanteRezando": false, "cinturaFinaTresPartes": true } },
    { id: "i26", name: "Escarabajo", category: "Invertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Coleoptera", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": false, "pinzasFinalCuerpo": false, "patasTraserasLargas": false, "patasDelanteRezando": false, "cinturaFinaTresPartes": false, "caparazonDuroBrilla": true } },
    { id: "i27", name: "Pulga", category: "Invertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Siphonaptera", traits: { "esPlanta": false, "tieneHuesos": false, "vuela": false, "tienePatas": true, "muchasPatas": false, "ochoPatas": false, "rojoPuntosNegros": false, "pinzasFinalCuerpo": false, "patasTraserasLargas": false, "patasDelanteRezando": false, "cinturaFinaTresPartes": false, "caparazonDuroBrilla": false } },

    // ===========================
    // VERTEBRADOS (30 especies) — Traits NUEVOS según árbol dicotómico v4
    // ===========================

    // --- AVES ---
    // Cigüeña (1m, pico largo, blanco y negro)
    { id: "v1", name: "Cigüeña blanca", category: "Vertebrado", trophicLevel: "Consumidor Terciario", wikiQuery: "Ciconia ciconia", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": true } },
    // Rapaces nocturnas (cara plana, ojos grandes)
    { id: "v2", name: "Lechuza", category: "Vertebrado", trophicLevel: "Consumidor Terciario", wikiQuery: "Tyto alba", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": true, "caraBlancaCorazon": true } },
    { id: "v3", name: "Mochuelo", category: "Vertebrado", trophicLevel: "Consumidor Terciario", wikiQuery: "Athene noctua", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": true, "caraBlancaCorazon": false } },
    // Milano (alas >1m, cola en V)
    { id: "v4", name: "Milano real", category: "Vertebrado", trophicLevel: "Consumidor Terciario", wikiQuery: "Milvus milvus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": true } },
    // Plumas negras/blanco-negro
    { id: "v5", name: "Urraca", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Pica pica", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": true, "barrigaBlancaColaLarga": true } },
    { id: "v6", name: "Cuervo", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Corvus corax", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": true, "barrigaBlancaColaLarga": false, "grandeComoGallinaPicoGordo": true } },
    { id: "v7", name: "Mirlo", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Turdus merula", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": true, "barrigaBlancaColaLarga": false, "grandeComoGallinaPicoGordo": false, "picoNaranjaAmarillo": true } },
    { id: "v8", name: "Estornino", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Sturnus vulgaris", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": true, "barrigaBlancaColaLarga": false, "grandeComoGallinaPicoGordo": false, "picoNaranjaAmarillo": false } },
    // Aves NO negras/blanco-negro → tamaño zapato (Tórtola/Paloma)
    { id: "v9", name: "Tórtola", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Streptopelia", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": true, "rayaNegraCollar": true } },
    { id: "v10", name: "Paloma", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Columba livia", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": true, "rayaNegraCollar": false } },
    // Aves NO negras, pequeñitas (como tu puño)
    { id: "v11", name: "Golondrina", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Hirundo rustica", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": false, "colaDosPuntasManchaRoja": true } },
    { id: "v12", name: "Avión común", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Delichon urbicum", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": false, "colaDosPuntasManchaRoja": false, "manchaBlancaEspalda": true } },
    { id: "v13", name: "Petirrojo", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Erithacus rubecula", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": false, "colaDosPuntasManchaRoja": false, "manchaBlancaEspalda": false, "manchaNaranjaPecho": true } },
    { id: "v14", name: "Carbonero", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Parus major", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": false, "colaDosPuntasManchaRoja": false, "manchaBlancaEspalda": false, "manchaNaranjaPecho": false, "barrigaAmarilloBrillante": true, "rayaNegraBarrigaCorbata": true } },
    { id: "v15", name: "Herrerillo", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Cyanistes caeruleus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": false, "colaDosPuntasManchaRoja": false, "manchaBlancaEspalda": false, "manchaNaranjaPecho": false, "barrigaAmarilloBrillante": true, "rayaNegraBarrigaCorbata": false } },
    { id: "v16", name: "Gorrión común", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Passer domesticus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": true, "1MetroPicoLargoBlaNeg": false, "caraPlanaOjosGrandes": false, "alas1MetroColaV": false, "plumasNegrasBlaNeg": false, "tamanoZapato": false, "colaDosPuntasManchaRoja": false, "manchaBlancaEspalda": false, "manchaNaranjaPecho": false, "barrigaAmarilloBrillante": false } },

    // --- MAMÍFEROS ---
    { id: "v17", name: "Murciélago", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Chiroptera", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": true } },
    { id: "v18", name: "Erizo", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Erinaceus europaeus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": false, "espaldaPinchosDuros": true } },
    { id: "v19", name: "Corzo", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Capreolus capreolus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": false, "espaldaPinchosDuros": false, "muyGrandePezunas": true } },
    { id: "v20", name: "Zorro", category: "Vertebrado", trophicLevel: "Consumidor Terciario", wikiQuery: "Vulpes vulpes", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": false, "espaldaPinchosDuros": false, "muyGrandePezunas": false, "tamanoPerroColaPeluda": true } },
    { id: "v21", name: "Liebre", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Lepus granatensis", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": false, "espaldaPinchosDuros": false, "muyGrandePezunas": false, "tamanoPerroColaPeluda": false, "orejasLargas": true, "manchaNegraOrejas": true } },
    { id: "v22", name: "Conejo", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Oryctolagus cuniculus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": false, "espaldaPinchosDuros": false, "muyGrandePezunas": false, "tamanoPerroColaPeluda": false, "orejasLargas": true, "manchaNegraOrejas": false } },
    { id: "v23", name: "Ratón de campo", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Apodemus sylvaticus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": false, "espaldaPinchosDuros": false, "muyGrandePezunas": false, "tamanoPerroColaPeluda": false, "orejasLargas": false, "colaLargaCuerpo": true } },
    { id: "v24", name: "Topillo", category: "Vertebrado", trophicLevel: "Consumidor Primario", wikiQuery: "Microtus arvalis", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": true, "alasPielVuela": false, "espaldaPinchosDuros": false, "muyGrandePezunas": false, "tamanoPerroColaPeluda": false, "orejasLargas": false, "colaLargaCuerpo": false } },

    // --- REPTILES y ANFIBIOS ---
    { id: "v25", name: "Lagarto ocelado", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Timon lepidus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": false, "tiene4Patas": true, "pielEscamasSecas": true, "manchasAzulCostados": true } },
    { id: "v26", name: "Lagartija", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Podarcis hispanica", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": false, "tiene4Patas": true, "pielEscamasSecas": true, "manchasAzulCostados": false } },
    { id: "v27", name: "Sapo", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Bufo bufo", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": false, "tiene4Patas": true, "pielEscamasSecas": false, "pielBultitosVerrugas": true } },
    { id: "v28", name: "Rana", category: "Vertebrado", trophicLevel: "Consumidor Secundario", wikiQuery: "Pelophylax perezi", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": false, "tiene4Patas": true, "pielEscamasSecas": false, "pielBultitosVerrugas": false } },
    // --- SERPIENTES ---
    { id: "v29", name: "Culebra de escalera", category: "Vertebrado", trophicLevel: "Consumidor Terciario", wikiQuery: "Zamenis scalaris", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": false, "tiene4Patas": false, "dibujoEscaleraEspalda": true } },
    { id: "v30", name: "Culebra bastarda", category: "Vertebrado", trophicLevel: "Consumidor Terciario", wikiQuery: "Malpolon monspessulanus", traits: { "esPlanta": false, "tieneHuesos": true, "tienePlumasPico": false, "tienePelo": false, "tiene4Patas": false, "dibujoEscaleraEspalda": false } }
];

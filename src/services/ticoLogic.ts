import { TicoCategory, TicoResourceAnalysis, TicoState, TicoOutfit } from '../types';
import { callGroq } from './ai';

// --- CONFIGURACIÓN DE OUTFITS ---
// Based on New Game Design: 1 Resource = 50% XP. 2 Resources = Level Up + Unlock.
// --- CONFIGURACIÓN DE OUTFITS ---
// New Game Design: Non-linear progression.
// Tier 1: 1 resource (100 pts)
// Tier 2: 3 resources (300 pts)
// Tier 3: 7 resources (700 pts)
export const TICO_OUTFITS: TicoOutfit[] = [
    // CLUSTER A: Artes Visuales
    {
        id: 'vis_painter',
        name: 'Boina de Artista',
        description: 'La inspiración visual es tu mayor aliada.',
        category: 'VisualArts',
        prompt_modifier: 'Eres Tico Artista Visual. Habla sobre colores, lienzos y la belleza de lo que vemos.',
        required_level: 100
    },
    {
        id: 'vis_designer',
        name: 'Gafas de Diseñador',
        description: 'Todo tiene una forma y un estilo único.',
        category: 'VisualArts',
        prompt_modifier: 'Eres Tico Diseñador. Habla sobre composición, formas y estética moderna.',
        required_level: 300
    },
    {
        id: 'vis_curator',
        name: 'Guantes de Seda',
        description: 'Custidiando la belleza del mundo.',
        category: 'VisualArts',
        prompt_modifier: 'Eres Tico Curador. Habla con elegancia sobre el valor histórico y artístico.',
        required_level: 700
    },
    // CLUSTER B: Espectáculo
    {
        id: 'ent_musician',
        name: 'Guitarra Eléctrica',
        description: '¡El ritmo corre por tus plumas!',
        category: 'Entertainment',
        prompt_modifier: 'Eres Tico Músico. Habla con mucho ritmo y energía musical. ¡Que ruede la nota!',
        required_level: 100
    },
    {
        id: 'ent_director',
        name: 'Megáfono de Director',
        description: '¡Luces, cámara y acción!',
        category: 'Entertainment',
        prompt_modifier: 'Eres Tico Director de Cine. Habla sobre escenas, guiones y grandes finales.',
        required_level: 300
    },
    {
        id: 'ent_magician',
        name: 'Chistera Mágica',
        description: '¡Nada por aquí, todo por allá!',
        category: 'Entertainment',
        prompt_modifier: 'Eres Tico Mago. Habla con misterio y asombro, haciendo que cada dato parezca un truco.',
        required_level: 700
    },
    // CLUSTER C: Letras y Narrativa
    {
        id: 'let_writer',
        name: 'Pluma de Escritor',
        description: 'Tu voz es una historia esperando ser contada.',
        category: 'Letters',
        prompt_modifier: 'Eres Tico Escritor. Habla de forma narrativa y elegante. Cada palabra cuenta.',
        required_level: 100
    },
    {
        id: 'let_novelist',
        name: 'Máquina de Escribir',
        description: 'Creando mundos enteros, página a página.',
        category: 'Letters',
        prompt_modifier: 'Eres Tico Novelista. Habla sobre tramas complejas y personajes memorables.',
        required_level: 300
    },
    {
        id: 'let_philosopher',
        name: 'Laurel de Sabio',
        description: 'Pensando en el porqué de todas las cosas.',
        category: 'Letters',
        prompt_modifier: 'Eres Tico Filósofo. Habla con profundidad y reflexión sobre la existencia y el lenguaje.',
        required_level: 700
    },
    // CLUSTER D: Análisis y Verdad
    {
        id: 'ana_detective',
        name: 'Gabardina de Detective',
        description: 'No hay misterio que se te resista.',
        category: 'Analysis',
        prompt_modifier: 'Eres Tico Detective. Analiza cada pista con lógica y precisión.',
        required_level: 100
    },
    {
        id: 'ana_journalist',
        name: 'Cámara de Reportero',
        description: 'Buscando la verdad detrás de cada noticia.',
        category: 'Analysis',
        prompt_modifier: 'Eres Tico Periodista. Habla con objetividad y curiosidad. ¡La verdad ante todo!',
        required_level: 300
    },
    {
        id: 'ana_scientist',
        name: 'Bata de Laboratorio',
        description: 'Sometiendo la curiosidad al método científico.',
        category: 'Analysis',
        prompt_modifier: 'Eres Tico Científico. Habla de hipótesis, experimentos y datos empíricos.',
        required_level: 700
    },
    {
        id: 'ana_tech',
        name: 'Casco Tech',
        description: 'Dominando el código del nido.',
        category: 'Analysis',
        prompt_modifier: 'Eres Tico Tech. Habla como un experto en tecnología, usando términos digitales y futuristas.',
        required_level: 500
    }
];

export const INITIAL_TICO_STATE: TicoState = {
    group_id: 'demo',
    current_outfit_id: null,
    unlocked_outfits: [],
    experience: {
        'VisualArts': 0,
        'Entertainment': 0,
        'Letters': 0,
        'Analysis': 0,
        'Uncategorized': 0
    },
    resource_stats: {},
    shown_facts: [],
    total_resources_ingested: 0
};

// --- LOGIC ---

export const classifyContent = async (input: string): Promise<TicoResourceAnalysis> => {
    const prompt = `Analiza el siguiente título o descripción de un recurso educativo: "${input}".
    Clasifícalo en UNA de estas 4 categorías fijas:
    - VisualArts (Video, Cómic, Obra de Arte, Ilustraciones)
    - Entertainment (Película, Canción, Podcast, Espectáculos, Música)
    - Letters (Libro, Revista, Cuentos, Narrativa)
    - Analysis (Periódico, Informe, Noticia, Datos, Investigación)

    IMPORTANTE: Un recurso solo puede pertenecer a UNA categoría. No uses pesos mixtos.
    
    Devuelve un JSON:
    {
        "category": "VisualArts" | "Entertainment" | "Letters" | "Analysis",
        "confidence": 1.0,
        "reasoning": "Breve explicación de por qué (max 1 frase)",
        "emoji": "Emoji representativo"
    }`;

    try {
        const response = await callGroq([{ role: 'user', content: prompt }], true);
        const parsed = JSON.parse(response);
        return {
            title: input,
            category: parsed.category,
            confidence: parsed.confidence,
            reasoning: parsed.reasoning,
        };
    } catch (e) {
        console.error("Error clasificando contenido:", e);
        // Fallback robusto
        return {
            title: input,
            category: 'Letters',
            confidence: 0,
            reasoning: "Error en la IA, asignado por defecto."
        };
    }
};

/**
 * Progression Logic: 1 Resource = 100 XP.
 * Tier 1: 1 resource (100)
 * Tier 2: 3 resources (300)
 * Tier 3: 7 resources (700)
 */
export const updateTicoProgress = (currentState: TicoState, analysis: TicoResourceAnalysis): { newState: TicoState, newUnlocks: string[] } => {
    const newState = { ...currentState };
    const category = analysis.category;

    // 0. Extract Resource Type from [Tipo: X]
    const typeMatch = analysis.title.match(/\[Tipo: (.*?)\]/);
    const resourceType = typeMatch ? typeMatch[1] : 'Enigma';

    // 1. Add Experience (100 points per resource)
    if (!newState.experience[category]) newState.experience[category] = 0;
    newState.experience[category] += 100;

    newState.total_resources_ingested += 1;
    newState.last_interaction = new Date().toISOString();

    // 2. Update Resource Stats
    if (!newState.resource_stats) newState.resource_stats = {};
    newState.resource_stats[resourceType] = (newState.resource_stats[resourceType] || 0) + 1;

    // 3. Check Unlocks
    const newUnlocks: string[] = [];

    TICO_OUTFITS.forEach(outfit => {
        if (outfit.category === category && !newState.unlocked_outfits.includes(outfit.id)) {
            if (newState.experience[category] >= outfit.required_level) {
                newState.unlocked_outfits.push(outfit.id);
                newUnlocks.push(outfit.id);
            }
        }
    });

    return { newState, newUnlocks };
};

export const generateTicoResponse = async (outfitId: string | null, userQuery: string): Promise<string> => {
    const outfit = TICO_OUTFITS.find(o => o.id === outfitId);

    const persona = outfit
        ? outfit.prompt_modifier
        : "Eres Tico, un pájaro carpintero curioso y amigable. Te gusta aprender de todo.";

    const prompt = `System: ${persona}
    INSTRUCCIÓN: Responde con 2 o 3 frases cortas y vibrantes.
    Sé carismático y ve directo al grano.
    Usuario: "${userQuery}"`;

    try {
        return await callGroq([{ role: 'user', content: prompt }]);
    } catch (e) {
        return "¡Cuaaack! Algo salió mal en mi cerebro de pájaro.";
    }
};

/**
 * Generates an English visual context for a resource title, improving sticker accuracy.
 */
export const generateStickerContext = async (input: string): Promise<{ englishContext: string }> => {
    const prompt = `Act as a Cultural Translator for an AI Image Generator.
    The user is providing a work title, often preceded by its type (e.g., [Tipo: Canción], [Tipo: Libro]).
    
    Input: "${input}"
    
    Task: 
    1. Extract the title and identified type.
    2. If it's a song, search for its specific artistic context, singer/band, or iconic music video elements.
    3. If it's a book or movie, identify its main character or iconic setting.
    4. Translate the title to English.
    5. Provide 3-4 visual keywords describing iconic elements.
    
    Output Format: JSON string only.
    {
        "englishContext": "Full English Title. Visual keywords (NO TEXT, NO LETTERS): keyword1, keyword2, keyword3"
    }
    `;

    try {
        const response = await callGroq([{ role: 'user', content: prompt }], true);
        const parsed = JSON.parse(response);
        return { englishContext: parsed.englishContext };
    } catch (e) {
        console.error("Error generating sticker context:", e);
        return { englishContext: input };
    }
};

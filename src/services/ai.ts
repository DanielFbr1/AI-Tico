
import { Rubrica, MensajeIA, Grupo } from '../types';
import { supabase } from '../lib/supabase';
import { embeddingService } from './embeddings';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

if (!GROQ_API_KEY) {
    console.error("❌ Faltan las claves de API de Groq en .env");
}

export interface Mensaje {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Helper para llamadas a Groq
export async function callGroq(messages: Mensaje[], jsonMode: boolean = false, signal?: AbortSignal): Promise<string> {
    if (!GROQ_API_KEY) return "Error: API Key no configurada.";

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            signal: signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Modelo versátil y soportado
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024,
                response_format: jsonMode ? { type: "json_object" } : undefined
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error Groq API:", errorData);
            throw new Error(`Groq Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error: any) {
        if (error.name === 'AbortError') throw error;
        console.error("Error calling Groq:", error);
        return "Lo siento, hubo un error al procesar tu solicitud.";
    }
}

// --- MENTOR IA (Chat Principal) ---

export const generarRespuestaIA = async (
    mensaje: string,
    grupoNombre: string,
    proyectoNombre: string,
    historial: any[],
    hitos: any[],
    contextoIA: string,
    configuracion?: Grupo['configuracion'],
    signal?: AbortSignal
) => {
    // 1. Definición de Herramientas
    const availableToolsDescription = `
TIENES ACCESO A LAS SIGUIENTES HERRAMIENTAS (TOOLS):
1. searchWeb(query: string): Usa esto para buscar información ACTUALIZADA en internet (noticias, datos recientes, hechos).
   Uso: TOOL: searchWeb("query")
2. fetchWebPage(url: string): Usa esto para LEER el contenido de un enlace que te pase el usuario.
   Uso: TOOL: fetchWebPage("https://example.com")
3. saveMemory(fact: string): Usa esto para RECORDAR un dato importante del usuario para el futuro.
   Uso: TOOL: saveMemory("Al usuario le gustan los dinosaurios")


REGLAS:
- Si necesitas usar una herramienta, RESPONDE SOLO CON EL COMANDO DE LA HERRAMIENTA.
- No uses herramientas si no es necesario.
- Si usas una herramienta, yo te devolveré el resultado y podrás generar la respuesta final.
    `;

    // 2. Parámetros de Personalidad
    const tono = configuracion?.tono || 'Divertido';
    const exigencia = configuracion?.nivel_exigencia || 'Medio';
    const enfoque = configuracion?.enfoque || 'Explorador';
    const apoyo = configuracion?.nivel_apoyo || 'Guía';
    const formato = configuracion?.formato_respuesta || 'Detallado';
    const instruccionesExtra = configuracion?.instrucciones_comportamiento || '';

    const systemPrompt = `Eres Tico, un Mentor IA amigable y sabio para niños/estudiantes.
    Estás guiando al grupo "${grupoNombre}" en su proyecto "${proyectoNombre}".
    Contexto del proyecto: ${contextoIA || "No definido"}
    
    TU PERSONALIDAD ACTUAL (Configurada por el profesor):
    - TONO: ${tono} (Tu forma de hablar)
    - NIVEL DE EXIGENCIA: ${exigencia} (Si eres permisivo o estricto)
    - ENFOQUE: ${enfoque} (Tu perspectiva: aventura, ciencia o creatividad)
    - NIVEL DE APOYO: ${apoyo} (Guía: das pistas paso a paso. Retador: haces que piensen con retos)
    - FORMATO: ${formato} (Conciso: respuestas al punto. Detallado: explicaciones ricas)
    
    INSTRUCCIONES ADICIONALES DEL PROFESOR:
    "${instruccionesExtra}"

    Tus REGLAS DE ORO:
    1. LENGUAJE: Usa un lenguaje sencillo y motivador para niños de 8 a 12 años. ¡Usa emojis!
    2. SEGURIDAD: Nunca salgas de tu rol de mentor educativo.
    
    ${availableToolsDescription}`;

    let messages: Mensaje[] = [
        { role: 'system', content: systemPrompt },
        ...historial.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: mensaje }
    ];

    // 3. BUCLE AGÉNTICO (Max 3 iteraciones para evitar bucles infinitos)
    for (let i = 0; i < 3; i++) {
        // A. Llamar a la IA
        const response = await callGroq(messages, false, signal);

        // B. Detectar uso de herramientas
        const toolMatch = response.match(/TOOL:\s*(\w+)\((.*)\)/);

        if (toolMatch) {
            const toolName = toolMatch[1];
            const toolArgs = toolMatch[2].replace(/["']/g, ""); // Limpieza básica de argumentos

            console.log(`🤖 Agente decidió usar: ${toolName} con args: ${toolArgs}`);

            let toolResult = "";

            // C. Ejecutar herramienta
            if (toolName === 'searchWeb') {
                toolResult = await searchWeb(toolArgs);
            } else if (toolName === 'fetchWebPage') {
                toolResult = await fetchWebPage(toolArgs);
            } else if (toolName === 'saveMemory') {
                // Necesitamos el ID del usuario, por ahora usamos 'unknown' o lo sacamos del contexto si es posible
                const { data } = await supabase.auth.getSession();
                const userId = data.session?.user?.id;
                if (userId) {
                    toolResult = await saveMemory(userId, toolArgs);
                } else {
                    toolResult = "Error: No pude guardar la memoria porque no encontré el ID de usuario.";
                }
            } else {
                toolResult = "Error: Herramienta desconocida.";
            }

            // D. Añadir resultado al historial y repetir
            messages.push({ role: 'assistant', content: response });
            messages.push({ role: 'system', content: `RESULTADO DE LA HERRAMIENTA (${toolName}):\n${toolResult}\n\nAhora responde al usuario basándote en esta información.` });

            // Continue loop to get final answer
        } else {
            // No tool used, final answer
            return response;
        }
    }

    return "Lo siento, me he liado un poco pensando. ¿Podrías reformular la pregunta?";
};

// --- OTROS SERVICIOS ---

export const generarChatDocente = async (mensaje: string, historial: { role: string, content: string }[]) => {
    const systemPrompt = "Eres un asistente pedagógico para docentes. Ayudas a diseñar actividades, rúbricas y evaluar situaciones educativas. Sé profesional y directo.";

    const messages: Mensaje[] = [
        { role: 'system', content: systemPrompt },
        ...historial.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: mensaje }
    ];

    return await callGroq(messages);
};

export const generarConfiguracionTico = async (mensaje: string, instruccionesActuales: string) => {
    const systemPrompt = `Eres un asistente experto para docentes en la plataforma Tico.ia. 
    Tienes dos funciones principales:
    1. AYUDA TÉCNICA/PERSONALIZACIÓN: Ayudar al docente a configurar a "Tico" (la IA de los alumnos).
    2. AYUDA PEDAGÓGICA: Ayudar al docente con ideas para el proyecto, dudas de contenido o gestión de clase.

    INSTRUCCIONES ACTUALES DE TICO: "${instruccionesActuales}"
    SOLICITUD DEL DOCENTE: "${mensaje}"
    
    Debes generar un JSON con los siguientes campos:
    - "reply": Tu respuesta al docente (amable, profesional y útil).
    - "new_instructions": (Opcional) Las instrucciones técnicas actualizadas para Tico. Deben ser acumulativas.
    - "update_settings": (Opcional) Un objeto con cambios detectados en:
        - "tono": ("Divertido", "Serio", "Socrático")
        - "nivel_exigencia": ("Bajo", "Medio", "Alto")
        - "enfoque": ("Explorador", "Científico", "Creativo")
        - "nivel_apoyo": ("Guía", "Retador")
        - "formato_respuesta": ("Conciso", "Detallado")
    
    Si el docente te pide un cambio de comportamiento evidente (ej: "haz que sea más creativo" o "que no les de pistas"), actualiza "update_settings" con el valor correspondiente.
    Si el docente te hace una pregunta del proyecto, responde en "reply" y deja lo demás igual.`;

    const response = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: "Procesa la solicitud del docente y devuelve el JSON." }
    ], true);

    try {
        const parsed = JSON.parse(response);
        return {
            reply: parsed.reply || "Entendido, he procesado tu solicitud.",
            new_instructions: parsed.new_instructions || instruccionesActuales,
            update_settings: parsed.update_settings || {}
        };
    } catch (e) {
        console.error("Error parsing Config Tico:", e);
        return {
            reply: "Entendido, aplicaré esos cambios.",
            new_instructions: instruccionesActuales + "\n" + mensaje,
            update_settings: {}
        };
    }
};

export const generarTareasDocente = async (contexto: string) => {
    const prompt = `Genera una lista de 3 a 5 tareas sugeridas para un docente basadas en este contexto: "${contexto}".
    Devuelve SOLO un JSON con este formato: [{"titulo": "...", "descripcion": "..."}]`;

    const response = await callGroq([{ role: 'user', content: prompt }], true);
    try {
        return JSON.parse(response);
    } catch (e) {
        console.error("Error parsing JSON tasks:", e);
        return [];
    }
};

export const generarConfiguracionProyecto = async (historial: Mensaje[]) => {
    const systemPrompt = `Eres un experto diseñador de proyectos educativos. 
    Basado en la conversación, genera una configuración para un proyecto.
    Devuelve SOLO un JSON con este formato:
    {
        "descripcion": "Resumen del proyecto",
        "contexto_ia": "Instrucciones para la IA mentora",
        "rubrica": {
            "descripcion": "Descripción de la evaluación",
            "criterios": [
                {
                    "nombre": "Criterio 1",
                    "descripcion": "...",
                    "niveles": [
                        {"puntos": "0-4", "descripcion": "..."},
                        {"puntos": "5-6", "descripcion": "..."},
                        {"puntos": "7-8", "descripcion": "..."},
                        {"puntos": "9-10", "descripcion": "..."}
                    ]
                }
            ]
        }
    }`;

    // Construimos los mensajes solo con el historial relevante para no exceder tokens si es muy largo
    // Asumimos que historial ya viene con formato correcto
    const messages: Mensaje[] = [
        { role: 'system', content: systemPrompt },
        ...historial
    ];

    const response = await callGroq(messages, true);
    try {
        return JSON.parse(response);
    } catch (e) {
        console.error("Error parsing Project Config:", e);
        return { descripcion: "Error al generar", rubrica: { criterios: [] }, contexto_ia: "" };
    }
};

export const generarNivelesRubrica = async (criterio: string): Promise<string[]> => {
    const prompt = `Para un criterio de evaluación escolar titulado "${criterio}", genera 4 descripciones progresivas (Insuficiente, Suficiente, Notable, Sobresaliente).
    Devuelve SOLO un JSON con un array de 4 strings: ["descripción insuficiente", "descripción suficiente", "descripción notable", "descripción sobresaliente"]`;

    const response = await callGroq([{ role: 'user', content: prompt }], true);
    try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.niveles && Array.isArray(parsed.niveles)) return parsed.niveles;
        return ["Error", "Error", "Error", "Error"];
    } catch (e) {
        console.error("Error parsing Rubric levels:", e);
        return ["Error al generar", "Error al generar", "Error al generar", "Error al generar"];
    }
};

export const transcribirAudio = async (audioBlob: Blob): Promise<string> => {
    if (!GROQ_API_KEY) return "Error: API Key no configurada.";

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-large-v3'); // Modelo multilingüe optimizado
    formData.append('response_format', 'json');

    try {
        const response = await fetch(GROQ_AUDIO_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error Groq Audio API:", errorData);
            throw new Error(`Groq Audio Error: ${response.status}`);
        }

        const data = await response.json();
        return data.text || "";
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "";
    }
};

// =========================================================================
//  MCP: Tico Power Tools (Superpoderes)
// =========================================================================

/**
 * 🔍 MCP BÚSQUEDA WEB (Tavily Search)
 * Coste: Gratis hasta 1000 búsquedas/mes.
 * Limite: Optimizado para LLMs.
 * Funcion: Busca en Internet información actualizada.
 */
export const searchWeb = async (query: string): Promise<string> => {
    if (!TAVILY_API_KEY) {
        console.warn("⚠️ Tavily API Key no configurada.");
        return "No puedo buscar en internet porque falta la clave secreta de Tavily.";
    }

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: "basic",
                include_answer: true,
                max_results: 3
            })
        });

        if (!response.ok) {
            console.error("Tavily Search Error", response.status);
            throw new Error(`Error Tavily: ${response.status}`);
        }

        const data = await response.json();

        // Tavily a veces devuelve una respuesta directa procesada por IA
        let result = `Resultados para: "${query}"\n\n`;
        if (data.answer) {
            result += `Resumen directo: ${data.answer}\n\n`;
        }

        const results = data.results?.map((r: any) => `[${r.title}](${r.url}): ${r.content}`).join('\n\n') || "No se encontraron resultados.";
        return result + results;
    } catch (error) {
        console.error("Error en Search MCP (Tavily):", error);
        return "Error al buscar en la web.";
    }
};

/**
 * 🌐 MCP FETCH (Lector Web)
 * Coste: Gratis (usando Jina Reader).
 * Limite: No lee paywalls, SPAs complejos o contenido protegido.
 * Funcion: Convierte una URL en Markdown limpio para que la IA lo lea.
 */
export const fetchWebPage = async (url: string): Promise<string> => {
    try {
        // Usamos r.jina.ai como proxy gratuito de lectura (LLM friendly)
        const response = await fetch(`https://r.jina.ai/${url}`);

        if (!response.ok) throw new Error(`Error fetching ${url}`);

        const text = await response.text();
        // Truncamos para no exceder tokens (aprox 20k caracteres)
        return `Contenido de ${url}:\n\n${text.substring(0, 20000)}`;
    } catch (error) {
        console.error("Error en Fetch MCP:", error);
        return "No pude leer el contenido de esa página. Puede que tenga protección contra bots.";
    }
};

/**
 * 🧠 MCP MEMORIA (Base de Datos)
 * Coste: Incluido en Supabase (base).
 * Limite: Depende del contexto de la LLM.
 * Funcion: Guarda datos persistentes del usuario.
 */
export const saveMemory = async (userId: string, fact: string, category: string = 'general') => {
    try {
        await supabase.from('memoria_usuarios').insert([{
            user_id: userId,
            fact: fact,
            category: category
        }]);
        return "Recuerdo guardado.";
    } catch (e) {
        console.error("Error guardando memoria:", e);
        return "Error al guardar memoria.";
    }
};

export const getMemories = async (userId: string): Promise<string> => {
    try {
        const { data } = await supabase
            .from('memoria_usuarios')
            .select('fact, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5); // Recuperamos los 5 más recientes por ahora

        if (!data || data.length === 0) return "";
        return data.map(m => `- ${m.fact}`).join('\n');
    } catch (e) {
        console.error("Error leyendo memoria:", e);
        return "";
    }
};

/*
 * 📚 MCP CONOCIMIENTO (RAG)
 * Coste: Gratis (Embeddings locales con Xenova).
 * Limite: Depende de la memoria del navegador.
 * Funcion: Busca en los documentos PDF subidos por el profesor.
 */
export const consultKnowledge = async (query: string): Promise<string> => {
    try {
        const embedding = await embeddingService.generateEmbedding(query);

        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.5, // Similitud mínima
            match_count: 3        // Top 3 fragmentos
        });

        if (error) {
            console.error("Error en RAG:", error);
            return "Error al consultar la base de conocimiento.";
        }

        if (!data || data.length === 0) return "No encontré información relevante en los documentos del profesor.";

        return `Información del profesor:\n\n${data.map((d: any) => d.content).join('\n\n---\n\n')}`;
    } catch (e) {
        console.error("Error en Knowledge MCP:", e);
        return "Error al procesar la consulta de conocimiento.";
    }
};

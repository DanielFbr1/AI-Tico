import { Rubrica, MensajeIA, Grupo } from '../types';
// @ts-nocheck
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

// Helper para llamadas a Groq con reintentos
export async function callGroq(
    messages: Mensaje[],
    jsonMode: boolean = false,
    signal?: AbortSignal,
    model: string = 'llama-3.3-70b-versatile',
    retries: number = 2
): Promise<string> {
    if (!GROQ_API_KEY) return "Error: API Key no configurada.";

    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                signal: signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024,
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });

            if (response.status === 429 && i < retries) {
                // Incremento de espera: 3s, 6s...
                const waitTime = (i + 1) * 3000;
                console.warn(`⚠️ Groq Rate Limit (429). Reintentando en ${waitTime}ms... (Intento ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Error Groq API:", errorData);

                // Si es 429 y nos quedan reintentos, esperamos y seguimos
                if (response.status === 429 && i < retries) {
                    const waitTime = (i + 1) * 8000; // Espera aún más agresiva (8s, 16s...)
                    console.warn(`⚠️ Groq Rate Limit (429). Reintentando en ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                throw new Error(`Groq Error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || "";

            if (jsonMode) {
                try {
                    JSON.parse(content); // Validar que es JSON
                } catch (e) {
                    console.error("Groq no devolvió JSON válido:", content);
                    if (i < retries) continue; // Reintentar si no es JSON
                    throw new Error("Invalid JSON response from Groq");
                }
            }

            return content;
        } catch (error: any) {
            if (error.name === 'AbortError') throw error;
            if (i === retries) {
                console.error("Error definitivo calling Groq:", error);

                // Si esperamos JSON, debemos lanzar error para que el catch del llamador lo gestione
                if (jsonMode) {
                    throw error;
                }

                return "¡Cuaack! Mi cerebro va muy rápido y se ha sobrecalentado. 🧠🔥 ¡Dame un segundito y vuelve a preguntarme!";
            }
            // Espera proporcional antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error("Tico está agotado tras múltiples intentos.");
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
    const apoyo = configuracion?.nivel_apoyo || 'Guía';
    const formato = configuracion?.formato_respuesta || 'Detallado';
    const instruccionesExtra = configuracion?.instrucciones_comportamiento || '';

    // Instrucciones imperativas basadas en configuración
    let restricciones = "";
    let sinEmojis = false;
    if (configuracion?.usar_emojis === false) {
        sinEmojis = true;
        restricciones += "\n- INSTRUCCIÓN CRÍTICA: NO USES NINGÚN EMOJI. ESTÁN TERMINANTEMENTE PROHIBIDOS. Tu respuesta debe ser texto puro sin emoticonos bajo ningún concepto.";
    } else {
        restricciones += "\n- Puedes usar emojis libremente para hacer la conversación amigable.";
    }
    if (configuracion?.tono === 'estricto/agresivo') {
        restricciones += "\n- INSTRUCCIÓN CRÍTICA: Debes responder de forma seca, estricta y cortante.";
    }
    if (configuracion?.formato_respuesta === 'breve') {
        restricciones += "\n- INSTRUCCIÓN CRÍTICA: Debes responder en 1 o 2 frases cortas como máximo.";
    }

    const systemPrompt = `Eres Tico, un Mentor IA amigable y sabio para niños/estudiantes.
    Estás guiando al grupo "${grupoNombre}" en su proyecto "${proyectoNombre}".
    
    Contexto general del proyecto (Referencia):
    "${contextoIA || "No definido"}"
    
    REGLA PERSONALIZADA DE ESTE GRUPO (PRIORIDAD MÁXIMA):
    - Las siguientes instrucciones del profesor para este grupo específico tienen precedencia absoluta sobre el contexto general anterior.
    INSTRUCCIONES ESPECÍFICAS: "${instruccionesExtra}"
    
    TU CONFIGURACIÓN ACTUAL:
    - TONO: ${tono}
    - NIVEL DE EXIGENCIA: ${exigencia}
    - NIVEL DE APOYO: ${apoyo}
    - FORMATO: ${formato}
    ${restricciones}

    REGLAS DE ORO:
    1. PRIORIDAD: Si las "INSTRUCCIONES ESPECÍFICAS" contradicen el "Contexto general", sigue SIEMPRE las específicas.
    2. LENGUAJE: Usa un lenguaje sencillo y motivador para niños de 8 a 12 años.
    3. SEGURIDAD: Nunca salgas de tu rol de mentor educativo.
    
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
            // Remove emojis aggressively if disabled
            if (sinEmojis) {
                return response.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1F200}-\u{1F2FF}\u{1F004}\u{1F0CF}\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F18E}\u{1F191}-\u{1F19A}⭐✨👍👎❤️💪🎉]/gu, '');
            }
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
    
    RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON CON ESTE FORMATO:
    {
      "tasks": [
        {
          "titulo": "Título corto de la tarea",
          "descripcion": "Descripción clara y accionable para el alumno"
        }
      ]
    }
    
    Asegúrate de que el JSON sea válido y no incluyas texto fuera del objeto.`;

    try {
        const response = await callGroq([{ role: 'user', content: prompt }], true);
        const parsed = JSON.parse(response);

        if (parsed.tasks && Array.isArray(parsed.tasks)) {
            return parsed.tasks;
        } else if (Array.isArray(parsed)) {
            return parsed;
        }

        console.warn("Formato inesperado en generarTareasDocente:", parsed);
        return [];
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
    const prompt = `Eres un experto en educación. Para el criterio de evaluación escolar "${criterio}", genera exactamente 4 descripciones progresivas de rendimiento.

Devuelve OBLIGATORIAMENTE un JSON con esta estructura exacta:
{"niveles": ["descripción para Insuficiente (0-4)", "descripción para Suficiente (5-6)", "descripción para Notable (7-8)", "descripción para Sobresaliente (9-10)"]}

Cada descripción debe tener 1-2 frases concretas y específicas para ese nivel. Responde SOLO con el JSON, sin texto adicional.`;

    const response = await callGroq([{ role: 'user', content: prompt }], true, undefined, 'llama-3.1-8b-instant');
    try {
        const parsed = JSON.parse(response);

        // Buscar un array de 4 elementos en cualquier clave del objeto
        let rawNiveles: any[] = [];
        if (Array.isArray(parsed)) {
            rawNiveles = parsed;
        } else {
            for (const key of Object.keys(parsed)) {
                if (Array.isArray(parsed[key]) && parsed[key].length >= 4) {
                    rawNiveles = parsed[key];
                    break;
                }
            }
        }

        if (rawNiveles.length >= 4) {
            return rawNiveles.slice(0, 4).map((v: any) => {
                if (typeof v === 'string') return v;
                if (v && typeof v === 'object') {
                    // Intentar sacar 'descripcion', 'contenido' o simplemente el primer valor string
                    return v.descripcion || v.content || v.text || v.desc || Object.values(v).find(val => typeof val === 'string') || JSON.stringify(v);
                }
                return String(v);
            });
        }

        console.warn("Formato inesperado de Groq:", parsed);
        return ["Sin descripción", "Sin descripción", "Sin descripción", "Sin descripción"];
    } catch (e) {
        console.error("Error parsing Rubric levels:", e, "Response:", response);
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

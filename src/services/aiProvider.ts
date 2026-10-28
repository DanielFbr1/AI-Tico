/**
 * AI Provider Adapter
 * Capa de abstracción modular para conectar con múltiples proveedores de LLM
 * (Groq LLaMA 3.3 70B, Google Gemini Flash, OpenAI, etc.)
 */

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    signal?: AbortSignal;
    model?: string;
}

export class AIProvider {
    private static GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
    private static GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private static DEFAULT_MODEL = 'openai/gpt-oss-120b';
    private static FALLBACK_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    /**
     * Invocación principal a LLM con reintentos y fallback automático de modelos
     */
    public static async generateCompletion(
        messages: LLMMessage[],
        options: LLMOptions = {}
    ): Promise<string> {
        const {
            temperature = 0.6,
            maxTokens = 2048,
            jsonMode = false,
            signal,
            model = this.DEFAULT_MODEL
        } = options;

        if (!this.GROQ_API_KEY) {
            console.error('❌ Falta configurar VITE_GROQ_API_KEY');
            return 'Lo siento, la clave de IA no está configurada en el sistema.';
        }

        // Probar el modelo solicitado y luego fallbacks si devuelve 404 u error
        const modelsToTry = [model, ...this.FALLBACK_MODELS.filter(m => m !== model)];

        for (const currentModel of modelsToTry) {
            const maxRetries = 1;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch(this.GROQ_URL, {
                        method: 'POST',
                        signal,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.GROQ_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: currentModel,
                            messages,
                            temperature,
                            max_tokens: maxTokens,
                            response_format: jsonMode ? { type: 'json_object' } : undefined
                        })
                    });

                    if (response.status === 429 && attempt < maxRetries) {
                        const waitTime = (attempt + 1) * 2000;
                        console.warn(`⚠️ Rate Limit (429) en ${currentModel}. Reintentando en ${waitTime}ms...`);
                        await new Promise(res => setTimeout(res, waitTime));
                        continue;
                    }

                    if (!response.ok) {
                        const errBody = await response.json().catch(() => ({}));
                        console.warn(`Error en llamada a LLM (${currentModel}):`, errBody);
                        // Si es 404 (modelo no disponible) u otro error del servidor, probar el siguiente modelo
                        break;
                    }

                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || '';

                    if (jsonMode) {
                        try {
                            JSON.parse(content);
                        } catch (jsonErr) {
                            if (attempt < maxRetries) continue;
                            break;
                        }
                    }

                    return content;
                } catch (error: any) {
                    if (error.name === 'AbortError') throw error;
                    console.warn(`Intento fallido con ${currentModel}:`, error);
                    break;
                }
            }
        }

        return 'Disculpa, el asistente ha tenido un problema temporal al procesar tu consulta. Por favor, inténtalo de nuevo.';

        return 'El asistente no pudo responder tras varios intentos.';
    }

    /**
     * Búsqueda en vivo en Internet vía Tavily API
     */
    public static async searchWeb(query: string): Promise<string> {
        const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;
        if (!tavilyKey) {
            return 'Búsqueda web no configurada (falta VITE_TAVILY_API_KEY).';
        }

        try {
            console.log(`🌐 Realizando búsqueda web para: "${query}"`);
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: tavilyKey,
                    query,
                    search_depth: 'basic',
                    include_answer: true,
                    max_results: 3
                })
            });

            if (!response.ok) {
                return `Error en la búsqueda web: status ${response.status}`;
            }

            const data = await response.json();
            let summary = data.answer ? `RESUMEN: ${data.answer}\n\n` : '';

            if (data.results && Array.isArray(data.results)) {
                summary += 'RESULTADOS ENCONTRADOS:\n';
                data.results.forEach((r: any, idx: number) => {
                    summary += `${idx + 1}. [${r.title}](${r.url}): ${r.content}\n\n`;
                });
            }

            return summary.trim() || 'No se encontraron resultados relevantes.';
        } catch (err: any) {
            console.error('Error al consultar Tavily:', err);
            return `Error de conexión en búsqueda web: ${err.message}`;
        }
    }
}


import { pipeline } from '@xenova/transformers';

class EmbeddingService {
    private static instance: EmbeddingService;
    private pipe: any = null;

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    public async init() {
        if (!this.pipe) {
            try {
                console.log("Cargando modelo de embeddings...");

                // Configuración para mayor compatibilidad
                const { env } = await import('@xenova/transformers');
                env.allowLocalModels = false; // Forzar descarga si no está en cache
                env.useBrowserCache = true;

                // Usamos un modelo pequeño y eficiente para el navegador
                this.pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
                console.log("Modelo de embeddings cargado correctamente.");
            } catch (error: any) {
                console.error("Error crítico cargando el modelo Xenova:", error);
                throw new Error(`Error de conexión con el servidor de IA: ${error.message || 'Desconocido'}`);
            }
        }
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        await this.init();
        const result = await this.pipe(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }
}

export const embeddingService = EmbeddingService.getInstance();

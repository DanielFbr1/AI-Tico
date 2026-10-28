
import { pipeline } from '@xenova/transformers';

class EmbeddingService {
    private static instance: EmbeddingService;
    private pipe: any = null;
    private isInitializing: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    public async init(): Promise<void> {
        if (this.pipe) return;
        if (this.isInitializing) return this.isInitializing;

        this.isInitializing = (async () => {
            try {
                console.log("Cargando modelo de embeddings...");

                const { env } = await import('@xenova/transformers');
                env.allowLocalModels = false;
                env.useFSCache = false;
                
                // Desactivar browserCache si no está soportado en este entorno
                const canUseBrowserCache = typeof window !== 'undefined' && 'caches' in window;
                env.useBrowserCache = canUseBrowserCache;

                try {
                    this.pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
                } catch (firstErr: any) {
                    console.warn("Fallo con cache del navegador, reintentando con useBrowserCache=false...", firstErr);
                    env.useBrowserCache = false;
                    this.pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
                }

                console.log("Modelo de embeddings cargado correctamente.");
            } catch (error: any) {
                console.error("Error crítico cargando el modelo Xenova:", error);
                throw new Error(`Error de conexión con el servidor de IA: ${error.message || 'Desconocido'}`);
            } finally {
                this.isInitializing = null;
            }
        })();

        return this.isInitializing;
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        await this.init();
        if (!this.pipe) {
            throw new Error("El modelo de embeddings no está inicializado.");
        }
        const result = await this.pipe(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }
}

export const embeddingService = EmbeddingService.getInstance();

import { supabase } from '../lib/supabase';
import { embeddingService } from './embeddings';
import { DocumentParser } from './documentParser';
import { AIProvider, LLMMessage } from './aiProvider';
import { ColegioDocumento, ColegioChunk, FuenteRAG, ColegioConfigIA } from '../types';

export class ColegioRAGService {
    /**
     * Elimina secuencias de escape Unicode no válidas y caracteres problemáticos
     * que causan el error "unsupported Unicode escape sequence" en PostgreSQL
     */
    private static sanitizeText(text: string): string {
        return text
            // Eliminar secuencias \uXXXX inválidas (solo conservar las válidas 0000-FFFF)
            .replace(/\\u(?![0-9a-fA-F]{4})[^\\]*/g, ' ')
            // Reemplazar caracteres nulos
            .replace(/\x00/g, '')
            // Normalizar retornos de carro
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Eliminar caracteres de control excepto tab y newline
            .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
            .trim();
    }

    /**
     * Calcula la similitud de coseno entre dos vectores
     */
    private static cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Divide texto en fragmentos (chunks) estructurados con solapamiento
     */
    private static chunkText(text: string, chunkSize = 700, overlap = 100): string[] {
        if (!text) return [];
        const cleanText = text.replace(/\r\n/g, '\n');
        const chunks: string[] = [];
        
        let startIndex = 0;
        while (startIndex < cleanText.length) {
            let endIndex = startIndex + chunkSize;
            
            // Intentar cortar en salto de línea o punto para no romper frases a la mitad
            if (endIndex < cleanText.length) {
                const nextNewline = cleanText.indexOf('\n', endIndex - 80);
                if (nextNewline !== -1 && nextNewline < endIndex + 80) {
                    endIndex = nextNewline;
                } else {
                    const nextPeriod = cleanText.indexOf('. ', endIndex - 60);
                    if (nextPeriod !== -1 && nextPeriod < endIndex + 60) {
                        endIndex = nextPeriod + 1;
                    }
                }
            }

            const chunk = cleanText.slice(startIndex, endIndex).trim();
            if (chunk.length > 20) {
                chunks.push(chunk);
            }

            startIndex += (chunkSize - overlap);
        }

        return chunks;
    }

    /**
     * Ingesta y procesa completamente un archivo para un colegio específico
     */
    public static async ingestDocument(
        colegioId: string,
        file: File,
        onProgress?: (status: string, percentage: number) => void
    ): Promise<ColegioDocumento> {
        if (!colegioId) throw new Error('Se requiere el ID del colegio.');

        onProgress?.(`Leyendo ${file.name}...`, 10);
        const parsed = await DocumentParser.parseFile(file);

        onProgress?.('Extrayendo fragmentos semánticos...', 30);
        const textChunks = this.chunkText(parsed.text);

        if (textChunks.length === 0) {
            throw new Error('No se pudo extraer contenido útil del documento.');
        }

        // Subir archivo original a Supabase Storage (para descarga posterior)
        let fileUrl: string | undefined;
        try {
            const { data: userAuth } = await supabase.auth.getUser();
            const userId = userAuth?.user?.id || 'anon';
            const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `${userId}/${colegioId}/${Date.now()}_${safeFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('colegio-documentos')
                .upload(storagePath, file, { cacheControl: '3600', upsert: false });

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('colegio-documentos')
                    .getPublicUrl(storagePath);
                fileUrl = urlData?.publicUrl;
            }
        } catch (storageErr) {
            console.warn('Advertencia: no se pudo subir el archivo original al storage. Solo se indexará el texto.', storageErr);
        }

        // Crear registro en colegio_documentos
        const { data: userAuth } = await supabase.auth.getUser();
        const { data: docRecord, error: docError } = await supabase
            .from('colegio_documentos')
            .insert({
                colegio_id: colegioId,
                nombre_archivo: file.name,
                tipo_archivo: parsed.fileType,
                tamano_bytes: file.size,
                total_chunks: textChunks.length,
                estado: 'procesando',
                metadata: { totalPages: parsed.totalPages || 1 },
                file_url: fileUrl,
                subido_por: userAuth?.user?.id
            })
            .select()
            .single();

        if (docError || !docRecord) {
            throw new Error(`Error al registrar documento: ${docError?.message || 'Desconocido'}`);
        }

        // Generar embeddings y guardar fragmentos
        onProgress?.('Iniciando modelo de embeddings...', 45);
        await embeddingService.init();

        const insertedChunks = [];
        const total = textChunks.length;

        for (let i = 0; i < total; i++) {
            // Sanitizar el contenido para evitar secuencias Unicode no válidas en PostgreSQL
            const chunkContent = this.sanitizeText(textChunks[i]);
            if (!chunkContent) continue;

            const currentPct = 45 + Math.round(((i + 1) / total) * 45);
            onProgress?.(`Vectorizando fragmento ${i + 1} de ${total}...`, currentPct);

            const embeddingRaw = await embeddingService.generateEmbedding(chunkContent);
            // Convertir a array JS plano (compatible con JSONB en Supabase)
            const embedding = Array.from(embeddingRaw);

            insertedChunks.push({
                colegio_id: colegioId,
                documento_id: docRecord.id,
                chunk_index: i,
                contenido: chunkContent,
                embedding: embedding,
                metadata: {
                    nombre_archivo: file.name,
                    tipo_archivo: parsed.fileType,
                    chunk_index: i,
                    total_chunks: total
                }
            });
        }

        onProgress?.('Guardando memoria institucional en base de datos...', 92);

        // Inserción en lotes para máxima velocidad
        const { error: chunkInsertError } = await supabase
            .from('colegio_conocimiento_chunks')
            .insert(insertedChunks);

        if (chunkInsertError) {
            await supabase.from('colegio_documentos').update({ estado: 'error' }).eq('id', docRecord.id);
            throw new Error(`Error guardando fragmentos: ${chunkInsertError.message}`);
        }

        // Actualizar estado del documento a 'indexado'
        const { data: updatedDoc } = await supabase
            .from('colegio_documentos')
            .update({ estado: 'indexado', total_chunks: total })
            .eq('id', docRecord.id)
            .select()
            .single();

        onProgress?.('¡Documento indexado con éxito en la memoria del colegio!', 100);
        return updatedDoc as ColegioDocumento;
    }

    /**
     * Obtiene la lista de documentos de un colegio
     */
    public static async getDocuments(colegioId: string): Promise<ColegioDocumento[]> {
        const { data, error } = await supabase
            .from('colegio_documentos')
            .select('*')
            .eq('colegio_id', colegioId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo documentos:', error);
            return [];
        }
        return data as ColegioDocumento[];
    }

    /**
     * Elimina un documento y todos sus chunks asociados
     */
    public static async deleteDocument(colegioId: string, documentoId: string): Promise<void> {
        // Borrar chunks
        await supabase
            .from('colegio_conocimiento_chunks')
            .delete()
            .eq('colegio_id', colegioId)
            .eq('documento_id', documentoId);

        // Borrar documento
        const { error } = await supabase
            .from('colegio_documentos')
            .delete()
            .eq('colegio_id', colegioId)
            .eq('id', documentoId);

        if (error) throw error;
    }

    /**
     * Búsqueda semántica vectorial filtrada estrictamente por colegio_id
     */
    public static async searchKnowledge(
        colegioId: string,
        query: string,
        topK = 4
    ): Promise<Array<{ chunk: ColegioChunk; score: number }>> {
        if (!colegioId || !query.trim()) return [];

        try {
            await embeddingService.init();
            const queryEmbedding = await embeddingService.generateEmbedding(query);

            // Obtener chunks del colegio
            const { data: chunks, error } = await supabase
                .from('colegio_conocimiento_chunks')
                .select('*')
                .eq('colegio_id', colegioId);

            if (error || !chunks || chunks.length === 0) {
                return [];
            }

            // Calcular similitud con cada chunk
            const scored = chunks.map(chunk => {
                const emb = Array.isArray(chunk.embedding) ? chunk.embedding : [];
                const score = this.cosineSimilarity(queryEmbedding, emb);
                return { chunk: chunk as ColegioChunk, score };
            });

            // Ordenar por mayor puntuación
            scored.sort((a, b) => b.score - a.score);

            // Retornar los top K más relevantes
            return scored.slice(0, topK);
        } catch (e) {
            console.error('Error en búsqueda semántica:', e);
            return [];
        }
    }

    /**
     * Orquestación de consulta al Asistente IA del Colegio
     */
    public static async askColegioAssistant(
        colegio: { id: string; nombre: string; configuracion_ia?: ColegioConfigIA },
        pregunta: string,
        historial: Array<{ role: 'user' | 'assistant'; content: string }> = [],
        signal?: AbortSignal
    ): Promise<{ respuesta: string; fuentes: FuenteRAG[] }> {
        const colegioId = colegio.id;
        const nombreColegio = colegio.nombre;
        const nombreAsistente = colegio.configuracion_ia?.nombre_asistente || `Asistente de ${nombreColegio}`;
        const tono = colegio.configuracion_ia?.tono || 'Profesional, amable, educativo y cercano';
        const instruccionesExtra = colegio.configuracion_ia?.instrucciones_especificas || '';
        const permitirWeb = colegio.configuracion_ia?.permitir_busqueda_web ?? true;

        const fuentes: FuenteRAG[] = [];

        // 1. Búsqueda semántica en los documentos del colegio
        const relevantChunks = await this.searchKnowledge(colegioId, pregunta, 4);
        
        // Umbral de relevancia para considerar que el documento contiene la respuesta
        const MIN_SCORE_CONFIDENCE = 0.28;
        const matchingChunks = relevantChunks.filter(r => r.score >= MIN_SCORE_CONFIDENCE);

        let contextPrompt = '';

        if (matchingChunks.length > 0) {
            contextPrompt += `\nDOCUMENTOS INTERNOS DEL COLEGIO "${nombreColegio}":\n`;
            matchingChunks.forEach((item, idx) => {
                const docName = item.chunk.metadata?.nombre_archivo || 'Documento oficial';
                contextPrompt += `\n[Fuente ${idx + 1}: ${docName}]\n${item.chunk.contenido}\n`;
                
                fuentes.push({
                    tipo: 'documento',
                    titulo: docName,
                    snippet: item.chunk.contenido.slice(0, 150) + '...',
                    documento_id: item.chunk.documento_id,
                    score: Math.round(item.score * 100)
                });
            });
        }

        // 2. Comprobar si la pregunta requiere explícitamente búsqueda web en tiempo real
        let webContext = '';
        const queriesWebTrigger = /(noticias|actualidad|hoy|calendario escolar oficial|boe|bocm|legislacion|ley|tiempo|clima|ministerio)/i;
        
        if (permitirWeb && matchingChunks.length === 0 && queriesWebTrigger.test(pregunta)) {
            try {
                const webResults = await AIProvider.searchWeb(`${pregunta} España educación`);
                if (webResults && !webResults.includes('Error')) {
                    webContext = `\nINFORMACIÓN OBTENIDA DE INTERNET:\n${webResults}\n`;
                    fuentes.push({
                        tipo: 'web',
                        titulo: 'Búsqueda en Internet (Web en tiempo real)',
                        snippet: webResults.slice(0, 160) + '...'
                    });
                }
            } catch (webErr) {
                console.warn('Búsqueda web opcional no disponible:', webErr);
            }
        }

        // Si no se usaron ni documentos ni web, marcar conocimiento general
        if (fuentes.length === 0) {
            fuentes.push({
                tipo: 'conocimiento_general',
                titulo: 'Conocimiento general educativo e institucional',
                snippet: 'Respuesta formulada a partir del conocimiento pedagógico y normativo estándar.'
            });
        }

        // 3. Elaborar System Prompt institucional
        const systemPrompt = `Eres ${nombreAsistente}, el asistente oficial de inteligencia artificial del centro educativo "${nombreColegio}".

PERSONALIDAD Y DIRECTRICES:
- Tu tono es: ${tono}.
- Eres profesional, amable, educativo, claro, cercano y preciso.
- Tu misión es asistir a los directivos, docentes, coordinadores y miembros del colegio con rigor institucional.
- NUNCA inventes información. Si no dispones del dato en la documentación ni en fuentes fiables, indícalo con cortesía y sugiere consultar a la dirección del centro.
- Si respondes usando los documentos del centro, fundamenta tu respuesta en ellos.
- Si usas información general o de internet, indícalo con naturalidad.

${instruccionesExtra ? `INSTRUCCIONES ESPECÍFICAS DE ESTA INSTITUCIÓN:\n${instruccionesExtra}\n` : ''}
${contextPrompt}
${webContext}
`;

        const messages: LLMMessage[] = [
            { role: 'system', content: systemPrompt },
            ...historial.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: pregunta }
        ];

        const respuesta = await AIProvider.generateCompletion(messages, {
            temperature: 0.4,
            maxTokens: 2048,
            signal
        });

        // 4. Guardar en historial institucional en segundo plano
        try {
            const { data: userAuth } = await supabase.auth.getUser();
            await supabase.from('colegio_mensajes_ia').insert({
                colegio_id: colegioId,
                usuario_id: userAuth?.user?.id,
                remitente_nombre: userAuth?.user?.user_metadata?.nombre || 'Administrador',
                rol_remitente: 'colegio',
                pregunta,
                respuesta,
                fuentes_usadas: fuentes
            });
        } catch (dbErr) {
            console.warn('No se pudo guardar registro de consulta en DB:', dbErr);
        }

        return {
            respuesta,
            fuentes
        };
    }
}

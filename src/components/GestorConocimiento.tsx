
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { embeddingService } from '../services/embeddings';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js usando el archivo local
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const GestorConocimiento: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [documentos, setDocumentos] = useState<any[]>([]);

    useEffect(() => {
        cargarDocumentos();
    }, []);

    const cargarDocumentos = async () => {
        const { data } = await supabase.from('documentos').select('id, metadata, created_at').order('created_at', { ascending: false });
        if (data) setDocumentos(data);
    };

    const procesarArchivo = async (file: File) => {
        try {
            setLoading(true);
            setStatus(`Leyendo ${file.name}...`);

            let text = "";
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items
                        .map((item: any) => item.str || '')
                        .join(' ');
                    text += pageText + "\n";
                }
            } else {
                text = await file.text();
            }

            if (!text || text.trim().length < 5) {
                throw new Error("El documento parece estar vacío o no se pudo extraer el texto.");
            }

            // Chunking (dividir texto en trozos)
            const chunkSize = 1000;
            const chunks = [];
            for (let i = 0; i < text.length; i += chunkSize) {
                chunks.push(text.slice(i, i + chunkSize));
            }

            setStatus(`Generando embeddings para ${chunks.length} fragmentos... (Esto tarda un poco en tu navegador)`);

            // Inicializar modelo
            try {
                await embeddingService.init();
            } catch (initError) {
                console.error("Error al inicializar el modelo de IA:", initError);
                throw new Error("No se pudo cargar el modelo de IA. Verifica tu conexión.");
            }

            for (const [index, chunk] of chunks.entries()) {
                setStatus(`Procesando fragmento ${index + 1}/${chunks.length}...`);
                const embedding = await embeddingService.generateEmbedding(chunk);

                const { error: insertError } = await supabase.from('documentos').insert({
                    content: chunk,
                    metadata: { filename: file.name, chunkIndex: index, totalChunks: chunks.length },
                    embedding: embedding
                });

                if (insertError) {
                    console.error("Error insertando en Supabase:", insertError);
                    throw new Error(`Error al guardar en la base de datos: ${insertError.message}`);
                }
            }

            setStatus("¡Documento procesado y guardado en la memoria de Tico!");
            cargarDocumentos();
        } catch (error: any) {
            console.error("Detalle completo del error:", error);
            const errorMessage = error.message || "Error desconocido";
            setStatus(`Error: ${errorMessage}. Intenta recargar la página o revisa tu internet.`);
        } finally {
            setLoading(false);
        }
    };

    const eliminarDocumento = async (filename: string) => {
        // Borrar todos los chunks de ese archivo (usando metadata->>filename)
        // Nota: Esto es ineficiente si hay muchos, pero sirve por ahora
        // Mejor sería tener una tabla 'archivos' y 'chunks' relacionada.
        // Aquí borramos por metadata
        const { error } = await supabase.from('documentos').delete().eq('metadata->>filename', filename);
        if (error) console.error(error);
        cargarDocumentos();
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                📚 Base de Conocimiento (Cerebro de Tico)
            </h2>

            <p className="text-sm text-slate-500 mb-6">
                Sube documentos PDF o de texto para que Tico pueda aprender de ellos.
                El procesamiento ocurre en tu navegador (privado y gratis).
            </p>

            <div className="mb-8">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click para subir</span> o arrastra un archivo</p>
                        <p className="text-xs text-slate-500">PDF o TXT</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => e.target.files?.[0] && procesarArchivo(e.target.files[0])} disabled={loading} />
                </label>
            </div>

            {status && (
                <div className={`p-4 mb-6 rounded-lg ${status.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {status}
                </div>
            )}

            <div className="space-y-2">
                <h3 className="font-medium text-slate-700">Documentos en Memoria</h3>
                {documentos.length === 0 && <p className="text-slate-400 italic">No hay documentos cargados.</p>}

                {/* Agrupar por nombre de archivo para mostrar lista limpia */}
                {Array.from(new Set(documentos.map(d => d.metadata.filename))).map((filename) => (
                    <div key={filename as string} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">📄 {filename as string}</span>
                        <button
                            onClick={() => eliminarDocumento(filename as string)}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                        >
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Colegio, ColegioDocumento } from '../../types';
import { ColegioRAGService } from '../../services/colegioRAGService';
import { UploadCloud, FileText, FileSpreadsheet, FileCode, Trash2, CheckCircle2, Loader2, Sparkles, Database, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ColegioGestorDocumentalProps {
    colegio: Colegio;
}

export function ColegioGestorDocumental({ colegio }: ColegioGestorDocumentalProps) {
    const [documentos, setDocumentos] = useState<ColegioDocumento[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ status: string; percentage: number }>({ status: '', percentage: 0 });
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        if (colegio.id) {
            cargarDocumentos();
        }
    }, [colegio.id]);

    const cargarDocumentos = async () => {
        try {
            setLoading(true);
            const docs = await ColegioRAGService.getDocuments(colegio.id);
            setDocumentos(docs);
        } catch (err) {
            console.error('Error cargando documentos:', err);
            toast.error('Error al cargar la lista de documentos');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        // Validar tamaño máximo (20 MB)
        if (file.size > 20 * 1024 * 1024) {
            toast.error('El archivo excede el límite máximo de 20 MB');
            return;
        }

        setUploading(true);
        setUploadProgress({ status: `Iniciando análisis de ${file.name}...`, percentage: 5 });

        try {
            await ColegioRAGService.ingestDocument(
                colegio.id,
                file,
                (status, percentage) => {
                    setUploadProgress({ status, percentage });
                }
            );

            toast.success(`"${file.name}" indexado con éxito en el cerebro del colegio`);
            await cargarDocumentos();
        } catch (error: any) {
            console.error('Error procesando archivo:', error);
            toast.error(`Error al procesar "${file.name}": ${error.message || 'Desconocido'}`);
        } finally {
            setUploading(false);
            setUploadProgress({ status: '', percentage: 0 });
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDelete = async (doc: ColegioDocumento) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${doc.nombre_archivo}" de la memoria del asistente?`)) {
            return;
        }

        try {
            await ColegioRAGService.deleteDocument(colegio.id, doc.id);
            toast.success('Documento eliminado');
            setDocumentos(prev => prev.filter(d => d.id !== doc.id));
        } catch (err: any) {
            console.error('Error eliminando documento:', err);
            toast.error('Error al eliminar el documento');
        }
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-rose-500" />;
            case 'docx': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'xlsx': return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
            default: return <FileCode className="w-5 h-5 text-slate-500" />;
        }
    };

    const totalChunks = documentos.reduce((acc, d) => acc + (d.total_chunks || 0), 0);

    return (
        <div className="space-y-6">
            {/* Cabecera & Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white border border-indigo-500/20 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Documentos Oficiales</p>
                        <h4 className="text-3xl font-black mt-1 tracking-tight">{documentos.length}</h4>
                        <p className="text-[11px] text-indigo-200/70 mt-1">Activos en la memoria</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 p-5 rounded-3xl text-white border border-blue-500/20 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Fragmentos Vectoriales</p>
                        <h4 className="text-3xl font-black mt-1 tracking-tight">{totalChunks}</h4>
                        <p className="text-[11px] text-blue-200/70 mt-1">Nodos RAG indexados</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                        <Database className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 p-5 rounded-3xl text-white border border-emerald-500/20 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Aislamiento de Datos</p>
                        <h4 className="text-xl font-black mt-1 tracking-tight text-emerald-400">100% Blindado</h4>
                        <p className="text-[11px] text-emerald-200/70 mt-1">Exclusivo para {colegio.nombre}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                        <Sparkles className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Zona de Carga Drag & Drop */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-indigo-600" />
                    Subir Nuevos Documentos a la Memoria de la IA
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                    Sube reglamentos, proyectos educativos de centro (PEC), normativas, manuales, protocolos de convivencia o calendarios en formato <strong>PDF, Word (.docx), Excel (.xlsx/.csv) o Texto (.txt)</strong>.
                </p>

                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                        isDragOver
                            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                            : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-indigo-400'
                    }`}
                >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-inner">
                        <UploadCloud className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Arrastra tus archivos aquí o haz clic para seleccionarlos
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mb-4">
                        Formatos soportados: PDF, DOCX, XLSX, CSV, TXT (hasta 20 MB por archivo)
                    </p>

                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all">
                            <Plus className="w-4 h-4" />
                            Seleccionar Documento
                        </span>
                    </label>
                </div>

                {/* Barra de Progreso de Ingesta */}
                {uploading && (
                    <div className="mt-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 animate-in fade-in">
                        <div className="flex items-center justify-between mb-2 text-xs font-bold text-indigo-900">
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                {uploadProgress.status}
                            </span>
                            <span>{uploadProgress.percentage}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-indigo-200/60 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress.percentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Listado de Documentos */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Documentos Indexados</h3>
                        <p className="text-xs text-slate-500">Base de conocimiento activa del colegio</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {documentos.length} archivos
                    </span>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <p className="text-xs font-medium">Cargando base documental...</p>
                    </div>
                ) : documentos.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">Aún no hay documentos subidos</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Sube el primer documento del centro para que el asistente pueda empezar a responder preguntas basadas en él.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {documentos.map((doc) => (
                            <div
                                key={doc.id}
                                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-3 rounded-2xl transition-colors"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                                        {getFileIcon(doc.tipo_archivo)}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-bold text-slate-800 truncate">{doc.nombre_archivo}</p>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                                            <span className="uppercase font-bold text-slate-500">{doc.tipo_archivo}</span>
                                            <span>•</span>
                                            <span>{doc.total_chunks || 0} fragmentos semánticos</span>
                                            <span>•</span>
                                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Indexado
                                    </span>

                                    {doc.file_url ? (
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Ver / Descargar documento original"
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    ) : (
                                        <span title="El archivo original no fue guardado (solo texto indexado)" className="p-2 text-slate-300 cursor-not-allowed">
                                            <ExternalLink className="w-4 h-4" />
                                        </span>
                                    )}

                                    <button
                                        onClick={() => handleDelete(doc)}
                                        title="Eliminar documento"
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

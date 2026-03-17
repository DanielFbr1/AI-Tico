import { FileText, Award, Users, Paperclip, Clock, X, Trash2, CheckCircle2, Send, ChevronRight, AlertCircle, Bookmark, Upload } from 'lucide-react';
import { TareaDetallada, Grupo } from '../types';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ModalDetalleTareaProps {
    tarea: TareaDetallada;
    grupos: Grupo[];
    onClose: () => void;
    onDelete?: (id: string) => void;
    onEstadoChange: (id: string, estado: string) => void;
    onSaveAlumnoContent?: (id: string, contenido: string, archivos: any[]) => Promise<void>;
    isStudent?: boolean;
}

export function ModalDetalleTarea({ tarea, grupos, onClose, onDelete, onEstadoChange, onSaveAlumnoContent, isStudent }: ModalDetalleTareaProps) {
    const [contenidoAlumno, setContenidoAlumno] = useState(tarea.contenido_alumno || '');
    const [archivosAlumno, setArchivosAlumno] = useState<any[]>(tarea.archivos_alumno || []);
    const [guardando, setGuardando] = useState(false);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDeleteFile = async (idx: number) => {
        const nuevosArchivos = archivosAlumno.filter((_, i) => i !== idx);
        setArchivosAlumno(nuevosArchivos);
        if (onSaveAlumnoContent) {
            await onSaveAlumnoContent(tarea.id, contenidoAlumno, nuevosArchivos);
        }
        toast.success('Evidencia eliminada');
    };

    const handleAnularEntrega = async () => {
        if (confirm('¿Quieres anular el envío y volver a editar la tarea?')) {
            onEstadoChange(tarea.id, 'en_progreso');
            toast.info('Envío anulado. Ya puedes editar de nuevo.');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        setSubiendoArchivo(true);
        const files = Array.from(e.target.files);
        const nuevosArchivos = [...archivosAlumno];

        for (const file of files) {
            try {
                const fileName = `${Date.now()}_${file.name}`;
                const filePath = `tareas_alumnos/${tarea.proyecto_id}/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('recursos')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: publicUrl } = supabase.storage
                    .from('recursos')
                    .getPublicUrl(filePath);

                nuevosArchivos.push({
                    nombre: file.name,
                    url: publicUrl.publicUrl,
                    tipo: file.type,
                    tamano: file.size
                });
            } catch (err) {
                console.error('Error al subir archivo:', err);
                toast.error(`Error al subir ${file.name}`);
            }
        }

        setArchivosAlumno(nuevosArchivos);
        setSubiendoArchivo(false);
        if (onSaveAlumnoContent) {
            await onSaveAlumnoContent(tarea.id, contenidoAlumno, nuevosArchivos);
        }
    };

    const grupoNombre = tarea.grupo_id ? grupos.find(g => Number(g.id) === tarea.grupo_id)?.nombre : 'Todos los alumnos';

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const getFileIcon = (tipo: string) => {
        if (tipo.startsWith('image')) return '🖼️';
        if (tipo === 'application/pdf') return '📄';
        if (tipo.includes('word') || tipo.includes('document')) return '📝';
        if (tipo === 'link') return '🔗';
        return '📎';
    };

    const puedeEnviarARevision = isStudent && (tarea.estado === 'pendiente' || tarea.estado === 'en_progreso');

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-start justify-center z-[100] p-4 md:p-8 animate-in fade-in zoom-in duration-300 overflow-y-auto scrollbar-hide">
            <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.15)] w-full max-w-4xl my-4 overflow-hidden border border-white/40 relative flex flex-col">
                
                {/* Decoration Orbs */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header Section Compacto */}
                <div className="relative p-6 md:p-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white overflow-hidden shadow-xl shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-110">
                        <FileText className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                                Misión Activa
                            </span>
                            {tarea.fecha_entrega && new Date(tarea.fecha_entrega) < new Date() && tarea.estado !== 'completado' && (
                                <span className="px-3 py-1 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-rose-100 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Fuera de plazo
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="max-w-xl">
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-sm">{tarea.titulo}</h2>
                                <p className="text-blue-100 font-bold mt-2 flex items-center gap-2 text-xs md:text-sm opacity-90">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDate(tarea.created_at)}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={onClose}
                                    className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl transition-all text-white backdrop-blur-md border border-white/20 group shadow-lg active:scale-90"
                                >
                                    <X className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - GRID 2 Columnas */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* COLUMNA IZQUIERDA: Info y Entrega (lg:col-span-8) */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* Instructions Section */}
                            {tarea.descripcion && (
                                <div className="relative group">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
                                            <Bookmark className="w-3.5 h-3.5" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoja de Ruta</h3>
                                    </div>
                                    <div className="bg-slate-50/70 p-6 rounded-[2rem] text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 shadow-inner relative overflow-hidden group-hover:bg-slate-50 transition-colors text-sm">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/20" />
                                        {tarea.descripcion}
                                    </div>
                                </div>
                            )}

                            {/* Resources Section (Professor) */}
                            {tarea.archivos_adjuntos && tarea.archivos_adjuntos.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Paperclip className="w-4 h-4 text-slate-400" />
                                        Herramientas Adjuntas
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {tarea.archivos_adjuntos.map((archivo, idx) => (
                                            <a
                                                key={idx}
                                                href={archivo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all group relative overflow-hidden active:scale-95"
                                            >
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-50 transition-colors">
                                                    {getFileIcon(archivo.tipo)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">{archivo.nombre}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recurso Docente</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Delivery Section (Student) */}
                            {(isStudent || tarea.contenido_alumno || (tarea.archivos_alumno && tarea.archivos_alumno.length > 0)) && (
                                <div className="pt-8 border-t border-slate-100 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Send className="w-4 h-4 text-indigo-500" />
                                            Panel de Entrega
                                        </h3>
                                        {puedeEnviarARevision && (
                                            <button
                                                onClick={async () => {
                                                    if (onSaveAlumnoContent) {
                                                        setGuardando(true);
                                                        await onSaveAlumnoContent(tarea.id, contenidoAlumno, archivosAlumno);
                                                        setGuardando(false);
                                                    }
                                                    onEstadoChange(tarea.id, 'revision');
                                                    toast.success('¡Misión enviada con éxito!');
                                                }}
                                                disabled={guardando}
                                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {guardando ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : <Send className="w-3.5 h-3.5" />}
                                                {guardando ? 'Guardando...' : 'Entregar Misión'}
                                            </button>
                                        )}
                                        {isStudent && tarea.estado === 'revision' && (
                                            <button
                                                onClick={handleAnularEntrega}
                                                className="px-6 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Anular Entrega
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <textarea
                                                value={contenidoAlumno}
                                                onChange={(e) => setContenidoAlumno(e.target.value)}
                                                readOnly={!isStudent || tarea.estado === 'revision' || tarea.estado === 'aprobado'}
                                                placeholder="Escribe aquí tu respuesta, reflexiones o proceso de trabajo..."
                                                className="w-full min-h-[140px] p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all resize-none shadow-inner text-sm leading-relaxed"
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {(archivosAlumno || []).map((archivo: any, idx: number) => (
                                                <div key={idx} className="relative group/file">
                                                    <a 
                                                        href={archivo.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center gap-3 px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group max-w-[240px]"
                                                    >
                                                        <div className="text-base">{getFileIcon(archivo.tipo)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-slate-700 truncate group-hover:text-indigo-600 transition-colors uppercase">{archivo.nombre}</p>
                                                        </div>
                                                    </a>
                                                    {isStudent && tarea.estado !== 'revision' && tarea.estado !== 'aprobado' && (
                                                        <button 
                                                            onClick={() => handleDeleteFile(idx)}
                                                            className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/file:opacity-100 transition-opacity hover:scale-110 active:scale-90"
                                                        >
                                                            <Trash2 className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {isStudent && tarea.estado !== 'revision' && tarea.estado !== 'aprobado' && (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={subiendoArchivo}
                                                    className="flex items-center gap-2 px-5 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest group"
                                                >
                                                    {subiendoArchivo ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                                    {subiendoArchivo ? 'Subiendo...' : 'Subir Archivos de Evidencia'}
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            multiple 
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* COLUMNA DERECHA: Widgets y Estado (lg:col-span-4) */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Status Card Compacta */}
                            <div className={`rounded-[2rem] p-6 text-center border-2 transition-all ${
                                tarea.estado === 'aprobado' || tarea.estado === 'completado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-lg shadow-emerald-100/50' :
                                tarea.estado === 'revision' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-lg shadow-amber-100/50 animate-pulse' :
                                tarea.estado === 'rechazado' ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-lg shadow-rose-100/50' :
                                'bg-slate-50 border-slate-200 text-slate-500 shadow-lg shadow-slate-100/50'
                            }`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Status de la Misión</p>
                                <span className="text-xl font-black uppercase tracking-tight">
                                    {tarea.estado === 'revision' ? 'En Revisión' : 
                                     tarea.estado === 'aprobado' || tarea.estado === 'completado' ? 'Completada' : 
                                     tarea.estado === 'rechazado' ? 'Reintentar' :
                                     tarea.estado === 'en_progreso' ? 'En Curso' : 'Pendiente'}
                                </span>
                            </div>

                            {/* Widgets List */}
                            <div className="space-y-3">
                                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white transition-all">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <Award className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-800 leading-none">{tarea.puntos_maximos}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Recompensa</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white transition-all">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <Users className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 truncate leading-none">{grupoNombre}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Destinatarios</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white transition-all">
                                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <Clock className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 leading-none">
                                            {tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin límite'}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Plazo de entrega</p>
                                    </div>
                                </div>
                            </div>

                            {/* Professor Actions Hub (SOLO SI ESTÁ EN REVISIÓN) */}
                            {!isStudent && tarea.estado === 'revision' && (
                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={() => {
                                            onEstadoChange(tarea.id, 'aprobado');
                                            toast.success('Misión aprobada con éxito');
                                        }}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-lg shadow-emerald-200 active:scale-95 border-b-4 border-emerald-800"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-sm font-black uppercase tracking-tight">Aprobar</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onEstadoChange(tarea.id, 'rechazado');
                                            toast.error('Misión devuelta para corrección');
                                        }}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-rose-100 hover:border-rose-400 text-rose-500 rounded-2xl transition-all active:scale-95 hover:bg-rose-50"
                                    >
                                        <X className="w-5 h-5" />
                                        <span className="text-sm font-black uppercase tracking-tight">Rechazar</span>
                                    </button>
                                </div>
                            )}

                            {/* Footer Actions Compactas */}
                            <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                                {!isStudent && onDelete && (
                                    <button
                                        onClick={() => { if (confirm('¿Eliminar esta tarea definitivamente?')) onDelete(tarea.id); }}
                                        className="w-full flex items-center justify-center gap-2 py-3 text-rose-400 hover:text-rose-600 font-black uppercase tracking-[0.1em] text-[10px] bg-rose-50/30 border border-rose-100 rounded-xl transition-all hover:bg-rose-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Eliminar Misión
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 uppercase tracking-[0.2em]"
                                >
                                    Salir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

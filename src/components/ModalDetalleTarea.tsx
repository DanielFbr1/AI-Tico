import { FileText, Star, Users, Paperclip, Clock, X, Trash2, CheckCircle2, Send } from 'lucide-react';
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
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] p-4 md:p-8 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl my-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 p-6 md:p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl md:text-2xl font-black tracking-tight truncate">{tarea.titulo}</h2>
                        <p className="text-sm text-blue-100 font-medium mt-0.5">
                            Creada el {formatDate(tarea.created_at)}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white group"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 space-y-6">

                    {/* Meta info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                            <p className="text-lg font-black text-slate-800">{tarea.puntos_maximos}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Puntos</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-sm font-black text-slate-800 truncate">{grupoNombre}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Asignada a</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <Paperclip className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                            <p className="text-lg font-black text-slate-800">{tarea.archivos_adjuntos?.length || 0}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Adjuntos</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <Clock className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                            <p className="text-xs font-black text-slate-800">
                                {tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '-'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Fecha límite</p>
                        </div>
                    </div>

                    {/* Estado y Acciones */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Estado de la Misión</h4>
                        {isStudent ? (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border-2 ${
                                    tarea.estado === 'aprobado' || tarea.estado === 'completado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    tarea.estado === 'revision' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                    tarea.estado === 'en_progreso' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                    {tarea.estado === 'revision' ? '⏳ En revisión' : 
                                     tarea.estado === 'aprobado' || tarea.estado === 'completado' ? '✅ Logrado' : 
                                     tarea.estado === 'rechazado' ? '❌ Necesita mejoras' :
                                     tarea.estado === 'en_progreso' ? '🔵 En curso' : '⏳ Pendiente'}
                                </div>
                                {puedeEnviarARevision && (
                                    <button
                                        onClick={async () => {
                                            if (onSaveAlumnoContent) {
                                                setGuardando(true);
                                                await onSaveAlumnoContent(tarea.id, contenidoAlumno, archivosAlumno);
                                                setGuardando(false);
                                            }
                                            onEstadoChange(tarea.id, 'revision');
                                        }}
                                        disabled={guardando}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            {guardando ? 'Guardando...' : <><Send className="w-3.5 h-3.5" /> Enviar a Revisión</>}
                                        </div>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                {tarea.estado === 'revision' ? (
                                    <>
                                        <button
                                            onClick={() => onEstadoChange(tarea.id, 'aprobado')}
                                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => onEstadoChange(tarea.id, 'rechazado')}
                                            className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Rechazar
                                        </button>
                                    </>
                                ) : (
                                    <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border-2 ${
                                        tarea.estado === 'aprobado' || tarea.estado === 'completado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        tarea.estado === 'en_progreso' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                        'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}>
                                        {tarea.estado === 'aprobado' || tarea.estado === 'completado' ? '✅ Aprobada' : 
                                         tarea.estado === 'rechazado' ? '❌ Rechazada' :
                                         tarea.estado === 'en_progreso' ? '🔵 En curso' : '⏳ Pendiente'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Entrega del Alumno */}
                    {(isStudent || tarea.contenido_alumno || (tarea.archivos_alumno && tarea.archivos_alumno.length > 0)) && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                             <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Tu Entrega</h4>
                             </div>
                             
                             <div className="space-y-4">
                                <textarea
                                    value={contenidoAlumno}
                                    onChange={(e) => setContenidoAlumno(e.target.value)}
                                    readOnly={!isStudent || tarea.estado === 'revision' || tarea.estado === 'aprobado'}
                                    placeholder="Escribe aquí tu respuesta o proceso..."
                                    className="w-full min-h-[120px] p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all resize-none shadow-inner"
                                />

                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {(archivosAlumno || []).map((archivo: any, idx: number) => (
                                            <a key={idx} href={archivo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-indigo-50 rounded-xl border border-indigo-100 max-w-[200px] group transition-all hover:bg-indigo-100">
                                                <Paperclip className="w-3 h-3 text-indigo-500 shrink-0" />
                                                <span className="text-[10px] font-bold text-indigo-700 truncate">{archivo.nombre}</span>
                                            </a>
                                        ))}
                                    </div>

                                    {isStudent && tarea.estado !== 'revision' && tarea.estado !== 'aprobado' && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={subiendoArchivo}
                                            className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {subiendoArchivo ? (
                                                <div className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                                            ) : <Paperclip className="w-3.5 h-3.5" />}
                                            {subiendoArchivo ? 'Subiendo...' : 'Adjuntar trabajo'}
                                        </button>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        multiple 
                                        onChange={handleFileChange}
                                    />
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Instrucciones */}
                    {tarea.descripcion && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Instrucciones del Profesor</h4>
                            <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-100">
                                {tarea.descripcion}
                            </div>
                        </div>
                    )}

                    {/* Adjuntos del Profesor */}
                    {tarea.archivos_adjuntos && tarea.archivos_adjuntos.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Archivos adjuntos del Profesor</h4>
                            <div className="space-y-2">
                                {tarea.archivos_adjuntos.map((archivo, idx) => (
                                    <a
                                        key={idx}
                                        href={archivo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                                    >
                                        <span className="text-xl">{getFileIcon(archivo.tipo)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{archivo.nombre}</p>
                                        </div>
                                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all">Abrir</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 md:px-8 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
                    {!isStudent && onDelete ? (
                        <button
                            onClick={() => { if (confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) onDelete(tarea.id); }}
                            className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:text-rose-700 font-bold uppercase tracking-widest text-[10px] bg-rose-50 rounded-xl border border-rose-100/50 transition-all hover:scale-105 active:scale-95"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar tarea
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all active:scale-95"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

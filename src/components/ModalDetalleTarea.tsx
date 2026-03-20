import { FileText, Award, Users, Paperclip, Clock, X, Trash2, CheckCircle2, Send, ChevronRight, AlertCircle, Bookmark, Upload, Calendar, MessageSquare, Trash, ArrowLeft } from 'lucide-react';
import { TareaDetallada, Grupo } from '../types';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ModalDetalleTareaProps {
    tarea: TareaDetallada;
    grupos: Grupo[];
    onClose: () => void;
    onDelete?: (id: string) => void;
    onEstadoChange: (id: string, estado: string, calificacion?: number) => void;
    onUpdateTarea?: (id: string, data: any) => Promise<void>;
    onSaveAlumnoContent?: (id: string, contenido: string, archivos: any[]) => Promise<void>;
    isStudent?: boolean;
    targetGrupoId?: string | number;
}

export function ModalDetalleTarea({ tarea, grupos, onClose, onDelete, onEstadoChange, onUpdateTarea, onSaveAlumnoContent, isStudent, targetGrupoId }: ModalDetalleTareaProps) {
    const [editMode, setEditMode] = useState(!isStudent);
    const [titulo, setTitulo] = useState(tarea.titulo);
    const [descripcion, setDescripcion] = useState(tarea.descripcion || '');
    const [puntos, setPuntos] = useState<number>(Number(tarea.puntos_maximos) || 0);
    const [fecha, setFecha] = useState(tarea.fecha_entrega?.split('T')[0] || '');
    const [hora, setHora] = useState(tarea.fecha_entrega?.split('T')[1]?.substring(0, 5) || '23:59');
    const [grupoId, setGrupoId] = useState(tarea.grupo_id?.toString() || 'todos');
    const [estadoLocal, setEstadoLocal] = useState<any>(tarea.estado);
    const [archivosAdjuntos, setArchivosAdjuntos] = useState<any[]>(tarea.archivos_adjuntos || []);
    
    const [contenidoAlumno, setContenidoAlumno] = useState(tarea.contenido_alumno || '');
    const [archivosAlumno, setArchivosAlumno] = useState<any[]>(tarea.archivos_alumno || []);
    const [calificacion, setCalificacion] = useState<number>(Number(tarea.calificacion) || 0);
    const [chatComentarios, setChatComentarios] = useState<any[]>(tarea.chat_comentarios || []);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [cargandoEntrega, setCargandoEntrega] = useState(!!targetGrupoId);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const adjuntosInputRef = useRef<HTMLInputElement>(null);

    const hasChanges = !isStudent && (
        titulo !== tarea.titulo ||
        descripcion !== (tarea.descripcion || '') ||
        puntos !== tarea.puntos_maximos ||
        fecha !== (tarea.fecha_entrega?.split('T')[0] || '') ||
        hora !== (tarea.fecha_entrega?.split('T')[1]?.substring(0, 5) || '23:59') ||
        grupoId !== (tarea.grupo_id?.toString() || 'todos') ||
        estadoLocal !== tarea.estado ||
        JSON.stringify(archivosAdjuntos) !== JSON.stringify(tarea.archivos_adjuntos || [])
    );

    const handleUpdate = async () => {
        setGuardando(true);
        try {
            // 1. Si es docente y NO estamos en vista de grupo específico, actualizar la tarea base (global)
            if (!isStudent && onUpdateTarea && !targetGrupoId) {
                const data = {
                    titulo: titulo.trim(),
                    descripcion: descripcion.trim() || null,
                    puntos_maximos: puntos,
                    calificacion: calificacion || 0, 
                    chat_comentarios: chatComentarios || [],
                    fecha_entrega: fecha ? new Date(`${fecha}T${hora}`).toISOString() : null,
                    grupo_id: grupoId !== 'todos' ? parseInt(grupoId) : null,
                    estado: estadoLocal,
                    archivos_adjuntos: archivosAdjuntos
                };
                await onUpdateTarea(tarea.id, data);
            }

            // 2. Si hay targetGrupoId (estamos en el Hub o un alumno entregando), gestionar entrega específica
            if (targetGrupoId) {
                const targetGidNum = typeof targetGrupoId === 'number' ? targetGrupoId : parseInt(targetGrupoId as any);
                
                const { data: entregaExistente } = await supabase
                    .from('entregas_tareas')
                    .select('id')
                    .eq('tarea_id', tarea.id)
                    .eq('grupo_id', targetGidNum)
                    .maybeSingle();

                // Mapear estado para cumplir con el CHECK constraint de entregas_tareas
                // Allowed: ['borrador', 'entregada', 'evaluada']
                let estadoEntrega = 'entregada';
                if (isStudent) {
                    estadoEntrega = 'entregada';
                } else if (estadoLocal === 'aprobado' || estadoLocal === 'completado' || estadoLocal === 'evaluada') {
                    estadoEntrega = 'evaluada';
                }

                const entregaData = {
                    tarea_id: tarea.id,
                    grupo_id: targetGidNum,
                    respuesta_texto: contenidoAlumno,
                    archivos_entregados: archivosAlumno,
                    calificacion: calificacion || 0,
                    estado: estadoEntrega,
                    chat_comentarios: chatComentarios || [],
                    updated_at: new Date().toISOString()
                };

                if (entregaExistente) {
                    const { error: upError } = await supabase.from('entregas_tareas').update(entregaData).eq('id', entregaExistente.id);
                    if (upError) throw upError;
                } else {
                    const { error: inError } = await supabase.from('entregas_tareas').insert({
                        ...entregaData,
                        fecha_entrega: new Date().toISOString()
                    });
                    if (inError) throw inError;
                }
                
                // Si el docente aprueba desde el hub, otorgar puntos
                if (!isStudent && (estadoLocal === 'aprobado' || estadoLocal === 'completado')) {
                    onEstadoChange(tarea.id, estadoLocal, calificacion); 
                }
            }

            toast.success('Cambios guardados correctamente');
            onClose();
        } catch (err) {
            console.error('Error al actualizar:', err);
            toast.error('Error al guardar los cambios');
        } finally {
            setGuardando(false);
        }
    };

    // Efecto para cargar y SUSCRIBIRSE a la entrega/tarea (Realtime)
    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            if (targetGrupoId) {
                // CARGA INICIAL (GRUPO)
                setCargandoEntrega(true);
                const targetGidNum = typeof targetGrupoId === 'number' ? targetGrupoId : parseInt(targetGrupoId as any);
                const { data } = await supabase
                    .from('entregas_tareas')
                    .select('*')
                    .eq('tarea_id', tarea.id)
                    .eq('grupo_id', targetGidNum)
                    .maybeSingle(); 
                
                if (data) {
                    setContenidoAlumno(data.respuesta_texto || '');
                    setArchivosAlumno(data.archivos_entregados || []);
                    const rawCal = data.calificacion;
                    setCalificacion(typeof rawCal === 'number' ? rawCal : parseFloat(rawCal) || 0);
                    setEstadoLocal(data.estado);
                    setChatComentarios(data.chat_comentarios || []);
                }
                setCargandoEntrega(false);

                // SUSCRIPCIÓN (GRUPO)
                channel = supabase.channel(`chat_entrega_${tarea.id}_${targetGidNum}`)
                    .on('postgres_changes', { 
                        event: '*', 
                        schema: 'public', 
                        table: 'entregas_tareas',
                        filter: `tarea_id=eq.${tarea.id}` 
                    }, (payload: any) => {
                        // Solo actualizar si es nuestro grupo (comparación segura de tipos)
                        const data = payload.new || payload.old;
                        if (data && Number(data.grupo_id) === Number(targetGidNum)) {
                            if (data.chat_comentarios) setChatComentarios(data.chat_comentarios);
                            if (data.archivos_entregados) setArchivosAlumno(data.archivos_entregados);
                            if (data.calificacion !== undefined) setCalificacion(Number(data.calificacion) || 0);
                        }
                    })
                    .subscribe();
            } else {
                // CARGA INICIAL (GLOBAL)
                const notaGlobal = typeof tarea.calificacion === 'number' ? tarea.calificacion : parseFloat(tarea.calificacion as any) || 0;
                setCalificacion(notaGlobal);
                setChatComentarios(tarea.chat_comentarios || []);
                setCargandoEntrega(false);

                // SUSCRIPCIÓN (GLOBAL - Tabla Tareas)
                channel = supabase.channel(`chat_tarea_global_${tarea.id}`)
                    .on('postgres_changes', { 
                        event: '*', 
                        schema: 'public', 
                        table: 'tareas',
                        filter: `id=eq.${tarea.id}` 
                    }, (payload: any) => {
                        const data = payload.new || payload.old;
                        if (data && data.chat_comentarios) setChatComentarios(data.chat_comentarios);
                    })
                    .subscribe();
            }
        };

        setupRealtime();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [targetGrupoId, tarea.id]);

    const handleDeleteFile = async (idx: number) => {
        const nuevosArchivos = archivosAlumno.filter((_, i) => i !== idx);
        setArchivosAlumno(nuevosArchivos);
        
        // Persistencia inmediata (Upsert)
        if (targetGrupoId) {
            const targetGidNum = typeof targetGrupoId === 'number' ? targetGrupoId : parseInt(targetGrupoId as any);
            await supabase.from('entregas_tareas')
                .upsert({ 
                    tarea_id: tarea.id, 
                    grupo_id: targetGidNum, 
                    archivos_entregados: nuevosArchivos,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tarea_id,grupo_id' });
        }

        if (onSaveAlumnoContent) {
            await onSaveAlumnoContent(tarea.id, contenidoAlumno, nuevosArchivos);
        }
        toast.success('Archivo eliminado');
    };

    const handleAnularEntrega = async () => {
        if (confirm('¿Quieres anular el envío y volver a editar la tarea?')) {
            onEstadoChange(tarea.id, 'en_progreso', undefined);
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

        // Persistencia inmediata para bidireccionalidad (Upsert)
        if (targetGrupoId) {
            const targetGidNum = typeof targetGrupoId === 'number' ? targetGrupoId : parseInt(targetGrupoId as any);
            await supabase.from('entregas_tareas')
                .upsert({ 
                    tarea_id: tarea.id, 
                    grupo_id: targetGidNum, 
                    archivos_entregados: nuevosArchivos,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tarea_id,grupo_id' });
        }

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

    const isExpired = tarea.fecha_entrega && new Date(tarea.fecha_entrega) < new Date() && estadoLocal !== 'aprobado' && estadoLocal !== 'completado';
    
    const getComputedStatus = () => {
        if (estadoLocal === 'aprobado' || estadoLocal === 'completado') return 'Completada';
        if (estadoLocal === 'revision') return 'En Revisión';
        if (isExpired) return 'Expirada';
        if (estadoLocal === 'rechazado') return 'Rechazada';
        return 'Pendiente';
    };

    const statusLabel = getComputedStatus();

    const puedeEnviarARevision = isStudent && (tarea.estado === 'pendiente' || tarea.estado === 'en_progreso');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-100">
                
                {false ? ( // Desactivamos el overlay global para permitir ver instrucciones mientras carga
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando expediente del grupo...</p>
                    </div>
                ) : (
                    <>
                        {/* Botón Volver Minimalista (Arriba Izquierda) */}
                        <div className="absolute top-6 left-6 z-[160]">
                           <button 
                                onClick={onClose}
                                className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-2xl backdrop-blur-md border border-white/30 transition-all active:scale-90 shadow-xl group"
                                title="Volver al panel"
                           >
                               <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                           </button>
                        </div>

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
                                        {isStudent ? 'Misión Activa' : 'Editor de Misión'}
                                    </span>
                                    {tarea.fecha_entrega && new Date(tarea.fecha_entrega) < new Date() && tarea.estado !== 'completado' && (
                                        <span className="px-3 py-1 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-rose-100 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" /> Fuera de plazo
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div className="max-w-xl flex-1">
                                        {!isStudent ? (
                                            <input 
                                                value={titulo}
                                                onChange={(e) => setTitulo(e.target.value)}
                                                className="w-full bg-white/10 hover:bg-white/20 focus:bg-white text-white focus:text-slate-900 text-2xl md:text-3xl font-black tracking-tight leading-tight rounded-xl px-4 py-2 transition-all outline-none border-2 border-transparent focus:border-white shadow-inner placeholder:text-white/40"
                                                placeholder="Título de la misión..."
                                            />
                                        ) : (
                                            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-sm">{tarea.titulo}</h2>
                                        )}
                                        <p className="text-blue-100 font-bold mt-2 flex items-center gap-2 text-xs md:text-sm opacity-90 px-4">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDate(tarea.created_at)}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        {/* El botón de cerrar (X) se mantiene aquí, el de Volver irá arriba a la izquierda si se desea o se puede unificar */}
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
                                    <div className="relative group">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
                                                <Bookmark className="w-3.5 h-3.5" />
                                            </div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoja de Ruta</h3>
                                        </div>
                                        {!isStudent ? (
                                            <textarea
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                className="w-full min-h-[160px] p-6 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all resize-none shadow-inner text-sm leading-relaxed"
                                                placeholder="Escribe aquí las instrucciones de la misión..."
                                            />
                                        ) : (
                                            tarea.descripcion && (
                                                <div className="bg-slate-50/70 p-6 rounded-[2rem] text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 shadow-inner relative overflow-hidden group-hover:bg-slate-50 transition-colors text-sm">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/20" />
                                                    {tarea.descripcion}
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Resources Section (Professor) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Paperclip className="w-4 h-4 text-slate-400" />
                                                Herramientas Adjuntas
                                            </h3>
                                            {!isStudent && (
                                                <button 
                                                    onClick={() => adjuntosInputRef.current?.click()}
                                                    disabled={subiendoArchivo}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all active:scale-95"
                                                >
                                                    {subiendoArchivo ? <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
                                                    Añadir Herramientas
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {archivosAdjuntos.map((archivo, idx) => (
                                                <div key={idx} className="relative group">
                                                    <a
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
                                                    {!isStudent && (
                                                        <button 
                                                            onClick={() => {
                                                                const nuevos = archivosAdjuntos.filter((_, i) => i !== idx);
                                                                setArchivosAdjuntos(nuevos);
                                                            }}
                                                            className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <input 
                                                type="file" 
                                                ref={adjuntosInputRef} 
                                                className="hidden" 
                                                multiple 
                                                onChange={async (e) => {
                                                    if (!e.target.files) return;
                                                    setSubiendoArchivo(true);
                                                    const files = Array.from(e.target.files);
                                                    const nuevos = [...archivosAdjuntos];
                                                    for (const file of files) {
                                                        const fileName = `${Date.now()}_adjunto_${file.name}`;
                                                        const filePath = `tareas_ajuntos/${tarea.proyecto_id}/${fileName}`;
                                                        await supabase.storage.from('recursos').upload(filePath, file);
                                                        const { data } = supabase.storage.from('recursos').getPublicUrl(filePath);
                                                        nuevos.push({ nombre: file.name, url: data.publicUrl, tipo: file.type });
                                                    }
                                                    setArchivosAdjuntos(nuevos);
                                                    setSubiendoArchivo(false);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Sección de Entrega y Evidencias */}
                                    {(isStudent || (contenidoAlumno || (archivosAlumno && archivosAlumno.length > 0))) && (
                                        <div className="pt-8 border-t border-slate-100 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Send className="w-4 h-4 text-indigo-500" />
                                                    Evidencias del Alumno
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
                                                        placeholder={isStudent ? "Escribe aquí tu respuesta, reflexiones o proceso de trabajo..." : "El alumno no ha proporcionado texto descriptivo."}
                                                        className={`w-full min-h-[140px] p-6 rounded-[2rem] border-2 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all resize-none shadow-inner text-sm leading-relaxed ${isStudent ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-50 italic opacity-60'}`}
                                                    />
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {archivosAlumno.map((archivo: any, idx: number) => (
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
                                                            {(isStudent && tarea.estado !== 'revision' && tarea.estado !== 'aprobado' || !isStudent) && (
                                                                <button 
                                                                    onClick={() => handleDeleteFile(idx)}
                                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/file:opacity-100 transition-opacity hover:scale-110 active:scale-90"
                                                                >
                                                                    <Trash2 className="w-2.5 h-2.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {/* Botón de subida unificado (Bidireccional) */}
                                                    {targetGrupoId && (isStudent ? (tarea.estado === 'pendiente' || tarea.estado === 'en_progreso' || tarea.estado === 'rechazado') : true) && (
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={subiendoArchivo}
                                                            className="flex items-center gap-2 px-5 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest group"
                                                        >
                                                            {subiendoArchivo ? (
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                                            {subiendoArchivo ? 'Subiendo...' : isStudent ? 'Subir Evidencia' : 'Subir Feedback / Herramienta'}
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

                                    {/* Sala de Comentarios (Mini Chat) - Ahora para todas las tareas */}
                                    {true && (
                                        <div className="pt-8 border-t border-slate-100 space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sala de Comentarios</h3>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-[2rem] p-4 min-h-[200px] flex flex-col gap-3 max-h-[400px] overflow-y-auto border border-slate-100 shadow-inner">
                                                {chatComentarios.length === 0 ? (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                                                        <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No hay comentarios aún</p>
                                                        <p className="text-[10px] opacity-60">Inicia la conversación sobre esta misión</p>
                                                    </div>
                                                ) : (
                                                    chatComentarios.map((c, idx) => (
                                                        <div key={idx} className={`flex flex-col max-w-[85%] ${c.rol === (isStudent ? 'alumno' : 'profesor') ? 'self-end items-end' : 'self-start items-start'}`}>
                                                            <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm ${
                                                                c.rol === (isStudent ? 'alumno' : 'profesor') 
                                                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                                            }`}>
                                                                {c.texto}
                                                            </div>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1 px-1">
                                                                {c.autor} • {new Date(c.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <input 
                                                    value={nuevoComentario}
                                                    onChange={(e) => setNuevoComentario(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && nuevoComentario.trim()) {
                                                            const msg = {
                                                                autor: isStudent ? 'Alumno' : 'Profesor',
                                                                rol: isStudent ? 'alumno' : 'profesor',
                                                                texto: nuevoComentario.trim(),
                                                                fecha: new Date().toISOString()
                                                            };
                                                            const nuevosComentarios = [...chatComentarios, msg];
                                                            setChatComentarios(nuevosComentarios);
                                                            setNuevoComentario('');
                                                            
                                                            // Persistencia inmediata (Usar upsert para asegurar creación si no existe)
                                                            if (targetGrupoId) {
                                                                const targetGidNum = typeof targetGrupoId === 'number' ? targetGrupoId : parseInt(targetGrupoId as any);
                                                                
                                                                // Primero intentamos actualizar por si existe para ser más eficientes, 
                                                                // pero upsert sobre un objeto sin ID requiere que usemos onConflict
                                                                const { error } = await supabase.from('entregas_tareas')
                                                                    .upsert({ 
                                                                        tarea_id: tarea.id, 
                                                                        grupo_id: targetGidNum, 
                                                                        chat_comentarios: nuevosComentarios,
                                                                        updated_at: new Date().toISOString()
                                                                    }, { onConflict: 'tarea_id,grupo_id' });
                                                                if (error) console.error('Error upserting chat:', error);
                                                            } else if (onUpdateTarea) {
                                                                await onUpdateTarea(tarea.id, { chat_comentarios: nuevosComentarios });
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Escribe un comentario..."
                                                    className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                                <button 
                                                    onClick={async () => {
                                                        if (!nuevoComentario.trim()) return;
                                                        const msg = {
                                                            autor: isStudent ? 'Alumno' : 'Profesor',
                                                            rol: isStudent ? 'alumno' : 'profesor',
                                                            texto: nuevoComentario.trim(),
                                                            fecha: new Date().toISOString()
                                                        };
                                                        const nuevosComentarios = [...chatComentarios, msg];
                                                        setChatComentarios(nuevosComentarios);
                                                        setNuevoComentario('');

                                                        // Persistencia inmediata
                                                        if (targetGrupoId) {
                                                            await supabase.from('entregas_tareas')
                                                                .update({ chat_comentarios: nuevosComentarios })
                                                                .eq('tarea_id', tarea.id)
                                                                .eq('grupo_id', targetGrupoId);
                                                        } else if (onUpdateTarea) {
                                                            await onUpdateTarea(tarea.id, { chat_comentarios: nuevosComentarios });
                                                        }
                                                    }}
                                                    className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-90"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* COLUMNA DERECHA: Widgets y Ajustes (lg:col-span-4) */}
                                <div className="lg:col-span-4 space-y-6">
                                    
                                    {/* Settings/Widgets List */}
                                    <div className="space-y-3 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">Configuración General</h4>
                                        
                                        {/* Status / Computed State */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5" /> Estado de la Misión
                                            </label>
                                            <div className={`px-4 py-3 rounded-xl border flex items-center justify-between shadow-sm transition-all ${
                                                statusLabel === 'Completada' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                statusLabel === 'En Revisión' ? 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse' :
                                                statusLabel === 'Expirada' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                                'bg-white border-slate-100 text-slate-600'
                                            }`}>
                                                <span className="text-xs font-black uppercase tracking-widest">{statusLabel}</span>
                                                {statusLabel === 'Completada' && calificacion !== undefined && (
                                                    <span className="text-[10px] font-black bg-white/50 px-2 py-0.5 rounded-lg border border-emerald-200/50">Nota: {calificacion}/10</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Puntos / Reward */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Award className="w-3.5 h-3.5" /> Recompensa
                                            </label>
                                            {!isStudent ? (
                                                <input 
                                                    type="number" 
                                                    value={puntos || 0}
                                                    onChange={(e) => setPuntos(Number(e.target.value) || 0)}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                            ) : (
                                                <p className="px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-sm font-black text-slate-800 shadow-sm">{tarea.puntos_maximos} puntos</p>
                                            )}
                                        </div>

                                        {/* Fecha / Deadline */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Fecha límite
                                            </label>
                                            {!isStudent ? (
                                                <input 
                                                    type="date" 
                                                    value={fecha}
                                                    onChange={(e) => setFecha(e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                            ) : (
                                                <p className="px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-sm font-bold text-slate-800 shadow-sm">
                                                    {tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleDateString() : 'Sin fecha'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Hora / Deadline Time */}
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" /> Hora límite
                                            </label>
                                            {!isStudent ? (
                                                <input 
                                                    type="time" 
                                                    value={hora}
                                                    onChange={(e) => setHora(e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                            ) : (
                                                <p className="px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-sm font-bold text-slate-800 shadow-sm">
                                                    {tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sin hora'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Grupo / Assignment */}
                                        <div className="space-y-1.5 pb-2 border-b border-slate-100/50">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5" /> Destinatarios
                                            </label>
                                            {!isStudent ? (
                                                <select
                                                    value={grupoId}
                                                    onChange={(e) => setGrupoId(e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
                                                >
                                                    <option value="todos">Todos los alumnos</option>
                                                    {grupos.map(g => (
                                                        <option key={g.id} value={g.id}>{g.nombre}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-xs font-black text-slate-800 shadow-sm truncate uppercase tracking-widest">{grupoNombre}</p>
                                            )}
                                        </div>

                                        {/* Calificación / Grade (Manual) */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Calificación
                                                </label>
                                                {calificacion !== undefined && (
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${calificacion >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {calificacion >= 5 ? 'APROBADO' : 'SUSPENSO'}
                                                    </span>
                                                )}
                                            </div>
                                            {!isStudent ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        max="10"
                                                        step="0.1"
                                                        value={calificacion || 0}
                                                        onChange={(e) => setCalificacion(parseFloat(e.target.value) || 0)}
                                                        className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-black text-indigo-600 outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                    />
                                                    <span className="text-xs font-black text-slate-300">/ 10</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm transition-all group-hover:border-indigo-100">
                                                    <p className="text-sm font-black text-slate-800">{calificacion || 'Sin nota'}</p>
                                                    <span className="text-[10px] font-black text-slate-300">Puntaje final</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Evaluation Panel (only for Teacher during Revision) */}
                                    {!isStudent && estadoLocal === 'revision' && (
                                        <div className="pt-4 space-y-3">
                                            <div className="bg-white border-2 border-indigo-100 p-6 rounded-[2.5rem] flex flex-col gap-4 shadow-xl shadow-indigo-500/5">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Evaluación de la Misión</p>
                                                <div className="flex items-center justify-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={calificacion || 0}
                                                        onChange={(e) => setCalificacion(Number(e.target.value) || 0)}
                                                        className="w-20 text-4xl font-black text-indigo-600 bg-slate-50 rounded-2xl p-4 text-center border-2 border-indigo-50 outline-none focus:border-indigo-300 transition-all"
                                                    />
                                                    <span className="text-xl font-black text-slate-300">/ 10</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            onEstadoChange(tarea.id, 'aprobado', calificacion);
                                                            toast.success('¡Misión aprobada!');
                                                            onClose();
                                                        }}
                                                        className="flex flex-col items-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                                                    >
                                                        <CheckCircle2 className="w-6 h-6" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Aprobar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            onEstadoChange(tarea.id, 'rechazado', undefined);
                                                            toast.error('Misión devuelta para corrección');
                                                            onClose();
                                                        }}
                                                        className="flex flex-col items-center gap-2 py-4 bg-rose-50 border-2 border-rose-100 text-rose-500 hover:bg-rose-100 rounded-3xl transition-all active:scale-95"
                                                    >
                                                        <X className="w-6 h-6" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Rechazar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete/Exit Footer */}
                                    {!isStudent && onDelete && (
                                        <button
                                            onClick={() => { if (confirm('¿Eliminar esta tarea definitivamente?')) onDelete(tarea.id); }}
                                            className="w-full flex items-center justify-center gap-2 py-4 text-rose-400 hover:text-rose-600 font-black uppercase tracking-[0.2em] text-[10px] bg-white border border-rose-100 rounded-[2rem] transition-all hover:bg-rose-50 shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Misión del Hub
                                        </button>
                                    )}
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleUpdate}
                                            disabled={guardando}
                                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-200 uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {guardando ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-5 h-5" />
                                            )}
                                            {guardando ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

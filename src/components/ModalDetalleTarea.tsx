import { FileText, Award, Users, Paperclip, Clock, X, Trash2, CheckCircle2, Send, ChevronRight, ChevronDown, AlertCircle, Bookmark, Upload, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';
import { TareaDetallada, Grupo } from '../types';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { crearNotificacionMasiva, getAlumnosDelGrupo } from '../lib/notificaciones';

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
    currentUserId?: string;
    currentUserNombre?: string;
}

export function ModalDetalleTarea({ tarea, grupos, onClose, onDelete, onEstadoChange, onUpdateTarea, onSaveAlumnoContent, isStudent, targetGrupoId, currentUserId, currentUserNombre }: ModalDetalleTareaProps) {
    const [editMode, setEditMode] = useState(!isStudent);
    const [titulo, setTitulo] = useState(tarea.titulo);
    const [descripcion, setDescripcion] = useState(tarea.descripcion || '');
    const [puntos, setPuntos] = useState<number>(Number(tarea.puntos_maximos) || 0);
    // Inicializar fecha y hora en tiempo local
    const initialDate = tarea.fecha_entrega ? new Date(tarea.fecha_entrega) : null;
    const [fecha, setFecha] = useState(initialDate ? initialDate.toLocaleDateString('en-CA') : '');
    const [hora, setHora] = useState(initialDate ? initialDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '23:59');
    const [grupoId, setGrupoId] = useState(tarea.grupo_id?.toString() || 'todos');
    const [estadoLocal, setEstadoLocal] = useState<any>(tarea.estado);
    const [archivosAdjuntos, setArchivosAdjuntos] = useState<any[]>(tarea.archivos_adjuntos || []);
    
    const [contenidoAlumno, setContenidoAlumno] = useState(tarea.contenido_alumno || '');
    const [archivosAlumno, setArchivosAlumno] = useState<any[]>(tarea.archivos_alumno || []);
    const [calificacion, setCalificacion] = useState<number>(Number(tarea.calificacion) || 0);
    const [chatComentarios, setChatComentarios] = useState<any[]>([]);
    const [isTeamChat, setIsTeamChat] = useState(!!targetGrupoId);
    const [alumnoUserId, setAlumnoUserId] = useState<string | null>(isStudent ? (currentUserId || null) : null);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [cargandoEntrega, setCargandoEntrega] = useState(!!targetGrupoId);
    const [showChat, setShowChat] = useState(false);
    const [lastSeenChatCount, setLastSeenChatCount] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const adjuntosInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al fondo del chat cuando hay mensajes nuevos
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // Si el chat está abierto, actualizamos el contador de vistos
        if (showChat) {
            setLastSeenChatCount(chatComentarios.length);
        }
    }, [chatComentarios, showChat]);

    // Cuando se abre el chat por primera vez, marcar mensajes como vistos
    useEffect(() => {
        if (showChat) {
            setLastSeenChatCount(chatComentarios.length);
        }
    }, [showChat]);

    const hasChanges = !isStudent && (
        titulo !== tarea.titulo ||
        descripcion !== (tarea.descripcion || '') ||
        puntos !== tarea.puntos_maximos ||
        fecha !== (initialDate ? initialDate.toLocaleDateString('en-CA') : '') ||
        hora !== (initialDate ? initialDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '23:59') ||
        grupoId !== (tarea.grupo_id?.toString() || 'todos') ||
        estadoLocal !== tarea.estado ||
        JSON.stringify(archivosAdjuntos) !== JSON.stringify(tarea.archivos_adjuntos || [])
    );

    const handleUpdate = async () => {
        setGuardando(true);
        try {
            // 1. Si es docente, actualizar SIEMPRE la tarea base (global) con los campos del editor
            if (!isStudent && onUpdateTarea) {
                const data = {
                    titulo: titulo.trim(),
                    descripcion: descripcion.trim() || null,
                    puntos_maximos: puntos,
                    calificacion: calificacion || 0, 
                    fecha_entrega: (() => {
                        if (!fecha) return null;
                        const [year, month, day] = fecha.split('-').map(Number);
                        const [h, m] = hora.split(':').map(Number);
                        return new Date(year, month - 1, day, h, m).toISOString();
                    })(),
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
                    
                    // Notificar a los alumnos del grupo
                    try {
                        const alumnoIds = await getAlumnosDelGrupo(targetGidNum, tarea.proyecto_id);
                        if (alumnoIds.length > 0) {
                            await crearNotificacionMasiva(alumnoIds, {
                                proyectoId: tarea.proyecto_id,
                                tipo: 'notas_actualizadas',
                                titulo: `Misión evaluada: "${tarea.titulo}"`,
                                descripcion: `El profesor ha evaluado vuestra entrega. Calificación: ${calificacion || 0} puntos.`,
                                metadata: { tarea_id: tarea.id, calificacion }
                            });
                        }
                    } catch (notifErr) {
                        console.error('Error enviando notificación de evaluación:', notifErr);
                    }
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
    // Nuevo Efecto para resolver el Alumno o Grupo
    useEffect(() => {
        const resolveContext = async () => {
            // Si es alumno, el ID del alumno es el ID del usuario actual
            if (isStudent && currentUserId) {
                setAlumnoUserId(currentUserId);
            }

            if (!targetGrupoId) {
                setIsTeamChat(false);
                return;
            }

            const gid = Number(targetGrupoId);
            const grupo = grupos.find(g => Number(g.id) === gid);
            if (grupo) {
                const esEquipo = grupo.miembros.length > 1;
                setIsTeamChat(esEquipo);

                // Si es docente y es chat individual, resolvemos el ID del alumno por nombre
                if (!isStudent && !esEquipo) {
                    const nombre = typeof grupo.miembros[0] === 'string' ? grupo.miembros[0] : (grupo.miembros[0] as any).nombre;
                    const { data } = await supabase.from('profiles').select('id').eq('nombre', nombre).maybeSingle();
                    if (data) setAlumnoUserId(data.id);
                }
            }
        };
        resolveContext();
    }, [targetGrupoId, grupos, isStudent, currentUserId]);

    // Efecto para SINCRONIZAR INSTRUCCIONES y ARCHIVOS ADJUNTOS en tiempo real
    useEffect(() => {
        if (!tarea.id) return;

        console.log(`[Realtime] Suscribiendo a tareas:${tarea.id}`);
        const channelTarea = supabase.channel(`sync_tarea_base_${tarea.id}`)
            .on('postgres_changes', {
                event: '*', // Escuchar todo (INSERT, UPDATE) por si acaso
                schema: 'public',
                table: 'tareas',
                filter: `id=eq.${tarea.id}`
            }, (payload: any) => {
                const updated = payload.new;
                console.log("[Realtime] Cambio detectado en tarea:", payload.eventType, updated);
                if (updated) {
                    if (updated.titulo !== undefined) setTitulo(updated.titulo);
                    if (updated.descripcion !== undefined) setDescripcion(updated.descripcion || '');
                    if (updated.archivos_adjuntos !== undefined) {
                        console.log("[Realtime] Actualizando archivos adjuntos:", updated.archivos_adjuntos);
                        setArchivosAdjuntos(updated.archivos_adjuntos || []);
                    }
                }
            })
            .subscribe((status) => {
                console.log(`[Realtime] Estado suscripción tareas:${tarea.id} ->`, status);
            });

        return () => {
            console.log(`[Realtime] Cancelando suscripción tareas:${tarea.id}`);
            supabase.removeChannel(channelTarea);
        };
    }, [tarea.id]);

    // Efecto para cargar y SINCRONIZAR la CALIFICACIÓN y la ENTREGA en tiempo real
    useEffect(() => {
        const syncEntrega = async () => {
            const finalGroupId = targetGrupoId || (isStudent ? null : tarea.grupo_id);
            if (!finalGroupId) return;

            const targetGidNum = typeof finalGroupId === 'number' ? finalGroupId : parseInt(finalGroupId as any);

            // 1. Carga inicial de la entrega/calificación
            const { data: entrega, error } = await supabase
                .from('entregas_tareas')
                .select('*')
                .eq('tarea_id', tarea.id)
                .eq('grupo_id', targetGidNum)
                .maybeSingle();

            if (!error && entrega) {
                if (entrega.calificacion !== null && entrega.calificacion !== undefined) {
                    setCalificacion(Number(entrega.calificacion));
                }
                if (entrega.respuesta_texto) setContenidoAlumno(entrega.respuesta_texto);
                if (entrega.archivos_entregados) setArchivosAlumno(entrega.archivos_entregados);
                if (entrega.estado === 'evaluada' || entrega.estado === 'revisado') {
                    setEstadoLocal('aprobado'); 
                } else if (entrega.estado === 'entregada') {
                    setEstadoLocal('revision');
                } else if (entrega.estado === 'rechazada') {
                    setEstadoLocal('rechazado');
                }
            }
        };

        syncEntrega();

        // 2. Suscripción Realtime para la FILA específica de esta entrega
        const finalGroupId = targetGrupoId || (isStudent ? null : tarea.grupo_id);
        if (!finalGroupId) return;
        const targetGidNum = typeof finalGroupId === 'number' ? finalGroupId : parseInt(finalGroupId as any);

        const channelEntrega = supabase.channel(`sync_entrega_${tarea.id}_${targetGidNum}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'entregas_tareas',
                filter: `tarea_id=eq.${tarea.id}`
            }, (payload: any) => {
                const updated = payload.new;
                if (updated && Number(updated.grupo_id) === targetGidNum) {
                    console.log("[Sync] Entrega de equipo actualizada:", updated);
                    if (updated.calificacion !== null && updated.calificacion !== undefined) {
                        setCalificacion(Number(updated.calificacion));
                    }
                    if (updated.archivos_entregados) {
                        setArchivosAlumno(updated.archivos_entregados);
                    }
                    if (updated.respuesta_texto !== undefined) {
                        setContenidoAlumno(updated.respuesta_texto || '');
                    }
                    if (updated.estado === 'evaluada' || updated.estado === 'revisado') {
                        setEstadoLocal('aprobado');
                    } else if (updated.estado === 'entregada') {
                        setEstadoLocal('revision');
                    } else if (updated.estado === 'rechazada') {
                        setEstadoLocal('rechazado');
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelEntrega);
        };
    }, [tarea.id, targetGrupoId, isStudent]);


    // Efecto para cargar y SUSCRIBIRSE a la mensajería unificada (Realtime)
    useEffect(() => {
        let channel: any;
        const fetchAndSubscribe = async () => {
            if (!tarea.id) {
                console.log("[Sync] Esperando tarea.id para el chat...");
                return;
            }

            // 1. Determinar contexto de grupo y tabla (EXCLUSIVAMENTE mensajes_chat)
            const finalGroupId = tarea.grupo_id || targetGrupoId;
            const table = 'mensajes_chat';
            
            console.log(`[Sync] Configurando chat INTEGRADO para Tarea ${tarea.id}. GrupoID: ${finalGroupId}`);

            // 2. Carga inicial
            let query = supabase.from(table).select('*').eq('tarea_id', tarea.id);
            if (finalGroupId) {
                query = query.eq('grupo_id', finalGroupId);
            } else if (!isStudent) {
                // Si es docente y no hay grupo asignado a la tarea todavía, cargamos todos los del proyecto para esa tarea
                // Pero lo normal es que haya un grupo contexto
            }

            const { data, error } = await query.order('created_at', { ascending: true });
            if (!error && data) {
                setChatComentarios(data.map(m => {
                    const isFromProfesor = m.tipo === 'profesor' || m.usuario_id === tarea.creador_id;
                    return {
                        id: m.id,
                        autor: m.remitente || (isFromProfesor ? 'Profesor' : 'Alumno'),
                        rol: m.tipo || (isFromProfesor ? 'profesor' : 'alumno'),
                        texto: m.mensaje || m.contenido,
                        fecha: m.created_at
                    };
                }));
            }

            // 3. Suscripción Realtime (Más robusta sin filtros de backend para evitar fallos de tipo)
            channel = supabase.channel(`chat_sync_${tarea.id}_${targetGrupoId}`)
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: table
                }, (payload: any) => {
                    const m = payload.new;
                    console.log("Realtime Payload Recibido en Tarea:", m);
                    
                    // Filtrar por tarea_id manualmente en JS (más seguro)
                    if (m.tarea_id !== tarea.id) return;

                    // Determinar contexto de grupo para el filtrado manual
                    const finalGroupId = tarea.grupo_id || targetGrupoId;

                    // Verificar que pertenezca al contexto actual (grupo o tarea global)
                    const belongs = finalGroupId 
                        ? (m.grupo_id && Number(m.grupo_id) === Number(finalGroupId))
                        : true; 
                    
                    if (belongs) {
                        const isFromProfesor = m.tipo === 'profesor' || m.usuario_id === tarea.creador_id;
                        const newMsg = {
                            id: m.id,
                            autor: m.remitente || (isFromProfesor ? 'Profesor' : 'Alumno'),
                            rol: m.tipo || (isFromProfesor ? 'profesor' : 'alumno'),
                            texto: m.mensaje || m.contenido,
                            fecha: m.created_at
                        };
                        setChatComentarios(prev => {
                            if (prev.some(msg => msg.id === newMsg.id)) return prev;
                            const updated = [...prev, newMsg];
                            console.log(`[Sync] OK - UI actualizada (${isStudent ? "Alumno" : "Docente"}):`, newMsg);
                            return updated;
                        });
                    }
                })
                .subscribe();
        };

        fetchAndSubscribe();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [alumnoUserId, targetGrupoId, currentUserId, tarea.id, tarea.grupo_id]);

    const handleDeleteFile = async (idx: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo de evidencia?')) return;
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

    const isExpired = tarea.fecha_entrega && new Date(tarea.fecha_entrega) < new Date() && 
                      estadoLocal !== 'aprobado' && 
                      estadoLocal !== 'completado' && 
                      estadoLocal !== 'revision';
    
    const getComputedStatus = () => {
        if (estadoLocal === 'completado' || estadoLocal === 'aprobado') return 'Completada';
        if (estadoLocal === 'revision') return 'En Revisión';
        if (isExpired) return 'Expirada';
        if (estadoLocal === 'rechazado') return 'Rechazada';
        return 'Pendiente';
    };

    const statusLabel = getComputedStatus();

    const puedeEnviarARevision = isStudent && (tarea.estado === 'pendiente' || tarea.estado === 'en_progreso');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[98vw] max-h-[98vh] overflow-hidden flex flex-col border border-slate-100">
                
                {false ? (
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
                        {/* Header Section Ultra-Compacto */}
                        <div className="relative p-1.5 md:p-2 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white overflow-hidden shadow-lg shrink-0">
                                
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pl-16 pr-4 md:pl-20">
                                    <div className="max-w-xl flex-1">
                                        {!isStudent ? (
                                            <input 
                                                value={titulo}
                                                onChange={(e) => setTitulo(e.target.value)}
                                                className="w-full bg-white/10 hover:bg-white/20 focus:bg-white text-white focus:text-slate-900 text-lg md:text-xl font-black tracking-tight leading-tight rounded-xl px-4 py-1.5 transition-all outline-none border-2 border-transparent focus:border-white shadow-inner placeholder:text-white/40"
                                                placeholder="Título de la misión..."
                                            />
                                        ) : (
                                            <h2 className="text-lg md:text-xl font-black tracking-tight leading-tight drop-shadow-sm">{tarea.titulo}</h2>
                                        )}
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-blue-100 font-bold flex items-center gap-2 text-[9px] md:text-[10px] opacity-90">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(tarea.created_at)}
                                            </p>
                                            {tarea.fecha_entrega && new Date(tarea.fecha_entrega) < new Date() && tarea.estado !== 'completado' && (
                                                <span className="px-2 py-0.5 bg-rose-500/30 border border-rose-500/50 rounded-lg text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-1">
                                                    <AlertCircle className="w-2.5 h-2.5" /> Fuera de plazo
                                                </span>
                                            )}
                                            
                                            <div className={`px-2.5 py-1 rounded-full border flex items-center gap-2 shadow-sm transition-all backdrop-blur-md ${
                                                statusLabel === 'Completada' ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-50' :
                                                statusLabel === 'En Revisión' ? 'bg-amber-500/20 border-amber-400/30 text-amber-50' :
                                                statusLabel === 'Expirada' ? 'bg-rose-500/20 border-rose-400/30 text-rose-50' :
                                                'bg-white/10 border-white/20 text-blue-50'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    statusLabel === 'Completada' ? 'bg-emerald-400' :
                                                    statusLabel === 'En Revisión' ? 'bg-amber-400 animate-pulse' :
                                                    statusLabel === 'Expirada' ? 'bg-rose-400' :
                                                    'bg-blue-400'
                                                }`} />
                                                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{statusLabel}</span>
                                            </div>

                                            {!isStudent && onDelete && (
                                                <button
                                                    onClick={() => { if (confirm('¿Eliminar esta tarea definitivamente?')) onDelete(tarea.id); }}
                                                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 rounded-lg border border-rose-500/30 transition-all active:scale-90"
                                                    title="Eliminar Misión"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 py-1">
                                        {/* Botones de acción (Entregar/Anular) movidos al encabezado */}
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
                                                className="px-6 py-2 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2 border-2 border-transparent hover:border-blue-200"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                Entregar Misión
                                            </button>
                                        )}
                                        {isStudent && tarea.estado === 'revision' && (
                                            <button
                                                onClick={() => onEstadoChange(tarea.id, 'pendiente')}
                                                className="px-6 py-2 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-100 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-500/40 transition-all active:scale-95"
                                            >
                                                Anular Entrega
                                            </button>
                                        )}
                                        
                                        <div className="flex items-center gap-2">
                                             <span className="text-[10px] font-black text-slate-400 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-widest border border-white/30 text-white/90">Versión V5.8.34</span>
                                            <button 
                                                onClick={onClose}
                                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                        </div>

                        {/* Main Content Area - GRID 2 Columnas */}
                        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                
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
                                                Archivos
                                            </h3>
                                            {!isStudent && (
                                                <button 
                                                    onClick={() => adjuntosInputRef.current?.click()}
                                                    disabled={subiendoArchivo}
                                                    className="px-4 py-2 bg-white text-indigo-600 border-2 border-indigo-50 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                                >
                                                    {subiendoArchivo ? <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
                                                    Subir
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
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recurso</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                                    </a>
                                                    <button 
                                                            onClick={async () => {
                                                                if (!window.confirm('¿Quieres eliminar este recurso compartido?')) return;
                                                                const nuevos = archivosAdjuntos.filter((_, i) => i !== idx);
                                                                setArchivosAdjuntos(nuevos);
                                                                if (onUpdateTarea) {
                                                                    await onUpdateTarea(tarea.id, { archivos_adjuntos: nuevos });
                                                                    toast.success('Recurso eliminado');
                                                                }
                                                            }}
                                                            className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
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
                                                    if (onUpdateTarea) {
                                                        await onUpdateTarea(tarea.id, { archivos_adjuntos: nuevos });
                                                        toast.success('Recursos añadidos');
                                                    }
                                                    setSubiendoArchivo(false);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Sección de Entrega y Evidencias */}
                                    {(isStudent || (contenidoAlumno || (archivosAlumno && archivosAlumno.length > 0))) && (
                                        <div className="pt-8 border-t border-slate-100 space-y-6">
                                            
                                            <div className="space-y-4">
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
                                                     {(isStudent ? (tarea.estado === 'pendiente' || tarea.estado === 'en_progreso' || tarea.estado === 'rechazado') : true) && (
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={subiendoArchivo}
                                                            className={`flex items-center gap-2 px-6 py-3 text-indigo-600 bg-white border-2 border-indigo-50 hover:bg-slate-50 rounded-2xl shadow-sm transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest group`}
                                                        >
                                                            {subiendoArchivo ? (
                                                                <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                                                            ) : <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                                            {subiendoArchivo ? 'Subiendo...' : 'Subir'}
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
                                    {/* Sala de Comentarios (Mini Chat) */}
                                    <div className="pt-6 border-t border-slate-100 space-y-4">
                                        <button 
                                            onClick={() => setShowChat(!showChat)}
                                            className="flex items-center justify-between w-full hover:bg-slate-50 p-2 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sala de Comentarios</h3>
                                                {chatComentarios.length > lastSeenChatCount && !showChat && (
                                                    <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-bounce shadow-lg shadow-amber-200">
                                                        {chatComentarios.length - lastSeenChatCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`transition-transform duration-300 ${showChat ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                            </div>
                                        </button>

                                        {showChat && (
                                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
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
                                                <div ref={messagesEndRef} />
                                            </div>

                                            <div className="flex gap-2">
                                                <input 
                                                    value={nuevoComentario}
                                                    onChange={(e) => setNuevoComentario(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && nuevoComentario.trim()) {
                                                            const autor = currentUserNombre || (isStudent ? 'Alumno' : 'Profesor');
                                                            const rol = isStudent ? 'alumno' : 'profesor';
                                                            const msgTexto = nuevoComentario.trim();
                                                            setNuevoComentario('');
                                                            const finalGroupId = tarea.grupo_id || targetGrupoId;
                                                            const gid = finalGroupId ? Number(finalGroupId) : null;
                                                            
                                                            await supabase.from('mensajes_chat').insert({
                                                                grupo_id: gid,
                                                                usuario_id: currentUserId || (isStudent ? (alumnoUserId || currentUserId) : tarea.creador_id),
                                                                remitente: autor,
                                                                contenido: msgTexto,
                                                                tipo: rol,
                                                                modo: 'equipo',
                                                                tarea_id: tarea.id,
                                                                tarea_titulo: tarea.titulo,
                                                                proyecto_id: tarea.proyecto_id
                                                            });
                                                        }
                                                    }}
                                                    placeholder="Escribe un comentario..."
                                                    className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                                <button 
                                                    onClick={async () => {
                                                        const autor = currentUserNombre || (isStudent ? 'Alumno' : 'Profesor');
                                                        const rol = isStudent ? 'alumno' : 'profesor';
                                                        const msgTexto = nuevoComentario.trim();
                                                        setNuevoComentario('');
                                                        const finalGroupId = tarea.grupo_id || targetGrupoId;
                                                        const gid = finalGroupId ? Number(finalGroupId) : null;
                                                        
                                                        await supabase.from('mensajes_chat').insert({
                                                            grupo_id: gid,
                                                            usuario_id: currentUserId || (isStudent ? (alumnoUserId || currentUserId) : tarea.creador_id),
                                                            remitente: autor,
                                                            contenido: msgTexto,
                                                            tipo: rol,
                                                            modo: 'equipo',
                                                            tarea_id: tarea.id,
                                                            tarea_titulo: tarea.titulo,
                                                            proyecto_id: tarea.proyecto_id
                                                        });
                                                    }}
                                                    className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-90"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: Widgets */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="space-y-3 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">Configuración General</h4>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Fecha límite
                                            </label>
                                            {!isStudent ? (
                                                <input 
                                                    type="date" 
                                                    value={fecha}
                                                    onChange={(e) => setFecha(e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                                                />
                                            ) : (
                                                <p className="px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-sm font-bold text-slate-800 shadow-sm">{tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleDateString() : 'Sin fecha'}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" /> Hora límite
                                            </label>
                                            {!isStudent ? (
                                                <input 
                                                    type="time" 
                                                    value={hora}
                                                    onChange={(e) => setHora(e.target.value)}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                                                />
                                            ) : (
                                                <p className="px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-sm font-bold text-slate-800 shadow-sm">{tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '23:59'}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
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

                                        <div className="space-y-1.5 pb-2 border-b border-slate-100/50">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Calificación
                                                </label>
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
                                                            onEstadoChange(tarea.id, 'completado', calificacion);
                                                            toast.success('¡Misión completada!');
                                                            onClose();
                                                        }}
                                                        className="flex flex-col items-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                                                    >
                                                        <CheckCircle2 className="w-6 h-6" />
                                                         <span className="text-[10px] font-black uppercase tracking-widest">Completar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            onEstadoChange(tarea.id, 'pendiente', undefined);
                                                            toast.error('Misión devuelta para corrección (Pendiente)');
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

import { LayoutList, Users, MessageSquare, ClipboardCheck, Plus, CircleHelp, Key, FolderOpen, Share2, LogOut, UserCheck, Sparkles, Pencil, Check, X, Upload, Trash2, Dices, Gamepad2, LayoutDashboard, Calendar, CalendarDays, Eye, FileText, Clock, Bell } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Card_Grupo } from './Card_Grupo';
import { EvaluacionRubricas } from './EvaluacionRubricas';
import { ModalCrearGrupo } from './ModalCrearGrupo';
import { ModalSubirRecurso } from './ModalSubirRecurso';
import { SistemaCodigoSala } from './SistemaCodigoSala';
import { ListaAlumnosEnLinea } from './ListaAlumnosEnLinea';
import { RuletaModal } from './RuletaModal';
import { TicoGameWidget } from './TicoGame/TicoGameWidget';

import { PerfilAlumno } from './PerfilAlumno';
import { RepositorioColaborativo } from './RepositorioColaborativo';
import { LivingTree } from './LivingTree';
import { Grupo, DashboardSection, ProyectoActivo, TareaDetallada } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ModalConfiguracionIA } from './ModalConfiguracionIA';
import { ModalRevisionHitos } from './ModalRevisionHitos';
import { ModalAsignarTareas } from './ModalAsignarTareas';
import { ModalAsistencia } from './ModalAsistencia';
import { ModalCrearTareaClassroom } from './ModalCrearTareaClassroom';
import { HitoGrupo } from '../types';
import { supabase } from '../lib/supabase';
import { getAsignaturaStyles } from '../data/asignaturas';
import { ModalChatAlumnosDocente } from './ModalChatAlumnosDocente';
import { ModalHorario } from './ModalHorario';
import { SolicitudesColaboracion } from './ModalSolicitudesColaboracion';
import { VistaCalendario } from './VistaCalendario';
import { ModalDetalleTarea } from './ModalDetalleTarea';
import { ModalSeguimientoGrupos } from './ModalSeguimientoGrupos';
import { ModalChatProfesores } from './ModalChatProfesores';
import { updatePuntosAlumno, addPointsToGroupMembers } from '../lib/puntos';
import { NotificacionesPanel, Notificacion } from './NotificacionesPanel';
import { crearNotificacion, crearNotificacionMasiva, getAlumnosDelProyecto, getProfesoresDelProyecto, getAlumnosDelGrupo } from '../lib/notificaciones';

interface DashboardDocenteProps {
    onSelectGrupo: (grupo: Grupo) => void;
    currentSection: DashboardSection;
    onSectionChange: (section: DashboardSection) => void;
    grupos: Grupo[];
    mostrandoEjemplo: boolean;
    onCargarEjemplo: () => void;
    onLimpiarDatos: () => void;
    onCrearGrupo: (grupo: Omit<Grupo, 'id'>) => void;
    onEditarGrupo: (id: number | string, grupo: Omit<Grupo, 'id'>) => void;
    onEliminarGrupo: (id: number | string) => void;
    onIniciarTutorial: () => void;
    proyectoActual: ProyectoActivo | null;
    onCambiarProyecto?: () => void;
    onClaseChange: (clase: string) => void;
    onUpdateProjectName: (newName: string) => Promise<void>;
    onOpenTicoFull?: () => void;
    hideSidebar?: boolean;
    onOpenFamilyChat?: () => void;
}

export function DashboardDocente({
    onSelectGrupo,
    currentSection,
    onSectionChange,
    grupos,
    mostrandoEjemplo,
    onCargarEjemplo,
    onLimpiarDatos,
    onCrearGrupo,
    onEditarGrupo,
    onEliminarGrupo,
    onIniciarTutorial,
    proyectoActual,
    onCambiarProyecto,
    onClaseChange,
    onUpdateProjectName,
    onOpenTicoFull,
    hideSidebar = false,
    onOpenFamilyChat
}: DashboardDocenteProps) {
    const [modalCrearGrupoAbierto, setModalCrearGrupoAbierto] = useState(false);
    const [menuAlumnosAbierto, setMenuAlumnosAbierto] = useState(false); // New state for dropdown
    const [grupoEditando, setGrupoEditando] = useState<Grupo | null>(null);
    const [mostrarCodigoSala, setMostrarCodigoSala] = useState(false);
    const [modalAjustesIAAbierto, setModalAjustesIAAbierto] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New State
    const [modalRevisionAbierto, setModalRevisionAbierto] = useState(false);
    const [modalConfigGruposAbierto, setModalConfigGruposAbierto] = useState(false);
    const [grupoParaConfigYEval, setGrupoParaConfigYEval] = useState<Grupo | null>(null);
    const [modalChatAlumnosAbierto, setModalChatAlumnosAbierto] = useState(false);
    const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
    const [grupoParaTareas, setGrupoParaTareas] = useState<Grupo | null>(null);
    const [modalAsistenciaOpen, setModalAsistenciaOpen] = useState(false);
    const [modalSubirRecursoAbierto, setModalSubirRecursoAbierto] = useState(false);
    const [modalRuletaAbierta, setModalRuletaAbierta] = useState(false);
    const [modalHorarioAbierto, setModalHorarioAbierto] = useState(false);
    const [modalTicoAbierto, setModalTicoAbierto] = useState(false);
    const [alumnoParaEvaluar, setAlumnoParaEvaluar] = useState<{ nombre: string, grupo: Grupo } | null>(null);
    const [unreadStudentMessages, setUnreadStudentMessages] = useState(0);
    const [unreadFamilyMessages, setUnreadFamilyMessages] = useState(0);
    const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
    const [solicitudEmergente, setSolicitudEmergente] = useState<any | null>(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadCollabMessages, setUnreadCollabMessages] = useState(0);
    const [modalChatProfesoresAbierto, setModalChatProfesoresAbierto] = useState(false);

    // Project Renaming State
    const [isEditingProjectName, setIsEditingProjectName] = useState(false);
    const [editingProjectName, setEditingProjectName] = useState('');
    const [refreshRecursos, setRefreshRecursos] = useState(0);
    const [tareasProyecto, setTareasProyecto] = useState<TareaDetallada[]>([]);
    const [entregasProyecto, setEntregasProyecto] = useState<any[]>([]);
    const [modalCrearTareaAbierto, setModalCrearTareaAbierto] = useState(false);
    const [tareaSeleccionadaDetalle, setTareaSeleccionadaDetalle] = useState<TareaDetallada | null>(null);
    const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState<TareaDetallada | null>(null);
    const [targetGrupoId, setTargetGrupoId] = useState<string | number | undefined>(undefined);
    const [modalInitialShowChat, setModalInitialShowChat] = useState(false);

    // Filter states
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');

    const { signOut, perfil, user } = useAuth();

    useEffect(() => {
        let studentSub: any = null;
        let familySub: any = null;

        if (user) {
            const fetchUnreadStudentMessages = async () => {
                try {
                    const { data, error } = await supabase
                        .from('mensajes_profesor_alumno')
                        .select('id')
                        .eq('profesor_user_id', user.id)
                        .neq('sender_id', user.id)
                        .eq('leido', false);

                    if (!error && data) {
                        setUnreadStudentMessages(data.length);
                    }
                } catch (err) {
                    console.error('Error fetching unread student messages:', err);
                }
            };

            const fetchUnreadFamilyMessages = async () => {
                try {
                    const { data, error } = await supabase
                        .from('mensajes_familia_profesor')
                        .select('id')
                        .eq('profesor_user_id', user.id)
                        .neq('sender_id', user.id)
                        .eq('leido', false);

                    if (!error && data) {
                        setUnreadFamilyMessages(data.length);
                    }
                } catch (err) {
                    console.error('Error fetching unread family messages:', err);
                }
            };

            const fetchUnreadCollabMessages = async () => {
                try {
                    const { data, error } = await supabase
                        .from('mensajes_colaboracion')
                        .select('id')
                        .neq('sender_id', user.id)
                        .eq('leido', false);

                    if (!error && data) {
                        setUnreadCollabMessages(data.length);
                    }
                } catch (err) {
                    console.error('Error fetching unread collab messages:', err);
                }
            };

            const fetchSolicitudesPendientes = async () => {
                try {
                    console.log("🔍 Fetching solicitudes for user:", user.id);
                    const { data, error } = await supabase
                        .from('peticiones_colaboracion')
                        .select(`
                            id, 
                            proyecto_id, 
                            profesor_solicitante_id, 
                            estado, 
                            created_at,
                            proyectos (nombre),
                            profesor_solicitante:profiles!profesor_solicitante_id (nombre, email)
                        `)
                        .eq('profesor_propietario_id', user.id)
                        .eq('estado', 'pendiente')
                        .order('created_at', { ascending: false });
                    
                    if (error) {
                        console.error('❌ Error 400 Detail:', error);
                        // Intento alternativo sin joins si falla
                        const { data: simpleData } = await supabase
                            .from('peticiones_colaboracion')
                            .select('*')
                            .eq('profesor_propietario_id', user.id)
                            .eq('estado', 'pendiente');
                        
                        if (simpleData && simpleData.length > 0) {
                            setSolicitudesPendientes(simpleData.length);
                            setSolicitudEmergente(simpleData[0]);
                        }
                        return;
                    }

                    if (data && data.length > 0) {
                        setSolicitudesPendientes(data.length);
                        // Mapeamos para mantener compatibilidad con el componente
                        const mappedData = data.map((s: any) => ({
                            ...s,
                            proyecto: s.proyectos,
                            perfil_solicitante: s.profesor_solicitante
                        }));
                        setSolicitudEmergente(mappedData[0]);
                    } else {
                        setSolicitudesPendientes(0);
                    }
                } catch (err) {
                    console.error('Error fetching collab requests:', err);
                }
            };

            const refreshData = () => {
                fetchUnreadStudentMessages();
                fetchUnreadFamilyMessages();
                fetchUnreadCollabMessages();
                fetchSolicitudesPendientes();
            };

            refreshData();

            studentSub = supabase.channel(`student_msgs_docente_${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'mensajes_profesor_alumno',
                    filter: `profesor_user_id=eq.${user.id}`
                }, payload => {
                    fetchUnreadStudentMessages();
                }).subscribe();

            familySub = supabase.channel(`family_msgs_docente_${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'mensajes_familia_profesor',
                    filter: `profesor_user_id=eq.${user.id}`
                }, payload => {
                    fetchUnreadFamilyMessages();
                }).subscribe();

            const collabMsgsSub = supabase.channel(`collab_msgs_docente_${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'mensajes_colaboracion'
                }, payload => {
                    fetchUnreadCollabMessages();
                }).subscribe();
            
            const collabSub = supabase.channel(`collab_requests_docente_${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'peticiones_colaboracion',
                    filter: `profesor_propietario_id=eq.${user.id}`
                }, async (payload) => {
                    console.log("🔍 DEBUG: Collab Notification Event:", payload.eventType);
                    if (payload.eventType === 'INSERT') {
                        toast.info('¡Nueva solicitud de colaboración!');
                    }
                    // Refetch completo para obtener los joins actualizados
                    fetchSolicitudesPendientes();
                }).subscribe();

            const notifSub = supabase.channel(`notif_docente_${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `user_id=eq.${user.id}`
                }, (payload: any) => {
                    const n = payload.new;
                    if (n.tipo === 'comentario_tarea') {
                        toast(n.titulo, {
                            description: n.descripcion,
                            duration: 10000,
                            action: {
                                label: 'Ir al chat',
                                onClick: () => {
                                    const tId = n.metadata?.tarea_id;
                                    const tarea = tareasProyecto.find(t => t.id === tId);
                                    if (tarea) {
                                        if (n.metadata?.grupo_id) setTargetGrupoId(n.metadata?.grupo_id);
                                        setModalInitialShowChat(true);
                                        setTareaSeleccionadaDetalle(tarea);
                                    }
                                }
                            }
                        });
                    } else if (n.tipo === 'mensaje_colaboracion') {
                        toast(n.titulo, {
                            description: n.descripcion,
                            duration: 10000,
                            action: {
                                label: 'Abrir Chat',
                                onClick: () => {
                                    setModalChatProfesoresAbierto(true);
                                }
                            }
                        });
                    }
                }).subscribe();

            return () => {
                if (studentSub) supabase.removeChannel(studentSub);
                if (familySub) supabase.removeChannel(familySub);
                if (collabMsgsSub) supabase.removeChannel(collabMsgsSub);
                if (collabSub) supabase.removeChannel(collabSub);
                if (notifSub) supabase.removeChannel(notifSub);
            };
        }
    }, [user, proyectoActual?.id, tareasProyecto]);

    // Fetch unread notifications count
    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            const { count } = await supabase
                .from('notificaciones')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('leida', false);
            setUnreadNotifications(count || 0);
        };
        fetchUnread();
        const notifSub = supabase.channel(`notif_count_docente_${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notificaciones',
                filter: `user_id=eq.${user.id}`
            }, () => fetchUnread())
            .subscribe();
        return () => { supabase.removeChannel(notifSub); };
    }, [user]);

    // === FETCH TAREAS DEL PROYECTO (tabla `tareas`) ===
    const fetchTareasProyecto = async () => {
        if (!proyectoActual?.id) return;
        try {
            const { data: tareas, error: tError } = await supabase
                .from('tareas')
                .select('*')
                .eq('proyecto_id', proyectoActual.id)
                .order('created_at', { ascending: false });
            
            if (tError) throw tError;

            // Fetch entregas para calcular el ratio x/y
            const { data: entregas, error: eError } = await supabase
                .from('entregas_tareas')
                .select('tarea_id, grupo_id, estado, calificacion, respuesta_texto, archivos_entregados')
                .in('tarea_id', (tareas || []).map(t => t.id));

            if (!eError) setEntregasProyecto(entregas || []);
            setTareasProyecto(tareas || []);
        } catch (err) {
            console.error('Error fetching tareas/entregas:', err);
        }
    };

    useEffect(() => {
        fetchTareasProyecto();

        if (!proyectoActual?.id) return;
        
        const ch = supabase.channel(`tareas_dashboard_${proyectoActual.id}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'tareas', 
                    filter: `proyecto_id=eq.${proyectoActual.id}` 
                },
                (payload: any) => {
                    console.log("🔍 DEBUG: Task Realtime Event:", payload.eventType, payload.new?.titulo, payload.new?.estado);
                    
                    // Notificación si una tarea pasa a revisión
                    const isNewRevision = payload.eventType === 'UPDATE' && 
                                        payload.new?.estado === 'revision' && 
                                        payload.old?.estado !== 'revision';
                    
                    const isInsertedAsRevision = payload.eventType === 'INSERT' && payload.new?.estado === 'revision';

                    if (isNewRevision || isInsertedAsRevision) {
                        const equipoNombre = grupos.find(g => Number(g.id) === Number(payload.new?.grupo_id))?.nombre || 'Toda la clase';
                        
                        // Crear notificación persistente para el profesor
                        // NOTA: Se ha eliminado la creación manual de notificación aquí para evitar duplicidad,
                        // ya que el alumno ya envía una notificación masiva a los profesores mediante DashboardAlumno.
                        /*
                        if (user) {
                            crearNotificacion({
                                userId: user.id,
                                proyectoId: proyectoActual?.id,
                                tipo: 'tarea_revision',
                                titulo: `Tarea para revisar: "${payload.new?.titulo}"`,
                                descripcion: `El equipo ${equipoNombre} ha enviado una entrega para revisión.`,
                                metadata: { tarea_id: payload.new?.id, grupo_id: payload.new?.grupo_id }
                            });
                        }
                        */
                    }
                    fetchTareasProyecto();
                }
            ).subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [proyectoActual?.id]);

    // numPendientes unificado: Lee de tareasProyecto (globales/asignadas) Y de los hitos de cada grupo
    const numPendientesTareas = tareasProyecto.filter(t => t.estado === 'revision').length;
    const numPendientesHitos = grupos.reduce((acc, g) => acc + (g.hitos || []).filter((h: any) => h.estado === 'revision').length, 0);
    const numPendientes = numPendientesTareas + numPendientesHitos;

    // Alerta sonora/visual anterior fue eliminada para favorecer NotificacionesPanel.

    const handleUpdateMilestone = async (grupoId: string | number, hitoId: string, nuevoEstado: 'aprobado' | 'rechazado') => {
        // Reutilizamos la lógica batch para una sola actualización
        await handleUpdateBatchMilestones(grupoId, [{ hitoId, nuevoEstado }]);
    };

    const handleUpdateBatchMilestones = async (grupoId: string | number, updates: { hitoId: string, nuevoEstado: 'aprobado' | 'rechazado' | 'pendiente' | 'revision' }[]) => {
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return;

        try {
            // 1. Aplicar TODAS las actualizaciones al array local
            let nuevosHitos = [...(grupo.hitos || [])];

            updates.forEach(update => {
                nuevosHitos = nuevosHitos.map(h =>
                    h.id === update.hitoId ? { ...h, estado: update.nuevoEstado } : h
                );
            });

            console.log("Applying updates to milestones (Batch):", updates);

            // 2. Recalcular el progreso dinámicamente (hitos aprobados / total hitos)
            const totalHitos = nuevosHitos.length;
            const hitosAprobados = nuevosHitos.filter(h => h.estado === 'aprobado').length;
            const nuevoProgreso = totalHitos > 0 ? Math.round((hitosAprobados / totalHitos) * 100) : 0;

            // 3. Persistir cambios usando el prop onEditarGrupo (UNA SOLA VEZ)
            await onEditarGrupo(grupoId, {
                nombre: grupo.nombre,
                miembros: grupo.miembros,
                estado: nuevoProgreso >= 100 ? 'Completado' : 'En progreso',
                progreso: nuevoProgreso,
                interacciones_ia: grupo.interacciones_ia,
                hitos: nuevosHitos
            });

            const aprobados = updates.filter(u => u.nuevoEstado === 'aprobado').length;
            const rechazados = updates.filter(u => u.nuevoEstado === 'rechazado').length;

            if (updates.length > 1) {
                toast.success(`Revisión completada: ${aprobados} aprobados, ${rechazados} rechazados.`);
            } else {
                toast.success(updates[0].nuevoEstado === 'aprobado' ? "¡Tarea aprobada!" : "Tarea rechazada.");
            }

        } catch (err) {
            console.error("Error al revisar hitos en lote:", err);
            toast.error("Hubo un fallo al guardar la revisión.");
        }
    };

    // handleEliminarTareaGlobal ahora elimina de la tabla `tareas`
    const handleEliminarTareaGlobal = async (tareaId: string, titulo: string) => {
        if (!confirm(`¿Estás seguro de eliminar la tarea "${titulo}"?`)) return;

        try {
            const { error } = await supabase.from('tareas').delete().eq('id', tareaId);
            if (error) throw error;
            setTareasProyecto(prev => prev.filter(t => t.id !== tareaId));
            toast.success('Tarea eliminada correctamente');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Error al eliminar la tarea');
        }
    };

    const handleEstadoChangeWithPoints = async (id: string, nuevoEstado: string, tareaRef?: TareaDetallada, calificacion?: number) => {
        try {
            const updateData: any = { estado: nuevoEstado };
            if (calificacion !== undefined) {
                updateData.calificacion = calificacion;
            }

            // 1. Actualizar la tarea base (tareas)
            const { error: errorTarea } = await supabase.from('tareas').update(updateData).eq('id', id);
            if (errorTarea) throw errorTarea;

            // 2. Si estamos en contexto de grupo (Hub), actualizar también entregas_tareas
            if (targetGrupoId) {
                const targetGidNum = typeof targetGrupoId === 'number' ? targetGrupoId : parseInt(targetGrupoId as any);
                
                // Mapear estado para cumplir con el CHECK constraint de entregas_tareas
                let estadoEntrega = 'entregada';
                if (nuevoEstado === 'aprobado' || nuevoEstado === 'completado' || nuevoEstado === 'evaluada') {
                    estadoEntrega = 'evaluada';
                }

                await supabase.from('entregas_tareas').upsert({
                    tarea_id: id,
                    grupo_id: targetGidNum,
                    calificacion: calificacion || 0,
                    estado: estadoEntrega,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tarea_id,grupo_id' });
            }
            
            // SUMAR PUNTOS SI SE APRUEBA
            if (nuevoEstado === 'aprobado' || nuevoEstado === 'completado') {
                const currentTarea = tareaRef || tareasProyecto.find(t => t.id === id);
                if (currentTarea) {
                    if (currentTarea.grupo_id) {
                        const grupo = grupos.find(g => g.id === currentTarea.grupo_id);
                        if (grupo?.miembros) {
                            await addPointsToGroupMembers(proyectoActual?.id || '', grupo.miembros, currentTarea.puntos_maximos);
                            toast.success(`¡${currentTarea.puntos_maximos} puntos otorgados al equipo ${grupo.nombre}!`);
                        }
                    } else {
                        // "Todos los alumnos" logic
                        const { data: alumnos } = await supabase.from('profiles').select('nombre').eq('proyecto_id', proyectoActual?.id).eq('rol', 'alumno');
                        if (alumnos) {
                            const nombres = alumnos.map(a => a.nombre).filter(Boolean) as string[];
                            await addPointsToGroupMembers(proyectoActual?.id || '', nombres, currentTarea.puntos_maximos);
                            toast.success(`¡${currentTarea.puntos_maximos} puntos otorgados a toda la clase!`);
                        }
                    }
                }
            }

            // NOTIFICAR ALUMNO SOBRE EVALUACIÓN
            if (nuevoEstado === 'aprobado' || nuevoEstado === 'completado' || nuevoEstado === 'evaluada') {
                const currentTarea = tareaRef || tareasProyecto.find(t => t.id === id);
                if (currentTarea) {
                    let destinoIds: string[] = [];
                    if (currentTarea.grupo_id) {
                        destinoIds = await getAlumnosDelGrupo(currentTarea.grupo_id, proyectoActual?.id || '');
                    } else {
                        destinoIds = await getAlumnosDelProyecto(proyectoActual?.id || '');
                    }

                    if (destinoIds.length > 0) {
                        await crearNotificacionMasiva(destinoIds, {
                            proyectoId: proyectoActual?.id,
                            tipo: 'notas_actualizadas',
                            titulo: `¡Tarea Evaluada: "${currentTarea.titulo}"!`,
                            descripcion: `El profesor ha calificado tu entrega. ¡Ven a ver el resultado!`,
                            metadata: { tarea_id: currentTarea.id }
                        });
                    }
                }
            }
            
            fetchTareasProyecto();
        } catch (err) {
            console.error('Error changing task status:', err);
            toast.error('Error al cambiar el estado');
        }
    };

    const handleUpdateTarea = async (id: string, data: any) => {
        try {
            const { error } = await supabase.from('tareas').update(data).eq('id', id);
            if (error) throw error;
            fetchTareasProyecto();
            // Si la tarea editada es la que está abierta, actualizamos el estado local del modal (opcional si se cierra)
            setTareaSeleccionadaDetalle(prev => prev && prev.id === id ? { ...prev, ...data } : prev);
        } catch (err) {
            console.error('Error updating task:', err);
            throw err;
        }
    };

    const totalInteracciones = grupos.reduce((sum, g) => sum + g.interacciones_ia, 0);
    
    const getProgresoGrupo = (grupoId: string | number) => {
        const gidNum = Number(grupoId);
        // Tareas que le corresponden a este grupo (específicas + generales)
        const tareasDelGrupo = tareasProyecto.filter(t => 
            (t.grupo_id !== null && t.grupo_id !== undefined && Number(t.grupo_id) === gidNum) || 
            (t.grupo_id === null || t.grupo_id === undefined || String(t.grupo_id) === 'all')
        );
        
        if (tareasDelGrupo.length === 0) return 0;

        const completadasCount = tareasDelGrupo.filter(t => {
            // 1. Priorizar estado de entrega (para tareas globales y específicas)
            const e = (entregasProyecto || []).find(ent => ent.tarea_id === t.id && Number(ent.grupo_id) === gidNum);
            if (e && (e.estado === 'evaluada' || e.estado === 'aprobado' || e.estado === 'completado' || e.estado === 'revisado')) {
                return true;
            }
            // 2. Si es específica de este grupo, el estado de la tarea en sí
            if (Number(t.grupo_id) === gidNum) {
                return t.estado === 'aprobado' || t.estado === 'completado';
            }
            // 3. Si la tarea es global y está aprobada pero NO hay entrega
            if (!t.grupo_id && (t.estado === 'aprobado' || t.estado === 'completado')) {
                return true; 
            }
            return false;
        }).length;

        return Math.round((completadasCount / tareasDelGrupo.length) * 100);
    };

    const progresoGlobal = grupos.length > 0
        ? Math.round(grupos.reduce((acc, g) => acc + getProgresoGrupo(g.id), 0) / grupos.length)
        : 0;

    const hitosCompletados = tareasProyecto.filter(t => t.estado === 'aprobado' || t.estado === 'completado').length;
    // Bloqueados cuenta status 'Bloqueado' O que estén pidiendo ayuda
    const gruposBloqueados = grupos.filter(g => g.estado === 'Bloqueado' || g.pedir_ayuda).length;

    const handleLogout = async () => {
        try {
            await signOut();
            // La redirección la maneja el AuthContext o el estado de usuario en App.tsx
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            toast.error('Error al cerrar sesión');
        }
    };

    const handleAjustesIA = () => {
        setModalAjustesIAAbierto(true);
    };

    return (
        <div className="flex min-h-screen bg-gray-50 uppercase-none">
            {/* Modals */}


            {modalAjustesIAAbierto && (
                <ModalConfiguracionIA
                    onClose={() => setModalAjustesIAAbierto(false)}
                    proyectoId={proyectoActual?.id}
                />
            )}

            {modalRuletaAbierta && (
                <RuletaModal
                    onClose={() => setModalRuletaAbierta(false)}
                    proyectoId={proyectoActual?.id}
                    codigoSala={proyectoActual?.codigo_sala}
                />
            )}

            {/* Modal Tico Game */}
            {modalTicoAbierto && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="relative w-full max-w-md">
                        <button
                            onClick={() => setModalTicoAbierto(false)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <TicoGameWidget
                            projectId={proyectoActual?.id}
                            organizacionId={proyectoActual?.organizacion_clase_id}
                        />
                    </div>
                </div>
            )}

            {/* Modal crear grupo */}
            {modalCrearGrupoAbierto && (
                <ModalCrearGrupo
                    onClose={() => {
                        setModalCrearGrupoAbierto(false);
                        setGrupoEditando(null);
                    }}
                    onCrear={(grupoData) => {
                        if (grupoEditando) {
                            onEditarGrupo(grupoEditando.id, grupoData);
                            setGrupoEditando(null);
                        } else {
                            onCrearGrupo(grupoData);
                        }
                    }}
                    grupoEditando={grupoEditando}
                    proyectoId={proyectoActual?.id}
                    codigoSala={proyectoActual?.codigo_sala}
                />
            )}

            {modalRevisionAbierto && (
                <ModalRevisionHitos
                    grupos={grupos}
                    tareasGlobales={tareasProyecto}
                    entregasGlobales={entregasProyecto}
                    onClose={() => setModalRevisionAbierto(false)}
                    onUpdateBatch={handleUpdateBatchMilestones}
                    onOpenTask={(t: TareaDetallada, gid: string | number | undefined) => {
                         // Asignar tarea seleccionada y setear el grupo objetivo actual del ModalRevisionHitos
                         setTareaSeleccionadaDetalle(t);
                         setTargetGrupoId(gid);
                    }}
                    onUpdateTarea={async (tareaId, nuevoEstado) => {
                        try {
                            const { error } = await supabase
                                .from('tareas')
                                .update({ estado: nuevoEstado })
                                .eq('id', tareaId);
                            if (error) throw error;
                            
                            // Actualización local para feedback instantáneo
                            setTareasProyecto(prev => prev.map(t => 
                                t.id === tareaId ? { ...t, estado: nuevoEstado as any } : t
                            ));
                        } catch (err) {
                            console.error('Error actualizando estado de tarea:', err);
                            toast.error('Error al actualizar la tarea');
                        }
                    }}
                />
            )}

            {modalAsistenciaOpen && (
                <ModalAsistencia
                    grupos={grupos}
                    proyectoId={proyectoActual?.id || ''}
                    rubrica={proyectoActual?.rubrica}
                    onClose={() => setModalAsistenciaOpen(false)}
                />
            )}


            {/* Modal unificado: Crear Tarea Classroom (reemplaza ModalAsignarTareas) */}
            {modalAsignarAbierto && proyectoActual && (
                <ModalCrearTareaClassroom
                    proyectoId={proyectoActual.id}
                    grupos={grupos}
                    preselectedGrupoId={grupoParaTareas ? String(grupoParaTareas.id) : undefined}
                    onClose={() => { setModalAsignarAbierto(false); setGrupoParaTareas(null); }}
                    onTareaCreada={(t) => {
                        setTareasProyecto(prev => [t, ...prev]);
                    }}
                />
            )}

            {/* Modal para crear tarea desde el botón global */}
            {modalCrearTareaAbierto && proyectoActual && (
                <ModalCrearTareaClassroom
                    proyectoId={proyectoActual.id}
                    grupos={grupos}
                    onClose={() => setModalCrearTareaAbierto(false)}
                    onTareaCreada={(t) => {
                        setTareasProyecto(prev => [t, ...prev]);
                    }}
                />
            )}



            {/* Modal Asignar Tareas (Profesor) */}
            {grupoEditando && modalCrearGrupoAbierto === false && (
                null
            )}

            {modalChatAlumnosAbierto && (
                <ModalChatAlumnosDocente
                    isOpen={modalChatAlumnosAbierto}
                    onClose={() => setModalChatAlumnosAbierto(false)}
                    docenteId={user?.id || 'profesor-local'}
                    docenteNombre={perfil?.nombre || 'Docente'}
                    grupos={grupos}
                    onMessagesRead={() => {
                        const fetchUnreadStudentMessages = async () => {
                            try {
                                const { data, error } = await supabase
                                    .from('mensajes_profesor_alumno')
                                    .select('id')
                                    .eq('profesor_user_id', user!.id)
                                    .neq('sender_id', user!.id)
                                    .eq('leido', false);

                                if (!error && data) {
                                    setUnreadStudentMessages(data.length);
                                }
                            } catch (err) {
                                console.error('Error fetching unread student messages:', err);
                            }
                        };
                        fetchUnreadStudentMessages();
                    }}
                />
            )}

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            {!modalAsistenciaOpen && !hideSidebar && (
                <aside className={`
            fixed md:relative z-50 h-full w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
                    <div className="p-6 border-b border-gray-200 flex flex-col justify-center items-center gap-2 relative">
                        <h2 className="text-xl font-black text-blue-600 uppercase tracking-widest">Ai Tico</h2>

                        <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400 absolute right-6">
                            <LayoutDashboard className="w-6 h-6 rotate-45" /> {/* Reuse icon as Close for speed */}
                        </button>
                    </div>

                    <nav className="flex-1 p-4">
                        <div className="hidden md:block">
                            <button
                                onClick={() => { onSectionChange('grupos'); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${currentSection === 'grupos'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold'
                                    : 'text-gray-600 hover:bg-gray-100 font-medium'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span>Grupos</span>
                            </button>

                            <button
                                onClick={() => { onSectionChange('resumen'); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 transition-all ${currentSection === 'resumen'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold'
                                    : 'text-gray-600 hover:bg-gray-100 font-medium'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <LayoutList className="w-5 h-5" />
                                    <span>Tareas</span>
                                </div>
                                {numPendientesTareas > 0 && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${currentSection === 'resumen' ? 'bg-white text-blue-600' : 'bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-200'}`}>
                                        {numPendientesTareas}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => { onSectionChange('trabajo-compartido'); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${currentSection === 'trabajo-compartido'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold'
                                    : 'text-gray-600 hover:bg-gray-100 font-medium'
                                    }`}
                            >
                                <Share2 className="w-5 h-5" />
                                <span>Trabajo compartido</span>
                            </button>





                            <button
                                onClick={() => { onSectionChange('evaluacion'); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${currentSection === 'evaluacion'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold'
                                    : 'text-gray-600 hover:bg-gray-100 font-medium'
                                    }`}
                            >
                                <ClipboardCheck className="w-5 h-5" />
                                <span>Evaluación</span>
                            </button>

                            <button
                                onClick={() => { onSectionChange('notificaciones'); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 transition-all ${currentSection === 'notificaciones'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold'
                                    : 'text-gray-600 hover:bg-gray-100 font-medium'
                                    }`}
                            >
                                <div className="flex items-center gap-3 relative">
                                    <Bell className="w-5 h-5" />
                                    <span>Notificaciones</span>
                                </div>
                                {unreadNotifications > 0 && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${currentSection === 'notificaciones' ? 'bg-white text-blue-600' : 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'}`}>
                                        {unreadNotifications}
                                    </span>
                                )}
                            </button>
                        </div>



                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <ListaAlumnosEnLinea proyectoId={proyectoActual?.id} grupos={grupos} onAlumnoClick={setAlumnoParaEvaluar} />
                        </div>
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={onIniciarTutorial}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold group"
                        >
                            <CircleHelp className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            <span>Tutorial interactivo</span>
                        </button>
                        
                        <div className="mt-2 px-4 text-[10px] text-gray-400 font-medium tracking-widest uppercase text-center opacity-60">
                            V5.8.79
                        </div>
                    </div>
                </aside>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-5 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
                            >
                                <LayoutDashboard className="w-6 h-6" />
                            </button>
                            {/* Oculto en móvil para ganar espacio */}
                            <div className="hidden md:flex flex-col gap-1">
                                {proyectoActual ? (
                                    <div className="flex flex-col">
                                        {/* Project Name & Edit */}
                                        {isEditingProjectName ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editingProjectName}
                                                    onChange={(e) => setEditingProjectName(e.target.value)}
                                                    className="text-xl font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={async () => {
                                                        if (editingProjectName.trim()) {
                                                            await onUpdateProjectName(editingProjectName.trim());
                                                            setIsEditingProjectName(false);
                                                        }
                                                    }}
                                                    className="p-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingProjectName(false)}
                                                    className="p-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                                        {proyectoActual.nombre}
                                                        <button
                                                            onClick={() => {
                                                                setEditingProjectName(proyectoActual.nombre);
                                                                setIsEditingProjectName(true);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Renombrar proyecto"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        {proyectoActual.asignatura && (
                                                            <div className={`px-2 py-0.5 rounded-full border ${getAsignaturaStyles(proyectoActual.asignatura).borderClass} ${getAsignaturaStyles(proyectoActual.asignatura).lightBgClass} ${getAsignaturaStyles(proyectoActual.asignatura).textClass} text-[10px] font-black uppercase tracking-widest`}>
                                                                {proyectoActual.asignatura}
                                                            </div>
                                                        )}
                                                    </h1>
                                                    <button
                                                        onClick={onCambiarProyecto}
                                                        className="relative flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                                    >
                                                        <FolderOpen className="w-3 h-3" />
                                                        Cambiar
                                                        {unreadFamilyMessages > 0 && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-500 rounded-full animate-bounce shadow-md border border-white" />}
                                                    </button>
                                                </div>

                                                 <div className="flex items-center gap-2">
                                                    <span className={`bg-blue-600 text-white text-sm font-black px-4 py-1.5 rounded-xl shadow-lg ${proyectoActual.asignatura ? `shadow-${getAsignaturaStyles(proyectoActual.asignatura).borderClass.split('-')[1]}-200` : 'shadow-blue-200'} tracking-wider flex items-center gap-2`}>
                                                        <Key className="w-4 h-4" />
                                                        CÓDIGO: <span className="text-lg">{proyectoActual.codigo_sala}</span>
                                                    </span>

                                                    <button
                                                        onClick={() => setModalHorarioAbierto(true)}
                                                        className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-all font-black text-xs shadow-sm"
                                                        title="Ver mi horario"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        <span>HORARIO</span>
                                                     </button>

                                                    <button
                                                        onClick={() => onSectionChange('calendario')}
                                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all font-black text-xs shadow-sm ${currentSection === 'calendario' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'}`}
                                                        title="Ver calendario del proyecto"
                                                    >
                                                        <CalendarDays className="w-4 h-4" />
                                                        <span>CALENDARIO</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Tico - Panel Docente</h1>
                                    </>
                                )}
                            </div>
                            {/* Texto e indicador visible en móvil */}
                            <div className="md:hidden flex flex-col items-start leading-none">
                                <div className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                                    {proyectoActual ? proyectoActual.nombre : 'Panel Docente'}
                                    <button
                                        onClick={onCambiarProyecto}
                                        className="relative p-1.5 bg-slate-100 text-slate-400 rounded-lg active:scale-95"
                                        title="Cambiar proyecto"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        {unreadFamilyMessages > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce border border-white" />}
                                    </button>
                                 </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Sala: {proyectoActual?.codigo_sala}</span>
                                    <button
                                        onClick={() => setModalHorarioAbierto(true)}
                                        className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black flex items-center gap-1 border border-emerald-100"
                                    >
                                        <Calendar className="w-2.5 h-2.5" />
                                        HORARIO
                                    </button>
                                    <button
                                        onClick={() => onSectionChange('calendario')}
                                        className={`p-1 px-2 rounded-lg text-[9px] font-black flex items-center gap-1 border ${currentSection === 'calendario' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}
                                    >
                                        <CalendarDays className="w-2.5 h-2.5" />
                                        CALENDARIO
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Acciones en Cuadrícula en móvil */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex items-center gap-2 w-full md:w-auto">


                            {/* Chat Alumnos Button (MOVED BEFORE IA MENTOR) */}
                            <button
                                onClick={() => setModalChatAlumnosAbierto(true)}
                                className="relative flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-fuchsia-50 text-fuchsia-600 border-2 border-fuchsia-100 hover:border-fuchsia-300 rounded-2xl font-black transition-all text-[10px] md:text-xs"
                                title="Chat con Alumnos"
                            >
                                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline">ALUMNOS</span>
                                <span className="md:hidden">CHAT</span>
                                {unreadStudentMessages > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 md:w-5 md:h-5 bg-rose-500 text-white text-[8px] md:text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                                        {unreadStudentMessages}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={handleAjustesIA}
                                className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-purple-100 text-purple-700 border-2 border-purple-200 hover:border-purple-400 rounded-2xl font-black transition-all text-[10px] md:text-xs"
                                title="Configurar Mentor IA"
                            >
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline">IA MENTOR</span>
                                <span className="md:hidden">IA</span>
                            </button>

                            <button
                                onClick={() => setModalAsistenciaOpen(true)}
                                className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl font-black transition-all duration-200 active:scale-95 text-[10px] md:text-xs"
                                title="Pasar lista"
                            >
                                <UserCheck className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline">LISTA</span>
                                <span className="md:hidden">LISTA</span>
                            </button>

                            <button
                                onClick={onOpenTicoFull}
                                className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 hover:border-emerald-300 rounded-2xl font-black transition-all text-[10px] md:text-xs"
                                title="Ver Mascota de clase (Pantalla Completa)"
                            >
                                <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline">TICO</span>
                                <span className="md:hidden">TICO</span>
                            </button>

                            <button
                                onClick={() => setModalRuletaAbierta(true)}
                                className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-amber-50 text-amber-600 border-2 border-amber-100 hover:border-amber-300 rounded-2xl font-black transition-all text-[10px] md:text-xs"
                                title="Sorteo y Grupos"
                            >
                                <Dices className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline">RULETA</span>
                                <span className="md:hidden">AZAR</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-rose-50 text-rose-600 border-2 border-rose-100 hover:border-rose-300 rounded-2xl font-black transition-all text-[10px] md:text-xs"
                            >
                                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline">SALIR</span>
                                <span className="md:hidden">SALIR</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main scroll area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50 pb-24 md:pb-8">
                    {/* Helper Functions internal to the component (or could be moved to utils) */}
                    {(() => {
                        const formatRelativeDate = (dateStr: string) => {
                            const d = new Date(dateStr);
                            const now = new Date();
                            const diff = d.getTime() - now.getTime();
                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            if (days < 0) return { text: `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`, color: 'text-red-500' };
                            if (days === 0) return { text: 'Vence hoy', color: 'text-amber-600' };
                            if (days === 1) return { text: 'Vence mañana', color: 'text-amber-500' };
                            if (days <= 7) return { text: `Vence en ${days} días`, color: 'text-blue-500' };
                            return { text: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), color: 'text-slate-500' };
                        };

                        const getEstadoBadge = (estado: string) => {
                            const map: Record<string, { bg: string; text: string; label: string }> = {
                                pendiente: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pendiente' },
                                en_progreso: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En curso' },
                                revision: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En revisión' },
                                aprobado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobada' },
                                completado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completada' },
                                rechazado: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazada' },
                                propuesto: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Propuesta' },
                            };
                            const s = map[estado] || map.pendiente;
                            return <span className={`${s.bg} ${s.text} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider`}>{s.label}</span>;
                        };

                        return null; // Just to define them once inside the scope if needed
                    })()}

                    <div className="max-w-7xl mx-auto space-y-8">
                        {currentSection === 'resumen' && (
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

                                {/* COLUMNA IZQUIERDA: TABLERO DE TAREAS (MAIN) */}
                                <div className="xl:col-span-3 space-y-8 order-2 xl:order-1">

                                    {/* TABLERO GLOBAL DE TAREAS (Sustituido por Lista Estilo Calendario) */}
                                    <div className="bg-white rounded-[2.5rem] p-4 md:p-8 border border-slate-200 shadow-sm min-h-[600px]">
                                        <div className="flex flex-wrap items-center justify-end gap-4 mb-8">
                                            <div className="flex flex-wrap items-center gap-3 ml-auto">
                                                {/* Toolbar de filtros */}
                                                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                                    <select 
                                                        value={filtroGrupo}
                                                        onChange={(e) => setFiltroGrupo(e.target.value)}
                                                        className="text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    >
                                                        <option value="todos">Todos los Grupos</option>
                                                        {grupos.map(g => <option key={g.id} value={String(g.id)}>{g.nombre}</option>)}
                                                    </select>
                                                    <div className="flex bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
                                                        {['todos', 'pendiente', 'revision', 'completado'].map(f => (
                                                            <button
                                                                key={f}
                                                                onClick={() => setFiltroEstado(f)}
                                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filtroEstado === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                            >
                                                                {f === 'todos' ? 'Todo' : f === 'revision' ? 'Para revisar' : f}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setModalCrearTareaAbierto(true)}
                                                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 shrink-0"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Nueva Tarea
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {(() => {
                                                const gidFilter = filtroGrupo === 'todos' ? null : filtroGrupo;
                                                const filtered = tareasProyecto.filter(t => {
                                                    // 1. Filtrado por GRUPO
                                                    if (gidFilter) {
                                                        const esDeEsteGrupo = String(t.grupo_id) === gidFilter;
                                                        const esGlobal = !t.grupo_id || String(t.grupo_id) === 'all';
                                                        if (!esDeEsteGrupo && !esGlobal) return false;
                                                    }

                                                    // 2. Determinación del ESTADO para el filtro
                                                    let estadoReal = t.estado;
                                                    
                                                    if (gidFilter) {
                                                        // Contexto de un grupo específico: la realidad es lo que haya hecho ESE grupo
                                                        const entrega = entregasProyecto.find(e => e.tarea_id === t.id && String(e.grupo_id) === gidFilter);
                                                        if (entrega) {
                                                            if (entrega.estado === 'evaluada') estadoReal = 'completado';
                                                            else if (entrega.estado === 'entregada') estadoReal = 'revision';
                                                            else estadoReal = 'pendiente';
                                                        } else {
                                                            // Si no hay entrega, usamos el estado de la tarea si es específica
                                                            if (String(t.grupo_id) === gidFilter) {
                                                                if (t.estado === 'aprobado') estadoReal = 'completado';
                                                                else estadoReal = t.estado;
                                                            } else {
                                                                // Es global pero este grupo no ha entregado
                                                                estadoReal = 'pendiente';
                                                            }
                                                        }
                                                    } else {
                                                        // Contexto "Todos los grupos": Lógica de agregación para globales
                                                        if (!t.grupo_id || String(t.grupo_id) === 'all') {
                                                            const entregas = entregasProyecto.filter(e => e.tarea_id === t.id);
                                                            const numEntregadas = entregas.filter(e => e.estado === 'entregada').length;
                                                            const numEvaluadas = entregas.filter(e => e.estado === 'evaluada').length;
                                                            const totalEsperados = grupos.length;

                                                            if (numEvaluadas >= totalEsperados && totalEsperados > 0) estadoReal = 'completado';
                                                            else if (numEntregadas > 0 || numEvaluadas > 0) estadoReal = 'revision';
                                                            else estadoReal = 'pendiente';
                                                        } else {
                                                            if (t.estado === 'aprobado') estadoReal = 'completado';
                                                            else estadoReal = t.estado;
                                                        }
                                                    }

                                                    // 3. Filtrado por ESTADO
                                                    const matchEstado = filtroEstado === 'todos' || 
                                                                       estadoReal === filtroEstado || 
                                                                       (filtroEstado === 'completado' && estadoReal === 'completado');
                                                    
                                                    return matchEstado;
                                                });

                                                if (filtered.length === 0) {
                                                    return (
                                                        <div className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-300">
                                                                <ClipboardCheck className="w-10 h-10" />
                                                            </div>
                                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin resultados para estos filtros</p>
                                                        </div>
                                                    );
                                                }

                                                return filtered.map(t => {
                                                    // Replicating helper logic here locally for simplicity in this replacement
                                                    const formatRelativeDate = (dateStr: string) => {
                                                        const d = new Date(dateStr);
                                                        const now = new Date();
                                                        const diff = d.getTime() - now.getTime();
                                                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                        if (days < 0) return { text: `Venció hace ${Math.abs(days)} d`, color: 'text-red-500' };
                                                        if (days === 0) return { text: 'Hoy', color: 'text-amber-600' };
                                                        if (days === 1) return { text: 'Mañana', color: 'text-amber-500' };
                                                        if (days <= 7) return { text: `${days} d`, color: 'text-blue-500' };
                                                        return { text: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), color: 'text-slate-500' };
                                                    };

                                                    const getEstadoBadgeInternal = (estado: string) => {
                                                        const map: Record<string, { bg: string; text: string; label: string }> = {
                                                            pendiente: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pendiente' },
                                                            en_progreso: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En curso' },
                                                            revision: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En revisión' },
                                                            aprobado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobada' },
                                                            completado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completada' },
                                                            rechazado: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazada' },
                                                            propuesto: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Propuesta' },
                                                        };
                                                        const s = map[estado] || map.pendiente;
                                                        return <span className={`${s.bg} ${s.text} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider`}>{s.label}</span>;
                                                    };

                                                    const fechaInfo = t.fecha_entrega ? formatRelativeDate(t.fecha_entrega) : null;
                                                    const grupoNombre = t.grupo_id ? grupos.find(g => Number(g.id) === t.grupo_id)?.nombre : 'Todos';

                                                    return (
                                                        <div
                                                            key={t.id}
                                                            className="w-full flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group"
                                                        >
                                                              <div 
                                                                  onClick={() => {
                                                                      if (gidFilter) {
                                                                          // Atajo: Si hay filtro de grupo, abrir directamente el editor para ese grupo
                                                                          setTargetGrupoId(gidFilter);
                                                                          setTareaSeleccionadaDetalle(t);
                                                                      } else {
                                                                          // Si es vista general, abrir el Hub (seguimiento)
                                                                          setModalSeguimientoAbierto(t);
                                                                      }
                                                                  }}
                                                                  className="flex-1 min-w-0 flex items-center gap-4 cursor-pointer"
                                                              >
                                                                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-slate-100">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span 
                                                                            onClick={(e) => { e.stopPropagation(); setTareaSeleccionadaDetalle(t); }}
                                                                            className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                                                                        >
                                                                            {grupoNombre}
                                                                        </span>
                                                                        {t.estado === 'revision' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>}
                                                                    </div>
                                                                    <p className="font-bold text-slate-800 truncate text-[13px] leading-none">{t.titulo}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3 shrink-0 ml-auto">
                                                                {fechaInfo && (
                                                                    <div className={`hidden sm:flex flex-col items-end ${fechaInfo.color}`}>
                                                                        <span className="text-[9px] font-black uppercase tracking-tighter opacity-50">Plazo</span>
                                                                        <span className="text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"><Clock className="w-2.5 h-2.5" /> {fechaInfo.text}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col items-center gap-1 min-w-[65px]">
                                                                    {(() => {
                                                                        const entregas = entregasProyecto.filter(e => e.tarea_id === t.id);
                                                                        const totalEsperados = t.grupo_id ? 1 : grupos.length;
                                                                        
                                                                        let estadoReal = t.estado;
                                                                        if (!t.grupo_id) {
                                                                            const numEntregadas = entregas.filter(e => e.estado === 'entregada').length;
                                                                            const numEvaluadas = entregas.filter(e => e.estado === 'evaluada' || e.estado === 'revisado').length;
                                                                            if (numEvaluadas >= totalEsperados) estadoReal = 'completado';
                                                                            else if (numEntregadas > 0) estadoReal = 'revision';
                                                                            else estadoReal = 'pendiente';
                                                                        }
                                                                        return getEstadoBadgeInternal(estadoReal);
                                                                    })()}
                                                                    <div className="flex items-center gap-1.5 mt-1">
                                                                        {(() => {
                                                                            const entregas = entregasProyecto.filter(e => e.tarea_id === t.id);
                                                                            const numEntregados = entregas.length;
                                                                            const totalEsperados = t.grupo_id ? 1 : grupos.length;
                                                                            return (
                                                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shadow-sm ${numEntregados >= totalEsperados ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                                                    {numEntregados}/{totalEsperados}
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.puntos_maximos} pts</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 group-hover:translate-x-0 transition-all">
                                                                    <button
                                                                        onClick={() => setModalSeguimientoAbierto(t)}
                                                                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-100 transition-all whitespace-nowrap"
                                                                    >
                                                                        <Users className="w-3.5 h-3.5" />
                                                                        <span className="hidden xs:inline">Entregas</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleEliminarTareaGlobal(t.id, t.titulo); }}
                                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA: BIO-ESTADO (STICKY SIDEBAR) */}
                                <div className="xl:col-span-1 order-1 xl:order-2 space-y-6">

                                    {/* Living Tree Card - Rocket Version */}
                                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden sticky top-24 p-6 flex flex-col items-center min-h-[500px] justify-center relative">
                                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-50/50 to-transparent rounded-t-[2rem] pointer-events-none"></div>
                                        <h3 className="absolute top-6 left-6 text-xs font-black text-slate-400 uppercase tracking-widest z-10">Progreso Global</h3>

                                        <div className="relative w-full flex justify-center -my-4 z-10 transform hover:-translate-y-2 transition-transform duration-500">
                                            <LivingTree
                                                progress={progresoGlobal}
                                                health={100}
                                                size={300}
                                                showLabels={false}
                                                variant="nexus"
                                            />
                                        </div>

                                        <div className="mt-12 text-center relative z-10 w-full">
                                            <div className="text-4xl font-black text-indigo-600 mb-1">{progresoGlobal}%</div>
                                            <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest bg-indigo-50 py-1.5 px-3 rounded-full box-border border border-indigo-100 inline-block">Tarea Espacial</div>
                                        </div>
                                    </div>

                                    {mostrandoEjemplo && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center shadow-inner">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">Modo Demo Activo</p>
                                            <button
                                                onClick={onLimpiarDatos}
                                                className="w-full py-2 bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-300 rounded-xl font-bold text-xs uppercase transition-all shadow-sm"
                                            >
                                                Reiniciar Datos
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>

                        )}

                        {currentSection === 'grupos' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                    <h2 className="text-2xl font-black text-gray-900 hidden md:block">Gestión de Equipos</h2>
                                    <button onClick={() => {
                                        setModalCrearGrupoAbierto(true);
                                        setGrupoEditando(null);
                                    }} className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-4 md:py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                                        <Plus className="w-5 h-5" />
                                        Crear nuevo grupo
                                    </button>
                                </div>

                                {/* Simple Grid View (No Departments) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...grupos].sort((a, b) => Number(b.id) - Number(a.id)).map(grupo => (
                                        <Card_Grupo
                                            key={grupo.id}
                                            grupo={{
                                                ...grupo,
                                                progreso: getProgresoGrupo(grupo.id)
                                            }}
                                            onClick={() => onSelectGrupo({
                                                ...grupo,
                                                progreso: getProgresoGrupo(grupo.id)
                                            })}
                                            onEdit={() => {
                                                setGrupoEditando(grupo);
                                                setModalCrearGrupoAbierto(true);
                                            }}
                                            onDelete={() => {
                                                if (confirm(`¿Eliminar "${grupo.nombre}"?`)) onEliminarGrupo(grupo.id);
                                            }}
                                            onAssignTasks={() => {
                                                setGrupoParaTareas(grupo);
                                                setModalAsignarAbierto(true);
                                            }}
                                            onRevisar={() => setModalRevisionAbierto(true)}
                                            mostrarBotonEditar={true}
                                            mostrarBotonBorrar={true}
                                            asignatura={proyectoActual?.asignatura}
                                        />
                                    ))}
                                    {grupos.length === 0 && (
                                        <div className="col-span-full py-16 text-center text-gray-400 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
                                            <p>No hay grupos creados aún.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                        {currentSection === 'trabajo-compartido' && (
                            <div className="relative">
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => setModalSubirRecursoAbierto(true)}
                                        className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl active:scale-95 border-2 border-slate-700"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Subir Archivo Docente
                                    </button>
                                </div>

                                <RepositorioColaborativo
                                    grupo={proyectoActual?.grupos?.[0] || { id: 0, nombre: 'General', estado: 'En progreso', progreso: 0, interacciones_ia: 0, miembros: [] }}
                                    todosLosGrupos={proyectoActual?.grupos || []}
                                    esDocente={true}
                                    proyectoId={proyectoActual?.id || ''}
                                    mostrarEjemplo={mostrandoEjemplo}
                                    refreshTrigger={refreshRecursos}
                                />

                                {modalSubirRecursoAbierto && (
                                    <ModalSubirRecurso
                                        grupo={{ id: 0, nombre: 'Docente', miembros: [], progreso: 0, estado: 'En progreso', interacciones_ia: 0 }}
                                        proyectoId={proyectoActual?.id}
                                        esDocente={true}
                                        onClose={() => setModalSubirRecursoAbierto(false)}
                                        onSuccess={() => {
                                            setModalSubirRecursoAbierto(false);
                                            setRefreshRecursos(prev => prev + 1);
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {currentSection === 'calendario' && proyectoActual && (
                            <VistaCalendario
                                proyectoId={proyectoActual.id}
                                grupos={grupos}
                            />
                        )}

                        {currentSection === 'evaluacion' && <EvaluacionRubricas grupos={grupos} rubrica={proyectoActual?.rubrica} proyectoId={proyectoActual?.id} tareasProyecto={tareasProyecto} entregasProyecto={entregasProyecto} />}

                        {currentSection === 'notificaciones' && user && (
                            <NotificacionesPanel 
                                userId={user.id} 
                                proyectoId={proyectoActual?.id} 
                                hideHeader={true}
                                onUnreadChange={setUnreadNotifications}
                                onNotificationClick={(notif: Notificacion) => {
                                    if (notif.tipo === 'tarea_revision') {
                                        const tId = notif.metadata?.tarea_id;
                                        const tarea = tareasProyecto.find(t => t.id === tId);
                                        if (tarea) {
                                            if (notif.metadata?.grupo_id) setTargetGrupoId(notif.metadata?.grupo_id);
                                            setTareaSeleccionadaDetalle(tarea);
                                        } else {
                                            setModalRevisionAbierto(true);
                                        }
                                    } else if (notif.tipo === 'mano_levantada') {
                                        onSectionChange('grupos');
                                    } else if (notif.tipo === 'mensaje_familia') {
                                        if (onOpenFamilyChat) onOpenFamilyChat();
                                    } else if (notif.tipo === 'comentario_tarea') {
                                        const tId = notif.metadata?.tarea_id;
                                        const gId = notif.metadata?.grupo_id;
                                        const tarea = tareasProyecto.find(t => t.id === tId);
                                        if (tarea) {
                                            if (gId) setTargetGrupoId(gId);
                                            setModalInitialShowChat(true);
                                            setTareaSeleccionadaDetalle(tarea);
                                        }
                                    } else if (notif.tipo === 'mensaje_colaboracion') {
                                        // Redirigir al panel de proyectos y abrir el chat allí
                                        localStorage.setItem('open_collab_chat_on_load', 'true');
                                        if (onCambiarProyecto) onCambiarProyecto();
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal código sala */}
            {mostrarCodigoSala && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-8 border-b-2 border-gray-100">
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Código de Clase</h3>
                            <button onClick={() => setMostrarCodigoSala(false)} className="text-gray-400 hover:text-red-500 font-black text-2xl">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10">
                            <SistemaCodigoSala codigoSala={proyectoActual?.codigo_sala} />
                        </div>
                    </div>
                </div>
            )}

            {solicitudEmergente && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
                        <div className="p-8 overflow-y-auto">
                            <SolicitudesColaboracion 
                                solicitudDirecta={solicitudEmergente}
                                onClose={() => setSolicitudEmergente(null)}
                                onUpdate={() => {
                                    setSolicitudEmergente(null);
                                    window.location.reload(); 
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {tareaSeleccionadaDetalle && (
                <ModalDetalleTarea
                    tarea={{
                        ...tareaSeleccionadaDetalle,
                        contenido_alumno: targetGrupoId 
                            ? (entregasProyecto.find((e: any) => e.tarea_id === tareaSeleccionadaDetalle.id && Number(e.grupo_id) === Number(targetGrupoId))?.respuesta_texto || '') 
                            : tareaSeleccionadaDetalle.contenido_alumno,
                        archivos_alumno: targetGrupoId 
                            ? (entregasProyecto.find((e: any) => e.tarea_id === tareaSeleccionadaDetalle.id && Number(e.grupo_id) === Number(targetGrupoId))?.archivos_entregados || []) 
                            : tareaSeleccionadaDetalle.archivos_alumno,
                        calificacion: targetGrupoId 
                            ? (entregasProyecto.find((e: any) => e.tarea_id === tareaSeleccionadaDetalle.id && Number(e.grupo_id) === Number(targetGrupoId))?.calificacion ?? tareaSeleccionadaDetalle.calificacion) 
                            : tareaSeleccionadaDetalle.calificacion
                    }}
                    grupos={grupos}
                    onClose={() => { setTareaSeleccionadaDetalle(null); setTargetGrupoId(undefined); setModalInitialShowChat(false); }}
                    onEstadoChange={async (id, nuevoEstado, nota) => {
                        await handleEstadoChangeWithPoints(id, nuevoEstado, tareaSeleccionadaDetalle, nota);
                        setTareaSeleccionadaDetalle(null);
                        setTargetGrupoId(undefined);
                        setModalInitialShowChat(false);
                    }}
                    onDelete={(id) => {
                        handleEliminarTareaGlobal(id, tareaSeleccionadaDetalle.titulo);
                        setTargetGrupoId(undefined);
                        setModalInitialShowChat(false);
                    }}
                    onUpdateTarea={handleUpdateTarea}
                    isStudent={false}
                    targetGrupoId={targetGrupoId}
                    currentUserId={user?.id}
                    currentUserNombre={perfil?.nombre || 'Profesor'}
                    initialShowChat={modalInitialShowChat}
                />
            )}

            {modalSeguimientoAbierto && (
                <ModalSeguimientoGrupos
                    tarea={modalSeguimientoAbierto}
                    grupos={grupos}
                    onClose={() => setModalSeguimientoAbierto(null)}
                    onUpdate={fetchTareasProyecto}
                    onSelectGrupo={(gId) => {
                        setTargetGrupoId(gId);
                        setTareaSeleccionadaDetalle(modalSeguimientoAbierto);
                        // setModalSeguimientoAbierto(null); // ELIMINADO: Mantener el Hub abierto debajo del detalle
                    }}
                />
            )}

            {alumnoParaEvaluar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <PerfilAlumno
                            alumno={alumnoParaEvaluar.nombre}
                            grupo={alumnoParaEvaluar.grupo}
                            onClose={() => setAlumnoParaEvaluar(null)}
                            rubrica={proyectoActual?.rubrica}
                        />
                    </div>
                </div>
            )}

            {/* Bottom Navigation (Mobile Only) - Hidden if any main modal is open to avoid overlapping */}
            {!modalCrearGrupoAbierto && !modalAsignarAbierto && !modalRevisionAbierto && !modalAsistenciaOpen && !modalAjustesIAAbierto && !alumnoParaEvaluar && !modalChatProfesoresAbierto && (
                <nav className="md:hidden fixed bottom-1 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/20 px-2 py-3 flex items-center justify-around z-[100] shadow-[0_10px_40px_rgb(0,0,0,0.1)] rounded-[2.5rem] animate-in slide-in-from-bottom-5 duration-300">
                    <button
                        onClick={() => onSectionChange('grupos')}
                        className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${currentSection === 'grupos' ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${currentSection === 'grupos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-transparent'}`}>
                            <Users className={`w-5 h-5 ${currentSection === 'grupos' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${currentSection === 'grupos' ? 'opacity-100' : 'opacity-80'}`}>Grupos</span>
                    </button>

                    <button
                        onClick={() => onSectionChange('resumen')}
                        className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${currentSection === 'resumen' ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${currentSection === 'resumen' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-transparent'}`}>
                            <LayoutList className={`w-5 h-5 ${currentSection === 'resumen' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${currentSection === 'resumen' ? 'opacity-100' : 'opacity-80'}`}>Tareas</span>
                    </button>

                    <button
                        onClick={() => onSectionChange('trabajo-compartido')}
                        className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${currentSection === 'trabajo-compartido' ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${currentSection === 'trabajo-compartido' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-transparent'}`}>
                            <FolderOpen className={`w-5 h-5 ${currentSection === 'trabajo-compartido' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${currentSection === 'trabajo-compartido' ? 'opacity-100' : 'opacity-80'}`}>Compartido</span>
                    </button>

                    <button
                        onClick={() => onSectionChange('evaluacion')}
                        className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${currentSection === 'evaluacion' ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${currentSection === 'evaluacion' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-transparent'}`}>
                            <ClipboardCheck className={`w-5 h-5 ${currentSection === 'evaluacion' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${currentSection === 'evaluacion' ? 'opacity-100' : 'opacity-80'}`}>Evaluación</span>
                    </button>

                    <button
                        onClick={() => onSectionChange('notificaciones')}
                        className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${currentSection === 'notificaciones' ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${currentSection === 'notificaciones' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-transparent'}`}>
                            <div className="relative">
                                <Bell className={`w-5 h-5 ${currentSection === 'notificaciones' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                                {unreadNotifications > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                        {unreadNotifications}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${currentSection === 'notificaciones' ? 'opacity-100' : 'opacity-80'}`}>Avisos</span>
                    </button>
                </nav>
            )}

            {modalHorarioAbierto && user && (
                <ModalHorario
                    isOpen={modalHorarioAbierto}
                    onClose={() => setModalHorarioAbierto(false)}
                    alumnoId={user.id}
                />
            )}

            {modalChatProfesoresAbierto && (
                <ModalChatProfesores
                    isOpen={modalChatProfesoresAbierto}
                    onClose={() => setModalChatProfesoresAbierto(false)}
                    user={user}
                    proyectos={proyectoActual ? [proyectoActual as any] : []}
                    onMessagesRead={() => setUnreadCollabMessages(0)}
                />
            )}
        </div>
    );
}

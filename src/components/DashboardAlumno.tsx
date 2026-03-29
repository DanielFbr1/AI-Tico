import {
  Users,
  FileText,
  Layout,
  Globe,
  MessageSquare,
  Award,
  Bot,
  Plus,
  History,
  Key,
  CircleHelp,
  LogOut,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Upload,
  Loader2,
  FolderOpen,
  Trophy,
  CheckCircle2,
  Star,
  AlertCircle,
  TrendingUp,
  Target,
  Calendar,
  Eye,
  Trash2,
  Check,
  Send,
  Clock,
  Bell
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Grupo, HitoGrupo, ProyectoFase, Rubrica } from '../types';
import { supabase } from '../lib/supabase';
import { MentorChat } from './MentorChat';
import { ChatGrupo } from './ChatGrupo';
import { RepositorioColaborativo } from './RepositorioColaborativo';
import { ModalSubirRecurso } from './ModalSubirRecurso';
import { TutorialInteractivo } from './TutorialInteractivo';
import { useAuth } from '../context/AuthContext';
import { ModalUnirseClase } from './ModalUnirseClase';
import { RoadmapView } from './RoadmapView';
import { LivingTree } from './LivingTree';
import { PROYECTOS_MOCK, getMockEvaluacion, PASOS_TUTORIAL_ALUMNO } from '../data/mockData';
import { toast } from 'sonner';
import { fetchPuntosProyecto } from '../lib/puntos';
import { ModalProponerHitos } from './ModalProponerHitos';
import { getAsignaturaStyles } from '../data/asignaturas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { useGroupTracking } from '../hooks/useGroupTracking';

import { ModalExploradorProyectosAlumno } from './ModalExploradorProyectosAlumno';
import { ModalHorario } from './ModalHorario';
import { ModalChatProfesoresAlumno } from './ModalChatProfesoresAlumno';
import { ModalDetalleTarea } from './ModalDetalleTarea';
import { VistaCalendario } from './VistaCalendario';
import { TareaDetallada } from '../types';
import { NotificacionesPanel, Notificacion } from './NotificacionesPanel';
import { crearNotificacionMasiva, getProfesoresDelProyecto } from '../lib/notificaciones';

interface DashboardAlumnoProps {
  alumno: {
    id: string;
    nombre: string;
    rol: 'profesor' | 'alumno' | 'familia';
    clase?: string;
    grupo_id?: number;
    proyecto_id?: string;
    codigo_sala?: string;
  };
  onLogout: () => void;
}

export function DashboardAlumno({ alumno, onLogout }: DashboardAlumnoProps) {
  // Estados de Vista
  const [vistaActiva, setVistaActiva] = useState<'grupo' | 'tareas' | 'comunidad' | 'chat' | 'perfil' | 'calendario' | 'notificaciones'>('grupo');
  const [chatTab, setChatTab] = useState<'ia' | 'equipo'>('ia');
  const [mobileChatTab, setMobileChatTab] = useState<'menu' | 'ia' | 'equipo'>('menu');
  const [puntosTotales, setPuntosTotales] = useState<number>(0);

  // Custom Hook for Tracking
  const [grupoReal, setGrupoReal] = useState<Grupo | null>(null);
  useGroupTracking(grupoReal?.id || 0);
  const [nombreProyecto, setNombreProyecto] = useState<string>(''); // New state for AI context
  const [asignaturaProyecto, setAsignaturaProyecto] = useState<string>('');
  const [contextoProyecto, setContextoProyecto] = useState<string>(''); // NEW: AI Context from Project
  const [rubricaProyecto, setRubricaProyecto] = useState<Rubrica | null>(null);
  const [fasesProyecto, setFasesProyecto] = useState<ProyectoFase[]>([]);
  const [todosLosGrupos, setTodosLosGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [modalUnirseOpen, setModalUnirseOpen] = useState(false);
  const [modalSubirRecursoOpen, setModalSubirRecursoOpen] = useState(false);
  const [modalProponerOpen, setModalProponerOpen] = useState(false);
  const [modalChatProfesoresOpen, setModalChatProfesoresOpen] = useState(false);
  const [modalExploradorProyectosOpen, setModalExploradorProyectosOpen] = useState(false);
  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [dropdownMisClasesOpen, setDropdownMisClasesOpen] = useState(false); // Control del dropdown
  const [faseParaProponer, setFaseParaProponer] = useState<any>(null);
  const [refreshRecursos, setRefreshRecursos] = useState(0);
  const [tareasAlumno, setTareasAlumno] = useState<TareaDetallada[]>([]);
  const [entregasTareas, setEntregasTareas] = useState<any[]>([]); // New state for task deliveries correlation
  const [localProjectId, setLocalProjectId] = useState<string | null>(null);
  const [localRoomCode, setLocalRoomCode] = useState<string | null>(null);
  const [tareaSeleccionadaDetalle, setTareaSeleccionadaDetalle] = useState<TareaDetallada | null>(null);
  const [modalInitialShowChat, setModalInitialShowChat] = useState(false);

  // Estado del tutorial para Alumnos
  const [tutorialActivo, setTutorialActivo] = useState(() => {
    const isNew = localStorage.getItem('isNewStudent') === 'true';
    const seen = localStorage.getItem(`tutorial_alumno_seen_${alumno.id}`) === 'true';
    return isNew && !seen;
  });

  const [showExample, setShowExample] = useState(() => {
    return localStorage.getItem('isNewStudent') === 'true';
  });

  const [historialClases, setHistorialClases] = useState<any[]>([]);
  const [notaGrupal, setNotaGrupal] = useState<number | null>(null);
  const [comentarios, setComentarios] = useState<{ id: string, contenido: string, created_at: string }[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (alumno?.id) {
      const fetchMisClases = async () => {
        try {
          const { data: allGroups, error } = await supabase
            .from('grupos')
            .select(`
              id, nombre, miembros, proyecto_id,
              proyectos (nombre, codigo_sala, asignatura, curso)
            `);

          if (error) throw error;

          if (allGroups) {
            const gruposDondeEstoy = allGroups.filter((g: any) => {
              if (!g.miembros) return false;
              const miembrosArr = Array.isArray(g.miembros) ? g.miembros : [];
              return miembrosArr.some((m: string) => m.includes(alumno.nombre));
            });

            const recentKey = `recent_student_projects_${alumno.id}`;
            const recentsStr = localStorage.getItem(recentKey);
            const recents: string[] = recentsStr ? JSON.parse(recentsStr) : [];

            const historialReal = gruposDondeEstoy.map((g: any) => {
              let orderIndex = recents.indexOf(String(g.proyecto_id));
              if (orderIndex === -1) orderIndex = 9999;

              return {
                id: g.proyecto_id,
                nombre: g.proyectos?.nombre || g.nombre,
                codigo: g.proyectos?.codigo_sala || '???',
                asignatura: g.proyectos?.asignatura || '',
                curso: g.proyectos?.curso || 'Sin Curso',
                grupo_interno_id: g.id,
                orden_reciente: orderIndex
              };
            });

            historialReal.sort((a, b) => a.orden_reciente - b.orden_reciente || a.nombre.localeCompare(b.nombre));

            const uniqueHistory = Array.from(new Map(historialReal.map((item: any) => [item.id, item])).values());
            
            // ASEGURAR QUE EL PROYECTO ACTUAL ESTÉ EN EL HISTORIAL (para que aparezca el profesor en el chat)
            const currentProjId = alumno.proyecto_id || localProjectId;
            if (currentProjId && !uniqueHistory.some(h => String(h.id) === String(currentProjId))) {
                uniqueHistory.unshift({
                    id: currentProjId,
                    nombre: nombreProyecto || 'Proyecto Actual',
                    codigo: alumno.codigo_sala || localRoomCode || '???',
                    asignatura: asignaturaProyecto || '',
                    curso: 'Actual',
                    orden_reciente: -1
                });
            }

            setHistorialClases(uniqueHistory.slice(0, 8));

            if (!alumno.proyecto_id && !localProjectId && uniqueHistory.length > 0) {
              const lastProject = uniqueHistory[0];
              console.log("🚀 Auto-seleccionando última clase:", lastProject.nombre);
              setLocalProjectId(String(lastProject.id));
              setLocalRoomCode(lastProject.codigo);
            }
          }
        } catch (err) {
          console.error("Error en fetchMisClases:", err);
        }
      };
      fetchMisClases();
    }
  }, [alumno?.id, alumno?.nombre, localProjectId]);

  useEffect(() => {
    fetchDatosAlumno();
  }, [alumno.id, localProjectId, localRoomCode]);

  const tutorialKey = `tutorial_alumno_seen_${alumno.id}`;

  const grupoEjemplo: Grupo = {
    id: 999,
    nombre: 'Beta Test Team',
    // departamento: removed
    estado: 'Casi terminado',
    progreso: 85,
    interacciones_ia: 42,
    miembros: [alumno.nombre || 'Tú', 'Sofía', 'Marco', 'Elena'],
    proyecto_id: 'demo'
  };

  const grupoDisplay = showExample ? grupoEjemplo : grupoReal;

  const evaluacionEjemplo = [
    { criterio: 'Colaboración y trabajo en equipo', puntos: 8, nivel: 'Notable' },
    { criterio: 'Uso crítico de la IA', puntos: 9, nivel: 'Sobresaliente' },
    { criterio: 'Aportación al producto', puntos: 8, nivel: 'Notable' },
    { criterio: 'Reflexión metacognitiva', puntos: 6, nivel: 'Suficiente' }
  ];

  const [unreadProfMessages, setUnreadProfMessages] = useState(0);
  const [realEvaluacion, setRealEvaluacion] = useState<any[]>([]);
  const [asistenciaStats, setAsistenciaStats] = useState({ present: 0, total: 0, percentage: 0 });
  const [hasNewEvaluation, setHasNewEvaluation] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    if (!alumno.id) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', alumno.id)
        .eq('leida', false);
      setUnreadNotifications(count || 0);
    };
    fetchUnread();
    const notifSub = supabase.channel(`notif_count_alumno_${alumno.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${alumno.id}`
      }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(notifSub); };
  }, [alumno.id]);

  const calculatedProgreso = useMemo(() => {
    if (showExample) return grupoEjemplo.progreso;
    if (!grupoReal || !tareasAlumno.length) return 0;
    
    // Tareas que le corresponden
    const tareasRel = tareasAlumno.filter(t => t.grupo_id === grupoReal.id || !t.grupo_id);
    if (!tareasRel.length) return 0;
    
    // Contar las aprobadas/evaluadas
    const evaluadas = tareasRel.filter(t => {
            // 1. Priorizar estado de entrega (para misiones globales y específicas)
            const gidNum = Number(grupoReal.id);
            const e = (entregasTareas || []).find(ent => ent.tarea_id === t.id && Number(ent.grupo_id) === gidNum);
            if (e && (e.estado === 'evaluada' || e.estado === 'aprobado' || e.estado === 'completado' || e.estado === 'revisado')) {
                return true;
            }
      // 2. Si no hay entrega, usar el estado de la tarea (para tareas sin entrega explícita)
      return ['aprobado', 'completado'].includes(t.estado);
    }).length;
    
    return Math.round((evaluadas / tareasRel.length) * 100);
  }, [showExample, grupoReal, tareasAlumno, entregasTareas]);

  const evaluacionAlumno = showExample ? evaluacionEjemplo : realEvaluacion;

  // Tracking de tiempo de conexión (Heartbeat) - Solo si tiene grupo real
  useGroupTracking(grupoReal?.id);

  const fetchDatosAlumno = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setErrorStatus(null);
      let targetProjectId = localProjectId || alumno.proyecto_id;
      let roomCode = localRoomCode || alumno.codigo_sala || '';

      if (!targetProjectId && roomCode) {
        const { data: proyecto, error: errorProyecto } = await supabase
          .from('proyectos')
          .select('id, nombre, asignatura, contexto_ia, rubrica, fases')
          .eq('codigo_sala', roomCode)
          .single();

        if (errorProyecto || !proyecto) {
          setErrorStatus('CODIGO_INVALIDO');
          return;
        }
        targetProjectId = proyecto.id;
        setNombreProyecto(proyecto.nombre); // Capture name from Room Code resolution
        setAsignaturaProyecto(proyecto.asignatura || '');
        setContextoProyecto(proyecto.contexto_ia || ''); // Capture AI context
        setRubricaProyecto(proyecto.rubrica as Rubrica);
        setFasesProyecto(proyecto.fases as ProyectoFase[] || []);
      }

      if (targetProjectId && !nombreProyecto) {
        // Fetch project details if we have ID but not details (e.g. login via profile)
        const { data: pData } = await supabase.from('proyectos').select('nombre, asignatura, contexto_ia, rubrica, fases').eq('id', targetProjectId).single();
        if (pData) {
          setNombreProyecto(pData.nombre);
          setAsignaturaProyecto(pData.asignatura || '');
          setContextoProyecto(pData.contexto_ia || '');
          setRubricaProyecto(pData.rubrica as Rubrica);
          setFasesProyecto(pData.fases as ProyectoFase[] || []);
        }
      }

      if (!targetProjectId) {
        setLoading(false);
        return;
      }

      // Añadir proyecto a recientes en localStorage si ya estamos en uno válido
      if (alumno.id && targetProjectId) {
        const recentKey = `recent_student_projects_${alumno.id}`;
        try {
          const recentsStr = localStorage.getItem(recentKey);
          let recents: string[] = recentsStr ? JSON.parse(recentsStr) : [];
          const pid = String(targetProjectId);
          // Remove if exists
          recents = recents.filter(id => id !== pid);
          // Add to beginning
          recents.unshift(pid);
          // Keep only 20 max to avoid localstorage bloat
          if (recents.length > 20) recents = recents.slice(0, 20);
          localStorage.setItem(recentKey, JSON.stringify(recents));
        } catch (e) {
          console.error("Error saving recent project", e);
        }
      }

      // Sync History logic - REMOVED (Now fetched from server)
      // if (alumno.id && targetProjectId && roomCode) { ... }

      const { data: grupos, error: errorGrupos } = await supabase
        .from('grupos')
        .select('*')
        .eq('proyecto_id', targetProjectId);

      if (errorGrupos) throw errorGrupos;
      const { data: tareasGlobales, error: errorTareas } = await supabase
        .from('tareas')
        .select('*')
        .eq('proyecto_id', targetProjectId);

      const normalizar = (t: string) => (t || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const nombreAlumnoNorm = normalizar(alumno.nombre);

      const miGrupo = (grupos || []).find(g =>
        g.miembros?.some((m: string) => normalizar(m).includes(nombreAlumnoNorm))
      );

      // Mapear tareas a grupos para la vista de comunidad
      const gruposConTareas = (grupos || []).map(g => {
        const tareasDelGrupo = (tareasGlobales || []).filter(t => 
            (t.grupo_id !== null && t.grupo_id !== undefined && Number(t.grupo_id) === g.id) || 
            (t.grupo_id === null || t.grupo_id === undefined || String(t.grupo_id) === 'all')
        );
        return { ...g, tareas: tareasDelGrupo };
      });
      setTodosLosGrupos(gruposConTareas);

      if (miGrupo) {
        setGrupoReal(miGrupo);
        setTareasAlumno((tareasGlobales || []).filter(t => t.grupo_id === miGrupo.id || t.grupo_id === null));
      } else {
        const placeholderGrupo: Grupo = {
          id: 0,
          nombre: 'Sin Equipo Asignado',
          // departamento: removed
          estado: 'Pendiente',
          progreso: 0,
          interacciones_ia: 0,
          miembros: [alumno.nombre],
          proyecto_id: targetProjectId
        };
        setGrupoReal(placeholderGrupo);
        setTodosLosGrupos([]);
      }

      // Fetch Evaluations
      const { data: evalData } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('alumno_nombre', alumno.nombre)
        .eq('proyecto_id', String(targetProjectId))
        .maybeSingle();

      if (evalData && evalData.criterios) {
        setRealEvaluacion(evalData.criterios);
      } else if (rubricaProyecto?.criterios) {
        // Fallback to Rubric Criteria (Pending state) so they see what they will be evaluated on
        setRealEvaluacion(rubricaProyecto.criterios.map(c => ({ criterio: c.nombre, puntos: 0, nivel: 'Pendiente' })));
      } else {
        setRealEvaluacion([]);
      }

      // Fetch Group Evaluation (New)
      if (miGrupo && miGrupo.id) {
        const { data: groupEval } = await supabase
          .from('evaluaciones_grupales')
          .select('nota_final')
          .eq('grupo_id', miGrupo.id)
          .eq('proyecto_id', targetProjectId)
          .maybeSingle();

        if (groupEval) {
          setNotaGrupal(groupEval.nota_final);
        } else {
          setNotaGrupal(null);
        }
      }

      // Fetch Comments
      const { data: commentsData } = await supabase
        .from('comentarios_alumno')
        .select('id, contenido, created_at')
        .eq('proyecto_id', targetProjectId)
        .eq('alumno_nombre', alumno.nombre)
        .order('created_at', { ascending: false });

      if (commentsData) setComentarios(commentsData);

      // Fetch Puntos Totales
      try {
        if (targetProjectId) {
          const puntosProyecto = await fetchPuntosProyecto(String(targetProjectId));
          const match = puntosProyecto.find((p: any) => p.alumno_nombre === alumno.nombre);
          setPuntosTotales(match ? match.puntos : 0);
        }
      } catch (pointsErr) {
        console.error("Error fetching points:", pointsErr);
      }

      // Fetch Assistance
      const { data: attendanceData } = await supabase
        .from('asistencia')
        .select('*')
        .eq('proyecto_id', targetProjectId)
        .eq('alumno_nombre', alumno.nombre);

      if (attendanceData) {
        const total = attendanceData.length;
        const present = attendanceData.filter(a => a.presente === true).length;
        setAsistenciaStats({
          present,
          total,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0
        });
      }

      // Fetch Entregas Tareas
      if (miGrupo && miGrupo.id) {
        const { data: entData } = await supabase
          .from('entregas_tareas')
          .select('*')
          .eq('grupo_id', miGrupo.id);
        setEntregasTareas(entData || []);
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      setErrorStatus('ERROR_TECNICO');
    } finally {
      setLoading(false);
    }
  };

  const fetchTareasAlumno = async () => {
    if (!grupoReal?.id || !alumno.proyecto_id) return;
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('proyecto_id', alumno.proyecto_id)
        .or(`grupo_id.eq.${grupoReal.id},grupo_id.is.null`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTareasAlumno(data || []);

      // Refresh entregas too
      if (grupoReal?.id) {
        const { data: entData } = await supabase
          .from('entregas_tareas')
          .select('*')
          .eq('grupo_id', grupoReal.id);
        setEntregasTareas(entData || []);
      }
    } catch (err) {
      console.error('Error fetching student tasks:', err);
    }
  };

  const handleUpdateTareaEstado = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('tareas')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;

      // Update local state for immediate feedback
      setTareasAlumno(prev => prev.map(t => t.id === id ? { ...t, estado: nuevoEstado as any } : t));
      
      if (nuevoEstado === 'revision') {
        toast.success('Misión enviada a revisión');
        
        // Notificar a los profesores
        if (alumno.proyecto_id) {
          getProfesoresDelProyecto(alumno.proyecto_id).then(profIds => {
            if (profIds.length > 0) {
              const tarea = tareasAlumno.find(t => t.id === id);
              crearNotificacionMasiva(profIds, {
                proyectoId: alumno.proyecto_id,
                tipo: 'tarea_revision',
                titulo: `Misión para revisar: "${tarea?.titulo || 'Nueva entrega'}"`,
                descripcion: `El alumno ${alumno.nombre} ha enviado una tarea para revisión.`,
                metadata: { tarea_id: id, alumno_id: alumno.id, alumno_nombre: alumno.nombre }
              });
            }
          });
        }
      } else if (nuevoEstado === 'pendiente' && grupoReal?.id) {
        // Al anular entrega, eliminamos el registro de la entrega para que vuelva al panel de Pendientes
        const { error: delError } = await supabase
          .from('entregas_tareas')
          .delete()
          .eq('tarea_id', id)
          .eq('grupo_id', grupoReal.id);
        
        if (!delError) {
          setEntregasTareas(prev => prev.filter(e => e.tarea_id !== id));
          toast.success('Entrega anulada');
        } else {
          console.error("Error al borrar entrega:", delError);
          toast.success('Estado actualizado');
        }
      } else {
        toast.success('Estado actualizado');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('No se pudo actualizar el estado');
    }
  };

  const handleUpdateTarea = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('tareas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Actualizar estado local para feedback inmediato
      setTareasAlumno(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (err) {
      console.error('Error al actualizar detalles de la tarea:', err);
      toast.error('No se pudo guardar el archivo');
    }
  };

  const handleSaveAlumnoContent = async (id: string, contenido: string, archivos: any[]) => {
    try {
      const entregaExistente = entregasTareas.find(e => e.tarea_id === id);
      if (entregaExistente) {
          const { error } = await supabase.from('entregas_tareas').update({
              respuesta_texto: contenido,
              archivos_entregados: archivos,
              updated_at: new Date().toISOString()
          }).eq('id', entregaExistente.id);
          if (error) throw error;
      } else {
          const { error } = await supabase.from('entregas_tareas').insert({
              tarea_id: id,
              grupo_id: grupoReal?.id,
              respuesta_texto: contenido,
              archivos_entregados: archivos,
              estado: 'entregada',
              fecha_entrega: new Date().toISOString(),
              updated_at: new Date().toISOString()
          });
          if (error) throw error;
      }
      
      setEntregasTareas(prev => {
          const exists = prev.find(e => e.tarea_id === id);
          if (exists) {
              return prev.map(e => e.tarea_id === id ? { ...e, respuesta_texto: contenido, archivos_entregados: archivos } : e);
          } else {
              return [...prev, { tarea_id: id, grupo_id: grupoReal?.id, respuesta_texto: contenido, archivos_entregados: archivos, estado: 'entregada' }];
          }
      });
      toast.success('Trabajo guardado');
    } catch (err) {
      console.error('Error saving task content:', err);
      toast.error('Error al guardar el trabajo');
    }
  };

  useEffect(() => {
    if (grupoReal?.id && alumno.proyecto_id) {
      fetchTareasAlumno();
      
      const ch = supabase.channel(`student_tareas_${grupoReal.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'tareas',
            filter: `proyecto_id=eq.${alumno.proyecto_id}` 
          }, 
          (payload) => {
            console.log("Realtime event received (Student):", payload.eventType);
            fetchTareasAlumno();
          }
        ).subscribe();
        
      const obsSub = supabase.channel(`obs_alumno_${alumno.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comentarios_alumno',
          filter: `proyecto_id=eq.${alumno.proyecto_id}`
        }, (payload: any) => {
          // Si el comentario es para este alumno, recargamos
          if (payload.new && payload.new.alumno_nombre === alumno.nombre) {
            fetchDatosAlumno(true);
          }
        }).subscribe();
    
        const notifSub = supabase.channel(`notif_alumno_${alumno.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones',
            filter: `user_id=eq.${alumno.id}`
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
                    const tarea = (tareasAlumno || []).find(t => t.id === tId);
                    if (tarea) {
                      setModalInitialShowChat(true);
                      setTareaSeleccionadaDetalle(tarea);
                      setVistaActiva('tareas');
                    }
                  }
                }
              });
            }
          }).subscribe();
    
        return () => {
          supabase.removeChannel(ch);
          supabase.removeChannel(notifSub);
          supabase.removeChannel(obsSub);
        };
    }
  }, [alumno.id, alumno.nombre, alumno.proyecto_id, tareasAlumno]);

  useEffect(() => {
    // Fetching and subscription for unread messages from professors
    if (!alumno.id) return;

    const setupMsgSubscription = async () => {
      const { count, error } = await supabase
        .from('mensajes_profesor_alumno')
        .select('*', { count: 'exact', head: true })
        .eq('alumno_user_id', alumno.id)
        .neq('sender_id', alumno.id)
        .eq('leido', false);

      if (!error) {
        setUnreadProfMessages(count || 0);
      }

      const subscriptionMsg = supabase.channel(`mensajes_profesor_alumno_alu_${alumno.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mensajes_profesor_alumno',
          filter: `alumno_user_id=eq.${alumno.id}`
        }, payload => {
          const newMsg = payload.new as any;
          if (payload.eventType === 'INSERT' && newMsg && !newMsg.leido && newMsg.sender_id !== alumno.id) {
            setUnreadProfMessages(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            supabase
              .from('mensajes_profesor_alumno')
              .select('*', { count: 'exact', head: true })
              .eq('alumno_user_id', alumno.id)
              .neq('sender_id', alumno.id)
              .eq('leido', false)
              .then(({ count }) => setUnreadProfMessages(count || 0));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscriptionMsg);
      };
    };

    const cleanupFn = setupMsgSubscription();
    return () => {
      cleanupFn.then(cleanup => cleanup && cleanup());
    };
  }, [alumno.id]);

  // NUEVO EFFECT: Sincronización en tiempo real de la configuración del AI Mentor (Tabla grupos)
  useEffect(() => {
    if (!grupoReal?.id || grupoReal.id === 0) return;

    const channelGrupo = supabase.channel(`sync_grupo_${grupoReal.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'grupos',
        filter: `id=eq.${grupoReal.id}`
      }, (payload) => {
        if (payload.new) {
          const updatedGroup = payload.new as any;
          // Actualizamos 'grupoReal' para que Tico lea las nuevas instrucciones instantáneamente
          setGrupoReal(prev => ({ ...prev, ...updatedGroup }));
          // Actualizamos también 'todosLosGrupos' por si cambia de grupo
          setTodosLosGrupos(prev => prev.map(g => g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelGrupo);
    };
  }, [grupoReal?.id]);

  const handleSwitchClass = async (classData: any) => {
    setLoading(true);
    try {
      // Update user profile to point to the selected class
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          codigo_sala: classData.codigo,
          proyecto_id: classData.id
        }
      });
      if (updateError) throw updateError;

      // Sync public profile as well
      await supabase.from('profiles').update({
        codigo_sala: classData.codigo,
        proyecto_id: classData.id
      }).eq('id', alumno.id);

      toast.success(`Cambiando a clase: ${classData.nombre}`);
      // A hard reload is simplest for "Session" changes, or we can just `window.location.reload()`.
      window.location.reload();

    } catch (error) {
      console.error("Error switching class", error);
      toast.error("Error al cambiar de clase");
      setLoading(false);
    }
  };

  // NUEVO EFFECT: Calificaciones en Tiempo Real (entregas_tareas)
  useEffect(() => {
    if (!grupoReal?.id) return;

    const channelEntregas = supabase
      .channel(`rt_entregas_grupo_${grupoReal.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'entregas_tareas',
        filter: `grupo_id=eq.${grupoReal.id}`
      }, () => {
        fetchTareasAlumno(); // Actualiza tanto las tareas como la calificación cruzada
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelEntregas);
    };
  }, [grupoReal?.id]);

  const handleTutorialComplete = () => {
    localStorage.setItem(tutorialKey, 'true');
    setTutorialActivo(false);
  };

  useEffect(() => {
    if (!grupoReal || !alumno) return;

    // Channel for presence (online tracking)
    const channelpresence = supabase.channel(`room:${grupoReal.proyecto_id}`)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channelpresence.track({
            id: alumno.id,
            nombre: alumno.nombre,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Channel for data updates (hitos, etc.)
    // Suscribimos a TODOS los cambios en la tabla grupos para este proyecto
    // Si el filtro específico falla, escuchar todo 'public:grupos' es un fallback seguro para depuración.
    // CHANNEL PARA ACTUALIZACIONES GENERALES (Ayuda, Hitos)
    const channelupdates = supabase.channel(`updates_project_${grupoReal.proyecto_id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grupos',
          filter: `proyecto_id=eq.${grupoReal.proyecto_id}`
        },
        async (payload) => {
          console.log("🔔 Realtime group update received:", payload);
          await fetchDatosAlumno(true);

          if (payload.eventType === 'UPDATE') {
            const oldRecord = payload.old as Grupo;
            const newRecord = payload.new as Grupo;

            if (oldRecord.pedir_ayuda === true && newRecord.pedir_ayuda === false) {
              toast.success("✅ ¡El profesor ha resuelto vuestra duda!");
            }

            if (oldRecord.hitos && newRecord.hitos) {
              const oldHitosMap = new Map((oldRecord.hitos as any[]).map(h => [h.id || h.titulo, h]));
              let feedbackReceived = false;
              let approvalReceived = false;

              (newRecord.hitos as any[]).forEach(newHito => {
                const oldHito = oldHitosMap.get(newHito.id || newHito.titulo);
                if (oldHito && oldHito.estado !== newHito.estado) {
                  if (newHito.estado === 'revision') feedbackReceived = true;
                  if (newHito.estado === 'aprobado' || newHito.estado === 'completado') approvalReceived = true;
                }
              });

              if (feedbackReceived) toast.info("📩 Tienes nuevas correcciones");
              if (approvalReceived) toast.success("⭐ ¡Tarea aprobada!");
            }
          }
        }
      )
      .subscribe();

    // SUSCRIPCIÓN PARA ASISTENCIA REAL-TIME
    const channelAsistencia = supabase.channel(`asistencia_alumno_${alumno.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistencia',
          filter: `proyecto_id=eq.${grupoReal.proyecto_id}`
        },
        async (payload) => {
          console.log("🔔 Realtime asistencia received:", payload);
          // Recalcular asistencia
          const { data: attendanceData } = await supabase
            .from('asistencia')
            .select('*')
            .eq('proyecto_id', grupoReal.proyecto_id)
            .eq('alumno_nombre', alumno.nombre);

          if (attendanceData) {
            const total = attendanceData.length;
            const present = attendanceData.filter(a => a.presente === true).length;
            setAsistenciaStats({
              present,
              total,
              percentage: total > 0 ? Math.round((present / total) * 100) : 0
            });

            // Si el evento fue INSERT o UPDATE, lanzar un pequeño brindis
            if (payload.eventType !== 'DELETE' && (payload.new as any).presente === true && (payload.new as any).alumno_nombre === alumno.nombre) {
              toast.success("✅ ¡Se ha registrado tu asistencia!", { icon: '📝' });
            }
          }
        }
      )
      .subscribe();

    // SUSCRIPCIÓN PARA EVALUACIONES INDIVIDUALES
    // Usamos filter por proyecto_id (más seguro que strings con espacios) y filtramos en cliente
    const channelEvaluaciones = supabase.channel(`evaluaciones_alumno_${alumno.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluaciones',
          filter: `proyecto_id=eq.${grupoReal.proyecto_id}`
        },
        async (payload) => {
          console.log("🔔 Realtime individual evaluation received:", payload);
          if (payload.eventType !== 'DELETE') {
            const newRecord = payload.new as any;
            // Verificar si es para este alumno
            if (newRecord.alumno_nombre === alumno.nombre) {
              const newEval = newRecord.criterios || [];
              if (newEval.length > 0) {
                setRealEvaluacion(newEval);
                // Individual evaluations change
                setHasNewEvaluation(true);
                toast.success("✨ ¡Tienes nuevas notas individuales disponibles!", {
                  duration: 6000,
                  icon: '🎯'
                });
              }
            }
          }
        }
      )
      .subscribe();

    // SUSCRIPCIÓN PARA EVALUACIONES GRUPALES REAL-TIME
    let channelEvaluacionesGrupales: any = null;

    if (grupoReal.id && Number(grupoReal.id) > 0) {
      channelEvaluacionesGrupales = supabase.channel(`evaluaciones_grupales_${grupoReal.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'evaluaciones_grupales',
            filter: `grupo_id=eq.${grupoReal.id}`
          },
          async (payload) => {
            console.log("🔔 Realtime group evaluation received:", payload);
            if (payload.eventType !== 'DELETE') {
              const newNota = (payload.new as any).nota_final;
              setNotaGrupal(newNota);
              setHasNewEvaluation(true); // Activar aviso visual también para notas grupales
              toast.success("🏆 ¡Se ha actualizado la nota de tu grupo!", {
                duration: 6000,
                icon: '🚀'
              });
            }
          }
        )
        .subscribe();
    }

    // SUSCRIPCIÓN PARA TAREAS DEL PROYECTO (Real-time Global)
    const channelTareasGlobal = supabase.channel(`tareas_global_${grupoReal.proyecto_id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tareas',
          filter: `proyecto_id=eq.${grupoReal.proyecto_id}`
        },
        async (payload) => {
          console.log("🔔 Realtime task global change received:", payload);
          // Refetch data so both tasks and group progress (calculated from tasks) update
          await fetchDatosAlumno(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelpresence);
      supabase.removeChannel(channelupdates);
      supabase.removeChannel(channelAsistencia);
      supabase.removeChannel(channelEvaluaciones);
      supabase.removeChannel(channelEvaluacionesGrupales);
      supabase.removeChannel(channelTareasGlobal);
    };
  }, [grupoReal?.proyecto_id, alumno.id, grupoReal?.id]);

  const notaMedia = evaluacionAlumno.length > 0
    ? evaluacionAlumno.reduce((sum, e) => sum + Number(e.puntos), 0) / evaluacionAlumno.length
    : 0;

  const tareasCompletadasMisiones = showExample ? 7 : tareasAlumno.filter(t => t.estado === 'aprobado' || t.estado === 'completado').length;
  const totalTareasMisiones = showExample ? 7 : tareasAlumno.length;

  const notasMisiones = showExample ? [10, 8, 9, 10, 7, 8, 9] : tareasAlumno.map(t => {
    // Priorizamos t.calificacion (misiones individuales) sobre entregas (tareas globales)
    if (t.calificacion !== undefined && t.calificacion !== null) {
      return t.calificacion;
    }
    const entrega = entregasTareas.find(e => e.tarea_id === t.id);
    return entrega?.calificacion || 0;
  });

  const notaMediaMisiones = notasMisiones.length > 0 
    ? notasMisiones.reduce((sum, n) => sum + n, 0) / notasMisiones.length 
    : 0;

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Sobresaliente': return 'bg-emerald-500 text-white';
      case 'Notable': return 'bg-blue-500 text-white';
      case 'Suficiente': return 'bg-amber-500 text-white';
      default: return 'bg-rose-500 text-white';
    }
  };

  const handleJoinSuccess = async () => {
    setShowExample(false);
    localStorage.removeItem('isNewStudent');
    // Force reload to sync auth provider state (metadata)
    window.location.reload();
  };

  const tareasCategorizadas = React.useMemo(() => {
    const VERSION = "V5.8.85";
    const panels = {
      pendientes: [] as any[],
      revision: [] as any[],
      completado: [] as any[],
      expirado: [] as any[]
    };

    const now = new Date();

    tareasAlumno.forEach(t => {
      // Cruzar con datos de entrega
      const entrega = entregasTareas.find((e: any) => e.tarea_id === t.id);
      const tareaConEntrega = {
        ...t,
        calificacion: entrega?.calificacion,
        estadoEntrega: entrega?.estado,
        contenido_alumno: entrega ? (entrega.respuesta_texto || '') : t.contenido_alumno,
        archivos_alumno: entrega ? (entrega.archivos_entregados || []) : t.archivos_alumno
      };

      const isCompletada = t.estado === 'aprobado' || t.estado === 'completado' || entrega?.estado === 'evaluada' || entrega?.estado === 'revisado';
      const isRevision = t.estado === 'revision' || entrega?.estado === 'entregada';
      const isExpirada = t.fecha_entrega && new Date(t.fecha_entrega) < now && !isCompletada && !isRevision;

      if (isCompletada) {
        panels.completado.push(tareaConEntrega);
      } else if (isRevision) {
        panels.revision.push(tareaConEntrega);
      } else if (isExpirada) {
        panels.expirado.push(tareaConEntrega);
      } else {
        panels.pendientes.push(tareaConEntrega);
      }
    });

    return panels;
  }, [tareasAlumno, entregasTareas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Iniciando sesión segura...</p>
        </div>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="min-h-screen bg-[#fcfdff] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">Error de carga</h2>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm">Recargar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#fcfdff] flex flex-col ${vistaActiva === 'chat' ? 'h-screen overflow-hidden' : ''}`}>
      {/* Header - Hidden on mobile if a specific chat is active */}
      <header className={`bg-white border-b border-slate-200 ${vistaActiva === 'chat' && mobileChatTab !== 'menu' ? 'hidden md:block' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-200">
                {(alumno.nombre || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">¡Hola, {(alumno.nombre || 'Alumno').split(' ')[0]}!</h1>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">V5.8.82</span>
                </div>
                <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest">
                  {nombreProyecto || 'Sin Clase'} • {grupoDisplay?.nombre || 'Sin Equipo'}
                </p>
                <div className="mt-2 text-[10px] md:text-xs">
                  <span className="inline-flex items-center bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black border border-indigo-100/50 shadow-sm shadow-indigo-500/5 tracking-wider">
                    <span className="opacity-50 mr-2 uppercase text-[8px] md:text-[9px]">Código de Clase:</span>
                    <span className="font-mono tracking-[0.1em]">{alumno.codigo_sala || 'N/A'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones de Cabecera - Grid 2x2 en móvil */}
            <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
              {/* Botón de Ayuda */}
              <button
                onClick={async () => {
                  if (!grupoReal) return;
                  const newState = !grupoReal.pedir_ayuda;

                  // Optimistic Update
                  setGrupoReal({ ...grupoReal, pedir_ayuda: newState });

                  try {
                    const { error } = await supabase
                      .from('grupos')
                      .update({ pedir_ayuda: newState })
                      .eq('id', grupoReal.id);

                    if (error) throw error;

                    if (newState) {
                      toast.success("✋ ¡Duda enviada!");
                      // Notificar a los profesores del proyecto
                      if (alumno.proyecto_id) {
                        getProfesoresDelProyecto(alumno.proyecto_id).then(profIds => {
                          if (profIds.length > 0) {
                            crearNotificacionMasiva(profIds, {
                              proyectoId: alumno.proyecto_id,
                              tipo: 'mano_levantada',
                              titulo: `✋ ${alumno.nombre} ha levantado la mano`,
                              descripcion: `El equipo ${grupoReal.nombre} necesita ayuda del profesor.`,
                              metadata: { grupo_id: grupoReal.id, alumno_nombre: alumno.nombre }
                            });
                          }
                        });
                      }
                    } else {
                      toast.info("✅ Duda resuelta");
                    }
                  } catch (e: any) {
                    console.error("Error updating help status:", e);
                    toast.error(`Error: ${e.message || 'No se pudo actualizar'}`);
                    // Revert on error
                    setGrupoReal({ ...grupoReal, pedir_ayuda: !newState });
                  }
                }}
                className={`flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-xl transition-all font-bold text-xs border-2 ${grupoReal?.pedir_ayuda
                  ? 'bg-yellow-500 text-white border-yellow-600 animate-pulse shadow-md shadow-yellow-200'
                  : 'bg-yellow-50 text-yellow-600 border-yellow-100 hover:bg-yellow-100 shadow-sm'
                  }`}
              >
                <span>✋</span>
                <span className="uppercase tracking-tight">{grupoReal?.pedir_ayuda ? 'ESPERANDO' : 'TENGO DUDA'}</span>
              </button>

              <button
                onClick={() => setModalHorarioOpen(true)}
                className="flex items-center justify-center md:justify-start gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all font-bold text-xs border border-emerald-100/50 shadow-sm"
              >
                <Clock className="w-4 h-4" />
                <span className="uppercase tracking-tight">Horario</span>
              </button>

              <button
                onClick={() => { setVistaActiva('calendario'); window.scrollTo(0, 0); }}
                className={`flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-xl transition-all font-bold text-xs border-2 ${vistaActiva === 'calendario'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-200 animate-in fade-in zoom-in duration-300'
                  : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 shadow-sm'
                  }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="uppercase tracking-tight">Calendario</span>
              </button>

              <button
                onClick={() => setModalChatProfesoresOpen(true)}
                className="relative flex items-center justify-center md:justify-start gap-2 px-3 py-2 bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 rounded-xl transition-all font-bold text-xs border border-fuchsia-100/50 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="uppercase tracking-tight hidden md:inline">Profe</span>
                <span className="uppercase tracking-tight md:hidden">Profe</span>
                {unreadProfMessages > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    {unreadProfMessages}
                  </span>
                )}
              </button>

              {/* CLASS SWITCHER */}
              <DropdownMenu open={dropdownMisClasesOpen} onOpenChange={setDropdownMisClasesOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center md:justify-start gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm hover:bg-indigo-100 rounded-xl transition-all font-bold text-xs">
                    <History className="w-4 h-4" />
                    <span className="uppercase tracking-tight">Mis Clases</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl border-slate-200 shadow-xl bg-white z-[100]">
                  <DropdownMenuLabel className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400">Historial</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {historialClases.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[10px] uppercase text-slate-300 font-bold tracking-widest">Sin historial reciente</p>
                    </div>
                  ) : (
                    <div className="max-h-[70vh] overflow-y-auto px-1 space-y-4 custom-scrollbar">
                      {Object.entries(
                        historialClases.reduce((acc: any, curr: any) => {
                          const year = curr.curso || 'Sin Curso';
                          if (!acc[year]) acc[year] = [];
                          acc[year].push(curr);
                          return acc;
                        }, {})
                      ).sort(([a], [b]) => b.localeCompare(a)) // Ordenar años descendente
                        .map(([year, clases]: [string, any]) => (
                          <div key={year} className="space-y-1">
                            <div className="flex items-center gap-2 px-2 py-1">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{year}</span>
                              <div className="h-px flex-1 bg-indigo-50"></div>
                            </div>
                            {clases.map((hist: any, i: number) => {
                              const asigStyles = getAsignaturaStyles(hist.asignatura);
                              return (
                                <DropdownMenuItem
                                  key={`${year}-${i}`}
                                  onClick={() => handleSwitchClass(hist)}
                                  className={`group flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer border-2 ${hist.asignatura ? `${asigStyles.borderClass} ${asigStyles.lightBgClass}` : 'border-transparent hover:bg-indigo-50'} data-[highlighted]:bg-indigo-50 transition-colors mb-1`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className={`font-bold text-xs ${hist.asignatura ? asigStyles.textClass : 'text-slate-700 group-hover:text-indigo-700'}`}>{hist.nombre}</span>
                                    {alumno.codigo_sala === hist.codigo && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest group-hover:bg-indigo-100 group-hover:text-indigo-500">{hist.codigo}</span>
                                    {hist.asignatura && (
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${asigStyles.textClass}`}>
                                        • {hist.asignatura}
                                      </span>
                                    )}
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        ))}
                    </div>
                  )}
                  {/* Botón Explorar todos mis proyectos */}
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setDropdownMisClasesOpen(false); // Cierra el menú manual
                        setModalExploradorProyectosOpen(true);
                      }}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Explorar todos mis proyectos
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => setModalUnirseOpen(true)}
                className="flex items-center justify-center md:justify-start gap-2 px-3 py-2 bg-purple-50 text-purple-600 border border-purple-100 shadow-sm hover:bg-purple-100 rounded-xl transition-all font-bold text-xs"
              >
                <Key className="w-4 h-4" />
                <span className="uppercase tracking-tight">Unirse</span>
              </button>

              {/* Contenedor botones pequeños: Tutorial y Salir */}
              <div className="flex gap-2">
                <button onClick={() => setTutorialActivo(true)} className="flex-1 md:flex-none p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm"><CircleHelp className="w-5 h-5" /></button>
                <button onClick={onLogout} className="flex-1 md:flex-none p-2 bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 rounded-xl flex items-center justify-center shadow-sm"><LogOut className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Visible solo en Desktop */}
      <div className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-2 md:px-6">
          <nav className="grid grid-cols-3 sm:flex gap-1 md:gap-2 p-2 md:p-0">
            <button
              onClick={() => { setVistaActiva('grupo'); window.scrollTo(0, 0); }}
              className={`px-2 md:px-6 py-3 md:py-5 font-bold text-[9px] md:text-xs uppercase tracking-tight md:tracking-widest transition-all rounded-xl md:rounded-none md:border-b-[3px] ${vistaActiva === 'grupo'
                ? 'bg-purple-600 text-white md:bg-purple-50/50 md:text-purple-600 md:border-purple-600 shadow-lg shadow-purple-100 md:shadow-none'
                : 'bg-slate-50 md:bg-transparent text-slate-400 md:border-transparent'
                }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                <Users className="w-4 h-4" />
                <span className="truncate">Mi Equipo</span>
              </div>
            </button>

            {/* NUEVO BOTÓN TAREAS */}
            <button
              onClick={() => { setVistaActiva('tareas'); window.scrollTo(0, 0); }}
              className={`px-2 md:px-6 py-3 md:py-5 font-bold text-[9px] md:text-xs uppercase tracking-tight md:tracking-widest transition-all rounded-xl md:rounded-none md:border-b-[3px] ${vistaActiva === 'tareas'
                ? 'bg-purple-600 text-white md:bg-purple-50/50 md:text-purple-600 md:border-purple-600 shadow-lg shadow-purple-100 md:shadow-none'
                : 'bg-slate-50 md:bg-transparent text-slate-400 md:border-transparent'
                }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                <Layout className="w-4 h-4" />
                <span className="truncate">Tareas</span>
              </div>
            </button>
            <button
              onClick={() => { setVistaActiva('comunidad'); window.scrollTo(0, 0); }}
              className={`px-2 md:px-8 py-3 md:py-5 font-bold text-[9px] md:text-xs uppercase tracking-tight md:tracking-widest transition-all rounded-xl md:rounded-none md:border-b-[3px] ${vistaActiva === 'comunidad'
                ? 'bg-purple-600 text-white md:bg-purple-50/50 md:text-purple-600 md:border-purple-600 shadow-lg shadow-purple-100 md:shadow-none'
                : 'bg-slate-50 md:bg-transparent text-slate-400 md:border-transparent'
                }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                <Globe className="w-4 h-4" />
                <span className="truncate">Global</span>
              </div>
            </button>
            <button
              onClick={() => { setVistaActiva('chat'); window.scrollTo(0, 0); }}
              className={`px-2 md:px-8 py-3 md:py-5 font-bold text-[9px] md:text-xs uppercase tracking-tight md:tracking-widest transition-all rounded-xl md:rounded-none md:border-b-[3px] ${vistaActiva === 'chat'
                ? 'bg-purple-600 text-white md:bg-purple-50/50 md:text-purple-600 md:border-purple-600 shadow-lg shadow-purple-100 md:shadow-none'
                : 'bg-slate-50 md:bg-transparent text-slate-400 md:border-transparent'
                }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="truncate">Chat</span>
              </div>
            </button>
            <button
              onClick={() => { setVistaActiva('notificaciones'); window.scrollTo(0, 0); }}
              className={`px-2 md:px-8 py-3 md:py-5 font-bold text-[9px] md:text-xs uppercase tracking-tight md:tracking-widest transition-all rounded-xl md:rounded-none md:border-b-[3px] ${vistaActiva === 'notificaciones'
                ? 'bg-purple-600 text-white md:bg-purple-50/50 md:text-purple-600 md:border-purple-600 shadow-lg shadow-purple-100 md:shadow-none'
                : 'bg-slate-50 md:bg-transparent text-slate-400 md:border-transparent'
                }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 relative">
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                <span className="truncate">Notificaciones</span>
                {unreadNotifications > 0 && vistaActiva !== 'notificaciones' && (
                  <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-3 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white shadow-md"></span>
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => {
                setVistaActiva('perfil');
                setHasNewEvaluation(false); // Limpiar aviso al entrar
                window.scrollTo(0, 0);
              }}
              className={`px-2 md:px-8 py-3 md:py-5 font-bold text-[9px] md:text-xs uppercase tracking-tight md:tracking-widest transition-all rounded-xl md:rounded-none md:border-b-[3px] relative ${vistaActiva === 'perfil'
                ? 'bg-purple-600 text-white md:bg-purple-50/50 md:text-purple-600 md:border-purple-600 shadow-lg shadow-purple-100 md:shadow-none'
                : 'bg-slate-50 md:bg-transparent text-slate-400 md:border-transparent'
                }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                <Award className="w-4 h-4" />
                <span className="truncate">Mis Notas</span>
              </div>

              {/* INDICADOR DE EVALUACIÓN DISPONIBLE */}
              {hasNewEvaluation && vistaActiva !== 'perfil' && (
                <span className="absolute top-2 right-2 md:top-4 md:right-4 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 border-2 border-white shadow-sm"></span>
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className={`max-w-7xl mx-auto px-6 w-full pb-24 md:pb-8 ${vistaActiva === 'chat' ? 'flex-1 overflow-hidden py-4' : 'py-8 flex-none'}`}>
        {vistaActiva === 'calendario' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VistaCalendario 
              proyectoId={alumno.proyecto_id || ''} 
              grupos={todosLosGrupos} 
              grupoId={grupoReal?.id}
            />
          </div>
        )}
        {showExample && (
          <div className="bg-indigo-600 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
            {/* ... Demo Banner styles ... */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30"><Sparkles className="w-6 h-6" /></div>
                <div><h3 className="text-xl font-black uppercase tracking-tight">Modo Demostración</h3><p className="text-indigo-100 text-sm font-medium">Visualiza cómo sería trabajar en equipo real.</p></div>
              </div>
              <button onClick={() => setModalUnirseOpen(true)} className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg">Unirse a clase</button>
            </div>
          </div>
        )}

        {/* VISTA MI GRUPO (Split 50/50 + Roadmap Vertical completo abajo) */}
        {vistaActiva === 'grupo' && grupoDisplay && (
          <div className="space-y-6">
            {grupoDisplay.id === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-200 text-center px-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">¡Bienvenido a la clase!</h2>
                <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                  Todavía no tienes un equipo asignado. Espera a que tu profesor te incluya en uno para comenzar.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Esperando asignación...
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* COLUMNAS IZQUIERDAS: INFO & RECURSOS */}
                  <div className="lg:col-span-2 space-y-6">
                    {(() => {
                      const asigStyles = getAsignaturaStyles(asignaturaProyecto);
                      return (
                        <div className={`bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border-2 ${asigStyles.borderClass} relative overflow-hidden`}>
                          <div className={`absolute top-0 right-0 w-64 h-64 ${asigStyles.lightBgClass} rounded-full -translate-y-1/2 translate-x-1/2 -z-0 opacity-50`}></div>
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none mb-2">{grupoDisplay.nombre}</h2>
                                  {asignaturaProyecto && (
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${asigStyles.textClass} px-3 py-1 ${asigStyles.lightBgClass} rounded-full border ${asigStyles.borderClass} opacity-80 inline-block mt-1`}>
                                      {asignaturaProyecto}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setModalSubirRecursoOpen(true)}
                                  className="bg-slate-900 text-white w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group"
                                  title="Subir aportación"
                                >
                                  <Upload className="w-6 h-6 group-hover:text-purple-400 transition-colors" />
                                </button>
                              </div>

                              {/* Members */}
                              <div className="mb-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Compañeros</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  {(grupoDisplay.miembros || []).map((miembro: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className={`w-8 h-8 bg-white border ${asigStyles.borderClass} rounded-lg flex items-center justify-center ${asigStyles.textClass} font-bold text-xs`}>
                                        {miembro.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-bold text-slate-700 text-xs tracking-tight truncate">{miembro}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Sección de Recursos del Grupo */}
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <FolderOpen className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recursos del Equipo</h3>
                        </div>
                      </div>
                      <RepositorioColaborativo
                        grupo={grupoDisplay}
                        todosLosGrupos={todosLosGrupos}
                        proyectoId={alumno.proyecto_id}
                        filterByGroupId={grupoDisplay.id}
                        className="!gap-4"
                        hideTitle={true}
                      />
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: BATERÍA (RESTAURADA) */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm sticky top-24 flex flex-col items-center justify-center min-h-[450px] overflow-hidden relative">
                      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>
                      <h3 className="absolute top-6 left-6 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Energía del Equipo</h3>

                      <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                        <LivingTree
                          progress={calculatedProgreso}
                          health={100}
                          size={260}
                          showLabels={false}
                          variant="satellite"
                        />
                      </div>

                      <div className="mt-8 text-center relative z-10 w-full">
                        <div className="text-4xl font-black text-indigo-600 mb-1">{calculatedProgreso.toFixed(0)}%</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-indigo-50 py-1.5 px-4 rounded-full inline-flex border border-indigo-100">Batería recolectada</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* VISTA TAREAS (Issue 4) */}
        {vistaActiva === 'tareas' && grupoDisplay && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full mx-auto w-full pb-20 px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* PANEL PENDIENTES */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Pendientes</h4>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-100">
                    {tareasCategorizadas.pendientes.length}
                  </span>
                </div>
                <div className="flex-1 space-y-4 bg-slate-100/50 p-4 rounded-[2.5rem] min-h-[400px]">
                  {tareasCategorizadas.pendientes.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setTareaSeleccionadaDetalle(t)}
                      className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        {t.fecha_entrega && (
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                             {new Date(t.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <h5 className="font-black text-slate-800 text-sm leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{t.titulo}</h5>
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                           <Award className="w-3.5 h-3.5 text-amber-500" />
                           <span className="text-[10px] font-black text-slate-400 leading-none">V5.8.85</span>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{t.puntos_maximos} Puntos</span>
                        </div>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateTareaEstado(t.id, 'revision');
                            toast.success('¡Misión enviada a revisión!');
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                        >
                          <Send className="w-3 h-3" />
                          Enviar
                        </button>
                      </div>
                    </div>
                  ))}
                  {tareasCategorizadas.pendientes.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                      <Sparkles className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Todo al día</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL EN REVISIÓN */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">En Revisión</h4>
                  </div>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-100">
                    {tareasCategorizadas.revision.length}
                  </span>
                </div>
                <div className="flex-1 space-y-4 bg-slate-100/50 p-4 rounded-[2.5rem] min-h-[400px]">
                  {tareasCategorizadas.revision.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setTareaSeleccionadaDetalle(t)}
                      className="group bg-white p-5 rounded-3xl border-2 border-amber-100 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-50/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2">
                        <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
                      </div>
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-3">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h5 className="font-black text-slate-800 text-sm leading-tight mb-4">{t.titulo}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 w-full text-center">Esperando respuesta...</span>
                      </div>
                    </div>
                  ))}
                  {tareasCategorizadas.revision.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                      <Clock className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nada pendiente</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL COMPLETADO */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Completado</h4>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100">
                    {tareasCategorizadas.completado.length}
                  </span>
                </div>
                <div className="flex-1 space-y-4 bg-slate-100/50 p-4 rounded-[2.5rem] min-h-[400px]">
                  {tareasCategorizadas.completado.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setTareaSeleccionadaDetalle(t)}
                      className="group bg-emerald-50/30 p-5 rounded-3xl border border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-50/50 transition-all cursor-pointer relative overflow-hidden opacity-80 hover:opacity-100"
                    >
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-3">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <h5 className="font-black text-slate-800 text-sm leading-tight mb-2 line-through decoration-emerald-500/30">{t.titulo}</h5>
                      <div className="flex items-center justify-between mt-auto">
                         <div className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600">+{t.puntos_maximos} Puntos</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Puntuación Final</span>
                            <span className="text-sm font-black text-indigo-600">{t.calificacion !== undefined && t.calificacion !== null ? `${t.calificacion}/10` : 'S/N'}</span>
                         </div>
                      </div>
                    </div>
                  ))}
                  {tareasCategorizadas.completado.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                      <Trophy className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">¿Primer objetivo?</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL EXPIRADO */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Expirado</h4>
                  </div>
                  <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-100">
                    {tareasCategorizadas.expirado.length}
                  </span>
                </div>
                <div className="flex-1 space-y-4 bg-slate-100/50 p-4 rounded-[2.5rem] min-h-[400px]">
                  {tareasCategorizadas.expirado.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setTareaSeleccionadaDetalle(t)}
                      className="group bg-rose-50/30 p-5 rounded-3xl border border-rose-100 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-50/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-2 right-2">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-400 mb-3">
                        <History className="w-5 h-5" />
                      </div>
                      <h5 className="font-black text-slate-700 text-sm leading-tight mb-2 opacity-60">{t.titulo}</h5>
                      <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Plazo vencido</p>
                    </div>
                  ))}
                  {tareasCategorizadas.expirado.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                      <CheckCircle2 className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">¡Ningún retraso!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA TODOS LOS GRUPOS (NUEVA: Comunidad con detalles) */}
        {vistaActiva === 'comunidad' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Grid Unificado: Árbol + Equipos + Recursos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 1. Árbol Global (Simple) */}
              <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100 mb-6 relative z-10">
                  <Globe className="w-3 h-3 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Progreso Global</span>
                </div>

                <div className="relative z-10 transform hover:-translate-y-2 transition-transform duration-500 w-full flex justify-center">
                  <LivingTree
                    progress={todosLosGrupos.reduce((acc, g) => acc + g.progreso, 0) / (todosLosGrupos.length || 1)}
                    health={100}
                    size={280}
                    variant="nexus"
                  />
                </div>

                <div className="mt-8 text-center relative z-10">
                  <div className="text-4xl font-black text-indigo-600 mb-2">
                    {(todosLosGrupos.reduce((acc, g) => acc + g.progreso, 0) / (todosLosGrupos.length || 1)).toFixed(0)}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-indigo-50 py-1.5 px-4 rounded-full border border-indigo-100 inline-block shadow-sm">Energía Planetaria</div>
                </div>
              </div>

              {/* 2. Lista de Equipos Compacta */}
              <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[500px] lg:max-h-full pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4">
                  {todosLosGrupos.map((g, idx) => {
                    const asigStyles = getAsignaturaStyles(asignaturaProyecto);

                    return (
                      <div key={idx} className={`p-4 bg-slate-50 rounded-2xl border-2 ${asigStyles.borderClass} group hover:border-indigo-400 transition-all shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`font-bold ${asigStyles.textClass} text-sm truncate max-w-[120px]`} title={g.nombre}>{g.nombre}</div>
                          <div className={`w-7 h-7 rounded-full bg-white border ${asigStyles.borderClass} flex items-center justify-center text-[9px] font-black ${asigStyles.textClass} shadow-sm`}>
                            {g.progreso}%
                          </div>
                        </div>

                        <div className="flex -space-x-2 mb-3 overflow-hidden py-1 pl-1">
                          {g.miembros?.slice(0, 4).map((m, i) => (
                            <div key={i} title={m} className={`w-5 h-5 rounded-full ${asigStyles.lightBgClass} border-2 border-white flex items-center justify-center text-[7px] font-bold ${asigStyles.textClass} uppercase ring-1 ring-slate-100`}>
                              {m.charAt(0)}
                            </div>
                          ))}
                          {(g.miembros?.length || 0) > 4 && (
                            <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[7px] font-bold text-slate-500 ring-1 ring-slate-100">
                              +{g.miembros!.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          {g.tareas && g.tareas.length > 0 ? (
                            g.tareas.map((t, i) => {
                              const completado = t.estado === 'aprobado' || t.estado === 'completado';
                              return (
                                <div key={i} className={`flex items-center gap-1.5 ${completado ? 'opacity-50' : 'opacity-80'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${completado ? 'bg-slate-300' : asigStyles.bgClass}`}></div>
                                  <span className={`text-[10px] font-medium truncate max-w-full block ${completado ? 'text-slate-400 line-through' : 'text-slate-600'}`} title={t.titulo}>
                                    {t.titulo}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-[9px] text-slate-400 italic">Sin tareas documentadas</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Repositorio Compartido */}
              <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-0 shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
                <div className="p-8 pb-4">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recursos</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                  <RepositorioColaborativo
                    grupo={grupoReal || grupoEjemplo}
                    todosLosGrupos={todosLosGrupos}
                    proyectoId={alumno.proyecto_id}
                    mostrarEjemplo={showExample}
                    className="!gap-4 !grid-cols-1"
                    hideTitle={true}
                    refreshTrigger={refreshRecursos}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA MENTOR IA / EQUIPO */}
        {
          vistaActiva === 'chat' && grupoDisplay && (
            <div className="h-full flex flex-col overflow-hidden">
              {/* UNIFIED VIEW: Selection Menu or Focused Chat */}
              <div className="h-full flex flex-col overflow-hidden">
                {mobileChatTab === 'menu' ? (
                  <div className="flex-1 flex flex-col justify-center items-center gap-6 p-6 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {/* Botón TICO */}
                      <button
                        onClick={() => setMobileChatTab('ia')}
                        className="group relative h-32 md:h-64 bg-gradient-to-r md:bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-indigo-100 active:scale-95 transition-all overflow-hidden border-4 border-white flex items-center md:flex-col md:justify-center gap-5"
                      >
                        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-white/10 rounded-full -mr-16 md:-mr-32 -mt-16 md:-mt-32 group-hover:scale-110 transition-transform"></div>
                        <div className="w-16 h-16 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0 relative z-10">
                          <Bot className="w-9 h-9 md:w-16 md:h-16 group-hover:rotate-12 transition-transform" />
                        </div>
                        <div className="text-left md:text-center relative z-10">
                          <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight leading-none italic">Hablar con Tico</h3>
                        </div>
                      </button>

                      {/* Botón GRUPO */}
                      <button
                        onClick={() => setMobileChatTab('equipo')}
                        className="group relative h-32 md:h-64 bg-gradient-to-r md:bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-emerald-100 active:scale-95 transition-all overflow-hidden border-4 border-white flex items-center md:flex-col md:justify-center gap-5"
                      >
                        <div className="absolute bottom-0 left-0 w-32 md:w-64 h-32 md:h-64 bg-white/10 rounded-full -ml-16 md:-ml-32 -mb-16 md:-mb-32 group-hover:scale-110 transition-transform"></div>
                        <div className="w-16 h-16 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white border border-white/30 shadow-inner shrink-0 relative z-10 pr-0.5">
                          <Users className="w-9 h-9 md:w-16 md:h-16 group-hover:-rotate-12 transition-transform" />
                        </div>
                        <div className="text-left md:text-center relative z-10">
                          <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight leading-none italic">Hablar con el grupo</h3>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col bg-white overflow-hidden md:rounded-[2.5rem] rounded-t-[2.5rem] border border-slate-100 shadow-2xl h-full">
                    {/* Compact Sub-Header */}
                    <div className="px-6 py-4 md:py-6 flex items-center justify-between border-b border-slate-50 shrink-0 bg-white/50 backdrop-blur-md z-10">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl text-white shadow-lg ${mobileChatTab === 'ia' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'}`}>
                          {mobileChatTab === 'ia' ? <Bot size={20} className="md:w-6 md:h-6" /> : <Users size={20} className="md:w-6 md:h-6" />}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm md:text-lg italic">
                            {mobileChatTab === 'ia' ? 'Mentor TICO' : 'Chat de Equipo'}
                          </h4>
                          <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">Canal de comunicación activo</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMobileChatTab('menu')}
                        className="px-4 md:px-6 py-2 md:py-3 bg-slate-50 rounded-xl md:rounded-2xl text-slate-400 font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-slate-100 hover:text-slate-600 active:scale-90 transition-all border border-slate-100 flex items-center gap-2"
                      >
                        <ArrowLeft size={14} className="md:w-4 md:h-4" />
                        <span>Volver</span>
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 relative h-full">
                      {mobileChatTab === 'ia' ? (
                        <MentorChat grupo={grupoDisplay} mostrarEjemplo={showExample} proyectoNombre={nombreProyecto} contextoIA={contextoProyecto} />
                      ) : (
                        <ChatGrupo
                          grupoId={String(grupoDisplay.id)}
                          miembroActual={alumno.nombre || 'Alumno'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }

        {/* VISTA NOTIFICACIONES */}
        {
          vistaActiva === 'notificaciones' && alumno.id && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NotificacionesPanel 
                userId={alumno.id} 
                proyectoId={alumno.proyecto_id}
                hideHeader={true}
                onNotificationClick={(notif: Notificacion) => {
                  if (notif.tipo === 'tarea_asignada' || notif.tipo === 'notas_actualizadas' || notif.tipo === 'comentario_tarea') {
                    const tId = notif.metadata?.tarea_id;
                    const tarea = tareasAlumno.find(t => t.id === tId);
                    if (tarea) {
                      if (notif.tipo === 'comentario_tarea') {
                        setModalInitialShowChat(true);
                      }
                      setTareaSeleccionadaDetalle(tarea);
                      setVistaActiva('tareas');
                    } else if (notif.tipo === 'notas_actualizadas') {
                      setVistaActiva('perfil');
                    } else {
                      setVistaActiva('tareas');
                    }
                    window.scrollTo(0, 0);
                  } else if (notif.tipo === 'recurso_subido') {
                    setVistaActiva('comunidad');
                    window.scrollTo(0, 0);
                  } else if (notif.tipo === 'mensaje_familia' || notif.tipo === 'mensaje_grupo') {
                    setVistaActiva('chat');
                    window.scrollTo(0, 0);
                  }
                }}
              />
            </div>
          )
        }

        {/* VISTA MIS NOTAS (Revertido a solo notas) */}
        {
          vistaActiva === 'perfil' && grupoDisplay && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header de Rendimiento */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 leading-none mb-1">{notaMedia.toFixed(1)}</div>
                    <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Media Crit.</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 leading-none mb-1">{asistenciaStats.percentage}%</div>
                    <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Asist.</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                    <Award className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-2xl lg:text-3xl font-black text-amber-600 leading-none mb-1">{tareasCompletadasMisiones}/{totalTareasMisiones}</div>
                    <div className="text-[8px] md:text-[9px] font-bold text-amber-500 uppercase tracking-wider leading-none">Misiones</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-fuchsia-50 rounded-xl md:rounded-2xl flex items-center justify-center text-fuchsia-600 shrink-0 shadow-sm">
                    <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-2xl lg:text-3xl font-black text-fuchsia-600 leading-none mb-1">{notaMediaMisiones.toFixed(1)}</div>
                    <div className="text-[8px] md:text-[9px] font-bold text-fuchsia-500 uppercase tracking-wider leading-none">Media Mis.</div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-4 md:p-6 shadow-sm border border-indigo-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                    <Star className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-2xl lg:text-3xl font-black text-indigo-600 leading-none mb-1">{puntosTotales}</div>
                    <div className="text-[8px] md:text-[9px] font-bold text-indigo-500 uppercase tracking-wider leading-none">Puntos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">

                <div className="space-y-6">
                  {evaluacionAlumno.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-slate-400 font-bold italic uppercase tracking-widest text-sm">Pendiente de evaluación</p>
                    </div>
                  ) : (
                    evaluacionAlumno.map((item, index) => {
                      const nombreCriterio = item.nombre || item.criterio || `Criterio ${index + 1}`;
                      const puntos = Number(item.puntos || 0);

                      const getNivelFromPuntos = (p: number) => {
                        if (p >= 9) return 'Sobresaliente';
                        if (p >= 7) return 'Notable';
                        if (p >= 5) return 'Suficiente';
                        return 'Insuficiente';
                      };

                      const getNivelStyles = (p: number) => {
                        const nivel = getNivelFromPuntos(p);
                        switch (nivel) {
                          case 'Sobresaliente': return { color: 'text-emerald-600', bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', icon: <Trophy className="w-3.5 h-3.5" /> };
                          case 'Notable': return { color: 'text-blue-600', bg: 'bg-blue-500', bgLight: 'bg-blue-50', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
                          case 'Suficiente': return { color: 'text-amber-600', bg: 'bg-amber-500', bgLight: 'bg-amber-50', icon: <Star className="w-3.5 h-3.5" /> };
                          default: return { color: 'text-rose-600', bg: 'bg-rose-500', bgLight: 'bg-rose-50', icon: <AlertCircle className="w-3.5 h-3.5" /> };
                        }
                      };

                      const styles = getNivelStyles(puntos);

                      return (
                        <div key={index} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h4 className="font-black text-slate-800 uppercase tracking-wide text-sm mb-1">{nombreCriterio}</h4>
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${styles.bgLight} ${styles.color}`}>
                                {styles.icon}
                                {getNivelFromPuntos(puntos)}
                              </div>
                            </div>
                            <div className="text-2xl font-black text-slate-900 shrink-0">
                              {puntos.toFixed(1)}<span className="text-sm text-slate-400 font-bold ml-1">/10</span>
                            </div>
                          </div>
                          <div className="h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full ${styles.bg} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                              style={{ width: `${puntos * 10}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              {/* SECCIÓN CALIFICACIONES POR TAREA */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  Calificaciones por Misión
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tareasAlumno.filter(t => {
                    const entrega = entregasTareas.find(e => e.tarea_id === t.id);
                    return (t.calificacion !== undefined && t.calificacion !== null) || (entrega?.calificacion !== undefined && entrega?.calificacion !== null);
                  }).length === 0 ? (
                    <div className="col-span-full py-10 text-center opacity-50">
                      <p className="text-sm font-bold text-gray-400">Sin misiones evaluadas aún</p>
                    </div>
                  ) : (
                    tareasAlumno.filter(t => {
                      const entrega = entregasTareas.find(e => e.tarea_id === t.id);
                      return (t.calificacion !== undefined && t.calificacion !== null) || (entrega?.calificacion !== undefined && entrega?.calificacion !== null);
                    }).map((t) => {
                      const entrega = entregasTareas.find(e => e.tarea_id === t.id);
                      const cal = t.calificacion ?? entrega?.calificacion ?? 0;
                      
                      const getNivelStyles = (p: number) => {
                        if (p >= 9) return { color: 'text-emerald-600', bg: 'bg-emerald-50' };
                        if (p >= 7) return { color: 'text-blue-600', bg: 'bg-blue-50' };
                        if (p >= 5) return { color: 'text-amber-600', bg: 'bg-amber-50' };
                        return { color: 'text-rose-600', bg: 'bg-rose-50' };
                      };
                      const styles = getNivelStyles(cal);

                      return (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-700 text-sm truncate uppercase tracking-tight" title={t.titulo}>{t.titulo}</h4>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Misión Evaluada</span>
                          </div>
                          <div className={`ml-4 px-3 py-1.5 rounded-xl font-black text-sm ${styles.bg} ${styles.color} shadow-sm border border-white/50`}>
                            {cal.toFixed(1)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECCION COMENTARIOS */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                  Observaciones del Profesor
                </h3>

                <div className="space-y-4">
                  {comentarios.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-bold text-gray-400">Sin observaciones registradas</p>
                    </div>
                  ) : (
                    comentarios.map((comentario) => (
                      <div key={comentario.id} className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-full -mr-8 -mt-8 opacity-50 blur-xl"></div>
                        <p className="text-gray-700 font-medium text-sm leading-relaxed whitespace-pre-wrap relative z-10">{comentario.contenido}</p>
                        <div className="mt-4 flex justify-end relative z-10">
                          <span className="text-[10px] uppercase font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full shadow-sm border border-yellow-200/50">
                            {new Date(comentario.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )
        }
      </main >

      {tutorialActivo && (
        <TutorialInteractivo
          pasos={PASOS_TUTORIAL_ALUMNO}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialComplete}
          onStepChange={(index) => {
            const paso = PASOS_TUTORIAL_ALUMNO[index];
            if (paso.vista) {
              // Mapeo de la vista del tutorial a la vista interna del componente
              const targetView = paso.vista === 'notas' ? 'perfil' : paso.vista;
              setVistaActiva(targetView as 'grupo' | 'comunidad' | 'chat' | 'perfil');
            }
          }}
        />
      )}
      {modalUnirseOpen && <ModalUnirseClase onClose={() => setModalUnirseOpen(false)} onJoinSuccess={handleJoinSuccess} />}

      {
        modalSubirRecursoOpen && grupoDisplay && (
          <ModalSubirRecurso
            grupo={grupoReal || grupoEjemplo}
            proyectoId={alumno.proyecto_id}
            onClose={() => setModalSubirRecursoOpen(false)}
            onSuccess={() => {
              toast.success("Recurso subido correctamente");
              setRefreshRecursos(prev => prev + 1);
            }}
          />
        )
      }

      {
        modalProponerOpen && faseParaProponer && (
          <ModalProponerHitos
            fase={faseParaProponer}
            onClose={() => setModalProponerOpen(false)}
            onSubmit={async (nuevosHitos) => {
              if (grupoReal) {
                try {
                  const updatedHitos = [...(grupoReal.hitos || []), ...nuevosHitos] as HitoGrupo[];

                  // Optimistic update
                  setGrupoReal({ ...grupoReal, hitos: updatedHitos });

                  // DB Update
                  const { error } = await supabase
                    .from('grupos')
                    .update({ hitos: updatedHitos })
                    .eq('id', grupoReal.id);

                  if (error) throw error;

                  toast.success("Propuesta enviada al profesor correctamente");
                  setModalProponerOpen(false);
                } catch (error) {
                  console.error("Error saving milestones:", error);
                  toast.error("Error al guardar la propuesta. Inténtalo de nuevo.");
                }
              }
            }}
          />
        )
      }

      {/* Bottom Navigation (Mobile Only) - Hidden if any main modal is open or a focused chat is active to avoid overlapping */}
      {
        !modalSubirRecursoOpen && !modalUnirseOpen && !modalProponerOpen && !tutorialActivo && (mobileChatTab === 'menu' || vistaActiva !== 'chat') && (
          <nav className="md:hidden fixed bottom-1 left-3 right-3 bg-white/90 backdrop-blur-xl border border-white/20 px-1 py-3 flex items-center justify-around z-[100] shadow-[0_10px_40px_rgb(0,0,0,0.1)] rounded-[2.5rem] animate-in slide-in-from-bottom-5 duration-300">
            <button
              onClick={() => { setVistaActiva('grupo'); window.scrollTo(0, 0); }}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${vistaActiva === 'grupo' ? 'text-purple-600 scale-110' : 'text-slate-400 opacity-60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${vistaActiva === 'grupo' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-transparent'}`}>
                <Users className={`w-5 h-5 ${vistaActiva === 'grupo' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${vistaActiva === 'grupo' ? 'opacity-100' : 'opacity-80'}`}>Mi Equipo</span>
            </button>

            <button
              onClick={() => { setVistaActiva('tareas'); window.scrollTo(0, 0); }}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${vistaActiva === 'tareas' ? 'text-purple-600 scale-110' : 'text-slate-400 opacity-60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${vistaActiva === 'tareas' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-transparent'}`}>
                <Layout className={`w-5 h-5 ${vistaActiva === 'tareas' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${vistaActiva === 'tareas' ? 'opacity-100' : 'opacity-80'}`}>Tareas</span>
            </button>

            <button
              onClick={() => { setVistaActiva('comunidad'); window.scrollTo(0, 0); }}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${vistaActiva === 'comunidad' ? 'text-purple-600 scale-110' : 'text-slate-400 opacity-60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${vistaActiva === 'comunidad' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-transparent'}`}>
                <Globe className={`w-5 h-5 ${vistaActiva === 'comunidad' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${vistaActiva === 'comunidad' ? 'opacity-100' : 'opacity-80'}`}>Global</span>
            </button>

            <button
              onClick={() => { setVistaActiva('chat'); window.scrollTo(0, 0); }}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${vistaActiva === 'chat' ? 'text-purple-600 scale-110' : 'text-slate-400 opacity-60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${vistaActiva === 'chat' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-transparent'}`}>
                <MessageSquare className={`w-5 h-5 ${vistaActiva === 'chat' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${vistaActiva === 'chat' ? 'opacity-100' : 'opacity-80'}`}>Chat</span>
            </button>

            <button
              onClick={() => { setVistaActiva('notificaciones'); window.scrollTo(0, 0); }}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all relative ${vistaActiva === 'notificaciones' ? 'text-purple-600 scale-110' : 'text-slate-400 opacity-60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${vistaActiva === 'notificaciones' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-transparent'}`}>
                <Bell className={`w-5 h-5 ${vistaActiva === 'notificaciones' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${vistaActiva === 'notificaciones' ? 'opacity-100' : 'opacity-80'}`}>Notificaciones</span>
              
              {unreadNotifications > 0 && vistaActiva !== 'notificaciones' && (
                <span className="absolute top-1 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white shadow-sm"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setVistaActiva('perfil');
                setHasNewEvaluation(false);
                window.scrollTo(0, 0);
              }}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all relative ${vistaActiva === 'perfil' ? 'text-purple-600 scale-110' : 'text-slate-400 opacity-60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${vistaActiva === 'perfil' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-transparent'}`}>
                <Award className={`w-5 h-5 ${vistaActiva === 'perfil' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${vistaActiva === 'perfil' ? 'opacity-100' : 'opacity-80'}`}>Mis Notas</span>

              {hasNewEvaluation && vistaActiva !== 'perfil' && (
                <span className="absolute top-1 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 border-2 border-white"></span>
                </span>
              )}
            </button>
          </nav>
        )
      }
      {modalExploradorProyectosOpen && (
        <ModalExploradorProyectosAlumno
          proyectos={historialClases}
          onClose={() => setModalExploradorProyectosOpen(false)}
          onSelectProject={handleSwitchClass}
          alumnoId={alumno.id}
          proyectoActualId={alumno.proyecto_id}
        />
      )}
      <ModalHorario
        isOpen={modalHorarioOpen}
        onClose={() => setModalHorarioOpen(false)}
        alumnoId={alumno.id}
      />
      {modalChatProfesoresOpen && (
        <ModalChatProfesoresAlumno
          isOpen={modalChatProfesoresOpen}
          onClose={() => setModalChatProfesoresOpen(false)}
          alumnoId={alumno.id}
          alumnoNombre={alumno.nombre}
          historialClases={historialClases}
        />
      )}

      {tareaSeleccionadaDetalle && (
        <ModalDetalleTarea
          tarea={tareaSeleccionadaDetalle}
          grupos={todosLosGrupos}
          isStudent={true}
          targetGrupoId={grupoReal?.id}
          onClose={() => { setTareaSeleccionadaDetalle(null); setModalInitialShowChat(false); }}
          onEstadoChange={handleUpdateTareaEstado}
          onUpdateTarea={handleUpdateTarea}
          onSaveAlumnoContent={handleSaveAlumnoContent}
          currentUserId={alumno.id}
          currentUserNombre={alumno.nombre}
          initialShowChat={modalInitialShowChat}
        />
      )}
    </div >
  );
}
// Dashboard Alumno Component
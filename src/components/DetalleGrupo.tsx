import { ArrowLeft, CheckCircle2, Circle, Brain, Share2, MessageSquare, Users, Bot, Pencil, ClipboardList, ExternalLink, User, Star, Calendar, FileText, Eye, Clock, Trash2, Plus, AlertCircle, TrendingUp, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Grupo, ProyectoFase, Criterio, TareaDetallada } from '../types';
import { EvaluacionGrupalContent } from './EvaluacionGrupalContent';
import { RepositorioColaborativo } from './RepositorioColaborativo';
import { MentorChat } from './MentorChat';
import { ChatGrupo } from './ChatGrupo';
import { ModalConfiguracionIA } from './ModalConfiguracionIA';
import { LivingTree } from './LivingTree';
import { ModalDetalleTarea } from './ModalDetalleTarea';
import { ModalSubirRecurso } from './ModalSubirRecurso';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface DetalleGrupoProps {
  grupo: Grupo;
  fases: ProyectoFase[];
  onBack: () => void;
  onViewFeedback?: () => void;
  onAssignTask?: () => void;
  onEditGroup?: () => void;
  onViewStudent?: (alumno: string) => void;
  onDeleteHito?: (faseId: string, hitoTitulo: string) => void;
  rubrica?: Criterio[];
}

export function DetalleGrupo({ grupo, fases, rubrica, onBack, onViewFeedback, onAssignTask, onEditGroup, onViewStudent, onDeleteHito }: DetalleGrupoProps) {
  const [vistaActiva, setVistaActiva] = useState<'detalle' | 'compartir' | 'chat' | 'tareas' | 'evaluacion'>('detalle');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [chatMode, setChatMode] = useState<'menu' | 'mentor' | 'group'>('menu');
  const [tareasGrupo, setTareasGrupo] = useState<TareaDetallada[]>([]);
  const [entregasGrupo, setEntregasGrupo] = useState<any[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<TareaDetallada | null>(null);
  const [modalSubirRecursoAbierto, setModalSubirRecursoAbierto] = useState(false);
  const [refreshRecursos, setRefreshRecursos] = useState(0);

  // Asegurar que empezamos arriba al entrar al detalle
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchTareas = async () => {
    try {
      // Obtenemos tareas que son del grupo específico O que son globales (grupo_id null o 'Todos')
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .or(`grupo_id.eq.${grupo.id},grupo_id.is.null`)
        .eq('proyecto_id', grupo.proyecto_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTareasGrupo(data || []);

      // Fetch entregas para calcular progreso REAL individual
      const { data: entregas, error: eError } = await supabase
        .from('entregas_tareas')
        .select('*')
        .eq('grupo_id', grupo.id);
      if (!eError) setEntregasGrupo(entregas || []);
    } catch (err) {
      console.error('Error fetching group tasks:', err);
    }
  };

  const tareasCategorizadas = useMemo(() => {
    return {
      pendientes: tareasGrupo.filter(t => t.estado === 'pendiente' || t.estado === 'en_progreso'),
      revision: tareasGrupo.filter(t => t.estado === 'revision'),
      completadas: tareasGrupo.filter(t => t.estado === 'aprobado' || t.estado === 'completado'),
      expiradas: tareasGrupo.filter(t => t.estado === 'expirado')
    };
  }, [tareasGrupo]);

  const handleUpdateTareaEstado = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('tareas')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar estado local de tareas
      const nuevasTareas = tareasGrupo.map(t => t.id === id ? { ...t, estado: nuevoEstado as any } : t);
      setTareasGrupo(nuevasTareas);

      // Recalcular progreso del grupo (Batería) - SOPORTAR TAREAS GLOBALES
      const total = nuevasTareas.length;
      const aprobadas = nuevasTareas.filter(t => {
        // En tareas específicas del grupo, nos vale el t.estado
        if (t.grupo_id === grupo.id) return (t.estado === 'aprobado' || t.estado === 'completado');
        // En tareas globales, nos vale la entrega del grupo específica
        const e = (entregasGrupo || []).find(ent => ent.tarea_id === t.id);
        return (e && (e.estado === 'aprobado' || e.estado === 'completado'));
      }).length;
      const nuevoProgreso = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

      await supabase
        .from('grupos')
        .update({ progreso: nuevoProgreso })
        .eq('id', grupo.id);

      toast.success(nuevoEstado === 'aprobado' ? 'Misión aprobada' : 'Misión rechazada');
    } catch (err) {
      console.error('Error updating task status or progress:', err);
      toast.error('No se pudo actualizar la misión');
    }
  };

  useEffect(() => {
    fetchTareas();
    // Suscribirse a cambios en tareas de este proyecto para capturar globales y específicas
    const ch = supabase.channel(`group_tareas_rt_${grupo.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tareas', 
        filter: `proyecto_id=eq.${grupo.proyecto_id}` 
      }, 
        (payload) => {
          console.log("Task change detected in group view:", payload.eventType);
          fetchTareas();
        }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [grupo.id, grupo.proyecto_id]);

  const getEstadoColor = (estado: Grupo['estado']) => {
    switch (estado) {
      case 'Completado': return 'bg-green-100 text-green-700 border-green-300';
      case 'Casi terminado': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'En progreso': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Bloqueado': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${vistaActiva === 'chat' ? 'h-screen overflow-hidden' : ''}`}>
      <header className={`bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${vistaActiva === 'chat' ? 'shrink-0' : ''}`}>
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm"
        >
          <div className="p-2 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Volver</span>
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 mx-auto">
          {[
            { id: 'detalle', label: 'Detalles', icon: Circle },
            { id: 'tareas', label: 'Tareas', icon: CheckCircle2 },
            { id: 'chat', label: 'Chats', icon: MessageSquare },
            { id: 'compartir', label: 'Recursos', icon: Share2 },
            { id: 'evaluacion', label: 'Evaluación', icon: ClipboardList },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVistaActiva(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${vistaActiva === tab.id
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${vistaActiva === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className={`w-full max-w-7xl mx-auto pb-24 md:pb-8 ${vistaActiva === 'chat' ? 'flex-1 overflow-hidden p-4' : 'flex-none p-4 md:p-8'}`}>
        {vistaActiva === 'detalle' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: INFO & ACTIONS */}
            <div className="lg:col-span-2 space-y-6">

              {/* Main Card */}
              <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex flex-col gap-6">

                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                      <h1 className="text-3xl font-black text-gray-900 mb-2 flex flex-wrap items-center gap-3">
                        {grupo.nombre}
                        {grupo.pedir_ayuda && (
                          <span className="animate-pulse px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-rose-200">
                            Ayuda urgente
                          </span>
                        )}
                      </h1>
                    </div>
                    <div>
                      {onEditGroup && (
                        <button
                          onClick={onEditGroup}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 rounded-xl transition-all text-sm font-bold active:scale-95 shadow-sm"
                          title="Editar configuración del grupo"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Botón Configuración IA */}





                  </div>

                  {/* Miembros */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Equipo de Trabajo</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {grupo.miembros && grupo.miembros.map((miembro: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => onViewStudent && onViewStudent(miembro)}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all text-left w-full group"
                          title="Ver evaluación del alumno"
                        >
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            {miembro.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700">{miembro}</div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-500">
                              Evaluar
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>



                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: BIG TREE */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-md sticky top-24 flex flex-col items-center justify-center min-h-[500px] h-full overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-50 to-transparent rounded-t-[2rem] pointer-events-none"></div>
                <h3 className="absolute top-6 left-6 text-xs font-black text-slate-400 uppercase tracking-widest z-10">Batería del Equipo</h3>

                <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                  <LivingTree
                    progress={grupo.progreso}
                    health={100}
                    size={280}
                    showLabels={false}
                    variant="satellite"
                  />
                </div>

                <div className="mt-8 text-center relative z-10 w-full">
                  <div className="text-4xl font-black text-blue-600 mb-1">{grupo.progreso.toFixed(0)}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-blue-50 py-1.5 px-3 rounded-full inline-flex border border-blue-100">Energía Recolectada</div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          // Otros tabs
          vistaActiva === 'tareas' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Misiones del Equipo</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Hitos y objetivos a completar</p>
                </div>
                {onAssignTask && (
                  <button onClick={onAssignTask} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-xs shadow-lg shadow-indigo-100 active:scale-95 uppercase tracking-wider">
                    <Plus className="w-4 h-4" />
                    Asignar Tarea
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PANEL: Pendientes */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Pendientes ({tareasCategorizadas.pendientes.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {tareasCategorizadas.pendientes.map((tarea) => (
                      <TaskCardTeacher key={tarea.id} tarea={tarea} onClick={() => setTareaSeleccionada(tarea)} />
                    ))}
                    {tareasCategorizadas.pendientes.length === 0 && <EmptyTaskState />}
                  </div>
                </div>

                {/* PANEL: En Revisión */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">En Revisión ({tareasCategorizadas.revision.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {tareasCategorizadas.revision.map((tarea) => (
                      <TaskCardTeacher 
                        key={tarea.id} 
                        tarea={tarea} 
                        onClick={() => setTareaSeleccionada(tarea)}
                        actions={
                          <div className="flex gap-2 mt-3 pt-3 border-t border-amber-100">
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleUpdateTareaEstado(tarea.id, 'aprobado'); }}
                                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-600 active:scale-95 transition-all"
                             >
                                Aprobar
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleUpdateTareaEstado(tarea.id, 'rechazado'); }}
                                className="flex-1 py-2 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-rose-600 active:scale-95 transition-all"
                             >
                                Rechazar
                             </button>
                          </div>
                        }
                      />
                    ))}
                    {tareasCategorizadas.revision.length === 0 && <EmptyTaskState />}
                  </div>
                </div>

                {/* PANEL: Completado */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-emerald-400 rounded-full"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Completado ({tareasCategorizadas.completadas.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {tareasCategorizadas.completadas.map((tarea) => (
                      <TaskCardTeacher key={tarea.id} tarea={tarea} onClick={() => setTareaSeleccionada(tarea)} />
                    ))}
                    {tareasCategorizadas.completadas.length === 0 && <EmptyTaskState />}
                  </div>
                </div>

                {/* PANEL: Expirado */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-rose-400 rounded-full"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Expirado ({tareasCategorizadas.expiradas.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {tareasCategorizadas.expiradas.map((tarea) => (
                      <TaskCardTeacher key={tarea.id} tarea={tarea} onClick={() => setTareaSeleccionada(tarea)} />
                    ))}
                    {tareasCategorizadas.expiradas.length === 0 && <EmptyTaskState />}
                  </div>
                </div>
              </div>
            </div>
          ) : vistaActiva === 'evaluacion' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden h-full">
                <EvaluacionGrupalContent
                  grupo={grupo}
                  rubricaProyecto={rubrica}
                  onCancel={() => setVistaActiva('detalle')}
                />
              </div>
            </div>
          ) : vistaActiva === 'chat' ? (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              {/* VISTA DESKTOP: Ambos chats en paralelo */}
              <div className="hidden md:grid grid-cols-2 gap-8 h-full max-w-[1600px] mx-auto p-4 lg:p-8">
                {/* Columna Mentor IA (Tico) */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col relative">
                  <div className="p-5 border-b-2 border-indigo-500 bg-white/95 backdrop-blur-sm shadow-sm z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                          <Brain className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">Chat con Tico</span>
                      </div>
                      <button
                        onClick={() => setShowConfigModal(true)}
                        className="p-2 hover:bg-indigo-50 text-indigo-500 rounded-xl transition-colors"
                        title="Configurar Mentor"
                      >
                        <Bot className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <MentorChat grupo={grupo} />
                  </div>
                </div>

                {/* Columna Chat Equipo */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col relative">
                  <div className="p-5 border-b-2 border-emerald-500 bg-white/95 backdrop-blur-sm shadow-sm z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-emerald-900 uppercase tracking-widest">Chat del Equipo</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ChatGrupo
                      grupoId={String(grupo.id)}
                      miembroActual="Profesor"
                      esProfesor={true}
                    />
                  </div>
                </div>
              </div>

              {/* VISTA MÓVIL: Menú de selección minimalista o chat individual */}
              <div className="md:hidden h-full flex flex-col p-4">
                {chatMode === 'menu' ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    {/* Botón Tico Minimalista */}
                    <button
                      onClick={() => setChatMode('mentor')}
                      className="w-full group bg-white border-2 border-slate-200 hover:border-indigo-500 p-8 rounded-[2.5rem] transition-all flex flex-col items-center gap-4 active:scale-95 shadow-xl hover:shadow-indigo-100"
                    >
                      <div className="p-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-lg shadow-indigo-200">
                        <Bot className="w-10 h-10" />
                      </div>
                      <div className="text-2xl font-black text-slate-800 uppercase tracking-tight">Chat con Tico</div>
                    </button>

                    {/* Botón Equipo Minimalista */}
                    <button
                      onClick={() => setChatMode('group')}
                      className="w-full group bg-white border-2 border-slate-200 hover:border-emerald-500 p-8 rounded-[2.5rem] transition-all flex flex-col items-center gap-4 active:scale-95 shadow-xl hover:shadow-emerald-100"
                    >
                      <div className="p-5 bg-emerald-500 text-white rounded-[1.5rem] shadow-lg shadow-emerald-200">
                        <Users className="w-10 h-10" />
                      </div>
                      <div className="text-2xl font-black text-slate-800 uppercase tracking-tight">Chat Equipo</div>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl relative animate-in slide-in-from-right-10 duration-500">
                    {/* Header Chat Móvil con botón Volver */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setChatMode('menu')}
                          className="p-3 bg-slate-100 text-slate-500 rounded-2xl active:scale-90 transition-all"
                          title="Volver"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl text-white shadow-sm ${chatMode === 'mentor' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                            {chatMode === 'mentor' ? <Bot className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <div className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            {chatMode === 'mentor' ? 'Chat con Tico' : 'Chat Equipo'}
                          </div>
                        </div>
                      </div>
                      {chatMode === 'mentor' && (
                        <button
                          onClick={() => setShowConfigModal(true)}
                          className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl active:rotate-12 transition-transform"
                        >
                          <Bot className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      {chatMode === 'mentor' ? (
                        <MentorChat grupo={grupo} />
                      ) : (
                        <ChatGrupo
                          grupoId={String(grupo.id)}
                          miembroActual="Profesor"
                          esProfesor={true}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recursos del Equipo</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Archivos y documentos compartidos</p>
                </div>
                <button
                  onClick={() => setModalSubirRecursoAbierto(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-all font-black text-xs shadow-lg active:scale-95 uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4" />
                  Compartir con Equipo
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <RepositorioColaborativo
                  grupo={grupo}
                  todosLosGrupos={[]}
                  proyectoId={grupo.proyecto_id}
                  esDocente={true}
                  filterByGroupId={grupo.id}
                  refreshTrigger={refreshRecursos}
                />
              </div>

              {modalSubirRecursoAbierto && (
                <ModalSubirRecurso
                  grupo={grupo}
                  proyectoId={grupo.proyecto_id}
                  onClose={() => setModalSubirRecursoAbierto(false)}
                  onSuccess={() => {
                    setModalSubirRecursoAbierto(false);
                    setRefreshRecursos(prev => prev + 1);
                  }}
                />
              )}
            </div>
          )
        )}
      </main>

      {/* Modal Configuración IA */}
      {showConfigModal && (
        <ModalConfiguracionIA
          onClose={() => setShowConfigModal(false)}
          grupo={grupo}
        />
      )}

      {/* Navegación Inferior (Móvil) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-white/90 backdrop-blur-xl border border-slate-200 p-2 flex items-center justify-around z-[100] shadow-2xl rounded-[2rem]">
        {[
          { id: 'detalle', label: 'Info', icon: Circle },
          { id: 'tareas', label: 'Tareas', icon: CheckCircle2 },
          { id: 'chat', label: 'Chats', icon: MessageSquare },
          { id: 'compartir', label: 'Docs', icon: Share2 },
          { id: 'evaluacion', label: 'Nota', icon: ClipboardList },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVistaActiva(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${vistaActiva === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400 opacity-60'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${vistaActiva === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-transparent'}`}>
              <tab.icon className={`w-5 h-5 ${vistaActiva === tab.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tight ${vistaActiva === tab.id ? 'opacity-100' : 'opacity-80'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Modal Detalle Tarea */}
      {tareaSeleccionada && (
        <ModalDetalleTarea
          tarea={tareaSeleccionada}
          grupos={[grupo]}
          onClose={() => setTareaSeleccionada(null)}
          onDelete={async (id) => {
            try {
              const { error } = await supabase.from('tareas').delete().eq('id', id);
              if (error) throw error;
              setTareasGrupo(prev => prev.filter(t => t.id !== id));
              setTareaSeleccionada(null);
              toast.success('Tarea eliminada');
            } catch {
              toast.error('Error al eliminar');
            }
          }}
          onEstadoChange={async (id, nuevoEstado, nota) => {
            try {
              const updateData: any = { estado: nuevoEstado };
              if (nota !== undefined) updateData.calificacion = nota;

              const { error } = await supabase.from('tareas').update(updateData).eq('id', id);
              if (error) throw error;
              setTareasGrupo(prev => prev.map(t => t.id === id ? { ...t, estado: nuevoEstado as any, calificacion: nota ?? t.calificacion } : t));
              setTareaSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado as any, calificacion: nota ?? prev.calificacion } : null);
              toast.success(`Estado actualizado`);
            } catch {
              toast.error('Error al cambiar el estado');
            }
          }}
        />
      )}
    </div>
  );
}

function TaskCardTeacher({ tarea, onClick, actions }: { tarea: TareaDetallada, onClick: () => void, actions?: React.ReactNode }) {
  const isCompleted = tarea.estado === 'aprobado' || tarea.estado === 'completado';
  const isRevision = tarea.estado === 'revision';

  return (
    <div 
        onClick={onClick}
        className={`group bg-white border ${isRevision ? 'border-amber-200 shadow-md shadow-amber-50' : 'border-slate-100'} p-4 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden`}
    >
        <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isCompleted ? 'bg-emerald-50 text-emerald-500' : 
                isRevision ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
            }`}>
                <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
                <h4 className={`text-xs font-black text-slate-800 leading-tight mb-1 truncate ${isCompleted ? 'line-through opacity-50' : ''}`}>
                    {tarea.titulo}
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-3 h-3" /> {tarea.puntos_maximos}
                    </span>
                    {tarea.fecha_entrega && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 
                            {new Date(tarea.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>
            </div>
            <Eye className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />
        </div>
        {actions}
    </div>
  );
}

function EmptyTaskState() {
  return (
    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-8 px-4 text-center">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Sin misiones en este sector</p>
    </div>
  );
}
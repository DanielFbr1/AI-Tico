import { ArrowLeft, CheckCircle2, Circle, Brain, Share2, MessageSquare, Users, Bot, Pencil, ClipboardList, ExternalLink, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Grupo, ProyectoFase, Criterio } from '../types';
import { EvaluacionGrupalContent } from './EvaluacionGrupalContent';
import { RepositorioColaborativo } from './RepositorioColaborativo';
import { MentorChat } from './MentorChat';
import { ChatGrupo } from './ChatGrupo';
import { RoadmapView } from './RoadmapView';
import { ModalConfiguracionIA } from './ModalConfiguracionIA';
import { LivingTree } from './LivingTree';
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

  // Asegurar que empezamos arriba al entrar al detalle
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-md sticky top-24 flex flex-col items-center justify-center min-h-[500px] h-full">
                <h3 className="absolute top-6 left-6 text-xs font-black text-slate-300 uppercase tracking-widest">Bio-Estado del Grupo</h3>
                <LivingTree
                  progress={grupo.progreso}
                  health={100}
                  size={320}
                  showLabels={true}
                  variant="satellite"
                />
                <div className="mt-4 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">En Órbita</div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          // Otros tabs
          vistaActiva === 'tareas' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {onAssignTask && (
                <div className="flex justify-end mb-6">
                  <button onClick={onAssignTask} className="flex items-center gap-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-md hover:shadow-lg active:scale-95">
                    <ClipboardList className="w-5 h-5" />
                    Asignar Nueva Tarea
                  </button>
                </div>
              )}
              <RoadmapView
                fases={fases}
                hitosGrupo={grupo.hitos || []}
                onToggleHito={() => { }}
                readOnly={true}
                layout="compact-grid"
                onDeleteHito={onDeleteHito}
              />
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
                    <MentorChat grupo={grupo} readOnly={true} />
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
            <div className="grid grid-cols-1 gap-6 animate-in fade-in">
              <RepositorioColaborativo
                grupo={grupo}
                todosLosGrupos={[]}
                proyectoId={grupo.proyecto_id}
              />
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
    </div>
  );
}
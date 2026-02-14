import { LayoutDashboard, Users, MessageSquare, ClipboardCheck, Plus, CircleHelp, Key, FolderOpen, Share2, LogOut, UserCheck, Sparkles, Pencil, Check, X, Upload, Trash2, Dices, Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import { Card_Metrica } from './Card_Metrica';
import { Card_Grupo } from './Card_Grupo';
import { InteraccionesIA } from './InteraccionesIA';
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
import { Grupo, DashboardSection, ProyectoActivo } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ModalConfiguracionIA } from './ModalConfiguracionIA';
import { ModalRevisionHitos } from './ModalRevisionHitos';
import { ModalAsignarTareas } from './ModalAsignarTareas';
import { ModalAsistencia } from './ModalAsistencia';
import { HitoGrupo } from '../types';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

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
    onUpdateProjectName
}: DashboardDocenteProps) {
    const [modalCrearGrupoAbierto, setModalCrearGrupoAbierto] = useState(false);
    const [menuAlumnosAbierto, setMenuAlumnosAbierto] = useState(false); // New state for dropdown
    const [grupoEditando, setGrupoEditando] = useState<Grupo | null>(null);
    const [mostrarCodigoSala, setMostrarCodigoSala] = useState(false);
    const [modalAjustesIAAbierto, setModalAjustesIAAbierto] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New State
    const [modalRevisionAbierto, setModalRevisionAbierto] = useState(false);
    const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
    const [grupoParaTareas, setGrupoParaTareas] = useState<Grupo | null>(null);
    const [modalAsistenciaOpen, setModalAsistenciaOpen] = useState(false);
    const [modalSubirRecursoAbierto, setModalSubirRecursoAbierto] = useState(false);
    const [modalRuletaAbierta, setModalRuletaAbierta] = useState(false);
    const [modalTicoAbierto, setModalTicoAbierto] = useState(false);
    const [alumnoParaEvaluar, setAlumnoParaEvaluar] = useState<{ nombre: string, grupo: Grupo } | null>(null);

    // Project Renaming State
    const [isEditingProjectName, setIsEditingProjectName] = useState(false);
    const [editingProjectName, setEditingProjectName] = useState('');
    const [refreshRecursos, setRefreshRecursos] = useState(0);

    const { signOut, perfil, user } = useAuth();

    const numPendientes = grupos.reduce((acc, g) =>
        acc + (g.hitos || []).filter(h => h.estado === 'revision').length, 0
    );

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

    const handleEliminarTareaGlobal = async (grupoId: string | number, hitoTitulo: string) => {
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return;

        if (!confirm(`¿Estás seguro de eliminar la tarea "${hitoTitulo}" del grupo ${grupo.nombre}?`)) return;

        try {
            const nuevosHitos = (grupo.hitos || []).filter(h => h.titulo !== hitoTitulo);

            // Recalcular progreso
            const total = nuevosHitos.length;
            const aprobados = nuevosHitos.filter(h => h.estado === 'aprobado').length;
            const nuevoProgreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;

            await onEditarGrupo(grupoId, {
                ...grupo, // Important to keep other fields
                hitos: nuevosHitos,
                progreso: nuevoProgreso
            });

            toast.success('Tarea eliminada correctamente');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Error al eliminar la tarea');
        }
    };

    const totalInteracciones = grupos.reduce((sum, g) => sum + g.interacciones_ia, 0);
    const hitosCompletados = grupos.reduce((sum, g) => sum + Math.floor(g.progreso / 20), 0);
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
                        <TicoGameWidget projectId={proyectoActual?.id} />
                    </div>
                </div>
            )}

            {/* Modal crear grupo */}
            {modalCrearGrupoAbierto && (
                <ModalCrearGrupo
                    onClose={() => setModalCrearGrupoAbierto(false)}
                    onCrear={(grupoData) => {
                        if (grupoEditando) {
                            onEditarGrupo(grupoEditando.id, grupoData);
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
                    onClose={() => setModalRevisionAbierto(false)}
                    onUpdateBatch={handleUpdateBatchMilestones}
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

            {modalAsignarAbierto && grupoParaTareas && (
                <ModalAsignarTareas
                    grupoNombre={grupoParaTareas.nombre}
                    faseId={proyectoActual?.fases?.find(f => f.estado === 'actual')?.id || '1'}
                    onClose={() => setModalAsignarAbierto(false)}
                    onSave={async (nuevosHitos) => {
                        const updatedHitos = [...(grupoParaTareas.hitos || []), ...nuevosHitos] as HitoGrupo[];
                        // Recalculate progress on new task assignment
                        const total = updatedHitos.length;
                        const aprobados = updatedHitos.filter(h => h.estado === 'aprobado').length;
                        const nuevoProgreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;

                        await onEditarGrupo(grupoParaTareas.id, {
                            ...grupoParaTareas,
                            hitos: updatedHitos,
                            progreso: nuevoProgreso
                        });
                        toast.success("Tareas asignadas correctamente");
                    }}
                />
            )}



            {/* Modal Asignar Tareas (Profesor) */}
            {grupoEditando && modalCrearGrupoAbierto === false && (
                // We use 'grupoEditando' state to track which group we are assigning tasks to (hacky reuse or new state?)
                // Better use a new state 'grupoParaTareas' or just differentiate via a boolean flag?
                // Let's reuse 'grupoEditando' but have a different boolean 'modalAsignarAbierto'.
                // Wait, I haven't added 'modalAsignarAbierto' state yet. I need to add it in the main component.
                // Since I can't add state within this replace block efficiently without context, I will skip adding the modal JSX here and do it in a Full File View/Replace or assume I added state.
                // Actually, I can add the state in a previous step? No, I must do it in one go if possible.
                // Limitation: 'replace_file_content' targets specific blocks.

                // I will ADD the state definition at the top of the file in a separate step, and then ADD the modal here.
                // For now, let's just add the modal rendering assuming state exists, but I CANNOT do that if state doesn't exist.
                // So I must add state first.

                // Step 1: Add import and state.
                // Step 2: Add modal rendering.
                // Step 3: Add trigger in Card_Grupo (prop passing).

                null
            )}

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed md:relative z-50 h-full w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="p-6 border-b border-gray-200 flex justify-center items-center relative">
                    <h2 className="text-xl font-black text-blue-600 uppercase tracking-widest">Ai Tico</h2>
                    <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400 absolute right-6">
                        <LayoutDashboard className="w-6 h-6 rotate-45" /> {/* Reuse icon as Close for speed */}
                    </button>
                </div>

                <nav className="flex-1 p-4">
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${currentSection === 'resumen'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold'
                            : 'text-gray-600 hover:bg-gray-100 font-medium'
                            }`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Progreso</span>
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



                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <ListaAlumnosEnLinea proyectoId={proyectoActual?.id} grupos={grupos} />
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
                    <div className="mt-4 px-4 text-[10px] text-gray-400 font-medium tracking-widest uppercase text-center">
                        Versión 0.3.6
                    </div>
                </div>
            </aside>

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
                                                    </h1>
                                                    <button
                                                        onClick={onCambiarProyecto}
                                                        className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                                    >
                                                        <FolderOpen className="w-3 h-3" />
                                                        Cambiar
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-600 text-white text-sm font-black px-3 py-1 rounded-lg shadow-sm tracking-wider">
                                                        CÓDIGO: <span className="text-lg">{proyectoActual.codigo_sala}</span>
                                                    </span>
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
                            {/* Texto visible solo en móvil como indicador */}
                            <div className="md:hidden font-black text-slate-800 text-sm uppercase tracking-widest">
                                {proyectoActual ? proyectoActual.nombre : 'Panel Docente'}
                            </div>
                        </div>

                        {/* Acciones en Cuadrícula 2x2 en móvil */}
                        <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                            {numPendientes > 0 && (
                                <button
                                    onClick={() => setModalRevisionAbierto(true)}
                                    className="relative flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 text-amber-600 border-2 border-amber-200 rounded-xl font-black text-[10px] uppercase tracking-tighter"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    <span>{numPendientes} {numPendientes === 1 ? 'Pendiente' : 'Pendientes'}</span>
                                </button>
                            )}

                            {/* Botón Ajustes IA Directo */}
                            <button
                                onClick={handleAjustesIA}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-100 text-purple-700 border-2 border-purple-200 hover:border-purple-400 rounded-xl font-bold transition-all text-xs"
                                title="Configurar Mentor IA"
                            >
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden lg:inline">IA</span>
                            </button>

                            <button
                                onClick={() => setModalAsistenciaOpen(true)}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 hover:border-indigo-300 rounded-xl font-bold transition-all text-xs"
                                title="Pasar lista"
                            >
                                <UserCheck className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden lg:inline">Lista</span>
                            </button>

                            {/* Botón Mascota Tico */}
                            <button
                                onClick={() => setModalTicoAbierto(true)}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 hover:border-emerald-300 rounded-xl font-bold transition-all text-xs"
                                title="Ver Mascota de clase"
                            >
                                <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden lg:inline">Tico</span>
                            </button>

                            {/* Botón Sorteo/Ruleta */}
                            <button
                                onClick={() => setModalRuletaAbierta(true)}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 text-amber-600 border-2 border-amber-100 hover:border-amber-300 rounded-xl font-bold transition-all text-xs"
                                title="Sorteo y Grupos"
                            >
                                <Dices className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden lg:inline">Ruleta</span>
                            </button>

                            {/* Botón Cerrar Sesión Directo */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-50 text-rose-600 border-2 border-rose-100 hover:border-rose-300 rounded-xl font-bold transition-all text-xs"
                            >
                                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden lg:inline">Salir</span>
                            </button>
                        </div>
                    </div>



                </header>

                {/* Main scroll area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {currentSection === 'resumen' && (
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

                                {/* COLUMNA IZQUIERDA: TABLERO DE MISIONES (MAIN) */}
                                <div className="xl:col-span-3 space-y-8 order-2 xl:order-1">

                                    {/* TABLERO GLOBAL DE TAREAS */}
                                    <div className="bg-slate-100 rounded-[2.5rem] p-4 md:p-8 border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm text-indigo-600">
                                                <ClipboardCheck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                                    Tablero Global de Misiones
                                                    <span className="bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full border border-indigo-200">
                                                        {grupos.reduce((acc, g) => acc + (g.hitos?.length || 0), 0)} Tareas Totales
                                                    </span>
                                                </h2>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seguimiento de todas las tareas activas</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* COLUMNA PENDIENTES */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest">En Revisión / Pendientes</h3>
                                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        {grupos.reduce((acc, g) => acc + (g.hitos || []).filter(h => h.estado === 'revision' || h.estado === 'propuesto').length, 0)}
                                                    </span>
                                                </div>
                                                <div className="space-y-3 bg-slate-200/50 p-4 rounded-2xl min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar">
                                                    {grupos.flatMap(g => (g.hitos || []).filter(h => h.estado === 'revision' || h.estado === 'propuesto').map(h => ({ ...h, grupoNombre: g.nombre, grupoId: g.id }))).map((task, idx) => (
                                                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider truncate max-w-[120px]">{task.grupoNombre}</span>
                                                                <div className="flex items-center gap-1">
                                                                    {task.estado === 'revision' && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Pendiente de revisión"></span>}
                                                                    <button onClick={() => handleEliminarTareaGlobal(task.grupoId, task.titulo)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Eliminar tarea">
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-700 leading-tight">{task.titulo}</p>
                                                        </div>
                                                    ))}
                                                    {grupos.every(g => (g.hitos || []).filter(h => h.estado === 'revision' || h.estado === 'propuesto').length === 0) && (
                                                        <div className="text-center py-8 text-slate-400 text-xs italic font-medium">No hay tareas pendientes</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* COLUMNA EN CURSO */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest">En Curso</h3>
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        {grupos.reduce((acc, g) => acc + (g.hitos || []).filter(h => h.estado === 'en_progreso' || h.estado === 'pendiente').length, 0)}
                                                    </span>
                                                </div>
                                                <div className="space-y-3 bg-slate-200/50 p-4 rounded-2xl min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar">
                                                    {grupos.flatMap(g => (g.hitos || []).filter(h => h.estado === 'en_progreso' || h.estado === 'pendiente').map(h => ({ ...h, grupoNombre: g.nombre, grupoId: g.id }))).map((task, idx) => (
                                                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                                <span className="bg-slate-50 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider truncate max-w-[120px]">{task.grupoNombre}</span>
                                                                <button onClick={() => handleEliminarTareaGlobal(task.grupoId, task.titulo)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Eliminar tarea">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-700 leading-tight pl-2">{task.titulo}</p>
                                                        </div>
                                                    ))}
                                                    {grupos.every(g => (g.hitos || []).filter(h => h.estado === 'en_progreso' || h.estado === 'pendiente').length === 0) && (
                                                        <div className="text-center py-8 text-slate-400 text-xs italic font-medium">Todo tranquilo por aquí</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* COLUMNA COMPLETADAS */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Completadas</h3>
                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        {grupos.reduce((acc, g) => acc + (g.hitos || []).filter(h => h.estado === 'aprobado').length, 0)}
                                                    </span>
                                                </div>
                                                <div className="space-y-3 bg-slate-200/50 p-4 rounded-2xl min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar">
                                                    {grupos.flatMap(g => (g.hitos || []).filter(h => h.estado === 'aprobado').map(h => ({ ...h, grupoNombre: g.nombre, grupoId: g.id }))).map((task, idx) => (
                                                        <div key={idx} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 opacity-80 hover:opacity-100 transition-all group relative">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="bg-white text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider truncate max-w-[120px] border border-emerald-100">{task.grupoNombre}</span>
                                                                <button onClick={() => handleEliminarTareaGlobal(task.grupoId, task.titulo)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Eliminar tarea">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <p className="text-sm font-bold text-emerald-800 leading-tight line-through decoration-emerald-500/50">{task.titulo}</p>
                                                        </div>
                                                    ))}
                                                    {grupos.every(g => (g.hitos || []).filter(h => h.estado === 'aprobado').length === 0) && (
                                                        <div className="text-center py-8 text-slate-400 text-xs italic font-medium">Aún no hay logros desbloqueados</div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                </div>

                                {/* COLUMNA DERECHA: BIO-ESTADO (STICKY SIDEBAR) */}
                                <div className="xl:col-span-1 order-1 xl:order-2 space-y-6">

                                    {/* Living Tree Card - Minimalist Version */}
                                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden sticky top-24 p-6 flex flex-col items-center min-h-[500px] justify-center">
                                        <div className="relative w-48 h-48 -my-4">
                                            <LivingTree
                                                progress={grupos.reduce((acc, g) => acc + g.progreso, 0) / grupos.length}
                                                health={100}
                                                size={200}
                                                showLabels={false}
                                            />
                                        </div>

                                        <div className="mt-8 text-center">
                                            <div className="text-3xl font-black text-blue-600">{(grupos.reduce((acc, g) => acc + g.progreso, 0) / grupos.length).toFixed(0)}%</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crecimiento Global</div>
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
                                    <button onClick={() => setModalCrearGrupoAbierto(true)} className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-4 md:py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                                        <Plus className="w-5 h-5" />
                                        Crear nuevo grupo
                                    </button>
                                </div>

                                {/* Simple Grid View (No Departments) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {grupos.map(grupo => (
                                        <Card_Grupo
                                            key={grupo.id}
                                            grupo={grupo}
                                            onClick={() => onSelectGrupo(grupo)}
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

                        {currentSection === 'interacciones' && <InteraccionesIA grupos={grupos} onSelectGrupo={onSelectGrupo} />}

                        {currentSection === 'trabajo-compartido' && (
                            <div className="relative">
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => setModalSubirRecursoAbierto(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                    >
                                        <Upload className="w-4 h-4" />
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
                                        onClose={() => setModalSubirRecursoAbierto(false)}
                                        onSuccess={() => {
                                            setModalSubirRecursoAbierto(false);
                                            setRefreshRecursos(prev => prev + 1);
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {currentSection === 'evaluacion' && <EvaluacionRubricas grupos={grupos} rubrica={proyectoActual?.rubrica} proyectoId={proyectoActual?.id} />}
                    </div>
                </div>
            </div >

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
            )
            }

            {/* Modal Evaluación Individual */}
            {alumnoParaEvaluar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
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
        </div >
    );
}
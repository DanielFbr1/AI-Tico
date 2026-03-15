import { LayoutList, Users, MessageSquare, ClipboardCheck, Plus, CircleHelp, Key, FolderOpen, Share2, LogOut, UserCheck, Sparkles, Pencil, Check, X, Upload, Trash2, Dices, Gamepad2, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
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
import { getAsignaturaStyles } from '../data/asignaturas';
import { ModalChatAlumnosDocente } from './ModalChatAlumnosDocente';

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
    hideSidebar = false
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
    const [modalTicoAbierto, setModalTicoAbierto] = useState(false);
    const [alumnoParaEvaluar, setAlumnoParaEvaluar] = useState<{ nombre: string, grupo: Grupo } | null>(null);
    const [unreadStudentMessages, setUnreadStudentMessages] = useState(0);
    const [unreadFamilyMessages, setUnreadFamilyMessages] = useState(0);

    // Project Renaming State
    const [isEditingProjectName, setIsEditingProjectName] = useState(false);
    const [editingProjectName, setEditingProjectName] = useState('');
    const [refreshRecursos, setRefreshRecursos] = useState(0);

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

            fetchUnreadStudentMessages();
            fetchUnreadFamilyMessages();

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
        }

        return () => {
            if (studentSub) {
                supabase.removeChannel(studentSub);
            }
            if (familySub) {
                supabase.removeChannel(familySub);
            }
        };
    }, [user]);

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

    const handleEliminarTareaGlobal = async (grupoId: string | number, hitoId: string) => {
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return;

        const hito = grupo.hitos?.find(h => h.id === hitoId);
        if (!hito) return;

        if (!confirm(`¿Estás seguro de eliminar la tarea "${hito.titulo}" del grupo ${grupo.nombre}?`)) return;

        try {
            const nuevosHitos = (grupo.hitos || []).filter(h => h.id !== hitoId);

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
                    faseId={proyectoActual?.fases?.find(f => f.estado === 'actual')?.id || proyectoActual?.fases?.[0]?.id || '1'}
                    proyectoContexto={proyectoActual?.descripcion}
                    onClose={() => setModalAsignarAbierto(false)}
                    onSave={async (nuevosHitos) => {
                        const updatedHitos = [...(grupoParaTareas.hitos || []), ...nuevosHitos] as HitoGrupo[];
                        // Recalculate progress on new task assignment
                        const total = updatedHitos.length;
                        const aprobados = updatedHitos.filter(h => h.estado === 'aprobado').length;
                        const nuevoProgreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;
                        const nuevoEstado = nuevoProgreso === 100 && total > 0 ? 'Completado' : 'En progreso';

                        await onEditarGrupo(grupoParaTareas.id, {
                            ...grupoParaTareas,
                            hitos: updatedHitos,
                            progreso: nuevoProgreso,
                            estado: nuevoEstado
                        });
                        toast.success("Tareas asignadas correctamente");
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
                    <div className="p-6 border-b border-gray-200 flex justify-center items-center relative">
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${currentSection === 'resumen'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold'
                                    : 'text-gray-600 hover:bg-gray-100 font-medium'
                                    }`}
                            >
                                <LayoutList className="w-5 h-5" />
                                <span>Tareas</span>
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
                        <div className="mt-4 px-4 text-[10px] text-gray-400 font-medium tracking-widest uppercase text-center">
                            v3.6.3 (Audio Fix)
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
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Sala: {proyectoActual?.codigo_sala}</span>
                            </div>
                        </div>

                        {/* Acciones en Cuadrícula en móvil */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex items-center gap-2 w-full md:w-auto">
                            {numPendientes > 0 && (
                                <button
                                    onClick={() => setModalRevisionAbierto(true)}
                                    className="relative flex items-center justify-center gap-2 px-3 py-2.5 md:py-3 bg-amber-50 text-amber-600 border-2 border-amber-200 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-tighter"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    <span>{numPendientes} {numPendientes === 1 ? 'Pendiente' : 'Pendientes'}</span>
                                </button>
                            )}

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
                                                                    <button onClick={() => handleEliminarTareaGlobal(task.grupoId, task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Eliminar tarea">
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
                                                                <button onClick={() => handleEliminarTareaGlobal(task.grupoId, task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Eliminar tarea">
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
                                                                <button onClick={() => handleEliminarTareaGlobal(task.grupoId, task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Eliminar tarea">
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

                                    {/* Living Tree Card - Rocket Version */}
                                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden sticky top-24 p-6 flex flex-col items-center min-h-[500px] justify-center relative">
                                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-50/50 to-transparent rounded-t-[2rem] pointer-events-none"></div>
                                        <h3 className="absolute top-6 left-6 text-xs font-black text-slate-400 uppercase tracking-widest z-10">Progreso Global</h3>

                                        <div className="relative w-full flex justify-center -my-4 z-10 transform hover:-translate-y-2 transition-transform duration-500">
                                            <LivingTree
                                                progress={grupos.reduce((acc, g) => acc + g.progreso, 0) / (grupos.length || 1)}
                                                health={100}
                                                size={300}
                                                showLabels={false}
                                                variant="nexus"
                                            />
                                        </div>

                                        <div className="mt-12 text-center relative z-10 w-full">
                                            <div className="text-4xl font-black text-indigo-600 mb-1">{(grupos.reduce((acc, g) => acc + g.progreso, 0) / (grupos.length || 1)).toFixed(0)}%</div>
                                            <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest bg-indigo-50 py-1.5 px-3 rounded-full box-border border border-indigo-100 inline-block">Misión Espacial</div>
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
            {!modalCrearGrupoAbierto && !modalAsignarAbierto && !modalRevisionAbierto && !modalAsistenciaOpen && !modalAjustesIAAbierto && !alumnoParaEvaluar && (
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
                            <Share2 className={`w-5 h-5 ${currentSection === 'trabajo-compartido' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${currentSection === 'trabajo-compartido' ? 'opacity-100' : 'opacity-80'}`}>Trabajo</span>
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
                </nav>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Proyecto, Organizacion } from '../types';
import { Layout, ArrowRight, Users, Key, Plus, Loader2, Sparkles, LogOut, RefreshCw, Trash2, Folder, BookOpen, GraduationCap, School, Search, X, MessageCircle, ChevronLeft } from 'lucide-react';
import { PROYECTOS_MOCK } from '../data/mockData';
import { ModalCrearProyecto } from '../components/ModalCrearProyecto';
import { MensajesFamiliasProfesor } from '../components/MensajesFamiliasProfesor';
import { getAsignaturaStyles } from '../data/asignaturas';
import { ModalChatAlumnosDocente } from '../components/ModalChatAlumnosDocente';
import { Grupo } from '../types';

interface ProjectsDashboardProps {
    onSelectProject: (proyecto: Proyecto) => void;
}

import { useAuth } from '../context/AuthContext';

export function ProjectsDashboard({ onSelectProject }: ProjectsDashboardProps) {
    const { signOut: authSignOut, session } = useAuth();
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [showModalProyecto, setShowModalProyecto] = useState(false);
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [showMensajesFamilias, setShowMensajesFamilias] = useState(false);
    const [unreadFamilyMessages, setUnreadFamilyMessages] = useState(0);
    const [showModalChatAlumnos, setShowModalChatAlumnos] = useState(false);
    const [unreadStudentMessages, setUnreadStudentMessages] = useState(0);

    const [todosMisGrupos, setTodosMisGrupos] = useState<Grupo[]>([]);

    const [filtroColegio, setFiltroColegio] = useState('');
    const [filtroCurso, setFiltroCurso] = useState('');
    const [filtroClase, setFiltroClase] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState('');

    const proyectosFiltrados = proyectos.filter(p => {
        const matchTexto = p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase());

        const matchColegio = !filtroColegio || (p.colegio && p.colegio === filtroColegio);
        const matchCurso = !filtroCurso || (p.curso && p.curso === filtroCurso);
        const matchClase = !filtroClase || (p.clase && p.clase === filtroClase);
        const matchEtapa = !filtroEtapa || (p.etapa && p.etapa === filtroEtapa);

        return matchTexto && matchColegio && matchCurso && matchClase && matchEtapa;
    });

    const colegiosExistentes = Array.from(new Set(proyectos.map(p => p.colegio).filter(Boolean))) as string[];
    const cursosExistentes = Array.from(new Set(proyectos.map(p => p.curso).filter(Boolean))) as string[];
    const etapasExistentes = Array.from(new Set(proyectos.map(p => p.etapa).filter(Boolean))) as string[];
    const clasesExistentes = Array.from(new Set(proyectos.map(p => p.clase).filter(Boolean))) as string[];

    useEffect(() => {
        fetchProyectos();
        fetchUnreadFamilyMessages();
    }, []);

    const [recentProjects, setRecentProjects] = useState<Record<string, number>>({});

    useEffect(() => {
        if (session?.user?.id) {
            try {
                const stored = localStorage.getItem(`recent_projects_${session.user.id}`);
                if (stored) {
                    setRecentProjects(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Error loading recent projects", e);
            }
        }
    }, [session?.user?.id]);

    const handleProjectClick = (proyecto: Proyecto) => {
        if (session?.user?.id) {
            const updated = { ...recentProjects, [proyecto.id]: Date.now() };
            localStorage.setItem(`recent_projects_${session.user.id}`, JSON.stringify(updated));
        }
        onSelectProject(proyecto);
    };

    const fetchUnreadFamilyMessages = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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

    useEffect(() => {
        const setupMessageSubscriptions = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const savedId = user?.id;

            if (savedId) {
                // Initial fetch for student messages
                const { count: studentCount, error: countStudentError } = await supabase
                    .from('mensajes_profesor_alumno')
                    .select('*', { count: 'exact', head: true })
                    .eq('profesor_user_id', savedId)
                    .neq('sender_id', savedId)
                    .eq('leido', false);

                if (!countStudentError) {
                    setUnreadStudentMessages(studentCount || 0);
                }

                // Suscripciones
                const subscriptionFamilies = supabase.channel(`mensajes_familia_profesor`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'mensajes_familia_profesor',
                        filter: `profesor_user_id=eq.${savedId}` // Corrected filter to profesor_user_id
                    }, payload => {
                        const newMsg = payload.new as any;
                        if (payload.eventType === 'INSERT' && newMsg && !newMsg.leido && newMsg.sender_id !== savedId) {
                            setUnreadFamilyMessages(prev => prev + 1);
                        } else if (payload.eventType === 'UPDATE') {
                            // Re-fetch count simply to keep synced if states change to read
                            supabase
                                .from('mensajes_familia_profesor')
                                .select('*', { count: 'exact', head: true })
                                .eq('profesor_user_id', savedId) // Corrected filter to profesor_user_id
                                .eq('leido', false)
                                .then(({ count }) => {
                                    setUnreadFamilyMessages(count || 0);
                                });
                        }
                    })
                    .subscribe();

                const subscriptionStudents = supabase.channel(`mensajes_profesor_alumno`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'mensajes_profesor_alumno',
                        filter: `profesor_user_id=eq.${savedId}`
                    }, payload => {
                        const newMsg = payload.new as any;
                        if (payload.eventType === 'INSERT' && newMsg && !newMsg.leido && newMsg.sender_id !== savedId) {
                            setUnreadStudentMessages(prev => prev + 1);
                        } else if (payload.eventType === 'UPDATE') {
                            supabase
                                .from('mensajes_profesor_alumno')
                                .select('*', { count: 'exact', head: true })
                                .eq('profesor_user_id', savedId)
                                .neq('sender_id', savedId)
                                .eq('leido', false)
                                .then(({ count }) => setUnreadStudentMessages(count || 0));
                        }
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(subscriptionFamilies);
                    supabase.removeChannel(subscriptionStudents);
                };
            }
        };

        setupMessageSubscriptions();
    }, [session?.user?.id]);


    const fetchProyectos = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            console.log("🔍 DEBUG: ProjectsDashboard User:", user?.id, user?.email);

            if (!user) return;

            const { data, error } = await supabase
                .from('proyectos')
                .select('*')
                .eq('created_by', user.id) // Filter by owner explicitly
                .order('created_at', { ascending: false });

            console.log("🔍 DEBUG: Fetched Projects for User:", user.id, data);

            if (error) throw error;
            setProyectos(data || []);

            if (data && data.length > 0) {
                const { data: gruposData } = await supabase
                    .from('grupos')
                    .select('*')
                    .in('proyecto_id', data.map(p => p.id));

                if (gruposData) {
                    setTodosMisGrupos(gruposData as Grupo[]);
                }
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCrearProyecto = async (nuevoProyecto: Omit<Proyecto, 'id' | 'grupos'>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('proyectos')
                .insert([{ ...nuevoProyecto, created_by: user?.id }]);

            if (error) throw error;
            await fetchProyectos();
        } catch (err: any) {
            console.error('Error creating project:', err);
            alert(`Error al crear el proyecto: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string, nombre: string) => {
        e.stopPropagation();
        if (!confirm(`¿Estás seguro de que quieres eliminar el proyecto "${nombre}"? Esta acción no se puede deshacer.`)) return;

        try {
            const { error } = await supabase
                .from('proyectos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProyectos(proyectos.filter(p => p.id !== id));
        } catch (err: any) {
            console.error('Error deleting project:', err);
            alert(`Error al eliminar el proyecto: ${err.message}`);
        }
    };

    const handleLoadSamples = async () => {
        if (!confirm('¿Quieres cargar los proyectos de ejemplo? Esto poblará tu base de datos con contenido de prueba.')) return;

        setIsSeeding(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            for (const p of PROYECTOS_MOCK) {
                const { data: projectData, error: projectError } = await supabase
                    .from('proyectos')
                    .insert([{
                        nombre: p.nombre,
                        descripcion: p.descripcion,
                        tipo: p.tipo,
                        estado: p.estado,
                        codigo_sala: p.codigo_sala,
                        clase: p.clase || '5.º Primaria - A',
                        created_by: user.id,
                        fases: p.fases
                    }])
                    .select()
                    .single();

                if (projectError) throw projectError;

                if (p.grupos && p.grupos.length > 0) {
                    const groupsToInsert = p.grupos.map(g => ({
                        nombre: g.nombre,
                        // departamento: g.departamento, // Removed
                        miembros: g.miembros,
                        progreso: g.progreso,
                        estado: g.estado,
                        interacciones_ia: g.interacciones_ia,
                        proyecto_id: projectData.id
                    }));

                    const { error: groupError } = await supabase
                        .from('grupos')
                        .insert(groupsToInsert);

                    if (groupError) console.error('Error seeding groups for project:', projectData.nombre, groupError);
                }
            }

            await fetchProyectos();
            alert('¡Proyectos y grupos de ejemplo cargados con éxito!');
        } catch (err: any) {
            console.error('Error seeding samples:', err);
            alert(`Hubo un error al cargar los ejemplos: ${err.message}`);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleLogout = async () => {
        await authSignOut();
    };

    const proyectosPorClase = proyectos.reduce((acc, p) => {
        const clase = p.clase || 'Sin Clase';
        if (!acc[clase]) acc[clase] = [];
        acc[clase].push(p);
        return acc;
    }, {} as Record<string, Proyecto[]>);

    const normalizeClassName = (name: string) => {
        if (!name) return 'Sin Clase';
        // Normalize: "1.º Primaria", "1º", "1" -> "1º"
        const match = name.match(/(\d+)/);
        if (match) return `${match[1]}º`;
        return name.trim().toUpperCase();
    };

    const getClaseStyles = (clase: string) => {
        const normalized = normalizeClassName(clase);
        if (normalized.startsWith('1º') || normalized.startsWith('2º')) return {
            header: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            bg: 'bg-emerald-500',
            light: 'bg-emerald-50'
        };
        if (normalized.startsWith('3º') || normalized.startsWith('4º')) return {
            header: 'bg-orange-50 border-orange-200 text-orange-700',
            bg: 'bg-orange-500',
            light: 'bg-orange-50'
        };
        if (normalized.startsWith('5º')) return {
            header: 'bg-blue-50 border-blue-200 text-blue-700',
            bg: 'bg-blue-500',
            light: 'bg-blue-50'
        };
        if (normalized.startsWith('6º')) return {
            header: 'bg-purple-50 border-purple-200 text-purple-700',
            bg: 'bg-purple-500',
            light: 'bg-purple-50'
        };
        return {
            header: 'bg-slate-50 border-slate-200 text-slate-700',
            bg: 'bg-slate-500',
            light: 'bg-slate-50'
        };
    };

    const getClaseIcon = (clase: string) => {
        const normalized = normalizeClassName(clase);
        if (normalized.startsWith('1º') || normalized.startsWith('2º')) return <School className="w-5 h-5" />;
        if (normalized.startsWith('3º') || normalized.startsWith('4º')) return <School className="w-5 h-5" />;
        if (normalized.startsWith('5º')) return <School className="w-5 h-5" />;
        if (normalized.startsWith('6º')) return <GraduationCap className="w-5 h-5" />;
        return <Folder className="w-5 h-5" />;
    };

    // Show family messages panel
    if (showMensajesFamilias) {
        return (
            <MensajesFamiliasProfesor
                profesorId={session?.user?.id || ''}
                profesorNombre={session?.user?.email?.split('@')[0] || 'Profesor'}
                onBack={() => { setShowMensajesFamilias(false); fetchUnreadFamilyMessages(); }}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando proyectos...</p>
                </div>
            </div>
        );
    }

    const getProjectScore = (p: Proyecto) => recentProjects[p.id] || 0;

    const orderedClasses = Object.entries(
        proyectosFiltrados.reduce((acc, p) => {
            const normalized = normalizeClassName(p.clase || '');
            if (!acc[normalized]) acc[normalized] = [];
            acc[normalized].push(p);
            return acc;
        }, {} as Record<string, Proyecto[]>)
    )
        .map(([clase, proyectosClase]) => {
            // Sort projects within class: recently opened first, then by name
            proyectosClase.sort((a, b) => {
                const scoreA = getProjectScore(a);
                const scoreB = getProjectScore(b);
                if (scoreA !== scoreB) return scoreB - scoreA;
                return a.nombre.localeCompare(b.nombre);
            });

            // The max score of the class is the score of its recently opened project
            const maxScore = proyectosClase.length > 0 ? getProjectScore(proyectosClase[0]) : 0;
            return { clase, proyectosClase, maxScore };
        })
        .sort((a, b) => {
            if (a.maxScore !== b.maxScore) return b.maxScore - a.maxScore;
            return a.clase.localeCompare(b.clase);
        });


    return (
        <div className="min-h-screen bg-[#fcfdff] p-4 md:p-8 font-sans overflow-x-hidden">
            <header className="mb-6 md:mb-12 max-w-7xl mx-auto">
                <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100/50 sticky top-0 z-50">
                    <div className="flex items-center gap-2 md:gap-5 min-w-0">
                        <div className="w-9 h-9 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 border-2 border-blue-100 shrink-0">
                            <Layout className="w-4 h-4 md:w-7 md:h-7" />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="text-base md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1 truncate">
                                Tus Proyectos
                            </h1>
                            <p className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1 md:gap-2">
                                <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {proyectos.length} proyectos en total
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMensajesFamilias(true)}
                            className="relative flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl md:rounded-2xl font-black transition-all border-2 border-emerald-200 hover:border-emerald-400 shadow-sm"
                            title="Mensajes de Familias"
                        >
                            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-[10px] md:text-xs uppercase tracking-widest hidden md:inline">Familias</span>
                            {unreadFamilyMessages > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    {unreadFamilyMessages}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowModalChatAlumnos(true)}
                            className="relative flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 rounded-xl md:rounded-2xl font-black transition-all border-2 border-fuchsia-200 hover:border-fuchsia-400 shadow-sm"
                            title="Chat con Alumnos"
                        >
                            <Users className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-[10px] md:text-xs uppercase tracking-widest hidden sm:inline">Alumnos</span>
                            {unreadStudentMessages > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    {unreadStudentMessages}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowModalProyecto(true)}
                            className="relative flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl md:rounded-2xl font-black transition-all shadow-md shadow-blue-200"
                            title="Crear Nuevo Proyecto"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-[10px] md:text-xs uppercase tracking-widest hidden md:inline">Nuevo</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 md:p-3.5 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl md:rounded-2xl transition-all border border-transparent"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

                {/* Barra de Búsqueda / Filtro Avanzado */}
                <div className="mt-4 md:mt-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50 flex flex-col gap-4">
                    <div className="relative group w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar proyecto por nombre..."
                            value={filtroBusqueda}
                            onChange={(e) => setFiltroBusqueda(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                        {filtroBusqueda && (
                            <button
                                onClick={() => setFiltroBusqueda('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <select
                            value={filtroColegio}
                            onChange={(e) => setFiltroColegio(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Colegio: Todos</option>
                            {colegiosExistentes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={filtroEtapa}
                            onChange={(e) => setFiltroEtapa(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Etapa: Todas</option>
                            {etapasExistentes.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <select
                            value={filtroCurso}
                            onChange={(e) => setFiltroCurso(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Curso (Año): Todos</option>
                            {cursosExistentes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={filtroClase}
                            onChange={(e) => setFiltroClase(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Clase: Todas</option>
                            {clasesExistentes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </header>


            <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
                {orderedClasses.length > 0 ? (
                    orderedClasses.map(({ clase, proyectosClase }) => (
                        <section key={clase} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0 ${getClaseStyles(clase).header}`}>
                                        {getClaseIcon(clase)}
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase whitespace-nowrap">{clase}</h2>
                                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                            {proyectosClase.length} {proyectosClase.length === 1 ? 'Proyecto' : 'Proyectos'}
                                        </span>
                                    </div>
                                </div>

                                <div className="hidden md:block h-[2px] flex-1 bg-slate-100 ml-4"></div>
                                <span className="hidden md:block text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">
                                    {proyectosClase.length} {proyectosClase.length === 1 ? 'PROYECTO' : 'PROYECTOS'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {proyectosClase
                                    .filter(p => p.created_by === session?.user?.id)
                                    .map((proyecto) => {
                                        const asigStyles = getAsignaturaStyles(proyecto.asignatura);
                                        return (
                                            <div
                                                key={proyecto.id}
                                                onClick={() => handleProjectClick(proyecto)}
                                                className={`group relative ${proyecto.asignatura ? asigStyles.lightBgClass : 'bg-white'} rounded-[1.25rem] p-8 flex flex-col border-2 ${asigStyles.borderClass} hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden`}
                                            >
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest border
                                                        ${proyecto.estado === 'En curso' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            proyecto.estado === 'Finalizado' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {proyecto.estado}
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleDeleteProject(e, proyecto.id, proyecto.nombre)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex flex-col mb-4 relative z-10">
                                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight leading-tight">{proyecto.nombre}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-slate-400 font-medium text-[11px] uppercase tracking-widest opacity-70">{proyecto.tipo}</p>
                                                        {proyecto.asignatura && (
                                                            <>
                                                                <span className="text-slate-200">•</span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${asigStyles.textClass}`}>
                                                                    {proyecto.asignatura}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-slate-500 font-medium text-sm mb-8 line-clamp-2 leading-relaxed relative z-10">{proyecto.descripcion}</p>

                                                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-slate-50 rounded-lg">
                                                            <Users className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestionar</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 font-bold text-[10px] text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 group-hover:bg-blue-100 transition-colors tracking-widest uppercase">
                                                        <Key className="w-3 h-3" />
                                                        {proyecto.codigo_sala}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 border-2 border-blue-100 shadow-lg shadow-blue-100/50 relative z-10 animate-in zoom-in duration-500">
                            <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
                        </div>

                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter relative z-10">Tu Aula Virtual está lista</h2>
                        <p className="text-slate-400 max-w-md mb-12 text-sm font-bold uppercase tracking-widest leading-loose relative z-10">
                            Solo falta la chispa. Carga los datos de demostración para ver la magia en acción.
                        </p>

                        <button
                            onClick={handleLoadSamples}
                            disabled={isSeeding}
                            className="relative z-10 flex items-center gap-4 px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-300 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-sm group/btn overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                            {isSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-yellow-300" />}
                            {isSeeding ? 'Configurando Aula...' : 'Cargar Proyecto Demo'}
                        </button>
                    </div>
                )}
            </div>

            {showModalProyecto && (
                <ModalCrearProyecto
                    onClose={() => setShowModalProyecto(false)}
                    onCrear={handleCrearProyecto}
                    nombreUsuario={session?.user?.email || 'Docente'}
                    clasesExistentes={clasesExistentes}
                />
            )}

            {showModalChatAlumnos && (
                <ModalChatAlumnosDocente
                    isOpen={showModalChatAlumnos}
                    onClose={() => setShowModalChatAlumnos(false)}
                    docenteId={session?.user?.id || 'profesor'}
                    docenteNombre={session?.user?.email?.split('@')[0] || 'Docente'}
                    grupos={todosMisGrupos}
                />
            )}
        </div>
    );
}


import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Proyecto } from '../types';
import { Layout, ArrowRight, Users, Key, Plus, Loader2, Sparkles, LogOut, RefreshCw, Trash2, Folder, BookOpen, GraduationCap, School, Search, X } from 'lucide-react';
import { PROYECTOS_MOCK } from '../data/mockData';
import { ModalCrearProyecto } from '../components/ModalCrearProyecto';

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

    const proyectosFiltrados = proyectos.filter(p =>
        p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        (p.clase || '').toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        p.tipo.toLowerCase().includes(filtroBusqueda.toLowerCase())
    );

    const clasesExistentes = Array.from(new Set(proyectos.map(p => p.clase).filter(Boolean))) as string[];

    useEffect(() => {
        fetchProyectos();
    }, []);

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

    return (
        <div className="min-h-screen bg-[#fcfdff] p-4 md:p-8 font-sans overflow-x-hidden">
            <header className="mb-6 md:mb-12 max-w-7xl mx-auto">
                <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100/50 sticky top-0 z-50">
                    <div className="flex items-center gap-2 md:gap-5 min-w-0">
                        <div className="w-9 h-9 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 border-2 border-blue-100 shrink-0">
                            <Layout className="w-4 h-4 md:w-7 md:h-7" />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="text-base md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1 truncate">Proyectos</h1>
                            <p className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1 md:gap-2">
                                <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {proyectos.length} total
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowModalProyecto(true)}
                            className="flex items-center justify-center gap-2 px-4 md:px-7 py-2.5 md:py-3.5 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all text-[10px] md:text-sm uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Nuevo</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 md:p-3.5 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl md:rounded-2xl transition-all border border-transparent"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

                {/* Barra de Búsqueda / Filtro */}
                <div className="mt-4 md:mt-6 max-w-2xl mx-auto px-1">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar clase o proyecto..."
                            value={filtroBusqueda}
                            onChange={(e) => setFiltroBusqueda(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 md:py-3.5 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-[13px] md:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        />
                        {filtroBusqueda && (
                            <button
                                onClick={() => setFiltroBusqueda('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>


            <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
                {proyectosFiltrados.length > 0 ? (
                    Object.entries(
                        proyectosFiltrados.reduce((acc, p) => {
                            const normalized = normalizeClassName(p.clase || '');
                            if (!acc[normalized]) acc[normalized] = [];
                            acc[normalized].push(p);
                            return acc;
                        }, {} as Record<string, Proyecto[]>)
                    ).map(([clase, proyectosClase]) => (
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
                                {proyectosClase.filter(p => p.created_by === session?.user?.id).map((proyecto) => (
                                    <div
                                        key={proyecto.id}
                                        onClick={() => onSelectProject(proyecto)}
                                        className="group relative bg-white rounded-[1.25rem] p-8 flex flex-col border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
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
                                            <p className="text-slate-400 font-medium text-[11px] uppercase tracking-widest mt-1 opacity-70">{proyecto.tipo}</p>
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
                                ))}
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
        </div>
    );
}


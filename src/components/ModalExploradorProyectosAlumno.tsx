import React, { useState, useMemo } from 'react';
import {
    X,
    Search,
    Filter,
    GraduationCap,
    School,
    BookOpen,
    Users,
    ChevronRight,
    FolderOpen,
    Key
} from 'lucide-react';
import { getAsignaturaStyles } from '../data/asignaturas';

// Array estático eliminado, los años vendrán de los propios proyectos del alumno

// Asignaturas comunes
const ASIGNATURAS_COMUNES = [
    "Matemáticas",
    "Lengua y Literatura",
    "Biología y Geología",
    "Física y Química",
    "Geografía e Historia",
    "Inglés",
    "Educación Plástica, Visual y Audiovisual",
    "Tecnología y Digitalización",
    "Música",
    "Filosofía"
];

interface ProjectData {
    id: string;
    nombre: string;
    codigo: string;
    asignatura: string;
    curso: string;
    grupo_interno_id: number;
    orden_reciente: number;
}

interface ModalExploradorProyectosAlumnoProps {
    proyectos: ProjectData[];
    onClose: () => void;
    onSelectProject: (proyecto: ProjectData) => void;
    alumnoId: string;
    proyectoActualId?: string;
}

export function ModalExploradorProyectosAlumno({
    proyectos,
    onClose,
    onSelectProject,
    alumnoId,
    proyectoActualId
}: ModalExploradorProyectosAlumnoProps) {
    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [cursoFilter, setCursoFilter] = useState('');
    const [asignaturaFilter, setAsignaturaFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Derivar listas únicas para los selectores a partir de los proyectos donde estoy
    const cursosUnicos = useMemo(() => {
        const anosEnMisProyectos = new Set(proyectos.map(p => p.curso).filter(c => c && c !== 'Sin Curso'));
        return Array.from(anosEnMisProyectos).sort((a, b) => b.localeCompare(a)); // Más recientes primero
    }, [proyectos]);

    const asignaturasUnicas = useMemo(() => {
        const asignaturasEnMisProyectos = new Set(proyectos.map(p => p.asignatura).filter(a => a));
        return Array.from(new Set([...ASIGNATURAS_COMUNES, ...asignaturasEnMisProyectos])).sort();
    }, [proyectos]);

    // Filtrado de proyectos
    const filteredProjects = useMemo(() => {
        return proyectos.filter(proyecto => {
            // 1. Match de búsqueda de texto (nombre proyecto, código o asignatura)
            const matchesSearch = searchTerm === '' ||
                proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                proyecto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (proyecto.asignatura || '').toLowerCase().includes(searchTerm.toLowerCase());

            // 2. Filtro de Curso
            const matchesCurso = cursoFilter === '' || proyecto.curso === cursoFilter;

            // 3. Filtro de Asignatura
            const matchesAsignatura = asignaturaFilter === '' || proyecto.asignatura === asignaturaFilter;

            return matchesSearch && matchesCurso && matchesAsignatura;
        });
    }, [proyectos, searchTerm, cursoFilter, asignaturaFilter]);

    // Agrupación para pintarlos por curso
    const groupedProjects = useMemo(() => {
        const groups: Record<string, ProjectData[]> = {};
        filteredProjects.forEach(p => {
            const year = p.curso || 'Sin Curso';
            if (!groups[year]) groups[year] = [];
            groups[year].push(p);
        });

        // Ordenar proyectos dentro de cada grupo (primero el actual, luego recientes, y después alfabético)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                // Priority 1: Current project
                if (a.id === proyectoActualId) return -1;
                if (b.id === proyectoActualId) return 1;

                // Priority 2: Recientes
                if (a.orden_reciente !== b.orden_reciente) {
                    return a.orden_reciente - b.orden_reciente;
                }

                // Priority 3: Alphabetical
                return a.nombre.localeCompare(b.nombre);
            });
        });

        return groups;
    }, [filteredProjects, proyectoActualId]);

    // Ordenamos los cursos para mostrar los más altos primero (como en el dropdown)
    const sortedYears = Object.keys(groupedProjects).sort((a, b) => {
        // Put "Sin Curso" at the end
        if (a === 'Sin Curso') return 1;
        if (b === 'Sin Curso') return -1;

        // Default alphabetical for strings
        return b.localeCompare(a);
    });


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 md:p-8 bg-gradient-to-r from-purple-600 to-indigo-600 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <FolderOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Explorador de Clases</h2>
                            <p className="text-purple-100 font-medium text-sm">Gestiona y encuentra todos tus proyectos y grupos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/20 rounded-xl transition-colors text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">

                    {/* Controls Bar */}
                    <div className="p-4 md:p-6 pb-2 shrink-0 border-b border-slate-100 bg-white shadow-sm z-10">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

                            {/* Search */}
                            <div className="relative w-full md:max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por clase, asignatura o código..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-100/80 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-2xl outline-none font-medium placeholder:text-slate-400 text-slate-800 transition-all font-sans"
                                />
                            </div>

                            {/* Toggle Filters Mobile */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="md:hidden flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                Filtros {showFilters ? 'Ocultar' : 'Mostrar'}
                            </button>

                            {/* Filters */}
                            <div className={`w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                                {/* Curso Filter */}
                                <div className="flex-1 min-w-[140px]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        Año Escolar
                                    </label>
                                    <select
                                        value={cursoFilter}
                                        onChange={(e) => setCursoFilter(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 appearance-none cursor-pointer transition-all hover:border-indigo-300"
                                    >
                                        <option value="">Todos los años</option>
                                        {cursosUnicos.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Asignatura Filter */}
                                <div className="relative w-full sm:w-auto group">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                                    <select
                                        value={asignaturaFilter}
                                        onChange={(e) => setAsignaturaFilter(e.target.value)}
                                        className="w-full sm:min-w-[180px] pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-700 appearance-none hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm cursor-pointer"
                                    >
                                        <option value="">Todas las asignaturas</option>
                                        {asignaturasUnicas.map(a => (
                                            <option key={`filter-asig-${a}`} value={a}>{a}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                </div>

                                {/* Clear filters button */}
                                {(searchTerm || cursoFilter || asignaturaFilter) && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setCursoFilter('');
                                            setAsignaturaFilter('');
                                        }}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>

                        </div>

                        {/* Results Count Info */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                                {filteredProjects.length === 1 ? '1 CLASE ENCONTRADA' : `${filteredProjects.length} CLASES ENCONTRADAS`}
                            </span>
                        </div>
                    </div>

                    {/* Project List Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">

                        {filteredProjects.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-transparent">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <Search className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Vaya, no hay resultados</h3>
                                <p className="text-slate-500 max-w-sm mb-6 font-medium">No se ha encontrado ninguna clase unida que coincida con los filtros actuales.</p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setCursoFilter('');
                                        setAsignaturaFilter('');
                                    }}
                                    className="px-6 py-3 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors rounded-xl font-bold uppercase tracking-widest text-sm"
                                >
                                    Ver todas mis clases
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 max-w-7xl mx-auto">
                                {cursoFilter && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 w-fit">
                                        <GraduationCap className="w-4 h-4 text-slate-400" />
                                        <span>Año: {cursoFilter}</span>
                                        <button onClick={() => setCursoFilter('')} className="ml-1 p-0.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                {sortedYears.map((year) => (
                                    <div key={year} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                                <School className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">{year}</h3>
                                            <div className="ml-auto inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                                                {groupedProjects[year].length}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {groupedProjects[year].map((proyecto) => {
                                                const style = getAsignaturaStyles(proyecto.asignatura);
                                                const isCurrentProject = proyecto.id === proyectoActualId;

                                                return (
                                                    <div
                                                        key={`proyecto-${proyecto.id}`}
                                                        className={`group cursor-pointer relative flex flex-col p-5 rounded-2xl border-2 transition-all duration-300
                              ${proyecto.asignatura
                                                                ? `${style.borderClass} ${style.lightBgClass} hover:shadow-lg`
                                                                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 bg-white hover:shadow-lg'}
                              ${isCurrentProject ? 'ring-4 ring-indigo-500/20' : ''}
                            `}
                                                        onClick={() => {
                                                            onSelectProject(proyecto);
                                                            onClose();
                                                        }}
                                                    >

                                                        {/* Status Badge (Current / Active) */}
                                                        {isCurrentProject && (
                                                            <div className="absolute -top-3 -right-3">
                                                                <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                                                    Estás aquí
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex-1 flex flex-col justify-between h-full min-h-[140px]">
                                                            <div>
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="p-2.5 bg-white/60 rounded-xl backdrop-blur-sm border border-white/40 shadow-sm">
                                                                        <BookOpen className={`w-5 h-5 ${proyecto.asignatura ? style.textClass : 'text-slate-400'}`} />
                                                                    </div>

                                                                    {/* Tag Código */}
                                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 rounded-lg text-[10px] font-mono font-bold text-slate-500 uppercase shadow-sm border border-slate-100">
                                                                        <Key className="w-3 h-3 text-emerald-500" />
                                                                        {proyecto.codigo}
                                                                    </div>
                                                                </div>

                                                                <h4 className={`text-base font-black leading-tight mb-2 tracking-tight line-clamp-2
                                        ${proyecto.asignatura ? style.textClass : 'text-slate-800'}`}>
                                                                    {proyecto.nombre}
                                                                </h4>
                                                            </div>

                                                            <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-col gap-2">
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <div className={`w-2 h-2 rounded-full ${proyecto.asignatura ? style.bgClass : 'bg-slate-300'}`}></div>
                                                                    {proyecto.asignatura || 'Sin Asignatura'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Hover Overlay Button */}
                                                        <div className={`absolute inset-0 rounded-2xl flex items-center justify-center bg-indigo-900/0 opacity-0 group-hover:bg-indigo-900/5 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]`}>
                                                            <div className="bg-white px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest text-indigo-600 shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 border border-indigo-100">
                                                                {isCurrentProject ? 'Recargar Clase' : 'Entrar a la Clase'} <ChevronRight className="w-4 h-4" />
                                                            </div>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

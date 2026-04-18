import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft, Loader2, Trophy, CheckCircle2, Star, AlertCircle,
    MessageSquare, FolderOpen, ChevronDown, ChevronUp, FileText,
    Info, Users, Calendar, Filter, GraduationCap, Award
} from 'lucide-react';
import { getAsignaturaStyles } from '../data/asignaturas';

interface AlumnoVinculado {
    id: string;
    alumno_user_id: string;
    alumno_nombre: string;
    created_at: string;
}

interface ProyectoNotas {
    proyecto_id: string;
    proyecto_nombre: string;
    codigo_sala: string;
    grupo_nombre: string;
    grupo_id: number;
    evaluacion: any[];
    notaMedia: number;
    notaGrupal: number | null;
    asistencia: { present: number; total: number; percentage: number };
    comentarios: { id: string, contenido: string, created_at: string }[];
    puntos: number;
    tareasEvaluadas: { id: string, titulo: string, calificacion: number | null, estado: string }[];
    notaMediaTareas: number;
    tareasEntregadasCount: number;
    tareasTotalCount: number;
    curso?: string;
    asignatura?: string;
}

interface FamiliaNotasAlumnoProps {
    alumno: AlumnoVinculado;
    onBack: () => void;
}

export function FamiliaNotasAlumno({ alumno, onBack }: FamiliaNotasAlumnoProps) {
    const [proyectos, setProyectos] = useState<ProyectoNotas[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const [expandedCurso, setExpandedCurso] = useState<string | null>(null);

    useEffect(() => {
        fetchNotasAlumno();
    }, [alumno.alumno_nombre]);

    const fetchNotasAlumno = async () => {
        try {
            setLoading(true);

            // 1. Find all groups where the student is a member
            const { data: allGroups, error: groupsError } = await supabase
                .from('grupos')
                // - [x] Rediseño Jerárquico <!-- id: 8 -->
                //     - [x] Planificar estructura de agrupación por Curso en `FamiliaNotasAlumno` <!-- id: 9 -->
                //     - [x] Implementar secciones por Curso Escolar <!-- id: 10 -->
                //     - [x] Adaptar expansión de proyectos dentro de cada curso <!-- id: 11 -->
                // - [/] Pulido de UI y Compactación <!-- id: 14 -->
                //     - [ ] Reducir espaciado entre criterios y notas en `FamiliaNotasAlumno` <!-- id: 15 -->
                // - [ ] Verificación <!-- id: 12 -->
                //     - [ ] Validar navegación jerárquica con múltiples cursos <!-- id: 13 -->
                .select(`
          id,
          nombre,
          miembros,
          proyecto_id,
          interacciones_ia,
          progreso,
          proyectos (
            nombre,
            codigo_sala,
            rubrica,
            curso,
            asignatura
          )
        `);

            if (groupsError) throw groupsError;

            const normalizar = (t: string) => (t || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const nombreAlumnoNorm = normalizar(alumno.alumno_nombre);

            const gruposDelAlumno = (allGroups || []).filter((g: any) => {
                if (!g.miembros) return false;
                const miembrosArr = Array.isArray(g.miembros) ? g.miembros : [];
                return miembrosArr.some((m: string) => normalizar(m).includes(nombreAlumnoNorm));
            });

            // 2. For each group/project, fetch evaluations, group grade, attendance, AND comments
            const proyectosData: ProyectoNotas[] = [];

            for (const grupo of gruposDelAlumno) {
                const proyectoId = grupo.proyecto_id;
                if (!proyectoId) continue;

                // Fetch individual evaluations
                const { data: evalData } = await supabase
                    .from('evaluaciones')
                    .select('*')
                    .ilike('alumno_nombre', alumno.alumno_nombre)
                    .eq('proyecto_id', proyectoId)
                    .maybeSingle();

                let evaluacion: any[] = [];
                if (evalData?.criterios) {
                    evaluacion = evalData.criterios;
                } else if ((grupo as any).proyectos?.rubrica?.criterios) {
                    evaluacion = (grupo as any).proyectos.rubrica.criterios.map((c: any) => ({
                        criterio: c.nombre,
                        puntos: 0,
                        nivel: 'Pendiente'
                    }));
                }

                const notaMedia = evaluacion.length > 0
                    ? evaluacion.reduce((sum: number, e: any) => sum + Number(e.puntos || 0), 0) / evaluacion.length
                    : 0;

                // Fetch group evaluation
                const { data: groupEval } = await supabase
                    .from('evaluaciones_grupales')
                    .select('nota_final')
                    .eq('grupo_id', grupo.id)
                    .eq('proyecto_id', proyectoId)
                    .maybeSingle();

                // Fetch attendance
                const { data: attendanceData } = await supabase
                    .from('asistencia')
                    .select('*')
                    .eq('proyecto_id', proyectoId)
                    .ilike('alumno_nombre', alumno.alumno_nombre);

                const total = attendanceData?.length || 0;
                const present = attendanceData?.filter((a: any) => a.presente === true).length || 0;

                // Fetch comments
                const { data: commentsData } = await supabase
                    .from('comentarios_alumno')
                    .select('id, contenido, created_at')
                    .eq('proyecto_id', proyectoId)
                    .ilike('alumno_nombre', alumno.alumno_nombre)
                    .order('created_at', { ascending: false });

                // Fetch tasks for the project and group
                const { data: tasksData } = await supabase
                    .from('tareas')
                    .select('id, titulo, calificacion, estado, grupo_id')
                    .eq('proyecto_id', proyectoId)
                    .or(`grupo_id.eq.${grupo.id},grupo_id.is.null`);

                // Fetch student deliveries for these tasks to get grades
                const { data: deliveriesData } = await supabase
                    .from('entregas_tareas')
                    .select('tarea_id, calificacion, estado')
                    .eq('grupo_id', grupo.id);

                const tareasEvaluadas = (tasksData || []).map(t => {
                    // Try to get grade from delivery first (global tasks)
                    const delivery = deliveriesData?.find(d => d.tarea_id === t.id);
                    const calificacion = t.calificacion ?? delivery?.calificacion ?? null;
                    const finalEstado = (t.estado === 'evaluada' || delivery?.estado === 'evaluada' || t.estado === 'aprobado' || t.estado === 'completado') ? 'evaluada' : t.estado;
                    return {
                        id: t.id,
                        titulo: t.titulo,
                        calificacion: calificacion,
                        estado: finalEstado
                    };
                }).filter(t => t.calificacion !== null); // Show only if evaluated

                const notaMediaTareas = tareasEvaluadas.length > 0
                    ? tareasEvaluadas.reduce((sum, t) => sum + (t.calificacion ?? 0), 0) / tareasEvaluadas.length
                    : 0;

                const tasksForProject = tasksData || [];
                const tareasTotalCount = tasksForProject.length;
                const tareasEntregadasCount = (deliveriesData || []).length;

                // Fetch points
                const { data: puntosData } = await supabase
                    .from('alumno_puntos')
                    .select('puntos')
                    .eq('proyecto_id', proyectoId)
                    .ilike('alumno_nombre', alumno.alumno_nombre)
                    .maybeSingle();

                const puntos = puntosData ? puntosData.puntos : 0;

                proyectosData.push({
                    proyecto_id: proyectoId,
                    proyecto_nombre: (grupo as any).proyectos?.nombre || 'Proyecto',
                    codigo_sala: (grupo as any).proyectos?.codigo_sala || '',
                    grupo_nombre: grupo.nombre,
                    grupo_id: grupo.id,
                    evaluacion,
                    notaMedia,
                    notaGrupal: groupEval?.nota_final ?? null,
                    asistencia: {
                        present,
                        total,
                        percentage: total > 0 ? Math.round((present / total) * 100) : 0
                    },
                    puntos,
                    comentarios: commentsData || [],
                    tareasEvaluadas,
                    notaMediaTareas,
                    tareasEntregadasCount,
                    tareasTotalCount,
                    curso: (grupo as any).proyectos?.curso || 'Sin curso',
                    asignatura: (grupo as any).proyectos?.asignatura || ''
                });
            }

            // Deduplicar por proyecto_id + grupo_id para evitar keys duplicados
            const seen = new Set<string>();
            const proyectosUnicos = proyectosData.filter(p => {
                const key = `${p.proyecto_id}-${p.grupo_id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            setProyectos(proyectosUnicos);

            // Auto-expand first course if available
            const courses = [...new Set(proyectosUnicos.map(p => p.curso).filter(Boolean))] as string[];
            if (courses.length > 0) {
                setExpandedCurso(courses.sort().reverse()[0]);
            } else if (proyectosUnicos.length > 0) {
                setExpandedCurso('Sin curso');
            }

            // Auto-expand first project if there's only one total
            if (proyectosUnicos.length === 1) {
                setExpandedProject(`${proyectosUnicos[0].proyecto_id}-${proyectosUnicos[0].grupo_id}`);
            }

        } catch (err) {
            console.error('Error fetching student grades:', err);
        } finally {
            setLoading(false);
        }
    };

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

    // Group projects by course
    const proyectosPorCurso = proyectos.reduce((acc, p) => {
        const curso = p.curso || 'Sin curso';
        if (!acc[curso]) acc[curso] = [];
        acc[curso].push(p);
        return acc;
    }, {} as Record<string, ProyectoNotas[]>);

    const cursosOrdenados = Object.keys(proyectosPorCurso).sort((a, b) => {
        if (a === 'Sin curso') return 1;
        if (b === 'Sin curso') return -1;
        return b.localeCompare(a); // Descending order (newest first)
    });

    return (
        <div className="min-h-screen bg-[#fcfdff]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-200">
                            {alumno.alumno_nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                                {alumno.alumno_nombre}
                            </h1>
                            <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : proyectos.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <FolderOpen className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight mb-2">Sin proyectos</h3>
                        <p className="text-slate-400 text-sm font-medium">Este alumno aún no está en ningún proyecto</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {cursosOrdenados.map((curso) => (
                            <div key={curso} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                                {/* Course Header */}
                                <button
                                    onClick={() => setExpandedCurso(expandedCurso === curso ? null : curso)}
                                    className={`w-full p-6 flex items-center justify-between text-left transition-all ${expandedCurso === curso ? 'bg-slate-50 border-b border-slate-100' : 'hover:bg-slate-50/50'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expandedCurso === curso ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-slate-100 text-slate-500'}`}>
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">{curso}</h2>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {proyectosPorCurso[curso].length} proyecto{proyectosPorCurso[curso].length !== 1 ? 's' : ''} vinculados
                                            </p>
                                        </div>
                                    </div>
                                    {expandedCurso === curso ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                </button>

                                {/* Projects in this course */}
                                {expandedCurso === curso && (
                                    <div className="p-4 space-y-4 bg-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {proyectosPorCurso[curso].map((proyecto) => {
                                            const uniqueKey = `${proyecto.proyecto_id}-${proyecto.grupo_id}`;
                                            const isExpanded = expandedProject === uniqueKey;
                                            const asigStyles = getAsignaturaStyles(proyecto.asignatura);
                                            return (
                                                <div key={uniqueKey} className={`bg-white rounded-[1.5rem] shadow-sm border-2 ${asigStyles.borderClass} overflow-hidden transition-all`}>
                                                    {/* Project Sub-header */}
                                                    <button
                                                        onClick={() => setExpandedProject(isExpanded ? null : uniqueKey)}
                                                        className={`w-full p-5 flex items-center justify-between text-left hover:${asigStyles.lightBgClass} transition-colors`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 ${asigStyles.lightBgClass} rounded-xl flex items-center justify-center ${asigStyles.textClass} shrink-0`}>
                                                                <GraduationCap className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className={`font-black ${asigStyles.textClass} tracking-tight text-sm uppercase`}>{proyecto.proyecto_nombre}</h3>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                                        {proyecto.codigo_sala}
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-400 font-bold">
                                                                        {proyecto.grupo_nombre}
                                                                    </span>
                                                                    {proyecto.asignatura && (
                                                                        <span className={`text-[9px] font-black uppercase ${asigStyles.textClass}`}>
                                                                            • {proyecto.asignatura}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="text-base font-black text-slate-800">{proyecto.notaMedia.toFixed(1)}</div>
                                                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Media</div>
                                                            </div>
                                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                                                        </div>
                                                    </button>

                                                    {/* Project Details */}
                                                    {isExpanded && (
                                                        <div className="px-5 pb-5 border-t border-slate-50 pt-5 animate-in fade-in zoom-in-95 duration-200">
                                                            {/* Stats Summary */}
                                                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                                                                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                                                    <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest block mb-1">MEDIA CRITERIOS</span>
                                                                    <div className="text-xl font-black text-blue-600">{proyecto.notaMedia.toFixed(1)}</div>
                                                                </div>
                                                                <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-100">
                                                                    <span className="text-[8px] text-cyan-500 font-black uppercase tracking-widest block mb-1">ASISTENCIA</span>
                                                                    <div className="text-xl font-black text-cyan-600">{proyecto.asistencia.percentage}%</div>
                                                                </div>
                                                                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                                                    <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest block mb-1">PUNTOS</span>
                                                                    <div className="text-xl font-black text-emerald-600 flex items-center gap-1">
                                                                        {proyecto.puntos} <Award className="w-4 h-4 text-emerald-500" />
                                                                    </div>
                                                                </div>
                                                                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                                                    <span className="text-[8px] text-amber-500 font-black uppercase tracking-widest block mb-1">MEDIA TAREAS</span>
                                                                    <div className="text-xl font-black text-amber-600">{proyecto.notaMediaTareas.toFixed(1)}</div>
                                                                </div>
                                                                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                                                                    <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest block mb-1">TAREAS ENTREGADAS</span>
                                                                    <div className="text-xl font-black text-orange-600">
                                                                        {proyecto.tareasEntregadasCount}/{proyecto.tareasTotalCount}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Detailed Grades Grid */}
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                                                {/* Left: Rubric Criteria */}
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-4">
                                                                        <Star className="w-3.5 h-3.5 text-emerald-500" />
                                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Evaluación por Rúbrica</span>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {proyecto.evaluacion.map((item: any, index: number) => {
                                                                            const puntos = Number(item.puntos || 0);
                                                                            const styles = getNivelStyles(puntos);
                                                                            return (
                                                                                <div key={index} className="flex items-center gap-4 p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate flex-1">
                                                                                        {item.nombre || item.criterio}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-3 shrink-0">
                                                                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${styles.bgLight} ${styles.color}`}>
                                                                                            {puntos.toFixed(1)}
                                                                                        </div>
                                                                                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                                                                            <div className={`h-full ${styles.bg} transition-all duration-700`} style={{ width: `${puntos * 10}%` }} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Right: Task Grades */}
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-4">
                                                                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Calificaciones por Tarea</span>
                                                                    </div>
                                                                    {proyecto.tareasEvaluadas.length > 0 ? (
                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            {proyecto.tareasEvaluadas.map((tarea) => {
                                                                                const cal = tarea.calificacion ?? 0;
                                                                                const styles = getNivelStyles(cal);
                                                                                return (
                                                                                    <div key={tarea.id} className="flex items-center justify-between p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50 hover:bg-indigo-50 transition-colors">
                                                                                        <span className="text-[10px] font-bold text-slate-600 truncate flex-1" title={tarea.titulo}>
                                                                                            {tarea.titulo}
                                                                                        </span>
                                                                                        <div className="flex items-center gap-3 shrink-0 ml-4">
                                                                                            <div className={`px-2 py-0.5 rounded text-[10px] font-black ${styles.bgLight} ${styles.color} shrink-0`}>
                                                                                                {cal.toFixed(1)}
                                                                                            </div>
                                                                                            <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                                                                                <div className={`h-full ${styles.bg} transition-all duration-700`} style={{ width: `${cal * 10}%` }} />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-[200px] flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-center animate-in fade-in duration-500">
                                                                            <FileText className="w-8 h-8 text-slate-200 mb-2" />
                                                                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Sin tareas evaluadas</p>
                                                                            <p className="text-[9px] text-slate-300 font-medium mt-1">Cuando el profesor califique una tarea individual aparecerá aquí.</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Observations - Always shown */}
                                                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <MessageSquare className="w-3 h-3 text-yellow-600" />
                                                                    <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Observaciones del Profesor</span>
                                                                </div>
                                                                {proyecto.comentarios.length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        {proyecto.comentarios.map(c => (
                                                                            <p key={c.id} className="text-xs text-slate-600 font-medium leading-relaxed italic">
                                                                                "{c.contenido}"
                                                                            </p>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-slate-400 font-medium italic">Sin observaciones registradas</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

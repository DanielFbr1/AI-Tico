import { useState, useEffect } from 'react';
import { X, Calendar, Check, Save, Loader2, UserCheck, Eye } from 'lucide-react';
import { Grupo, Rubrica } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { PerfilAlumno } from './PerfilAlumno';
import { fetchPuntosProyecto, updatePuntosAlumno } from '../lib/puntos';

interface ModalAsistenciaProps {
    grupos: Grupo[];
    proyectoId: string;
    rubrica?: Rubrica;
    onClose: () => void;
}

interface AlumnoAsistencia {
    nombre: string;
    grupo: string;
    grupoCompleto: Grupo;
    presente: boolean;
    puntos: number;
}

export function ModalAsistencia({ grupos, proyectoId, rubrica, onClose }: ModalAsistenciaProps) {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [alumnos, setAlumnos] = useState<AlumnoAsistencia[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<AlumnoAsistencia | null>(null);

    // Initial load of students and attendance for selected date
    useEffect(() => {
        const cargarAlumnosYAsistencia = async () => {
            setLoading(true);
            try {
                // 1. Extraer lista plana de alumnos de los grupos
                const listaAlumnos: AlumnoAsistencia[] = grupos.flatMap(g =>
                    g.miembros.map(m => ({
                        nombre: m,
                        grupo: g.nombre,
                        grupoCompleto: g,
                        presente: false, // Default to false until checked against DB
                        puntos: 0
                    }))
                ).reduce((acc, current) => {
                    const x = acc.find(item => item.nombre === current.nombre);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, [] as AlumnoAsistencia[]).sort((a, b) => a.nombre.localeCompare(b.nombre));

                // 2. Fetch asistencia existente para esta fecha
                const { data: asistenciaExistente } = await supabase
                    .from('asistencia')
                    .select('alumno_nombre, presente')
                    .eq('proyecto_id', proyectoId)
                    .eq('fecha', fecha);

                // 3. Obtener puntos
                const puntosExistentes = await fetchPuntosProyecto(proyectoId);
                const mapPuntos = new Map(puntosExistentes.map((p: any) => [p.alumno_nombre, p.puntos]));

                // 4. Merge data
                if (asistenciaExistente && asistenciaExistente.length > 0) {
                    const mapAsistencia = new Map(asistenciaExistente.map(a => [a.alumno_nombre, a.presente]));
                    listaAlumnos.forEach(a => {
                        a.puntos = mapPuntos.get(a.nombre) || 0;
                        if (mapAsistencia.has(a.nombre)) {
                            a.presente = mapAsistencia.get(a.nombre)!;
                        } else {
                            a.presente = true; // Si ya hay registro de DIA, asumimos nuevos como presentes por defecto? O false? 
                            // Mejor: Si existe registro del día, usamos lo que hay. Si no hay registro del alumno, false.
                            // Pero para la PRIMERA carga del día (sin registros previos), quizás queramos 'check all' por defecto?
                            // Vamos a mantener 'false' por defecto si no hay registro, o podríamos poner 'true' por defecto para agilizar.
                            // Estrategia: Si hay CERO registros para ese día en todo el proyecto, poner todos en TRUE.
                        }
                    });
                } else {
                    // Si no hay registros para este día, marcamos todos como PRESENTES por defecto para ahorrar clicks
                    listaAlumnos.forEach(a => {
                        a.presente = true;
                        a.puntos = mapPuntos.get(a.nombre) || 0;
                    });
                }

                setAlumnos(listaAlumnos);

            } catch (error) {
                console.error("Error loading attendance:", error);
                toast.error("Error al cargar lista");
            } finally {
                setLoading(false);
            }
        };

        cargarAlumnosYAsistencia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fecha, proyectoId]);

    const handleToggle = (index: number) => {
        const updated = [...alumnos];
        updated[index].presente = !updated[index].presente;
        setAlumnos(updated);
    };

    const handlePuntos = async (e: React.MouseEvent, index: number, delta: number) => {
        e.stopPropagation();
        const alumno = alumnos[index];
        // Optimistic update
        const updated = [...alumnos];
        updated[index].puntos += delta;
        setAlumnos(updated);

        const result = await updatePuntosAlumno(proyectoId, alumno.nombre, delta);
        if (!result) {
            // Revert
            toast.error("Error al actualizar puntos");
            const reverted = [...alumnos];
            reverted[index].puntos -= delta;
            setAlumnos(reverted);
        } else {
            toast.success(`${delta > 0 ? '+1' : '-1'} punto para ${alumno.nombre}`);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const upsertData = alumnos.map(a => ({
                proyecto_id: proyectoId,
                fecha: fecha,
                alumno_nombre: a.nombre,
                presente: a.presente
            }));

            const { error } = await supabase
                .from('asistencia')
                .upsert(upsertData, { onConflict: 'proyecto_id, fecha, alumno_nombre' });

            if (error) throw error;

            toast.success(`Asistencia del ${fecha} guardada`);
            onClose();

        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error("Error al guardar asistencia");
        } finally {
            setSaving(false);
        }
    };

    const countPresentes = alumnos.filter(a => a.presente).length;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-gray-800 tracking-tight">Control de Asistencia</h3>
                            <p className="text-sm text-gray-500 font-medium">Registra quién está en clase hoy</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-8 py-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-gray-600 uppercase tracking-wide">Fecha:</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-500">
                            Presentes: <strong className="text-emerald-600 text-lg">{countPresentes}</strong> / {alumnos.length}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Registro
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alumnos.map((alumno, idx) => (
                                <div
                                    key={idx}
                                    className={`
                                        relative overflow-hidden rounded-2xl p-4 border-2 transition-all duration-200 group
                                        ${alumno.presente
                                            ? 'bg-white border-emerald-200 shadow-sm hover:border-emerald-400'
                                            : 'bg-gray-50 border-transparent opacity-60 hover:opacity-100 hover:bg-white hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col gap-3 relative z-10 w-full">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer w-full"
                                            onClick={() => setAlumnoSeleccionado(alumno)}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-sm border-2 transition-colors
                                                ${alumno.presente ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-200 text-gray-500 border-gray-300'}
                                            `}>
                                                {alumno.nombre.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm leading-tight break-words ${alumno.presente ? 'text-gray-900' : 'text-gray-500'}`} title={alumno.nombre}>{alumno.nombre}</h4>
                                                <p className="text-[10px] uppercase font-bold text-gray-400 break-words">{alumno.grupo}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100/60">
                                            <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                                                <button
                                                    onClick={(e) => handlePuntos(e, idx, -1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Restar punto"
                                                >
                                                    <span className="text-sm font-black">-1</span>
                                                </button>
                                                <span className="w-8 text-center font-black text-base text-gray-700">{alumno.puntos}</span>
                                                <button
                                                    onClick={(e) => handlePuntos(e, idx, 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                    title="Sumar punto"
                                                >
                                                    <span className="text-sm font-black">+1</span>
                                                </button>
                                            </div>
                                            <div
                                                onClick={() => handleToggle(idx)}
                                                className={`
                                                cursor-pointer w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                                                ${alumno.presente ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'border-gray-300 bg-white hover:bg-gray-50'}
                                            `}>
                                                {alumno.presente && <Check className="w-5 h-5 text-white" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background effect */}
                                    {alumno.presente && (
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 -z-0"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {alumnoSeleccionado && (
                <PerfilAlumno
                    alumno={alumnoSeleccionado.nombre}
                    grupo={alumnoSeleccionado.grupoCompleto}
                    rubrica={rubrica}
                    onClose={() => setAlumnoSeleccionado(null)}
                />
            )}
        </div>
    );
}

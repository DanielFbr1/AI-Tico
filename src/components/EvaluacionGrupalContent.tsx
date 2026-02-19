import { Save, Loader2, Users, AlertTriangle, Trash2, Plus, Trophy, CheckCircle2, Star, Minus, Pencil, Target } from 'lucide-react';
import { Grupo, Criterio } from '../types';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface EvaluacionGrupalContentProps {
    grupo: Grupo;
    onSave?: () => void;
    onCancel?: () => void;
    rubricaProyecto?: Criterio[];
    onRubricChange?: (newRubric: Criterio[]) => void;
    isModal?: boolean; // To adjust styling if inside a modal vs inline
}

interface EvaluacionCriterio {
    nombre: string;
    puntos: number;
    comentario: string;
}

const CRITERIOS_GRUPALES_DEFAULT: EvaluacionCriterio[] = [
    { nombre: 'Colaboración y trabajo en equipo', puntos: 5, comentario: '' },
    { nombre: 'Creatividad e Innovación', puntos: 5, comentario: '' },
    { nombre: 'Uso de Herramientas TIC', puntos: 5, comentario: '' }
];

export function EvaluacionGrupalContent({ grupo, onSave, onCancel, rubricaProyecto, onRubricChange, isModal = false }: EvaluacionGrupalContentProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Init state: Try global rubric first, fall back to default ONLY if global is empty
    const [criterios, setCriterios] = useState<EvaluacionCriterio[]>(() => {
        if (rubricaProyecto && rubricaProyecto.length > 0) {
            return rubricaProyecto.map(c => ({
                nombre: c.nombre,
                puntos: 5,
                comentario: ''
            }));
        }
        return CRITERIOS_GRUPALES_DEFAULT;
    });

    const [comentariosGenerales, setComentariosGenerales] = useState('');

    useEffect(() => {
        fetchEvaluacionGrupal();
    }, [grupo.id]);

    const fetchEvaluacionGrupal = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('evaluaciones_grupales')
                .select('*')
                .eq('grupo_id', grupo.id)
                .eq('proyecto_id', grupo.proyecto_id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching group evaluation:', error);
            }

            if (data) {
                if (data.criterios) {
                    // Merge loaded criteria with global rubric structure if it exists
                    if (rubricaProyecto && rubricaProyecto.length > 0) {
                        const merged = rubricaProyecto.map(globalCrit => {
                            const savedCrit = data.criterios.find((c: any) => (c.nombre || c.criterio) === globalCrit.nombre);
                            return {
                                nombre: globalCrit.nombre,
                                puntos: savedCrit ? Number(savedCrit.puntos) : 5,
                                comentario: savedCrit ? savedCrit.comentario : ''
                            };
                        });
                        setCriterios(merged);
                    } else {
                        // Normalize criteria from DB (could have 'criterio' or 'nombre')
                        const normalized = data.criterios.map((c: any) => ({
                            nombre: c.nombre || c.criterio,
                            puntos: Number(c.puntos),
                            comentario: c.comentario || ''
                        }));
                        setCriterios(normalized);
                    }
                }
                if (data.comentarios_generales) setComentariosGenerales(data.comentarios_generales);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const notaFinal = Number((criterios.reduce((sum, c) => sum + Number(c.puntos), 0) / Math.max(1, criterios.length)).toFixed(2));

            // 1. Guardar Evaluación Grupal
            const payload = {
                grupo_id: grupo.id,
                proyecto_id: grupo.proyecto_id,
                criterios,
                nota_final: notaFinal,
                comentarios_generales: comentariosGenerales,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('evaluaciones_grupales')
                .upsert(payload, { onConflict: 'grupo_id, proyecto_id' });

            if (error) throw error;

            // 2. Aplicar Herencia a los Alumnos (Sincronización Total)
            let inheritanceCount = 0;

            if (grupo.miembros && grupo.miembros.length > 0) {
                for (const alumnoNombre of grupo.miembros) {
                    // Mapeamos los criterios grupales a individuales
                    const criteriosHeredados = criterios.map(c => ({
                        nombre: c.nombre, // CONSISTENT WITH nombre
                        puntos: Number(c.puntos),
                        comentario: c.comentario || ''
                    }));

                    await supabase.from('evaluaciones').upsert({
                        alumno_nombre: alumnoNombre,
                        proyecto_id: grupo.proyecto_id,
                        grupo_id: grupo.id,
                        criterios: criteriosHeredados,
                        nota_final: notaFinal,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'proyecto_id, alumno_nombre' });

                    inheritanceCount++;
                }
            }

            toast.success(`Evaluación grupal guardada y sincronizada con ${inheritanceCount} alumnos.`);

            // Llamar a onSave y onCancel de forma segura para asegurar el cierre del panel
            try {
                if (onSave) onSave();
            } catch (e) {
                console.error("Error en onSave callback:", e);
            }

            if (onCancel) onCancel();

        } catch (err: any) {
            console.error('Error saving group evaluation:', err);
            const errorMessage = err.message || 'Error desconocido';
            toast.error(`Error al guardar: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const updateCriterio = (index: number, field: keyof EvaluacionCriterio, value: any) => {
        const newCriterios = [...criterios];
        newCriterios[index] = { ...newCriterios[index], [field]: value };
        setCriterios(newCriterios);
    };

    const addCriterio = () => {
        const newCriterion = { nombre: 'Nuevo Criterio', puntos: 5, comentario: '' };
        const newCriterios = [...criterios, newCriterion];
        setCriterios(newCriterios);

        // GLOBAL SYNC: Construct full Global Criterio object
        if (onRubricChange) {
            const globalCriterio: Criterio = {
                nombre: newCriterion.nombre,
                descripcion: 'Nuevo criterio añadido desde evaluación grupal',
                niveles: [
                    { puntos: '0-4', descripcion: '' },
                    { puntos: '5-6', descripcion: '' },
                    { puntos: '7-8', descripcion: '' },
                    { puntos: '9-10', descripcion: '' }
                ]
            };

            if (rubricaProyecto) {
                onRubricChange([...rubricaProyecto, globalCriterio]);
                toast.success("Criterio añadido a la Rúbrica Global");
            }
        }
    };

    const removeCriterio = (index: number) => {
        if (criterios.length <= 1) {
            toast.error("Debe haber al menos un criterio de evaluación.");
            return;
        }

        if (!confirm("¿Eliminar este criterio de TODA la rúbrica del proyecto?")) return;

        const newCriterios = criterios.filter((_, i) => i !== index);
        setCriterios(newCriterios);

        // GLOBAL SYNC: Remove from Global Rubric
        if (onRubricChange && rubricaProyecto) {
            const newGlobalRubric = rubricaProyecto.filter((_, i) => i !== index);
            onRubricChange(newGlobalRubric);
            toast.success("Criterio eliminado de la Rúbrica Global");
        }
    };

    const getNivelColor = (puntos: number) => {
        if (puntos >= 9) return 'bg-green-600 text-white';
        if (puntos >= 7) return 'bg-blue-600 text-white';
        if (puntos >= 5) return 'bg-yellow-600 text-white';
        return 'bg-red-600 text-white';
    };

    const getBarColor = (puntos: number) => {
        if (puntos >= 9) return 'bg-green-600';
        if (puntos >= 7) return 'bg-blue-600';
        if (puntos >= 5) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    const getNivelIcon = (puntos: number) => {
        if (puntos >= 9) return <Trophy className="w-4 h-4" />;
        if (puntos >= 7) return <CheckCircle2 className="w-4 h-4" />;
        if (puntos >= 5) return <Star className="w-4 h-4" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    const getNivelFromPuntos = (puntos: number) => {
        if (puntos >= 9) return 'Sobresaliente';
        if (puntos >= 7) return 'Notable';
        if (puntos >= 5) return 'Suficiente';
        return 'Insuficiente';
    };

    const notaMedia = criterios.reduce((sum, c) => sum + Number(c.puntos || 0), 0) / Math.max(1, criterios.length);

    return (
        <div className={`flex flex-col ${isModal ? 'h-[80vh]' : 'h-full'} bg-[#fbfbfe]`}>
            {/* Header for both Tab and Modal, adjusted for context */}
            <div className={`bg-white border-b border-gray-100 flex justify-between items-center shadow-sm shrink-0 ${isModal ? 'p-4 md:p-6' : 'p-6 md:p-8 rounded-t-[1.5rem] md:rounded-t-[2.5rem]'}`}>
                <div className="flex items-center gap-3 md:gap-4">
                    <div className={`bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center ${isModal ? 'p-2 w-8 h-8 md:w-10 md:h-10' : 'p-2 w-10 h-10 md:p-3 md:w-14 md:h-14'}`}>
                        <Users className={isModal ? 'w-4 h-4 md:w-5 md:h-5' : 'w-5 h-5 md:w-7 md:h-7'} />
                    </div>
                    <div>
                        <h2 className={`${isModal ? 'text-base md:text-lg' : 'text-xl md:text-2xl'} font-black text-gray-900 tracking-tight`}>
                            {isModal ? `Evaluando: ${grupo.nombre}` : 'Evaluación Grupal'}
                        </h2>
                        {!isModal && <p className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider">Aplica a todo el equipo</p>}
                        {isModal && <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mt-0.5">Control de Calificaciones</p>}
                    </div>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8`}>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Nota Media del Grupo</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-gray-900 tracking-tighter">{notaMedia.toFixed(1)}</span>
                            <span className="text-xl font-bold text-gray-400">/10</span>
                        </div>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md ${getNivelColor(notaMedia)}`}>
                        {getNivelIcon(notaMedia)}
                        {getNivelFromPuntos(notaMedia).toUpperCase()}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        CRITERIOS DE EVALUACIÓN
                    </h3>

                    {criterios.map((criterio, index) => {
                        const p = Number(criterio.puntos);
                        return (
                            <div key={index} className="bg-white border-2 border-gray-100 p-6 rounded-3xl shadow-sm hover:border-blue-200 transition-all group">
                                <div className="flex justify-between items-start mb-6 gap-4">
                                    <div className="flex-1">
                                        <div className="relative group/input">
                                            <input
                                                type="text"
                                                value={criterio.nombre}
                                                onChange={(e) => {
                                                    updateCriterio(index, 'nombre', e.target.value);
                                                    if (onRubricChange && rubricaProyecto && rubricaProyecto[index]) {
                                                        const newRubric = [...rubricaProyecto];
                                                        newRubric[index] = { ...newRubric[index], nombre: e.target.value };
                                                        onRubricChange(newRubric);
                                                    }
                                                }}
                                                className="text-lg font-black text-gray-900 bg-gray-50 border-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none w-full transition-all outline-none rounded-xl px-4 py-2 pr-10"
                                                placeholder="Nombre del criterio"
                                            />
                                            <Pencil className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover/input:text-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm ${getNivelColor(p)}`}>
                                            {getNivelIcon(p)}
                                            {getNivelFromPuntos(p)}
                                        </span>
                                        <div className="text-2xl font-black text-gray-900">
                                            {p.toFixed(1)} <span className="text-xs text-gray-400 font-bold">/10</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100/50">
                                        <button
                                            onClick={() => {
                                                const newVal = Math.max(0, p - 0.5);
                                                updateCriterio(index, 'puntos', newVal);
                                            }}
                                            className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm hover:shadow-md active:scale-90 transition-all"
                                            title="Bajar puntuación"
                                        >
                                            <Minus className="w-5 h-5 font-bold" />
                                        </button>

                                        <div className="flex-1 relative h-10 flex items-center justify-center group/slider">
                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${getBarColor(p)}`}
                                                    style={{ width: `${(p / 10) * 100}%` }}
                                                />
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                step="0.5"
                                                value={p}
                                                onChange={(e) => updateCriterio(index, 'puntos', e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            {/* Custom Thumb Visual */}
                                            <div
                                                className="absolute h-6 w-6 bg-white border-4 border-blue-500 rounded-full shadow-lg pointer-events-none transition-all duration-75 ease-out flex items-center justify-center z-0"
                                                style={{ left: `calc(${(p / 10) * 100}% - 12px)` }}
                                            >
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const newVal = Math.min(10, p + 0.5);
                                                updateCriterio(index, 'puntos', newVal);
                                            }}
                                            className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-100 rounded-xl text-gray-400 hover:text-green-600 hover:border-green-200 shadow-sm hover:shadow-md active:scale-90 transition-all"
                                            title="Subir puntuación"
                                        >
                                            <Plus className="w-5 h-5 font-bold" />
                                        </button>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => removeCriterio(index)}
                                            className="p-2 text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-xl transition-all shadow-sm"
                                            title="Eliminar criterio"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={addCriterio}
                        className="w-full py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-black hover:border-blue-400 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <div className="p-1.5 bg-gray-100 group-hover:bg-blue-100 rounded-lg">
                            <Plus className="w-6 h-6" />
                        </div>
                        AÑADIR CRITERIO PERSONALIZADO
                    </button>
                </div>

            </div>

            <div className={`border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 p-6 shrink-0`}>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-gray-500 font-black hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all active:scale-95 text-xs"
                        disabled={saving}
                    >
                        {isModal ? 'CANCELAR' : 'DESCARTAR'}
                    </button>
                )}
                <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-blue-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 text-xs"
                    disabled={saving}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    GUARDAR CAMBIOS
                </button>
            </div>
        </div>
    );
}

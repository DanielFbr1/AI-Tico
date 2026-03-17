import { X, CheckCircle2, Clock, AlertCircle, Trophy, Save, Edit3, Paperclip, Minus, Plus, FileText, ExternalLink, BarChart3, ChevronDown, ChevronUp, FolderOpen, Info } from 'lucide-react';
import { Grupo, TareaDetallada, ArchivoAdjunto } from '../types';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ModalSeguimientoGruposProps {
    tarea: TareaDetallada;
    grupos: Grupo[];
    onClose: () => void;
    onUpdate?: () => void;
}

export function ModalSeguimientoGrupos({ tarea, grupos, onClose, onUpdate }: ModalSeguimientoGruposProps) {
    const [entregas, setEntregas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editandoId, setEditandoId] = useState<string | number | null>(null);
    const [notaTemp, setNotaTemp] = useState<number>(0);
    const [verEntregasId, setVerEntregasId] = useState<string | number | null>(null);
    const [mostrarDetalles, setMostrarDetalles] = useState(false);

    const fetchEntregas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('entregas_tareas')
                .select('*')
                .eq('tarea_id', tarea.id);
            
            if (error) throw error;
            setEntregas(data || []);
        } catch (err) {
            console.error('Error fetching entregas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntregas();
    }, [tarea.id]);

    // Lógica de Priorización y Estadísticas
    const { gruposOrdenados, stats } = useMemo(() => {
        const relevantes = grupos.filter(g => !tarea.grupo_id || tarea.grupo_id === Number(g.id));
        
        const infoGrupos = relevantes.map(grupo => {
            const entrega = entregas.find(e => e.grupo_id === grupo.id);
            const isSpecificTask = tarea.grupo_id === Number(grupo.id);
            
            // Determinar estados precisos
            const haEntregado = !!entrega?.contenido_alumno || (entrega?.archivos_alumno && entrega.archivos_alumno.length > 0);
            const notaActual = isSpecificTask ? (tarea.estado === 'completado' ? tarea.puntos_maximos : 0) : (entrega?.calificacion || 0);
            const estaEvaluado = isSpecificTask ? tarea.estado === 'completado' : (!!entrega && entrega.calificacion !== null && entrega.calificacion !== undefined);
            
            let estadoVisual: 'evaluado' | 'pendiente_nota' | 'sin_entrega' = 'sin_entrega';
            if (estaEvaluado) estadoVisual = 'evaluado';
            else if (haEntregado) estadoVisual = 'pendiente_nota';

            return {
                ...grupo,
                entrega,
                haEntregado,
                notaActual,
                estaEvaluado,
                estadoVisual
            };
        });

        // Ordenar: Pendientes de nota > Evaluados > Sin entrega
        const ordenados = [...infoGrupos].sort((a, b) => {
            const priorities = { pendiente_nota: 0, evaluado: 1, sin_entrega: 2 };
            return priorities[a.estadoVisual] - priorities[b.estadoVisual];
        });

        const numRealizadas = infoGrupos.filter(g => g.haEntregado).length;
        const numEvaluadas = infoGrupos.filter(g => g.estaEvaluado).length;
        const numPendientesNota = infoGrupos.filter(g => g.estadoVisual === 'pendiente_nota').length;

        return {
            gruposOrdenados: ordenados,
            stats: {
                total: relevantes.length,
                numRealizadas,
                numEvaluadas,
                numPendientesNota,
                numSinRealizar: relevantes.length - numRealizadas
            }
        };
    }, [grupos, entregas, tarea]);

    const handleEvaluar = async (grupoId: string | number, nota: number) => {
        try {
            const isSpecificTask = tarea.grupo_id === Number(grupoId);
            
            if (isSpecificTask) {
                const { error } = await supabase
                    .from('tareas')
                    .update({ estado: 'completado' })
                    .eq('id', tarea.id);
                if (error) throw error;
            } else {
                const entregaExistente = entregas.find(e => e.grupo_id === grupoId);
                if (entregaExistente) {
                    const { error } = await supabase
                        .from('entregas_tareas')
                        .update({ 
                            calificacion: nota, 
                            estado: 'revisado',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', entregaExistente.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('entregas_tareas')
                        .insert({
                            tarea_id: tarea.id,
                            grupo_id: grupoId,
                            calificacion: nota,
                            estado: 'revisado',
                            fecha_entrega: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                    if (error) throw error;
                }
            }

            toast.success('Evaluación guardada con éxito');
            setEditandoId(null);
            fetchEntregas();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error al evaluar:', error);
            toast.error('Error al guardar la nota');
        }
    };

    const getBarColor = (p: number, max: number) => {
        const ratio = p / max;
        if (ratio >= 0.9) return 'bg-emerald-500';
        if (ratio >= 0.7) return 'bg-blue-500';
        if (ratio >= 0.5) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header Dinámico */}
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 border-4 border-white">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Hub de Misión</h2>
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200/50">V5.4.3</span>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{tarea.titulo} (Máx: 10 pts)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setMostrarDetalles(!mostrarDetalles)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${mostrarDetalles ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Info className="w-4 h-4" />
                            {mostrarDetalles ? 'Ocultar Perfil' : 'Perfil de Tarea'}
                        </button>
                        <button onClick={onClose} className="p-4 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm border border-slate-100 group">
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Perfil de Tarea (Instrucciones y Archivos) */}
                {mostrarDetalles && (
                    <div className="bg-indigo-50/50 border-b border-indigo-100 p-8 animate-in slide-in-from-top-10 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Instrucciones de la Misión</h4>
                                <div className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm text-sm text-slate-600 leading-relaxed italic">
                                    {tarea.descripcion || "Sin descripción proporcionada."}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Archivos del Almirante (Docente)</h4>
                                {tarea.archivos_adjuntos && tarea.archivos_adjuntos.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {tarea.archivos_adjuntos.map((archivo: ArchivoAdjunto, i: number) => (
                                            <a 
                                                key={i} href={archivo.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-white hover:bg-indigo-50 rounded-2xl border border-indigo-100 group transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FolderOpen className="w-5 h-5 text-indigo-400" />
                                                    <span className="text-xs font-black text-slate-700">{archivo.nombre}</span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white/50 rounded-[2rem] border-2 border-dashed border-indigo-100">
                                        No hay archivos adjuntos
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Estadísticas de Evaluación */}
                {!mostrarDetalles && (
                    <div className="px-8 py-6 bg-white border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
                        <div className="bg-emerald-50 rounded-[1.5rem] p-4 border border-emerald-100/50 flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100"><CheckCircle2 className="w-5 h-5" /></div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Evaluadas</span>
                                <span className="text-xl font-black text-emerald-700">{stats.numEvaluadas} <span className="text-[10px] text-emerald-400">/ {stats.total}</span></span>
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded-[1.5rem] p-4 border border-amber-100/50 flex items-center gap-4">
                            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-100 animate-pulse"><Clock className="w-5 h-5" /></div>
                            <div>
                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">Esperado Nota</span>
                                <span className="text-xl font-black text-amber-700">{stats.numPendientesNota}</span>
                            </div>
                        </div>
                        <div className="bg-rose-50 rounded-[1.5rem] p-4 border border-rose-100/50 flex items-center gap-4">
                            <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-100"><AlertCircle className="w-5 h-5" /></div>
                            <div>
                                <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">Faltan Entrega</span>
                                <span className="text-xl font-black text-rose-700">{stats.numSinRealizar}</span>
                            </div>
                        </div>
                        <div className="bg-indigo-50 rounded-[1.5rem] p-4 border border-indigo-100/50 flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-100"><BarChart3 className="w-5 h-5" /></div>
                            <div>
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Éxito Misión</span>
                                <span className="text-xl font-black text-indigo-700">{Math.round((stats.numEvaluadas / Math.max(1, stats.total)) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Listado de Equipos Priorizado */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#fbfbfe] space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando canal de evaluación seguro...</p>
                        </div>
                    ) : (
                        gruposOrdenados.map(g => {
                            const isEditing = editandoId === g.id;
                            const isViewingContent = verEntregasId === g.id;

                            return (
                                <div key={g.id} className={`rounded-[2.5rem] border-2 transition-all flex flex-col ${isEditing ? 'border-indigo-400 bg-white shadow-2xl scale-[1.01]' : g.estadoVisual === 'pendiente_nota' ? 'border-amber-200 bg-amber-50/30' : 'border-white bg-white shadow-sm'}`}>
                                    <div className="p-6 flex flex-wrap items-center justify-between gap-6">
                                        <div className="flex items-center gap-5 flex-1">
                                            <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center font-black text-xl border-4 border-white shadow-sm uppercase ${g.estadoVisual === 'evaluado' ? 'bg-emerald-100 text-emerald-600' : g.estadoVisual === 'pendiente_nota' ? 'bg-amber-100 text-amber-600 animate-bounce-subtle' : 'bg-slate-100 text-slate-400'}`}>
                                                {g.nombre.substring(0,2)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{g.nombre}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {g.estadoVisual === 'evaluado' ? (
                                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200/50">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Evaluada
                                                        </span>
                                                    ) : g.estadoVisual === 'pendiente_nota' ? (
                                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full border border-amber-200/50">
                                                            <AlertCircle className="w-3.5 h-3.5" /> Pendiente de Nota
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
                                                            <Clock className="w-3.5 h-3.5" /> Sin Entrega
                                                        </span>
                                                    )}
                                                    {g.haEntregado && (
                                                        <button 
                                                            onClick={() => setVerEntregasId(isViewingContent ? null : g.id)}
                                                            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isViewingContent ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
                                                        >
                                                            {isViewingContent ? 'Ocultar Entrega' : 'Ver Entrega'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            {!isEditing ? (
                                                <div className="flex items-center gap-8">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleEvaluar(g.id, 10)}
                                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 group/btn"
                                                            title="Aprobar (10 pts)"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEvaluar(g.id, 0)}
                                                            className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                                            title="Rechazar (0 pts)"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Puntuación Final</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-4xl font-black ${g.notaActual > 0 ? 'text-indigo-600' : 'text-slate-200'}`}>{g.notaActual}</span>
                                                            <span className="text-xs font-bold text-slate-300">/10</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => { setEditandoId(g.id); setNotaTemp(Math.min(10, g.notaActual)); }}
                                                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-100 active:scale-95"
                                                    >
                                                        <Edit3 className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 animate-in slide-in-from-right-10 duration-500">
                                                    <button onClick={() => setEditandoId(null)} className="p-4 text-slate-400 hover:text-rose-500 transition-colors uppercase font-black text-xs tracking-widest">Cancelar</button>
                                                    <button 
                                                        onClick={() => handleEvaluar(g.id, notaTemp)}
                                                        className="px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 active:scale-95"
                                                    >
                                                        <Save className="w-5 h-5" /> Guardar Evaluación
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Slider de Calificación */}
                                    {isEditing && (
                                        <div className="px-8 pb-8 pt-2 animate-in zoom-in-95 duration-300">
                                            <div className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col gap-8">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Mandos de Evaluación</span>
                                                        <span className={`text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-tighter text-white shadow-xl transition-all duration-500 ${getBarColor(notaTemp, tarea.puntos_maximos)}`}>
                                                            Nivel: {notaTemp / tarea.puntos_maximos >= 0.9 ? 'Élite' : notaTemp / tarea.puntos_maximos >= 0.7 ? 'Maestro' : notaTemp / tarea.puntos_maximos >= 0.5 ? 'Aprendiz' : 'Reintentar'}
                                                        </span>
                                                    </div>
                                                    <div className="text-6xl font-black text-slate-800 tracking-tighter tabular-nums">
                                                        {notaTemp}
                                                        <span className="text-xl font-bold text-slate-300 ml-2">/10</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 group/evaluation">
                                                    <button onClick={() => setNotaTemp(Math.max(0, parseFloat((notaTemp - 0.5).toFixed(1))))} className="w-16 h-16 flex items-center justify-center bg-white border-2 border-slate-100 rounded-[1.2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm active:scale-90 transition-all"><Minus className="w-8 h-8" /></button>
                                                    <div className="flex-1 relative h-20 flex items-center">
                                                        <div className="w-full h-6 bg-slate-200 rounded-full overflow-hidden shadow-inner border-4 border-white">
                                                            <div className={`h-full transition-all duration-700 ease-out shadow-lg ${getBarColor(notaTemp, 10)}`} style={{ width: `${(notaTemp / 10) * 100}%` }} />
                                                        </div>
                                                        <input type="range" min="0" max="10" step="0.5" value={notaTemp} onChange={(e) => setNotaTemp(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                                        <div className="absolute h-10 w-10 bg-white border-[8px] border-indigo-600 rounded-full shadow-2xl pointer-events-none transition-all duration-150 ease-out z-10" style={{ left: `calc(${(notaTemp / 10) * 100}% - 20px)` }} />
                                                    </div>
                                                    <button onClick={() => setNotaTemp(Math.min(10, parseFloat((notaTemp + 0.5).toFixed(1))))} className="w-16 h-16 flex items-center justify-center bg-white border-2 border-slate-100 rounded-[1.2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm active:scale-90 transition-all"><Plus className="w-8 h-8" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Visor de Trabajo del Alumno */}
                                    {isViewingContent && g.entrega && (
                                        <div className="px-8 pb-8 animate-in slide-in-from-bottom-10 duration-500">
                                            <div className="bg-gradient-to-br from-indigo-50/50 to-white border-2 border-indigo-100/50 rounded-[2.5rem] p-10 shadow-inner">
                                                <div className="flex items-center gap-3 mb-6 border-b border-indigo-100 pb-5">
                                                    <FileText className="w-6 h-6 text-indigo-600" />
                                                    <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Expediente de Entrega</h4>
                                                </div>
                                                {g.entrega.contenido_alumno ? (
                                                    <div className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap mb-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm italic relative">
                                                        <span className="absolute -top-3 left-8 px-3 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest">Resumen de Texto</span>
                                                        "{g.entrega.contenido_alumno}"
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] mb-8 text-[11px]">No se ha adjuntado texto explicativo</div>
                                                )}
                                                {g.entrega.archivos_alumno && g.entrega.archivos_alumno.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {g.entrega.archivos_alumno.map((archivo: any, i: number) => (
                                                            <a key={i} href={archivo.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-white hover:bg-indigo-600 hover:text-white rounded-2xl border border-indigo-100 group/file transition-all shadow-sm">
                                                                <div className="flex items-center gap-4 overflow-hidden">
                                                                    <Paperclip className="w-5 h-5 text-indigo-500 group-hover/file:text-white" />
                                                                    <span className="text-xs font-black truncate">{archivo.nombre}</span>
                                                                </div>
                                                                <ExternalLink className="w-5 h-5 opacity-30 group-hover/file:opacity-100" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer del Hub */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-6">
                    <div className="flex flex-col items-start gap-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            <BarChart3 className="w-3 h-3" /> Consola Maestra de Seguimiento TICO.ia
                        </p>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Sincronización de datos mediante motor cuántico Supabase</span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm">
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" /> Crítico</span>
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" /> Pendiente</span>
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" /> Óptimo</span>
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> Élite</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

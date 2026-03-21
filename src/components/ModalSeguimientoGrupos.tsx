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
    onSelectGrupo?: (grupoId: string | number) => void;
}

export function ModalSeguimientoGrupos({ tarea, grupos, onClose, onUpdate, onSelectGrupo }: ModalSeguimientoGruposProps) {
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

        // Suscripción en tiempo real para actualizaciones de notas/entregas
        const channel = supabase
            .channel(`entregas_tarea_${tarea.id}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'entregas_tareas',
                filter: `tarea_id=eq.${tarea.id}`
            }, () => {
                fetchEntregas();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tarea.id]);

    // Lógica de Priorización y Estadísticas
    const { gruposOrdenados, stats } = useMemo(() => {
        const relevantes = grupos.filter(g => !tarea.grupo_id || tarea.grupo_id === Number(g.id));
        
        const infoGrupos = relevantes.map(grupo => {
            const entrega = entregas.find(e => e.grupo_id === grupo.id);
            const isSpecificTask = tarea.grupo_id === Number(grupo.id);
            
            // Determinar estados precisos
            const haEntregado = !!entrega?.respuesta_texto || (entrega?.archivos_entregados && entrega.archivos_entregados.length > 0);
            
            // Lógica jerárquica de calificación:
            // 1. Nota específica de la entrega (Manual/Slider)
            // 2. Nota cargada en el objeto tarea (Manual Global)
            // 3. Fallback a 0
            const notaActual = entrega?.calificacion !== undefined && entrega?.calificacion !== null 
                ? entrega.calificacion 
                : (tarea.calificacion !== undefined && tarea.calificacion !== null ? tarea.calificacion : 0);

            const estaEvaluado = (entrega?.calificacion !== null && entrega?.calificacion !== undefined) || (tarea.calificacion !== null && tarea.calificacion !== undefined && isSpecificTask);
            
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
            
            // 1. Siempre guardar/actualizar en entregas_tareas (Fuente de verdad del Hub)
            const entregaData = {
                tarea_id: tarea.id,
                grupo_id: Number(grupoId),
                calificacion: nota,
                estado: 'evaluada',
                updated_at: new Date().toISOString()
            };

            const { error: entError } = await supabase
                .from('entregas_tareas')
                .upsert(entregaData, { onConflict: 'tarea_id,grupo_id' });
            
            if (entError) throw entError;

            // 2. Si es una tarea específica para ese grupo, actualizar también la tarea principal
            if (isSpecificTask) {
                const { error: tarError } = await supabase
                    .from('tareas')
                    .update({ 
                        estado: 'completado',
                        calificacion: nota 
                    })
                    .eq('id', tarea.id);
                if (tarError) throw tarError;
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
                                <span className="px-5 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">Versión V5.8.6</span>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{tarea.titulo} (Máx: 10 pts)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                            const isViewingContent = verEntregasId === g.id;

                            return (
                                <div 
                                    key={g.id} 
                                    onClick={() => onSelectGrupo && onSelectGrupo(g.id)}
                                    className={`rounded-[2.5rem] border-2 transition-all flex flex-col cursor-pointer hover:shadow-xl hover:scale-[1.01] ${g.estadoVisual === 'pendiente_nota' ? 'border-amber-200 bg-amber-50/30' : 'border-white bg-white shadow-sm'}`}
                                >
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
                                                            onClick={(e) => { e.stopPropagation(); setVerEntregasId(isViewingContent ? null : g.id); }}
                                                            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isViewingContent ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
                                                        >
                                                            {isViewingContent ? 'Ocultar Entrega' : 'Ver Entrega'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Puntuación Final</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-4xl font-black ${g.notaActual > 0 ? 'text-indigo-600' : 'text-slate-200'}`}>{g.notaActual !== null ? g.notaActual.toFixed(1) : '0.0'}</span>
                                                    <span className="text-xs font-bold text-slate-300">/10</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visor de Trabajo del Alumno */}
                                    {isViewingContent && g.entrega && (
                                        <div className="px-8 pb-8 animate-in slide-in-from-bottom-10 duration-500">
                                            <div className="bg-gradient-to-br from-indigo-50/50 to-white border-2 border-indigo-100/50 rounded-[2.5rem] p-10 shadow-inner">
                                                <div className="flex items-center gap-3 mb-6 border-b border-indigo-100 pb-5">
                                                    <FileText className="w-6 h-6 text-indigo-600" />
                                                    <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Expediente de Entrega</h4>
                                                </div>
                                                {g.entrega.respuesta_texto ? (
                                                    <div className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap mb-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm italic relative">
                                                        <span className="absolute -top-3 left-8 px-3 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest">Resumen de Texto</span>
                                                        "{g.entrega.respuesta_texto}"
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] mb-8 text-[11px]">No se ha adjuntado texto explicativo</div>
                                                )}
                                                {g.entrega.archivos_entregados && g.entrega.archivos_entregados.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {g.entrega.archivos_entregados.map((archivo: any, i: number) => (
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
            </div>
        </div>
    );
}

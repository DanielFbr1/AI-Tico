import { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Save, ChevronRight, Users, FileText, Download } from 'lucide-react';
import { Grupo, HitoGrupo, TareaDetallada } from '../types';
import { toast } from 'sonner';

interface ModalRevisionHitosProps {
    grupos: Grupo[];
    tareasGlobales?: TareaDetallada[];
    onClose: () => void;
    onUpdateBatch: (grupoId: string | number, updates: { hitoId: string, nuevoEstado: 'aprobado' | 'rechazado' | 'pendiente' | 'revision' }[]) => Promise<void>;
    onUpdateTarea?: (tareaId: string, nuevoEstado: 'aprobado' | 'pendiente') => Promise<void>;
    onOpenTask?: (tarea: TareaDetallada) => void;
}

export function ModalRevisionHitos({ grupos, tareasGlobales = [], onClose, onUpdateBatch, onUpdateTarea, onOpenTask }: ModalRevisionHitosProps) {
    const [selectedGroupId, setSelectedGroupId] = useState<string | number | null>(null);
    const [decisiones, setDecisiones] = useState<Record<string, { accion: 'aprobar' | 'rechazar' | 'pendiente', comentario?: string }>>({});

    // Filter groups that have things to review
    const tieneTareasGlobales = tareasGlobales.some(t => t.grupo_id === null && t.estado === 'revision');

    const gruposConRevision = [
        ...(tieneTareasGlobales ? [{ id: 'global', nombre: 'Misiones Globales', miembros: [] }] : []),
        ...grupos.filter(g => {
            const tieneHitos = (g.hitos || []).some(h => h.estado === 'revision');
            const tieneTareas = tareasGlobales.some(t => t.grupo_id === Number(g.id) && t.estado === 'revision');
            return tieneHitos || tieneTareas;
        })
    ];

    const selectedGrupo = selectedGroupId === 'global' 
        ? { id: 'global', nombre: 'Misiones Globales', miembros: [], hitos: [] } as any
        : grupos.find(g => g.id === selectedGroupId);

    const handleDecision = (id: string, accion: 'aprobar' | 'rechazar') => {
        setDecisiones(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), accion }
        }));
    };

    const handleComentario = (id: string, comentario: string) => {
        setDecisiones(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), comentario }
        }));
    };

    const handleSave = async () => {
        if (!selectedGroupId) return;

        // 1. Handle Legacy Milestones
        const hitosPendientes = ((selectedGrupo as any)?.hitos || []).filter((h: any) => h.estado === 'revision');
        const milestoneUpdates: { hitoId: string, nuevoEstado: 'aprobado' | 'rechazado' | 'pendiente' | 'revision' }[] = [];

        for (const hito of hitosPendientes) {
            const decision = decisiones[hito.id];
            if (decision && decision.accion !== 'pendiente') {
                milestoneUpdates.push({
                    hitoId: hito.id,
                    nuevoEstado: decision.accion === 'aprobar' ? 'aprobado' : 'pendiente'
                });
            }
        }

        // 2. Handle New Tasks (from `tareas` table)
        const filterFn = selectedGroupId === 'global' 
            ? (t: TareaDetallada) => t.grupo_id === null && t.estado === 'revision'
            : (t: TareaDetallada) => t.grupo_id === Number(selectedGroupId) && t.estado === 'revision';

        const tareasPendientes = tareasGlobales.filter(filterFn);
        for (const tarea of tareasPendientes) {
            const decision = decisiones[tarea.id];
            if (decision && decision.accion !== 'pendiente' && onUpdateTarea) {
                await onUpdateTarea(tarea.id, decision.accion === 'aprobar' ? 'aprobado' : 'pendiente');
            }
        }

        if (milestoneUpdates.length > 0) {
            await onUpdateBatch(selectedGroupId, milestoneUpdates);
        }

        toast.success("Revisiones procesadas");
        onClose();
    };

    const allItemsToReviewCount = selectedGrupo 
        ? (selectedGroupId === 'global' 
            ? tareasGlobales.filter(t => t.grupo_id === null && t.estado === 'revision').length
            : ((selectedGrupo as any).hitos || []).filter((h: any) => h.estado === 'revision').length + 
              tareasGlobales.filter(t => t.grupo_id === Number(selectedGroupId) && t.estado === 'revision').length)
        : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full p-8 relative flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Revisiones Pendientes</h2>
                            <p className="text-slate-500 font-medium tracking-tight">
                                {selectedGrupo ? `Revisando: ${selectedGrupo.nombre}` : 'Selecciona un grupo para revisar'}
                            </p>
                        </div>
                    </div>
                </div>

                {!selectedGrupo ? (
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {gruposConRevision.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-200" />
                                <p className="font-bold">¡Todo al día! No hay revisiones pendientes.</p>
                            </div>
                        ) : (
                            gruposConRevision.map(g => {
                                const numHitos = ((g as any).hitos || []).filter((h: any) => h.estado === 'revision').length;
                                const numTareas = g.id === 'global' 
                                    ? tareasGlobales.filter(t => t.grupo_id === null && t.estado === 'revision').length
                                    : tareasGlobales.filter(t => t.grupo_id === Number(g.id) && t.estado === 'revision').length;
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => setSelectedGroupId(g.id)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div className="text-left font-bold tracking-tight">
                                                <h4 className="text-slate-800 group-hover:text-indigo-700">{g.nombre}</h4>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">{g.miembros?.length || 0} miembros</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black uppercase tracking-tighter">
                                                {numHitos + numTareas} pendientes
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4">
                            {/* Hitos */}
                            {((selectedGrupo as any).hitos || []).filter((h: any) => h.estado === 'revision').map((hito: any) => {
                                const decision = decisiones[hito.id] || { accion: 'pendiente' };
                                return (
                                    <div key={hito.id} className={`p-5 rounded-2xl border transition-all ${
                                        decision.accion === 'aprobar' ? 'bg-emerald-50 border-emerald-200' :
                                        decision.accion === 'rechazar' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 mr-4">
                                                <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tighter mb-2 inline-block">Hito de Equipo</span>
                                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">{hito.titulo}</h3>
                                                {hito.descripcion && <p className="text-sm text-slate-500 mt-1">{hito.descripcion}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDecision(hito.id, 'aprobar')} className={`p-2 rounded-lg transition-all ${decision.accion === 'aprobar' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100'}`}><CheckCircle2 className="w-5 h-5" /></button>
                                                <button onClick={() => handleDecision(hito.id, 'rechazar')} className={`p-2 rounded-lg transition-all ${decision.accion === 'rechazar' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-rose-100'}`}><XCircle className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Tareas */}
                            {tareasGlobales.filter(t => 
                                (selectedGroupId === 'global' ? t.grupo_id === null : t.grupo_id === Number(selectedGroupId)) && 
                                t.estado === 'revision'
                            ).map((tarea) => {
                                const decision = decisiones[tarea.id] || { accion: 'pendiente' };
                                return (
                                    <div key={tarea.id} className={`p-5 rounded-2xl border transition-all ${
                                        decision.accion === 'aprobar' ? 'bg-emerald-50 border-emerald-200' :
                                        decision.accion === 'rechazar' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                                <div 
                                                    onClick={() => onOpenTask?.(tarea)}
                                                    className="flex-1 mr-4 cursor-pointer hover:bg-slate-50 transition-all rounded-xl p-2 -m-2 group/taskitem"
                                                    title="Hacer clic para ver detalles y evaluar"
                                                >
                                                    <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter mb-2 inline-block group-hover/taskitem:bg-blue-600 group-hover/taskitem:text-white transition-colors">Misión Global</span>
                                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                                        {tarea.titulo}
                                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover/taskitem:translate-x-1 transition-all" />
                                                    </h3>
                                                    {tarea.contenido_alumno && (
                                                        <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic group-hover/taskitem:bg-white transition-colors">"{tarea.contenido_alumno}"</div>
                                                    )}
                                                    {tarea.archivos_alumno && tarea.archivos_alumno.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {tarea.archivos_alumno.map((f, i) => (
                                                                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-indigo-50"><FileText className="w-3 h-3 text-indigo-500" /><span className="max-w-[100px] truncate">{f.nombre}</span><Download className="w-3 h-3 text-slate-400" /></a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDecision(tarea.id, 'aprobar')} className={`p-2 rounded-lg transition-all ${decision.accion === 'aprobar' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100'}`}><CheckCircle2 className="w-5 h-5" /></button>
                                                <button onClick={() => handleDecision(tarea.id, 'rechazar')} className={`p-2 rounded-lg transition-all ${decision.accion === 'rechazar' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-rose-100'}`}><XCircle className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                        {decision.accion === 'rechazar' && (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    placeholder="Feedback: ¿Por qué se rechaza? Volverá a Pendientes."
                                                    className="w-full px-4 py-2 text-sm rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none"
                                                    value={decision.comentario || ''}
                                                    onChange={(e) => handleComentario(tarea.id, e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {allItemsToReviewCount === 0 && <p className="text-center text-slate-400 py-4 font-bold">No hay tareas pendientes de revisión.</p>}
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-100">
                            <button onClick={() => setSelectedGroupId(null)} className="px-6 py-3 text-slate-500 hover:text-slate-800 font-bold text-sm">Volver</button>
                            <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                                <Save className="w-4 h-4" /> Aplicar Cambios
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

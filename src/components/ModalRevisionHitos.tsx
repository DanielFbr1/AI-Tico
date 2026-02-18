import { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Save, ChevronRight, Users } from 'lucide-react';
import { Grupo, HitoGrupo } from '../types';
import { toast } from 'sonner';

interface ModalRevisionHitosProps {
    grupos: Grupo[];
    onClose: () => void;
    onUpdateBatch: (grupoId: string | number, updates: { hitoId: string, nuevoEstado: 'aprobado' | 'rechazado' | 'pendiente' | 'revision' }[]) => Promise<void>;
}

export function ModalRevisionHitos({ grupos, onClose, onUpdateBatch }: ModalRevisionHitosProps) {
    const [selectedGroupId, setSelectedGroupId] = useState<string | number | null>(null);
    const [decisiones, setDecisiones] = useState<Record<string, { accion: 'aprobar' | 'rechazar' | 'pendiente', comentario?: string, nuevoTitulo?: string }>>({});

    // Filter groups that have things to review
    const gruposConRevision = grupos.filter(g => (g.hitos || []).some(h => h.estado === 'revision'));
    const selectedGrupo = grupos.find(g => g.id === selectedGroupId);

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

    const handleTitulo = (id: string, nuevoTitulo: string) => {
        setDecisiones(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), nuevoTitulo }
        }));
    }

    const handleSave = async () => {
        if (!selectedGrupo) return;

        const hitosPendientes = (selectedGrupo.hitos || []).filter(h => h.estado === 'revision');
        const updates: { hitoId: string, nuevoEstado: 'aprobado' | 'rechazado' | 'pendiente' | 'revision' }[] = [];

        for (const hito of hitosPendientes) {
            const decision = decisiones[hito.id];
            if (decision && decision.accion !== 'pendiente') {
                updates.push({
                    hitoId: hito.id,
                    nuevoEstado: decision.accion === 'aprobar' ? 'aprobado' : 'rechazado'
                });
            }
        }

        if (updates.length > 0) {
            await onUpdateBatch(selectedGrupo.id, updates);
            toast.success("Cambios aplicados correctamente");
            onClose(); // Close the entire modal after saving
        }
    };

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
                            <p className="text-slate-500 font-medium">{selectedGrupo ? `Revisando: ${selectedGrupo.nombre}` : 'Selecciona un grupo para revisar'}</p>
                        </div>
                    </div>
                </div>

                {!selectedGrupo ? (
                    // LIST VIEW
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {gruposConRevision.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-200" />
                                <p>¡Todo al día! No hay revisiones pendientes.</p>
                            </div>
                        ) : (
                            gruposConRevision.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGroupId(g.id)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-700">{g.nombre}</h4>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">{g.miembros?.length || 0} miembros</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                                            {(g.hitos || []).filter(h => h.estado === 'revision').length} pendientes
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    // DETAIL VIEW
                    <>
                        <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4">
                            {(selectedGrupo.hitos || []).filter(h => h.estado === 'revision').map((hito) => {
                                const decision = decisiones[hito.id] || { accion: 'pendiente' };

                                return (
                                    <div key={hito.id} className={`p-5 rounded-2xl border transition-all ${decision.accion === 'aprobar' ? 'bg-emerald-50 border-emerald-200' :
                                        decision.accion === 'rechazar' ? 'bg-rose-50 border-rose-200' :
                                            'bg-white border-slate-200'
                                        }`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 mr-4">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tarea a Revisar</label>
                                                {decision.accion === 'aprobar' ? (
                                                    <input
                                                        className="w-full bg-emerald-100/50 border-emerald-200 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                        value={decision.nuevoTitulo !== undefined ? decision.nuevoTitulo : hito.titulo}
                                                        onChange={(e) => handleTitulo(hito.id, e.target.value)}
                                                    />
                                                ) : (
                                                    <h3 className="text-lg font-bold text-slate-800">{hito.titulo}</h3>
                                                )}
                                                {hito.descripcion && <p className="text-sm text-slate-500 mt-1">{hito.descripcion}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDecision(hito.id, 'aprobar')}
                                                    className={`p-2 rounded-lg transition-all ${decision.accion === 'aprobar' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-500'}`}
                                                    title="Aprobar"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDecision(hito.id, 'rechazar')}
                                                    className={`p-2 rounded-lg transition-all ${decision.accion === 'rechazar' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500'}`}
                                                    title="Rechazar"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {(decision.accion === 'rechazar' || decision.accion === 'aprobar') && (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    placeholder={decision.accion === 'rechazar' ? "¿Por qué se rechaza? (Feedback)" : "Comentario opcional"}
                                                    className={`w-full px-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${decision.accion === 'rechazar' ? 'bg-white border-rose-200 focus:ring-rose-500 placeholder:text-rose-300' :
                                                        'bg-white border-emerald-200 focus:ring-emerald-500 placeholder:text-emerald-300'
                                                        }`}
                                                    value={decision.comentario || ''}
                                                    onChange={(e) => handleComentario(hito.id, e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {(selectedGrupo.hitos || []).filter(h => h.estado === 'revision').length === 0 && (
                                <p className="text-center text-slate-400 py-4">No hay tareas pendientes de revisión.</p>
                            )}
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedGroupId(null)}
                                className="px-6 py-3 text-slate-500 hover:text-slate-800 font-bold text-sm"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Aplicar Cambios
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { ProyectoFase, HitoGrupo } from '../types';

interface RoadmapViewProps {
    fases: ProyectoFase[];
    hitosGrupo: HitoGrupo[];
    onToggleHito: (faseId: string, hitoTitulo: string, currentEstado: string) => void;
    currentPhaseId?: string;
    readOnly?: boolean;
    layout?: 'horizontal' | 'vertical' | 'compact-grid';
    onProposeMilestones?: (faseId: string) => void;
    onDeleteHito?: (faseId: string, hitoTitulo: string) => void;
}

export function RoadmapView({ fases = [], hitosGrupo, onToggleHito, currentPhaseId, readOnly = false, layout = 'horizontal', onProposeMilestones, onDeleteHito }: RoadmapViewProps) {
    const [activePhase, setActivePhase] = useState<string>(currentPhaseId || (fases.length > 0 ? fases[0].id : ''));

    // Helper to find the status of a specific milestone for this group
    const getHitoStatus = (faseId: string, hitoTitulo: string) => {
        const hito = hitosGrupo.find(h => h.fase_id === faseId && h.titulo === hitoTitulo);
        return hito?.estado || 'pendiente';
    };

    // LAYOUT TAREAS (KANBAN: Pendientes, En Curso, Completadas)
    if (layout === 'compact-grid') {
        const allTasks: { faseId: string, faseNombre: string, titulo: string, status: string }[] = [];

        fases.forEach(fase => {
            const customHitos = hitosGrupo.filter(h => h.fase_id === fase.id);
            if (customHitos.length > 0) {
                customHitos.forEach(h => {
                    allTasks.push({
                        faseId: fase.id,
                        faseNombre: fase.nombre,
                        titulo: h.titulo,
                        status: h.estado || 'pendiente'
                    });
                });
            }
        });

        const pendientes = allTasks.filter(t => t.status === 'pendiente' || t.status === 'propuesto');
        const enCurso = allTasks.filter(t => t.status === 'revision' || t.status === 'en_progreso' || t.status === 'rechazado');
        const completadas = allTasks.filter(t => t.status === 'aprobado');

        const Column = ({ title, tasks, colorClass }: any) => (
            <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${colorClass}`}>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs">{title}</h4>
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-black text-slate-700">{tasks.length}</span>
                </div>
                <div className="p-3 space-y-3 bg-slate-50/50 flex-1 overflow-y-auto max-h-[400px]">
                    {tasks.length === 0 ? (
                        <div className="text-center py-6 text-slate-300 text-xs italic">Vacío</div>
                    ) : (
                        tasks.map((task: any, i: number) => (
                            <div key={i} className={`bg-white p-3 rounded-xl border shadow-sm hover:shadow-md transition-all group ${task.status === 'rechazado' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
                                <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{task.faseNombre}</div>
                                <div className="text-sm font-bold text-slate-700 mb-2 leading-snug">{task.titulo}</div>

                                {task.status === 'pendiente' && !readOnly && (
                                    <button
                                        onClick={() => onToggleHito(task.faseId, task.titulo, task.status)}
                                        className="w-full py-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-500 rounded-lg text-xs font-bold border border-slate-100 hover:border-indigo-100 transition-colors"
                                    >
                                        Empezar Tarea
                                    </button>
                                )}

                                {task.status === 'rechazado' && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] flex items-center gap-1 text-rose-500 font-bold bg-rose-100/50 px-2 py-1 rounded">
                                            <AlertCircle className="w-3 h-3" />
                                            Tarea Devuelta
                                        </div>
                                        {!readOnly && (
                                            <button
                                                onClick={() => onToggleHito(task.faseId, task.titulo, task.status)}
                                                className="w-full py-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-200 hover:border-rose-300 transition-colors flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                Corregir y Reenviar
                                            </button>
                                        )}
                                    </div>
                                )}

                                {task.status === 'en_progreso' && !readOnly && (
                                    <button
                                        onClick={() => onToggleHito(task.faseId, task.titulo, task.status)}
                                        className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold border border-amber-100 hover:border-amber-200 transition-colors flex items-center justify-center gap-1"
                                    >
                                        Enviar a Revisión
                                    </button>
                                )}

                                {task.status === 'revision' && (
                                    <div className="text-[10px] flex items-center gap-1 text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded justify-center">
                                        <Clock className="w-3 h-3" />
                                        Esperando Revisión
                                    </div>
                                )}

                                {task.status === 'aprobado' && (
                                    <div className="text-[10px] flex items-center gap-1 text-emerald-500 font-bold bg-emerald-50 px-2 py-1 rounded">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Completado
                                    </div>
                                )}

                                {onDeleteHito && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                                                onDeleteHito(task.faseId, task.titulo);
                                            }
                                        }}
                                        className="w-full py-1.5 mt-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold border border-red-100 hover:border-red-200 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" /> Eliminar Tarea
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );

        if (allTasks.length === 0) return <div className="text-center py-8 text-slate-400 italic">No hay tareas definidas. Usa el asistente IA para crear algunas.</div>;

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Column title="Pendientes" tasks={pendientes} colorClass="bg-slate-100" />
                <Column title="En Curso / Revisión" tasks={enCurso} colorClass="bg-amber-50" />
                <Column title="Completadas" tasks={completadas} colorClass="bg-emerald-50" />
            </div>
        )
    }

    // Si layout es vertical, mostramos todo en una lista expandida
    if (layout === 'vertical') {
        return (
            <div className="w-full space-y-6">
                {(fases || []).map((fase) => {
                    const customHitos = hitosGrupo.filter(h => h.fase_id === fase.id);
                    const hitosToShow = customHitos.length > 0
                        ? customHitos.map(h => h.titulo)
                        : (readOnly && fase.hitos ? fase.hitos : []);

                    const totalTasks = hitosToShow.length;
                    const completedTasks = customHitos.filter(h => h.estado === 'aprobado').length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    const isCurrent = fase.estado === 'actual';
                    const isCompleted = fase.estado === 'completado';

                    return (
                        <div key={fase.id} className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isCurrent ? 'border-indigo-200 shadow-xl shadow-indigo-100/50 scale-[1.01]' : 'border-slate-100 shadow-sm opacity-90 hover:opacity-100'}`}>
                            <div className={`px-6 py-4 border-b flex items-center justify-between ${isCurrent ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isCurrent ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {fase.estado}
                                        </span>
                                    </div>
                                    <h4 className={`font-bold text-lg ${isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>{fase.nombre}</h4>
                                </div>
                                {totalTasks > 0 && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-slate-500">{progress}% Completado</span>
                                        <div className="w-24 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 space-y-3">
                                {hitosToShow.length === 0 ? (
                                    <div className="text-center py-8 px-4 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Sparkles className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium text-sm">Sin tareas asignadas</p>
                                        <p className="text-xs text-slate-400 mt-1">Usa el Asistente IA para generar tareas para esta fase.</p>
                                    </div>
                                ) : (
                                    hitosToShow.map((hitoTitulo, index) => {
                                        const hito = hitosGrupo.find(h => h.fase_id === fase.id && h.titulo === hitoTitulo);
                                        const status = hito?.estado || 'pendiente';

                                        return (
                                            <div key={index} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${status === 'aprobado' ? 'bg-emerald-50/50 border-emerald-100' : status === 'revision' ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'}`}>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        disabled={readOnly || status === 'aprobado' || status === 'revision'}
                                                        onClick={() => onToggleHito(fase.id, hitoTitulo, status)}
                                                        className={`shrink-0 transition-transform active:scale-95 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                                    >
                                                        {status === 'aprobado' ? (
                                                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                        ) : status === 'revision' ? (
                                                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200 animate-pulse">
                                                                <Clock className="w-4 h-4 text-amber-600" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-slate-200 group-hover:border-indigo-400">
                                                                <Circle className="w-full h-full text-transparent" />
                                                            </div>
                                                        )}
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${status === 'aprobado' ? 'text-emerald-800 line-through opacity-70' : 'text-slate-700'}`}>
                                                            {hitoTitulo}
                                                        </span>
                                                        {hito?.descripcion && (
                                                            <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">{hito.descripcion}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {onDeleteHito && !readOnly && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                                                                    onDeleteHito(fase.id, hitoTitulo);
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar tarea"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Show phase status ribbon if needed */}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Phases Timeline Scrollable */}
            <div className="flex overflow-x-auto pb-6 gap-2 no-scrollbar">
                {(fases || []).map((fase) => (
                    <button
                        key={fase.id}
                        onClick={() => setActivePhase(fase.id)}
                        className={`flex-shrink-0 px-6 py-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-2 min-w-[160px] ${activePhase === fase.id
                            ? 'bg-white border-purple-600 shadow-xl shadow-purple-100 ring-4 ring-purple-50'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-purple-200'
                            }`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-widest ${fase.estado === 'completado' ? 'text-emerald-500' :
                            fase.estado === 'actual' ? 'text-purple-600' : 'text-slate-400'
                            }`}>
                            {fase.estado}
                        </span>
                        <span className={`text-md font-bold leading-tight text-left ${activePhase === fase.id ? 'text-slate-800' : 'text-slate-500'
                            }`}>
                            {fase.nombre}
                        </span>
                    </button>
                ))}
            </div>

            {/* Milestones List for Active Phase */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    Hitos de {fases.find(f => f.id === activePhase)?.nombre || 'esta fase'}
                </h3>

                <div className="space-y-3">
                    {/* Dynamic Milestones for Active Phase */}
                    {(() => {
                        const phase = fases.find(f => f.id === activePhase);
                        if (!phase) return null;

                        const customHitos = hitosGrupo.filter(h => h.fase_id === phase.id).map(h => h.titulo);
                        const hitosToRender = customHitos.length > 0 ? customHitos : (readOnly ? (phase.hitos || []) : []);

                        if (hitosToRender.length === 0) {
                            return <p className="text-slate-400 italic text-center py-4">No hay hitos definidos para esta fase.</p>;
                        }

                        return hitosToRender.map((hitoTitulo, index) => {
                            const status = getHitoStatus(activePhase, hitoTitulo);

                            return (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${status === 'aprobado' ? 'bg-emerald-50 border-emerald-100' :
                                        status === 'revision' ? 'bg-amber-50 border-amber-100' :
                                            'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <button
                                            disabled={readOnly || status === 'aprobado' || status === 'revision'}
                                            onClick={() => onToggleHito(activePhase, hitoTitulo, status)}
                                            className={`shrink-0 transition-transform active:scale-95 ${readOnly ? 'cursor-default' : 'cursor-pointer'
                                                }`}
                                        >
                                            {status === 'aprobado' ? (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            ) : status === 'revision' ? (
                                                <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
                                            ) : (
                                                <Circle className="w-6 h-6 text-slate-300 hover:text-purple-500" />
                                            )}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${status === 'aprobado' ? 'text-slate-700' : 'text-slate-600'}`}>
                                                {hitoTitulo}
                                            </span>
                                            {status === 'revision' && (
                                                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Esperando aprobación del profesor</span>
                                            )}
                                            {status === 'aprobado' && (
                                                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Completado y verificado</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm">
                                            +10 XP
                                        </div>

                                        {onDeleteHito && !readOnly && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                                                        onDeleteHito(activePhase, hitoTitulo);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar tarea"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );
}

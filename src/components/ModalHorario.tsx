import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getAsignaturaStyles } from '../data/asignaturas';

interface ModalHorarioProps {
    isOpen: boolean;
    onClose: () => void;
    alumnoId: string;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS_PREDEFINIDAS = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 11:30 (Recreo)',
    '11:30 - 12:30',
    '12:30 - 13:30',
    '13:30 - 14:30'
];

export function ModalHorario({ isOpen, onClose, alumnoId }: ModalHorarioProps) {
    // Representación del horario: horario[horaIndex][diaIndex]
    const [horario, setHorario] = useState<string[][]>([]);
    // Representación de las horas para poder editarlas
    const [horas, setHoras] = useState<string[]>([]);

    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (isOpen && alumnoId) {
            const cargarHorario = async () => {
                const { data, error } = await supabase
                    .from('horarios_alumno')
                    .select('horario, horas')
                    .eq('alumno_user_id', alumnoId)
                    .maybeSingle();

                if (!error && data) {
                    setHoras(data.horas || HORAS_PREDEFINIDAS);
                    setHorario(data.horario || (data.horas || HORAS_PREDEFINIDAS).map(() => Array(DIAS.length).fill('')));
                } else {
                    // No existe aún, usar valores predeterminados
                    setHoras(HORAS_PREDEFINIDAS);
                    setHorario(HORAS_PREDEFINIDAS.map(() => Array(DIAS.length).fill('')));
                }
            };
            cargarHorario();
        }
    }, [isOpen, alumnoId]);

    const handleChange = (horaIndex: number, diaIndex: number, valor: string) => {
        const upperValor = valor.toUpperCase();
        const nuevoHorario = horario.map((fila, i) =>
            i === horaIndex ? fila.map((columna, j) => (j === diaIndex ? upperValor : columna)) : fila
        );
        setHorario(nuevoHorario);
    };

    const handleChangeHora = (index: number, valor: string) => {
        const nuevasHoras = horas.map((h, i) => (i === index ? valor : h));
        setHoras(nuevasHoras);
    };

    const agregarFila = () => {
        setHoras([...horas, 'Nueva hora']);
        setHorario([...horario, Array(DIAS.length).fill('')]);
    };

    const eliminarFila = (index: number) => {
        if (horas.length <= 1) {
            toast.error('Debes mantener al menos una franja horaria.');
            return;
        }
        const nuevasHoras = horas.filter((_, i) => i !== index);
        const nuevoHorario = horario.filter((_, i) => i !== index);
        setHoras(nuevasHoras);
        setHorario(nuevoHorario);
    };

    const guardarHorario = async () => {
        setGuardando(true);
        try {
            // Intentar upsert (insertar o actualizar si ya existe)
            const { error } = await supabase
                .from('horarios_alumno')
                .upsert({
                    alumno_user_id: alumnoId,
                    horario: horario,
                    horas: horas,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'alumno_user_id' });

            if (error) {
                console.error('Error al guardar horario:', error);
                toast.error('Error al guardar el horario');
            } else {
                toast.success('Horario guardado correctamente');
                onClose();
            }
        } catch (err) {
            console.error('Error al guardar horario:', err);
            toast.error('Error al guardar el horario');
        } finally {
            setGuardando(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, horaIndex: number, diaIndex: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            let nextD = diaIndex + 1;
            let nextH = horaIndex;

            if (nextD >= DIAS.length) {
                nextD = 0;
                nextH++;
            }

            while (nextH < horas.length && horas[nextH].toLowerCase().includes('recreo')) {
                nextH++;
            }

            if (nextH < horas.length) {
                const nextEl = document.getElementById(`celda-${nextH}-${nextD}`);
                if (nextEl) nextEl.focus();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl rounded-[1.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[95vh]">

                {/* Compact Header with integrated Save/Close */}
                <div className="flex items-center justify-between p-3 md:p-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-base md:text-lg font-black text-slate-800 tracking-tight">Mi Horario</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={guardarHorario}
                            className="px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">Guardar</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-slate-50 custom-scrollbar relative">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className="p-2 border-b-2 border-slate-100 font-black text-slate-400 uppercase tracking-widest text-[10px] md:text-xs w-[120px] md:w-[150px]">
                                        Hora a Editar
                                    </th>
                                    {DIAS.map(dia => (
                                        <th key={dia} className="p-2 border-b-2 border-slate-100 font-black text-slate-600 uppercase tracking-widest text-xs md:text-sm text-center">
                                            {dia}
                                        </th>
                                    ))}
                                    <th className="border-b-2 border-slate-100 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {horas.map((hora, horaIndex) => {
                                    const esFilaRecreo = hora.toLowerCase().includes('recreo');

                                    return (
                                        <tr key={horaIndex} className={`group transition-colors ${esFilaRecreo ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}>
                                            {/* Editor de Horas */}
                                            <td className="p-1 md:p-2 border-b border-slate-100 align-middle">
                                                <input
                                                    type="text"
                                                    value={hora}
                                                    onChange={(e) => handleChangeHora(horaIndex, e.target.value)}
                                                    placeholder="00:00 - 00:00"
                                                    className="w-full h-full min-h-[40px] font-bold text-[10px] md:text-xs text-slate-600 bg-transparent border-2 border-transparent outline-none focus:border-emerald-300 focus:bg-white rounded-xl p-2 transition-all text-center md:text-left"
                                                />
                                            </td>

                                            {/* Asignaturas */}
                                            {DIAS.map((dia, diaIndex) => {
                                                const valor = horario[horaIndex] ? (horario[horaIndex][diaIndex] || '') : '';
                                                const isCeldaRecreo = valor.toLowerCase().includes('recreo');

                                                let backgroundClass = 'bg-transparent hover:bg-white focus:bg-white';
                                                let textClass = 'text-slate-700';

                                                if (!esFilaRecreo) {
                                                    if (isCeldaRecreo) {
                                                        backgroundClass = 'bg-amber-50 focus:bg-amber-100 border-amber-200';
                                                        textClass = 'text-amber-500/70 font-black tracking-widest';
                                                    } else if (valor.length > 0) {
                                                        const asigStyles = getAsignaturaStyles(valor);
                                                        if (asigStyles) {
                                                            backgroundClass = asigStyles.lightBgClass;
                                                            textClass = asigStyles.textClass;
                                                        } else {
                                                            backgroundClass = 'bg-slate-100';
                                                        }
                                                    }
                                                }

                                                return (
                                                    <td key={`${horaIndex}-${diaIndex}`} className="p-1 md:p-2 border-b border-slate-100 border-l border-l-slate-50 align-top">
                                                        {esFilaRecreo ? (
                                                            <div className="w-full h-12 md:h-14 text-center text-[10px] md:text-xs font-black text-amber-500/50 uppercase tracking-widest flex items-center justify-center hover:bg-amber-100/30 rounded-xl transition-all">
                                                                {diaIndex === 2 ? 'R E C R E O' : ''}
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                id={`celda-${horaIndex}-${diaIndex}`}
                                                                value={valor}
                                                                onChange={(e) => handleChange(horaIndex, diaIndex, e.target.value)}
                                                                onKeyDown={(e) => handleKeyDown(e, horaIndex, diaIndex)}
                                                                placeholder="ASIGNATURA"
                                                                className={`w-full h-12 md:h-14 p-2 text-[10px] md:text-xs font-black text-center uppercase border-2 border-transparent hover:border-slate-200 focus:border-emerald-500 rounded-xl outline-none resize-none transition-all shadow-sm ${backgroundClass} ${textClass} placeholder:text-slate-300/50 flex items-center justify-center pt-3`}
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            {/* Action para Borrar fila */}
                                            <td className="p-1 border-b border-slate-100 border-l border-l-slate-50 align-middle text-center">
                                                <button
                                                    onClick={() => eliminarFila(horaIndex)}
                                                    className="p-1.5 md:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Eliminar hora"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Añadir nueva fila */}
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={agregarFila}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-emerald-100"
                            >
                                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                Añadir una hora más
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

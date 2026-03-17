import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Star, FileText, Users, Eye, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TareaDetallada, Grupo } from '../types';
import { ModalCrearTareaClassroom } from './ModalCrearTareaClassroom';
import { ModalDetalleTarea } from './ModalDetalleTarea';
import { toast } from 'sonner';

interface VistaCalendarioProps {
    proyectoId: string;
    grupos: Grupo[];
    grupoId?: number | string; // Opcional: si existe, es vista de alumno
}

export function VistaCalendario({ proyectoId, grupos, grupoId }: VistaCalendarioProps) {
    const isAlumno = !!grupoId;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tareas, setTareas] = useState<TareaDetallada[]>([]);
    const [modalCrear, setModalCrear] = useState(false);
    const [tareaSeleccionada, setTareaSeleccionada] = useState<TareaDetallada | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTareas = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('tareas')
                .select('*')
                .eq('proyecto_id', proyectoId);

            // Si es vista de alumno, filtrar solo sus tareas o las globales
            if (isAlumno) {
                query = query.or(`grupo_id.eq.${grupoId},grupo_id.is.null`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setTareas(data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (proyectoId) fetchTareas();
    }, [proyectoId]);

    // Realtime subscription
    useEffect(() => {
        if (!proyectoId) return;
        const channel = supabase.channel(`tareas_proyecto_${proyectoId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tareas',
                filter: `proyecto_id=eq.${proyectoId}`
            }, () => {
                fetchTareas();
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [proyectoId]);

    // Calendar calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Monday start
    const daysInMonth = lastDayOfMonth.getDate();

    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const tareasDelMes = useMemo(() => {
        const map: Record<number, TareaDetallada[]> = {};
        tareas.forEach(t => {
            if (t.fecha_entrega) {
                const d = new Date(t.fecha_entrega);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    const day = d.getDate();
                    if (!map[day]) map[day] = [];
                    map[day].push(t);
                }
            }
        });
        return map;
    }, [tareas, month, year]);

    // Build calendar grid
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
    while (calendarDays.length % 7 !== 0) calendarDays.push(null);

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isPast = (day: number) => {
        const d = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    };

    const formatRelativeDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = d.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return { text: `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`, color: 'text-red-500' };
        if (days === 0) return { text: 'Vence hoy', color: 'text-amber-600' };
        if (days === 1) return { text: 'Vence mañana', color: 'text-amber-500' };
        if (days <= 7) return { text: `Vence en ${days} días`, color: 'text-blue-500' };
        return { text: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), color: 'text-slate-500' };
    };

    // Helper para badge de estado
    const getEstadoBadge = (estado: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            pendiente:  { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pendiente' },
            en_progreso: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En curso' },
            revision:   { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En revisión' },
            aprobado:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobada' },
            completado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completada' },
            rechazado:  { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazada' },
            propuesto:  { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Propuesta' },
        };
        const s = map[estado] || map.pendiente;
        return <span className={`${s.bg} ${s.text} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider`}>{s.label}</span>;
    };

    const getEstadoCalColor = (estado: string) => {
        const m: Record<string, string> = {
            pendiente: 'bg-slate-100 text-slate-600',
            en_progreso: 'bg-blue-100 text-blue-700',
            revision: 'bg-amber-100 text-amber-700',
            aprobado: 'bg-emerald-100 text-emerald-700',
            completado: 'bg-emerald-100 text-emerald-700',
            rechazado: 'bg-red-100 text-red-700',
            propuesto: 'bg-purple-100 text-purple-700',
        };
        return m[estado] || m.pendiente;
    };

    const handleEstadoChange = async (tareaId: string, nuevoEstado: string) => {
        try {
            const { error } = await supabase.from('tareas').update({ estado: nuevoEstado }).eq('id', tareaId);
            if (error) throw error;
            setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado as any } : t));
            if (tareaSeleccionada?.id === tareaId) {
                setTareaSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado as any } : null);
            }
            toast.success(`Estado actualizado a: ${nuevoEstado.replace('_', ' ')}`);
        } catch (err) {
            console.error('Error updating estado:', err);
            toast.error('Error al cambiar el estado');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Calendario de Tareas</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{tareas.length} tarea{tareas.length !== 1 ? 's' : ''} totales</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isAlumno && (
                        <button
                            onClick={() => setModalCrear(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Crear tarea</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ========= CALENDAR VIEW ========= */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-slate-800 capitalize">{monthName}</h3>
                        <button onClick={goToToday} className="text-[10px] text-blue-500 font-bold uppercase tracking-widest hover:underline">Hoy</button>
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((day, idx) => {
                        const tareasDelDia = day ? (tareasDelMes[day] || []) : [];
                        return (
                            <div
                                key={idx}
                                className={`min-h-[80px] md:min-h-[110px] border-b border-r border-slate-100 p-1.5 md:p-2 transition-colors ${
                                    day === null ? 'bg-slate-50/30' :
                                    isToday(day) ? 'bg-blue-50/50' :
                                    isPast(day) ? 'bg-slate-50/20' : 'bg-white hover:bg-slate-50/50'
                                }`}
                            >
                                {day !== null && (
                                    <>
                                        <div className={`text-xs font-bold mb-1 ${
                                            isToday(day) ? 'w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center' :
                                            isPast(day) ? 'text-slate-300' : 'text-slate-600'
                                        }`}>
                                            {day}
                                        </div>
                                        <div className="space-y-1">
                                            {tareasDelDia.slice(0, 2).map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTareaSeleccionada(t)}
                                                    className={`w-full text-left px-1.5 py-1 ${getEstadoCalColor(t.estado)} rounded-md text-[10px] font-bold truncate hover:opacity-80 transition-colors leading-tight`}
                                                >
                                                    {t.titulo}
                                                </button>
                                            ))}
                                            {tareasDelDia.length > 2 && (
                                                <span className="text-[9px] text-slate-400 font-bold px-1">+{tareasDelDia.length - 2} más</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL CREAR TAREA */}
            {modalCrear && (
                <ModalCrearTareaClassroom
                    proyectoId={proyectoId}
                    grupos={grupos}
                    onClose={() => setModalCrear(false)}
                    onTareaCreada={(t) => {
                        setTareas(prev => [t, ...prev]);
                    }}
                />
            )}

            {/* MODAL DETALLE TAREA */}
            {tareaSeleccionada && (
                <ModalDetalleTarea
                    tarea={tareaSeleccionada}
                    grupos={grupos}
                    onClose={() => setTareaSeleccionada(null)}
                    isStudent={isAlumno}
                    onDelete={isAlumno ? undefined : async (id) => {
                        try {
                            await supabase.from('tareas').delete().eq('id', id);
                            setTareas(prev => prev.filter(t => t.id !== id));
                            setTareaSeleccionada(null);
                            toast.success('Tarea eliminada');
                        } catch {
                            toast.error('Error al eliminar');
                        }
                    }}
                    onEstadoChange={isAlumno ? () => {} : handleEstadoChange}
                />
            )}
        </div>
    );
}



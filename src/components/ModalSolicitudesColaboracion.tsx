import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Users, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface Solicitud {
    id: string;
    proyecto_id: string;
    profesor_solicitante_id: string;
    estado: 'pendiente' | 'aceptada' | 'rechazada';
    created_at: string;
    proyecto: { nombre: string };
    perfil_solicitante: { nombre: string; email: string };
}

export function SolicitudesColaboracion({ onUpdate, solicitudDirecta, onClose }: { onUpdate: () => void; solicitudDirecta?: Solicitud; onClose?: () => void }) {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [loading, setLoading] = useState(!solicitudDirecta);
    const [procesando, setProcesando] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (solicitudDirecta) {
            setSolicitudes([solicitudDirecta]);
            setLoading(false);
        } else if (user) {
            fetchSolicitudes();
        }
    }, [user, solicitudDirecta]);

    const fetchSolicitudes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('peticiones_colaboracion')
                .select(`
                    id, 
                    proyecto_id, 
                    profesor_solicitante_id, 
                    estado, 
                    created_at,
                    proyecto:proyectos(nombre),
                    profesor_solicitante:profiles!profesor_solicitante_id(nombre, email)
                `)
                .eq('profesor_propietario_id', user!.id)
                .eq('estado', 'pendiente')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const mapped = (data || []).map((s: any) => ({
                ...s,
                perfil_solicitante: s.profesor_solicitante
            }));

            setSolicitudes(mapped);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (solicitud: Solicitud, decision: 'aceptada' | 'rechazada') => {
        if (!user) return;
        setProcesando(solicitud.id);
        try {
            if (decision === 'aceptada') {
                const { error: cError } = await supabase
                    .from('proyecto_colaboradores')
                    .insert([{
                        proyecto_id: solicitud.proyecto_id,
                        profesor_id: solicitud.profesor_solicitante_id,
                        profesor_propietario_id: user.id,
                        rol: 'colaborador'
                    }]);

                if (cError) throw cError;
            }

            const { error: pError } = await supabase
                .from('peticiones_colaboracion')
                .update({ estado: decision })
                .eq('id', solicitud.id);

            if (pError) throw pError;

            toast.success(decision === 'aceptada' ? 'Colaborador añadido con éxito' : 'Petición rechazada');
            setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id));
            onUpdate();
        } catch (err) {
            console.error('Error procesando decisión:', err);
            toast.error('Hubo un error al procesar la solicitud.');
        } finally {
            setProcesando(null);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="mb-8">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Solicitudes de Colaboración</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Colabora con otros docentes</p>
                        </div>
                    </div>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                        <p className="font-black uppercase tracking-widest text-[10px]">Sincronizando solicitudes...</p>
                    </div>
                ) : solicitudes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-sm">
                            <Users className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 mb-2 tracking-tight">Todo al día</h3>
                        <p className="font-black uppercase tracking-widest text-[10px] text-slate-300">No tienes solicitudes pendientes en este momento</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {solicitudes.map((solicitud) => (
                            <div key={solicitud.id} className="p-6 bg-white rounded-[2rem] border-2 border-slate-50 flex flex-col justify-between gap-6 group hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-slate-50 border-2 border-white rounded-[1.25rem] flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <Users className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 tracking-tight text-xl truncate">
                                            {solicitud.perfil_solicitante?.nombre || solicitud.perfil_solicitante?.email?.split('@')[0] || 'Docente'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                Interesado en
                                            </span>
                                            <p className="text-xs font-bold text-slate-500 truncate">
                                                {solicitud.proyecto?.nombre}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-center gap-3 mt-auto">
                                    <button
                                        onClick={() => handleDecision(solicitud, 'aceptada')}
                                        disabled={!!procesando}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                    >
                                        {procesando === solicitud.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Aceptar
                                    </button>
                                    <button
                                        onClick={() => handleDecision(solicitud, 'rechazada')}
                                        disabled={!!procesando}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {solicitudes.length > 0 && (
                <div className="mt-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center gap-4 transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
                        Al aceptar, el docente tendrá permisos completos para gestionar equipos, tareas y recursos de este proyecto.
                    </p>
                </div>
            )}
        </div>
    );
}

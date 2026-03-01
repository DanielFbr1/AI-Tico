import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MessageCircle, Loader2, Users, ChevronRight, X } from 'lucide-react';
import { ChatFamiliaProfesor } from './ChatFamiliaProfesor';

interface ConversacionFamilia {
    familia_user_id: string;
    familia_nombre: string;
    alumno_nombre: string;
    ultimo_mensaje: string;
    ultimo_fecha: string;
    no_leidos: number;
}

interface MensajesFamiliasProfesorProps {
    profesorId: string;
    profesorNombre: string;
    onBack: () => void;
}

export function MensajesFamiliasProfesor({ profesorId, profesorNombre, onBack }: MensajesFamiliasProfesorProps) {
    const [conversaciones, setConversaciones] = useState<ConversacionFamilia[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<ConversacionFamilia | null>(null);

    useEffect(() => {
        fetchConversaciones();
    }, [profesorId]);

    const fetchConversaciones = async () => {
        try {
            setLoading(true);

            // Fetch all messages where this teacher is involved
            const { data: mensajes, error } = await supabase
                .from('mensajes_familia_profesor')
                .select('*')
                .eq('profesor_user_id', profesorId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!mensajes || mensajes.length === 0) {
                setConversaciones([]);
                return;
            }

            // Group by familia_user_id + alumno_nombre to get unique conversations
            const convMap = new Map<string, ConversacionFamilia>();

            for (const msg of mensajes) {
                const key = `${msg.familia_user_id}-${msg.alumno_nombre}`;
                if (!convMap.has(key)) {
                    // Get family name from profiles
                    convMap.set(key, {
                        familia_user_id: msg.familia_user_id,
                        familia_nombre: '', // will be filled below
                        alumno_nombre: msg.alumno_nombre,
                        ultimo_mensaje: msg.mensaje,
                        ultimo_fecha: msg.created_at,
                        no_leidos: msg.sender_id !== profesorId && !msg.leido ? 1 : 0
                    });
                } else {
                    const conv = convMap.get(key)!;
                    if (msg.sender_id !== profesorId && !msg.leido) {
                        conv.no_leidos++;
                    }
                }
            }

            // Get family names
            const familiaIds = [...new Set([...convMap.values()].map(c => c.familia_user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, nombre, email')
                .in('id', familiaIds);

            const profileMap = new Map<string, string>();
            (profiles || []).forEach((p: any) => {
                profileMap.set(p.id, p.nombre || p.email?.split('@')[0] || 'Familia');
            });

            const convList = [...convMap.values()].map(c => ({
                ...c,
                familia_nombre: profileMap.get(c.familia_user_id) || 'Familia'
            }));

            // Sort by last message date (newest first)
            convList.sort((a, b) => new Date(b.ultimo_fecha).getTime() - new Date(a.ultimo_fecha).getTime());

            setConversaciones(convList);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    // If viewing a specific chat
    if (selectedChat) {
        return (
            <ChatFamiliaProfesor
                currentUserId={profesorId}
                currentUserName={profesorNombre}
                currentRole="profesor"
                otherUserId={selectedChat.familia_user_id}
                otherUserName={selectedChat.familia_nombre}
                alumnoNombre={selectedChat.alumno_nombre}
                onBack={() => { setSelectedChat(null); fetchConversaciones(); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfdff]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                                Mensajes de Familias
                            </h1>
                            <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                {conversaciones.length} conversación{conversaciones.length !== 1 ? 'es' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : conversaciones.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <MessageCircle className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight mb-2">Sin mensajes</h3>
                        <p className="text-slate-400 text-sm font-medium">Las familias podrán escribirte desde su panel</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {conversaciones.map((conv) => (
                            <button
                                key={`${conv.familia_user_id}-${conv.alumno_nombre}`}
                                onClick={() => setSelectedChat(conv)}
                                className="w-full bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all text-left flex items-center gap-4"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200 shrink-0">
                                    {conv.familia_nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-slate-800 tracking-tight text-base truncate">{conv.familia_nombre}</h3>
                                        {conv.no_leidos > 0 && (
                                            <span className="w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shrink-0">
                                                {conv.no_leidos}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                                        Sobre: {conv.alumno_nombre}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate font-medium">
                                        {conv.ultimo_mensaje}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end shrink-0 gap-1">
                                    <span className="text-[9px] text-slate-400 font-bold">
                                        {new Date(conv.ultimo_fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

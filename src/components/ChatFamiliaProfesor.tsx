import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Loader2, MessageCircle, User } from 'lucide-react';
import { crearNotificacion } from '../lib/notificaciones';

interface ChatFamiliaProfesorProps {
    currentUserId: string;
    currentUserName: string;
    currentRole: 'familia' | 'profesor';
    otherUserId: string;
    otherUserName: string;
    alumnoNombre: string;
    onBack: () => void;
}

interface Mensaje {
    id: string;
    mensaje: string;
    sender_id: string;
    created_at: string;
    leido: boolean;
}

export function ChatFamiliaProfesor({
    currentUserId,
    currentUserName,
    currentRole,
    otherUserId,
    otherUserName,
    alumnoNombre,
    onBack
}: ChatFamiliaProfesorProps) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const familiaId = currentRole === 'familia' ? currentUserId : otherUserId;
    const profesorId = currentRole === 'profesor' ? currentUserId : otherUserId;

    useEffect(() => {
        fetchMensajes();

        // Real-time subscription
        const channel = supabase
            .channel(`chat-${familiaId}-${profesorId}-${alumnoNombre}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensajes_familia_profesor',
                    filter: `familia_user_id=eq.${familiaId}`
                },
                (payload) => {
                    const newMsg = payload.new as Mensaje;
                    // Only add if it matches our conversation
                    setMensajes(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [familiaId, profesorId, alumnoNombre]);

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    useEffect(() => {
        // Mark unread messages as read
        markAsRead();
    }, [mensajes]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMensajes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('mensajes_familia_profesor')
                .select('*')
                .eq('familia_user_id', familiaId)
                .eq('profesor_user_id', profesorId)
                .eq('alumno_nombre', alumnoNombre)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMensajes(data || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        const unread = mensajes.filter(m => m.sender_id !== currentUserId && !m.leido);
        if (unread.length === 0) return;

        await supabase
            .from('mensajes_familia_profesor')
            .update({ leido: true })
            .in('id', unread.map(m => m.id));
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('mensajes_familia_profesor')
                .insert({
                    familia_user_id: familiaId,
                    profesor_user_id: profesorId,
                    alumno_nombre: alumnoNombre,
                    mensaje: newMessage.trim(),
                    sender_id: currentUserId
                });

            if (error) throw error;
            
            // === NOTIFICACIONES ===
            try {
                const targetUserId = currentRole === 'familia' ? profesorId : familiaId;
                await crearNotificacion({
                    userId: targetUserId,
                    tipo: 'mensaje_familia',
                    titulo: `Nuevo mensaje de ${currentUserName}`,
                    descripcion: newMessage.trim().length > 50 
                        ? newMessage.trim().substring(0, 47) + '...' 
                        : newMessage.trim(),
                    metadata: { 
                        sender_id: currentUserId, 
                        alumno_nombre: alumnoNombre,
                        tipo_chat: 'familia_profesor'
                    }
                });
            } catch (notifErr) {
                console.error('Error enviando notificación de chat:', notifErr);
            }

            setNewMessage('');
            inputRef.current?.focus();
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' ' +
            d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const accentColor = currentRole === 'familia' ? 'emerald' : 'blue';

    return (
        <div className="fixed inset-0 bg-[#fcfdff] flex flex-col overflow-hidden z-[70]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className={`w-12 h-12 bg-gradient-to-br ${currentRole === 'familia' ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                            {otherUserName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base md:text-lg font-black text-slate-800 tracking-tight truncate">
                                {otherUserName}
                            </h1>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                {currentRole === 'familia' ? 'Profesor/a' : 'Familia'} • Sobre {alumnoNombre}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                        </div>
                    ) : mensajes.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight mb-2">Sin mensajes aún</h3>
                            <p className="text-slate-400 text-sm font-medium">
                                Envía el primer mensaje para iniciar la conversación
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {mensajes.map((msg) => {
                                const isMine = msg.sender_id === currentUserId;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] md:max-w-[65%]`}>
                                            {!isMine && (
                                                <div className="flex items-center gap-2 mb-1 ml-1">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${currentRole === 'familia' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                                                        {otherUserName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-bold">{otherUserName}</span>
                                                </div>
                                            )}
                                            <div
                                                className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${isMine
                                                    ? `bg-${accentColor}-600 text-white rounded-br-md`
                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                                                    }`}
                                                style={isMine ? { backgroundColor: accentColor === 'emerald' ? '#059669' : '#2563eb' } : {}}
                                            >
                                                {msg.mensaje}
                                            </div>
                                            <div className={`text-[9px] text-slate-400 mt-1 font-bold ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                                {formatTime(msg.created_at)}
                                                {isMine && msg.leido && ' ✓✓'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </main>

            {/* Message Input */}
            <div className="bg-white border-t border-slate-200 shrink-0 sticky bottom-0 z-10">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-sm"
                            placeholder="Escribe un mensaje..."
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ backgroundColor: accentColor === 'emerald' ? '#059669' : '#2563eb' }}
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

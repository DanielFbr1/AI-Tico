import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Mic, Loader2, Volume2, StopCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface MensajeChat {
    id: string | number; // Support both temp client UUID and server serial ID
    created_at: string;
    grupo_id: string;
    remitente: string;
    contenido: string;
    audio_url?: string | null;
    tipo: 'alumno' | 'profesor';
    modo: 'equipo';
    tarea_id?: string | null;
    tarea_titulo?: string | null;
    tempId?: string; // Optional client-side ID for reconciliation
}

interface ChatGrupoProps {
    grupoId: string;
    miembroActual: string;
    esProfesor?: boolean;
    tareaId?: string;
    tareaTitulo?: string;
}

export function ChatGrupo({ grupoId, miembroActual, esProfesor, tareaId, tareaTitulo }: ChatGrupoProps) {
    const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Audio Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const scrollToBottom = () => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        if (!grupoId) return;
        
        fetchMensajes();

        // Realtime Subscription
        const channelName = `chat_grupo_${grupoId}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensajes_chat',
                    filter: `grupo_id=eq.${grupoId}`
                },
                (payload) => {
                    const newMsg = payload.new as MensajeChat;
                    const matchesTarea = tareaId ? newMsg.tarea_id === tareaId : !newMsg.tarea_id;
                    
                    if (newMsg.modo === 'equipo' && matchesTarea) {
                        setMensajes((prev) => {
                            // Prevent duplicates comparing both real ID and tempId
                            if (prev.some(m => m.id === newMsg.id || (m.tempId && m.tempId === String(newMsg.id)))) return prev;
                            return [...prev, newMsg];
                        });
                        setTimeout(scrollToBottom, 50);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [grupoId, tareaId, miembroActual]);

    const fetchMensajes = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('mensajes_chat')
                .select('*')
                .eq('grupo_id', grupoId)
                .eq('modo', 'equipo');
            
            if (tareaId) {
                query = query.eq('tarea_id', tareaId);
            } else {
                query = query.is('tarea_id', null);
            }

            const { data, error } = await query.order('created_at', { ascending: true });

            if (error) throw error;
            setMensajes(data || []);
            setTimeout(scrollToBottom, 500);
        } catch (err) {
            console.error('Error fetching group chat:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (audioUrl?: string) => {
        if ((!input.trim() && !audioUrl) || loading) return;

        const msgContent = input.trim();
        const tempId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        // Optimistic Message
        const optimisticMsg: MensajeChat = {
            id: tempId,
            tempId: tempId,
            created_at: now,
            grupo_id: grupoId,
            remitente: miembroActual,
            contenido: audioUrl ? '🎤 Mensaje de voz' : msgContent,
            audio_url: audioUrl || null,
            tipo: esProfesor ? 'profesor' : 'alumno',
            modo: 'equipo',
            tarea_id: tareaId || null,
            tarea_titulo: tareaTitulo || null
        };

        setMensajes(prev => [...prev, optimisticMsg]);
        setTimeout(scrollToBottom, 50);

        if (!audioUrl) setInput('');

        try {
            const { data, error } = await supabase
                .from('mensajes_chat')
                .insert([{
                    grupo_id: grupoId,
                    remitente: miembroActual,
                    contenido: audioUrl ? '🎤 Mensaje de voz' : msgContent,
                    audio_url: audioUrl || null,
                    tipo: esProfesor ? 'profesor' : 'alumno',
                    modo: 'equipo',
                    tarea_id: tareaId || null,
                    tarea_titulo: tareaTitulo || null
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setMensajes(prev => prev.map(m => m.id === tempId ? { ...data, tempId } : m));
            }
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error('Error al enviar mensaje');
            setMensajes(prev => prev.filter(m => m.id !== tempId));
            if (!audioUrl) setInput(msgContent);
        }
    };

    const startRecordingRobust = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = e => chunks.push(e.data);

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
                const fileName = `audio_${Date.now()}.webm`;

                const { error } = await supabase.storage
                    .from('chat-audio')
                    .upload(fileName, blob);

                if (!error) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('chat-audio')
                        .getPublicUrl(fileName);
                    await handleSend(publicUrl);
                } else {
                    toast.error("Error subiendo audio");
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (e) {
            toast.error("Error de micrófono");
        }
    };

    const stopRecordingRobust = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    const speakMessage = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="bg-white flex flex-col h-full overflow-hidden">
            <div ref={containerRef} className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-6 space-y-3 md:space-y-4 bg-slate-50/30">
                {loading && mensajes.length === 0 ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                    </div>
                ) : mensajes.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-400 font-medium">No hay mensajes aún. ¡Saluda a tu equipo!</p>
                    </div>
                ) : (
                    mensajes.map((msg) => {
                        const esMio = msg.remitente === miembroActual;
                        const esProfe = msg.tipo === 'profesor';

                        return (
                            <div key={msg.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-end gap-1.5 md:gap-2 max-w-[92%] md:max-w-[85%] ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black uppercase text-white shrink-0 shadow-sm ${esMio ? 'bg-indigo-600' : esProfe ? 'bg-purple-600' : 'bg-emerald-500'}`}>
                                        {msg.remitente.substring(0, 1)}
                                    </div>
                                    <div className={`px-3 md:px-5 py-2 md:py-3.5 rounded-2xl md:rounded-[1.5rem] shadow-sm border ${esMio ? 'bg-indigo-600 text-white rounded-br-none border-indigo-500' : 'bg-white text-slate-700 rounded-bl-none border-slate-100'}`}>
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${esMio ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {msg.remitente} {esProfe && '• PROFESOR'}
                                            </span>
                                            <button onClick={() => speakMessage(msg.contenido)} className={`opacity-50 hover:opacity-100 transition-opacity ${esMio ? 'text-white' : 'text-slate-400'}`}>
                                                <Volume2 size={12} />
                                            </button>
                                        </div>
                                        <p className="text-xs md:text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">{msg.contenido}</p>
                                        
                                        {msg.audio_url && (
                                            <div className="mt-3">
                                                <audio src={msg.audio_url} controls className="h-8 w-40 md:w-48" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mt-1.5 mx-2 tracking-tighter">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-3 md:p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={isRecording ? stopRecordingRobust : startRecordingRobust}
                        className={`p-3.5 rounded-2xl transition-all shrink-0 border ${isRecording
                            ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-200'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                    >
                        {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isRecording ? "Grabando equipo..." : "Mensaje al grupo..."}
                            disabled={isRecording}
                            className="w-full pl-4 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium placeholder:text-slate-400 shadow-inner"
                        />
                    </div>

                    {!isRecording && (
                        <button
                            type="button"
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center shrink-0"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

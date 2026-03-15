import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Mic, Loader2, Volume2, StopCircle, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface MensajeChat {
    id: string;
    created_at: string;
    grupo_id: string;
    remitente: string;
    contenido: string;
    audio_url?: string;
    tipo: 'alumno' | 'profesor';
    modo: 'equipo';
}

interface ChatGrupoProps {
    grupoId: string;
    miembroActual: string;
    esProfesor?: boolean;
}

export function ChatGrupo({ grupoId, miembroActual, esProfesor = false }: ChatGrupoProps) {
    const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Audio Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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

        // Realtime Subscription - Usamos un canal específico por grupo
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
                    if (newMsg.modo === 'equipo') {
                        setMensajes((prev) => {
                            // Evitar duplicados (especialmente con updates optimistas)
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                        setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to ${channelName}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [grupoId]);

    const fetchMensajes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('mensajes_chat')
                .select('*')
                .eq('grupo_id', grupoId)
                .eq('modo', 'equipo')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMensajes(data || []);
            setTimeout(scrollToBottom, 500); // More delay to ensure render
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
        
        if (!audioUrl) setInput('');

        // Optimistic UI Update
        const optimisticMsg: MensajeChat = {
            id: tempId,
            created_at: new Date().toISOString(),
            grupo_id: grupoId,
            remitente: miembroActual,
            contenido: audioUrl ? '🎤 Mensaje de voz' : msgContent,
            audio_url: audioUrl || undefined,
            tipo: esProfesor ? 'profesor' : 'alumno',
            modo: 'equipo'
        };

        setMensajes(prev => [...prev, optimisticMsg]);
        setTimeout(scrollToBottom, 100);

        try {
            const { data, error } = await supabase
                .from('mensajes_chat')
                .insert([{
                    grupo_id: grupoId,
                    remitente: miembroActual,
                    contenido: audioUrl ? '🎤 Mensaje de voz' : msgContent,
                    audio_url: audioUrl || null,
                    tipo: esProfesor ? 'profesor' : 'alumno',
                    modo: 'equipo'
                }])
                .select();

            if (error) throw error;
            
            // Reemplazar el mensaje optimista con el real para tener el ID correcto de la DB
            if (data && data[0]) {
                setMensajes(prev => prev.map(m => m.id === tempId ? data[0] : m));
            }
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error('Error al enviar mensaje');
            // Revertir cambio optimista si falla
            setMensajes(prev => prev.filter(m => m.id !== tempId));
            if (!audioUrl) setInput(msgContent);
        }
    };

    // --- Audio Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setAudioChunks([]);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) setAudioChunks((prev) => [...prev, e.data]);
            };

            recorder.onstop = async () => {
                // Create Blob
                // Note: using 'audioChunks' from state directly might be empty due to closure?
                // Better logic: inside onstop, we can't fully rely on state update immediately.
                // We'll rely on a separate effect or a custom way.
                // Simplified:
            };

            recorder.start();
            setIsRecording(true);
            toast.info("Grabando... pulsa para enviar");
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("No se pudo acceder al micrófono");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            mediaRecorder.stream.getTracks().forEach(track => track.stop());

            // Hacky but simple: Wait for dataavailable to fire
            setTimeout(async () => {
                uploadAudioAndSend();
            }, 500);
        }
    };

    const uploadAudioAndSend = async () => {
        if (audioChunks.length === 0 && !mediaRecorder) return;

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = `${grupoId}-${Date.now()}.webm`;

        try {
            const { data, error } = await supabase.storage
                .from('chat-audio')
                .upload(fileName, audioBlob);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-audio')
                .getPublicUrl(fileName);

            await handleSend(publicUrl);
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Error al subir el audio");
        }
        setAudioChunks([]);
        setMediaRecorder(null);
    };

    // Fix for closure issue in upload:
    // Actually, let's use a specialized hook or specific Ref, but for speed:
    // We will rebuild 'stopRecording' to just stop, and handle upload in an effect dependent on chunks? 
    // No, standard way:
    useEffect(() => {
        if (!isRecording && audioChunks.length > 0 && mediaRecorder === null) {
            // It was stopped and cleared, but chunks remain? 
            // Better: trigger upload manually.
        }
    }, [isRecording]);

    // Redefining stop to simple version that relies on event timing
    // Re-impl below in UI.

    const handleMicClick = () => {
        if (isRecording) {
            // Stop & Send
            if (mediaRecorder) {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                // We need to wait for the last chunk.
                // We will create a one-off listener for the blobs.
                // Refactoring for reliability:
            }
        } else {
            startRecording();
        }
    };

    // Better Audio Recorder Implementation
    const startRecordingRobust = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = e => chunks.push(e.data);

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
                const fileName = `audio_${Date.now()}.webm`;

                // Upload
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
        <div className="bg-white flex flex-col h-full">


            {/* Messages Area */}
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
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm
                                        ${esProfe ? 'bg-purple-600 text-white' :
                                            esMio ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                        {esProfe ? 'P' : msg.remitente.charAt(0).toUpperCase()}
                                    </div>

                                    <div className={`p-3 md:p-4 rounded-2xl text-[13px] md:text-sm shadow-sm leading-relaxed relative group
                                        ${esMio
                                            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200'
                                            : esProfe
                                                ? 'bg-purple-50 border border-purple-100 text-purple-800 rounded-bl-none'
                                                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                                        }`}>
                                        {!esMio && <p className="text-[9px] font-bold opacity-50 mb-0.5 uppercase tracking-wider">{msg.remitente}</p>}

                                        {msg.audio_url ? (
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                <audio controls src={msg.audio_url} className="h-8 w-full max-w-[250px]" />
                                            </div>
                                        ) : (
                                            <>
                                                {msg.contenido}
                                                <button
                                                    onClick={() => speakMessage(msg.contenido)}
                                                    className={`absolute -right-8 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all
                                                  ${esMio ? 'text-indigo-400 hover:bg-white' : 'text-slate-400 hover:bg-slate-100'}`}
                                                    title="Leer en voz alta"
                                                >
                                                    <Volume2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[9px] text-slate-300 font-medium mt-1 mx-11">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
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

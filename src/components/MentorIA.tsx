import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { generarRespuestaIA } from '../services/ai';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Mensaje {
    id: string;
    created_at: string;
    grupo_id: string;
    remitente: string;
    contenido: string;
    tipo: 'alumno' | 'ia';
}

interface MentorIAProps {
    grupoId: string;
    proyectoId: string;
    departamento: string;
    miembro: string;
}

export function MentorIA({ grupoId, proyectoId, departamento, miembro }: MentorIAProps) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hitos, setHitos] = useState<any[]>([]);
    const [contextoIA, setContextoIA] = useState<string>('');

    // Estado para el efecto de escritura
    const [displayedContent, setDisplayedContent] = useState('');
    const [typingId, setTypingId] = useState<string | null>(null);

    // Estados para Voz
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Inicializar reconocimiento de voz
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setSpeechSupported(true);
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput((prev) => prev + (prev ? ' ' : '') + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Error de voz:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const toggleMute = () => {
        if (!isMuted) {
            window.speechSynthesis.cancel();
        }
        setIsMuted(!isMuted);
    };

    const speakText = (text: string) => {
        if (isMuted || !text) return;
        window.speechSynthesis.cancel(); // Parar lo anterior
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMensajes();
        fetchProyectoDetalles();
    }, [grupoId, proyectoId]);

    const fetchProyectoDetalles = async () => {
        if (!proyectoId) return;
        const { data } = await supabase
            .from('proyectos')
            .select('contexto_ia, fases')
            .eq('id', proyectoId)
            .single();

        if (data) {
            setContextoIA(data.contexto_ia || '');
            // Extraer hitos de las fases si es necesario, o si hitos están en otra tabla
            // Por ahora, si no hay tabla de hitos separada, intentamos sacar hitos del grupo
            const { data: grupoData } = await supabase
                .from('grupos')
                .select('hitos')
                .eq('id', grupoId)
                .single();

            if (grupoData?.hitos) {
                setHitos(grupoData.hitos);
            }
        }
    };

    // Efecto de escritura robusto
    useEffect(() => {
        if (!typingId) return;

        const messageToType = mensajes.find(m => m.id === typingId);
        if (!messageToType || !messageToType.contenido) return;

        const text = messageToType.contenido;
        let i = 0;

        // Limpiamos contenido previo por seguridad
        setDisplayedContent('');

        // Velocidad variable para más realismo (entre 10 y 30ms)
        const typeChar = () => {
            setDisplayedContent(text.substring(0, i + 1));
            i++;
            scrollToBottom();

            if (i < text.length) {
                // Velocidad más lenta (30ms a 60ms) para que sea más natural y tarde un poco más
                const randomSpeed = Math.floor(Math.random() * 30) + 30;
                setTimeout(typeChar, randomSpeed);
            } else {
                setTypingId(null); // Fin del typing
                // Leer en voz alta al terminar de escribir si no es del usuario (y si no está muteado)
                speakText(text);
            }
        };

        // Pequeño delay inicial para asegurar renderizado correcto
        setTimeout(typeChar, 100);

    }, [typingId]);
    // TypingId controla el trigger

    const fetchMensajes = async () => {
        const { data } = await supabase
            .from('mensajes_chat')
            .select('*')
            .eq('grupo_id', grupoId)
            .order('created_at', { ascending: true });

        if (data) {
            setMensajes(data);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault(); // Critical: Stop form submission refresh
        e.stopPropagation();

        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setLoading(true);

        try {
            // 1. Save User Message
            const { data: newMsg, error: sendError } = await supabase
                .from('mensajes_chat')
                .insert([{
                    grupo_id: grupoId,
                    remitente: miembro,
                    contenido: userMsg,
                    tipo: 'alumno'
                }])
                .select()
                .single();

            if (sendError) throw sendError;
            if (newMsg) setMensajes(prev => [...prev, newMsg]);

            // 2. AI Generation
            const historial = mensajes.slice(-50).map(m => ({
                role: m.tipo === 'alumno' ? 'user' as const : 'assistant' as const,
                content: m.contenido
            }));

            // Safe AI Call
            let respuesta = '';
            try {
                respuesta = await generarRespuestaIA(userMsg, departamento, "Proyecto ABP", historial, hitos, contextoIA);
            } catch (aiErr) {
                console.error("AI Error:", aiErr);
                respuesta = "Lo siento, tuve un problema pensando. ¿Me lo repites?";
            }

            // 3. Save AI Message
            const { data: iaMsg, error: iaError } = await supabase
                .from('mensajes_chat')
                .insert([{
                    grupo_id: grupoId,
                    remitente: 'Mentor IA',
                    contenido: respuesta,
                    tipo: 'ia'
                }])
                .select()
                .single();

            if (iaError) throw iaError;

            if (iaMsg) {
                setMensajes(prev => [...prev, iaMsg]);
                setTypingId(iaMsg.id);
            }

        } catch (error: any) {
            console.error('Chat Error:', error);
            // toast.error('Error al enviar mensaje'); // Silent fail better than crash
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                        <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Mentor IA <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1">v3.5 (Voz)</span></h3>
                        <p className="text-xs text-gray-500">Impulsado por Groq Llama 3</p>
                    </div>
                </div>
                <button
                    onClick={toggleMute}
                    className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}
                    title={isMuted ? "Activar voz" : "Silenciar voz"}
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 scroll-smooth">
                {mensajes.map((m, i) => {
                    const isIA = m.tipo === 'ia';
                    // Lógica crítica: mostrar contenido parcial SOLO si este mensaje es el que se está escribiendo actualmente.
                    const isTypingThis = typingId === m.id;
                    const contentToShow = isTypingThis ? displayedContent : m.contenido;

                    return (
                        <div key={i} className={`flex ${isIA ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            {isIA && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mr-3 mt-1 shadow-lg shadow-indigo-500/20 shrink-0">
                                    <Sparkles size={14} />
                                </div>
                            )}
                            <div className={`p-5 rounded-[1.5rem] max-w-[85%] text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                                ${!isIA
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20'
                                    : 'bg-white border boundary-slate-100 text-slate-600 rounded-tl-none font-medium'
                                }`}>
                                {contentToShow}
                                {isTypingThis && (
                                    <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-indigo-500 animate-pulse"></span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex justify-start animate-in fade-in zoom-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3 mt-1 shrink-0">
                            <Bot size={14} className="text-slate-400" />
                        </div>
                        <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex gap-1 items-center">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                    {speechSupported && (
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`p-2 rounded-xl transition-all ${isListening
                                ? 'bg-red-100 text-red-600 animate-pulse'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            title="Dictar pregunta"
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    )}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSend(e as any);
                            }
                        }}
                        placeholder={isListening ? "Escuchando..." : "Pregunta sobre tu proyecto..."}
                        className="flex-1 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                    <button
                        type="button"
                        onClick={(e) => handleSend(e as any)}
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

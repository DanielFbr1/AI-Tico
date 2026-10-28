import React, { useState, useEffect, useRef } from 'react';
import { Colegio, FuenteRAG } from '../../types';
import { ColegioRAGService } from '../../services/colegioRAGService';
import { Bot, Send, User, Sparkles, BookOpen, Globe, Lightbulb, Copy, Check, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface MessageItem {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    fuentes?: FuenteRAG[];
    timestamp: Date;
}

interface ColegioChatAsistenteProps {
    colegio: Colegio;
}

export function ColegioChatAsistente({ colegio }: ColegioChatAsistenteProps) {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const assistantName = colegio.configuracion_ia?.nombre_asistente || `Asistente de ${colegio.nombre}`;

    // Mensaje de bienvenida inicial
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: `¡Hola! Soy **${assistantName}**, el asistente oficial de inteligencia artificial de **${colegio.nombre}**.\n\nPuedo responder dudas sobre normativas, protocolos, proyectos del centro, reglamentos internos o cuestiones pedagógicas generales. ¿En qué puedo ayudarte hoy?`,
                    timestamp: new Date()
                }
            ]);
        }
    }, [colegio]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (textToSend?: string) => {
        const query = (textToSend || input).trim();
        if (!query || loading) return;

        setInput('');
        const userMsg: MessageItem = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const historyForAI = messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }));

            const response = await ColegioRAGService.askColegioAssistant(
                colegio,
                query,
                historyForAI
            );

            const aiMsg: MessageItem = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.respuesta,
                fuentes: response.fuentes,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error('Error en chat del colegio:', error);
            toast.error('Error al obtener respuesta del asistente');
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo en unos momentos.',
                    timestamp: new Date()
                }
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success('Respuesta copiada al portapapeles');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const clearChat = () => {
        setMessages([
            {
                id: 'welcome-reset',
                role: 'assistant',
                content: `Conversación reiniciada. ¿En qué más puedo orientarte sobre **${colegio.nombre}**?`,
                timestamp: new Date()
            }
        ]);
        toast.info('Chat reiniciado');
    };

    const sampleQueries = [
        '¿Cuáles son los protocolos vigentes del centro?',
        '¿Cómo está estructurado el plan de convivencia?',
        'Redacta un comunicado oficial para las familias sobre la reunión general.',
        '¿Qué criterios debemos seguir para organizar una salida extraescolar?'
    ];

    return (
        <div className="flex flex-col h-[76vh] bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
            {/* Header del Chat */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white tracking-tight">{assistantName}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                                RAG Activo
                            </span>
                        </div>
                        <p className="text-xs text-indigo-200/70 font-medium">
                            IA Institucional • {colegio.nombre}
                        </p>
                    </div>
                </div>

                <button
                    onClick={clearChat}
                    title="Reiniciar conversación"
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Cuerpo de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                        >
                            {!isUser && (
                                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                                    <Bot className="w-5 h-5" />
                                </div>
                            )}

                            <div className={`max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                        isUser
                                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md font-medium'
                                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm'
                                    }`}
                                >
                                    <div className="whitespace-pre-wrap">{msg.content}</div>

                                    {/* Fuentes y Citas RAG */}
                                    {!isUser && msg.fuentes && msg.fuentes.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                                Fuentes utilizadas:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {msg.fuentes.map((f, fIdx) => (
                                                    <span
                                                        key={fIdx}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                            f.tipo === 'documento'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                                                : f.tipo === 'web'
                                                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200/60'
                                                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}
                                                        title={f.snippet || f.titulo}
                                                    >
                                                        {f.tipo === 'documento' && <BookOpen className="w-3 h-3" />}
                                                        {f.tipo === 'web' && <Globe className="w-3 h-3" />}
                                                        {f.tipo === 'conocimiento_general' && <Lightbulb className="w-3 h-3" />}
                                                        {f.titulo}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Botón Copiar */}
                                {!isUser && msg.id !== 'welcome' && (
                                    <button
                                        onClick={() => copyToClipboard(msg.content, index)}
                                        className="mt-1.5 text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium px-2 py-0.5 rounded transition-colors"
                                    >
                                        {copiedIndex === index ? (
                                            <>
                                                <Check className="w-3 h-3 text-emerald-500" />
                                                <span className="text-emerald-600">Copiado</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copiar</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {isUser && (
                                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-md">
                                    <User className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex gap-3.5 justify-start animate-in fade-in">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                            <Bot className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 text-slate-500 text-xs font-medium">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            Consultando base documental de {colegio.nombre}...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Preguntas sugeridas si el chat tiene pocos mensajes */}
            {messages.length <= 2 && (
                <div className="px-6 py-2.5 bg-slate-100/60 border-t border-slate-200/60 overflow-x-auto flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-1">
                        Sugerencias:
                    </span>
                    {sampleQueries.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(q)}
                            className="shrink-0 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200/80 transition-all font-medium shadow-2xs"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Barra de Entrada */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder={`Pregunta a ${assistantName} sobre reglamentos, protocolos o proyectos...`}
                        className="flex-1 bg-transparent border-none outline-none resize-none px-3 py-2 text-sm text-slate-800 placeholder-slate-400 font-medium max-h-28"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center shrink-0"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

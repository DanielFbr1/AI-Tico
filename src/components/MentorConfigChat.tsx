import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { generarConfiguracionTico } from '../services/ai';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface MentorConfigChatProps {
    currentInstructions: string;
    onUpdateInstructions: (newInstructions: string) => void;
    onUpdateSettings: (settings: {
        tono?: string,
        nivel_exigencia?: string,
        enfoque?: string,
        nivel_apoyo?: string,
        formato_respuesta?: string
    }) => void;
    currentTone?: string;
}

export function MentorConfigChat({ currentInstructions, onUpdateInstructions, onUpdateSettings, currentTone }: MentorConfigChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `¡Hola! Soy tu asistente pedagógico. 🤖\n\nPuedo ayudarte a configurar a Tico (la IA de tus alumnos) o darte ideas para el proyecto.\n\nDime qué necesitas (ej: "Ayúdame con una idea sobre biodiversidad", "Cambia a Tico a un tono socrático", "Haz que Tico sea más exigente").`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    /* 
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]); 
    */

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Real call to AI service
            const response = await generarConfiguracionTico(userMsg.content, currentInstructions);

            if (response && response.reply) {
                setMessages(prev => [...prev, { id: 'ai-' + Date.now(), role: 'assistant', content: response.reply }]);

                if (response.new_instructions) {
                    onUpdateInstructions(response.new_instructions);
                }

                if (response.update_settings) {
                    onUpdateSettings(response.update_settings);
                }
            } else {
                throw new Error("Invalid response format");
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'assistant', content: "Hubo un error al procesar tu solicitud. Inténtalo de nuevo." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[320px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                            }`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Sparkles size={16} className="text-green-600" />
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-500 italic flex items-center">
                            Pensando nuevas reglas...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(e)}
                    placeholder="Ej: Haz que Tico sea fan de Harry Potter..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}

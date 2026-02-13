import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, Save, Wand2 } from 'lucide-react';
import { generarConfiguracionProyecto, Mensaje, generarChatDocente } from '../services/ai'; // We will need to export generarConfiguracionProyecto from services/ai
import { Rubrica } from '../types';
import { toast } from 'sonner';

interface AsistenteProps {
    onConfiguracionGenerada: (config: { descripcion: string; rubrica: Rubrica; contexto_ia: string }) => void;
    onCancel: () => void;
}

export function AsistenteDisenoProyecto({ onConfiguracionGenerada, onCancel }: AsistenteProps) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([
        {
            role: 'assistant',
            content: '¡Hola! Soy tu asistente pedagógico. 🎓 Ayudaré a configurar este proyecto para que nuestra IA tutora sepa exactamente cómo guiar a tus alumnos. ¿De qué trata el proyecto que tienes en mente?'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [analizando, setAnalizando] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const nuevoMensaje: Mensaje = { role: 'user', content: input };
        setMensajes(prev => [...prev, nuevoMensaje]);
        setInput('');
        setLoading(true);

        try {
            // Usamos generarChatDocente para la conversación fluida
            const respuestaTexto = await generarChatDocente(nuevoMensaje.content, mensajes);

            const respuestaIA: Mensaje = { role: 'assistant', content: respuestaTexto };
            setMensajes(prev => [...prev, respuestaIA]);
        } catch (error) {
            console.error('Error en chat asistente:', error);
            toast.error('Error al conectar con el asistente');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarAhora = async () => {
        setAnalizando(true);
        try {
            // Esta función aún no existe en services/ai, la crearemos a continuación
            const config = await generarConfiguracionProyecto(mensajes);
            onConfiguracionGenerada(config);
            toast.success("¡Configuración generada con éxito!");
        } catch (error) {
            console.error('Error generando configuración:', error);
            toast.error('No se pudo generar la configuración. Intenta darme más detalles sobre el proyecto.');
        } finally {
            setAnalizando(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Asistente de Diseño</h3>
                        <p className="text-indigo-100 text-xs">Diseñando tu proyecto con IA</p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-1 rounded text-sm transition-colors"
                >
                    Cerrar
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {mensajes.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                            }`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                                    <Bot className="w-3 h-3" /> Asistente Pedagógico
                                </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-white border-t border-gray-100">
                {mensajes.length > 2 && (
                    <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-700 text-sm">
                            <Wand2 className="w-4 h-4" />
                            <span>¿Crees que ya tenemos suficiente información?</span>
                        </div>
                        <button
                            onClick={handleGenerarAhora}
                            disabled={analizando || loading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {analizando ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analizando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Generar Proyecto
                                </>
                            )}
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Describe tu proyecto, objetivos o ideas..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        disabled={loading || analizando}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading || analizando}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Bot, Check, Trash2, Plus, User } from 'lucide-react';
import { HitoGrupo } from '../types';
import { toast } from 'sonner';

interface ModalAsignarTareasProps {
    grupoNombre: string;
    faseId: string;
    proyectoContexto?: string;
    onClose: () => void;
    onSave: (hitos: Partial<HitoGrupo>[]) => void;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export function ModalAsignarTareas({ grupoNombre, faseId, proyectoContexto, onClose, onSave }: ModalAsignarTareasProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: `Hola. Soy tu Asistente Docente. ¿Qué tareas quieres asignar al grupo "${grupoNombre}"?` }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hitos, setHitos] = useState<{ titulo: string; descripcion: string }[]>([]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- REAL AI INTEGRATION ---
    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');

        // Optimistic update
        const newHistory = [...messages, { role: 'user', content: userMsg } as Message];
        setMessages(newHistory);
        setIsTyping(true);

        try {
            // IA Connection
            const { generarChatDocente } = await import('../services/ai');

            const historyForAI = newHistory.map(m => ({
                role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
                content: m.content
            }));

            // Generate Response
            const aiResponse = await generarChatDocente(userMsg, historyForAI);

            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);

            // If AI suggests regenerating tasks, we could trigger it automatically, but better to let user decide/click.
        } catch (error) {
            console.error("Error in handleSendMessage:", error);
            toast.error("Error conectando con el asistente");
            setMessages(prev => [...prev, { role: 'ai', content: "Lo siento, tuve un error de conexión." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleGenerateMilestones = async (context: string = "") => {
        setIsTyping(true);
        try {
            const { generarTareasDocente } = await import('../services/ai');

            // Combinar contexto del proyecto con el historial del chat
            const historyText = messages.map(m => `[${m.role}] ${m.content}`).join('\n');
            const promptContext = context || `Proyecto: ${proyectoContexto || 'General'}\nGrupo: ${grupoNombre}\nChat:\n${historyText}`;

            const newTasksRaw = await generarTareasDocente(promptContext);

            if (!Array.isArray(newTasksRaw) || newTasksRaw.length === 0) {
                // FALLBACK: Si la IA falla, sugerimos tareas genéricas pero útiles
                const fallbackTasks = [
                    { titulo: "Investigación Inicial", descripcion: "Investigar los conceptos clave del proyecto y crear un mapa mental." },
                    { titulo: "Prototipado", descripcion: "Crear un boceto o esquema de la solución propuesta." },
                    { titulo: "Presentación", descripcion: "Preparar una breve explicación de los avances del equipo." }
                ];
                setHitos(prev => [...prev, ...fallbackTasks]);
                setMessages(prev => [...prev, { role: 'ai', content: "He tenido un pequeño problema técnico generando las tareas personalizadas, pero aquí te dejo unas sugerencias generales que siempre funcionan bien para empezar. ¡Espero que te sirvan! 🚀" }]);
                toast.info("Se han generado tareas sugeridas");
                return;
            }

            const newHitos = newTasksRaw.map((t: any) => ({
                titulo: t.titulo || 'Tarea sin título',
                descripcion: t.descripcion || ''
            }));

            setMessages(prev => [...prev, { role: 'ai', content: "¡Listo! He preparado unas sugerencias aquí al lado basándome en vuestro proyecto. Puedes editarlas o borrarlas antes de asignarlas." }]);
            setHitos(prev => [...prev, ...newHitos]);
            toast.success("Tareas generadas con IA");
        } catch (error) {
            console.error("Error in handleGenerateMilestones:", error);
            // Fallback total
            setHitos(prev => [...prev, { titulo: "Tarea Sugerida", descripcion: "Completa la primera fase del proyecto." }]);
            toast.error("Error de conexión. Se añadió una tarea de ejemplo.");
        } finally {
            setIsTyping(false);
        }
    };

    const handleRemoveHito = (index: number) => {
        setHitos(hitos.filter((_, i) => i !== index));
    };

    const handleEditHito = (index: number, field: 'titulo' | 'descripcion', value: string) => {
        const newHitos = [...hitos];
        newHitos[index] = { ...newHitos[index], [field]: value };
        setHitos(newHitos);
    };

    const handleSave = () => {
        if (hitos.length === 0) {
            toast.error("Define al menos una tarea");
            return;
        }
        const hitosValidos = hitos.map(h => ({
            ...h,
            id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
            fase_id: faseId,
            estado: 'pendiente' as const // Start as Pending for students
        }));
        onSave(hitosValidos);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-none md:rounded-[2rem] shadow-2xl max-w-5xl w-full h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-slate-600 bg-white/80 backdrop-blur-sm md:hover:bg-slate-100 rounded-full transition-all shadow-sm">
                    <X className="w-6 h-6" />
                </button>

                {/* Left: Chat */}
                <div className="flex-1 min-h-0 flex flex-col border-r border-slate-200 bg-slate-50 order-2 md:order-1">
                    <div className="p-4 md:p-6 bg-white border-b border-slate-200 flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Bot className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 tracking-tight text-sm md:text-base">Asistente Docente</h2>
                            <p className="text-[10px] md:text-xs font-bold text-indigo-600 uppercase tracking-widest">Generador de Tareas</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                                    {m.role === 'ai' ? <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <User className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                </div>
                                <div className={`p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[80%] text-[13px] md:text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-600 border border-slate-200 rounded-tl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && <div className="text-[10px] md:text-xs text-slate-400 ml-10 md:ml-12 font-bold animate-pulse">Escribiendo...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 md:p-4 bg-white border-t border-slate-200 space-y-3">
                        {messages.length > 1 && (
                            <button
                                onClick={() => handleGenerateMilestones("")}
                                type="button"
                                className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 border border-indigo-100 shadow-sm active:scale-95"
                            >
                                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                Generar Tareas con IA
                            </button>
                        )}

                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="flex gap-2"
                        >
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe aquí tus instrucciones..."
                                className="flex-1 px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="p-2.5 md:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-md active:scale-95"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Task List */}
                <div className="w-full md:w-[400px] flex flex-col bg-white border-b md:border-b-0 md:border-l border-slate-200 h-[45%] md:h-full order-1 md:order-2">
                    <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/30">
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-base md:text-lg">Borrador de Tareas</h3>
                        <p className="text-[11px] md:text-sm text-slate-500 font-bold mt-0.5">Grupo: {grupoNombre}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4">
                        {hitos.length === 0 ? (
                            <div className="text-center py-8 md:py-12 px-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                                <Bot className="w-8 h-8 text-slate-200 mb-3" />
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Usa el chat para generar tareas automáticamente</p>
                            </div>
                        ) : (
                            hitos.map((hito, index) => (
                                <div key={index} className="flex gap-3 items-start p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-all shadow-sm">
                                    <div className="mt-1 w-5 h-5 md:w-6 md:h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-md shadow-indigo-100">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <input
                                            value={hito.titulo}
                                            onChange={(e) => handleEditHito(index, 'titulo', e.target.value)}
                                            className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none font-bold text-slate-800 text-[13px] md:text-sm px-1 py-0.5"
                                        />
                                        <textarea
                                            value={hito.descripcion}
                                            onChange={(e) => handleEditHito(index, 'descripcion', e.target.value)}
                                            className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none text-[11px] text-slate-500 leading-snug px-1 py-0.5 resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveHito(index)}
                                        className="text-slate-300 hover:text-rose-500 transition-colors mt-1 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}

                        <button
                            onClick={() => setHitos([...hitos, { titulo: 'Nueva Tarea', descripcion: '' }])}
                            className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-black hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Manualmente
                        </button>
                    </div>

                    <div className="p-4 md:p-6 border-t border-slate-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                        <button
                            onClick={handleSave}
                            disabled={hitos.length === 0}
                            className="w-full py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] md:text-xs hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                        >
                            <Check className="w-4 h-4 md:w-5 md:h-5" />
                            Asignar a este equipo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

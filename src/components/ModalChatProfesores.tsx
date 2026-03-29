import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Proyecto } from '../types';

interface MensajeColaboracion {
    id: string;
    proyecto_id: string;
    sender_id: string;
    sender_nombre: string;
    mensaje: string;
    created_at: string;
}

interface ModalChatProfesoresProps {
    isOpen: boolean;
    onClose: () => void;
    user: { id: string; email?: string } | null;
    proyectos: Proyecto[];
}

export function ModalChatProfesores({ isOpen, onClose, user, proyectos }: ModalChatProfesoresProps) {
    const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string | null>(null);
    const [mensajes, setMensajes] = useState<MensajeColaboracion[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [cargandoMensajes, setCargandoMensajes] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Seleccionar el primer proyecto por defecto si hay alguno
    useEffect(() => {
        if (isOpen && proyectos.length > 0 && !proyectoSeleccionado) {
            setProyectoSeleccionado(proyectos[0].id);
        }
    }, [isOpen, proyectos]);

    // Cargar mensajes cuando cambia el proyecto seleccionado
    useEffect(() => {
        if (!isOpen || !proyectoSeleccionado) return;

        const fetchMensajes = async () => {
            setCargandoMensajes(true);
            try {
                const { data, error } = await supabase
                    .from('mensajes_colaboracion')
                    .select('*')
                    .eq('proyecto_id', proyectoSeleccionado)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setMensajes(data || []);
            } catch (err) {
                console.error('Error cargando mensajes:', err);
                toast.error('Error al cargar la conversación');
            } finally {
                setCargandoMensajes(false);
            }
        };

        fetchMensajes();

        // Suscripción Realtime
        const channel = supabase.channel(`chat_colab_${proyectoSeleccionado}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'mensajes_colaboracion',
                filter: `proyecto_id=eq.${proyectoSeleccionado}`
            }, payload => {
                const nuevo = payload.new as MensajeColaboracion;
                setMensajes(prev => {
                    if (prev.some(m => m.id === nuevo.id)) return prev;
                    return [...prev, nuevo];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, proyectoSeleccionado]);

    // Scroll al final
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const handleEnviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoMensaje.trim() || !user || !proyectoSeleccionado) return;

        const texto = nuevoMensaje.trim();
        const nombre = user.email?.split('@')[0] || 'Profesor';
        setNuevoMensaje('');

        try {
            const { error } = await supabase
                .from('mensajes_colaboracion')
                .insert([{
                    proyecto_id: proyectoSeleccionado,
                    sender_id: user.id,
                    sender_nombre: nombre,
                    mensaje: texto
                }]);

            if (error) throw error;
        } catch (err) {
            console.error('Error enviando mensaje:', err);
            toast.error('Error al enviar el mensaje');
        }
    };

    if (!isOpen) return null;

    const proyectosFiltrados = proyectos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const proyActual = proyectos.find(p => p.id === proyectoSeleccionado);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                
                {/* Lateral: Lista de Proyectos */}
                <div className={`w-full md:w-80 flex-col border-r border-slate-200 bg-slate-50 ${proyectoSeleccionado && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
                    <div className="p-6 bg-white border-b border-slate-200">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                            <MessageCircle className="w-6 h-6 text-blue-600" />
                            Chat Docente
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar proyecto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {proyectosFiltrados.map(proy => (
                            <button
                                key={proy.id}
                                onClick={() => setProyectoSeleccionado(proy.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${proyectoSeleccionado === proy.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-600'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${proyectoSeleccionado === proy.id ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                                    <span className="font-black text-sm">{proy.nombre.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm truncate">{proy.nombre}</h3>
                                    <p className={`text-[10px] uppercase font-black tracking-widest ${proyectoSeleccionado === proy.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {proy.clase || 'Sin clase'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Principal: Chat */}
                <div className={`flex-1 flex flex-col bg-white ${!proyectoSeleccionado && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
                    {proyectoSeleccionado ? (
                        <>
                            {/* Header */}
                            <div className="h-[72px] border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setProyectoSeleccionado(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h2 className="font-black text-slate-800 tracking-tight leading-none text-lg">{proyActual?.nombre}</h2>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Colaboradores del proyecto
                                        </p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Mensajes */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                {cargandoMensajes ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    </div>
                                ) : mensajes.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <MessageCircle className="w-10 h-10 text-blue-200" />
                                        </div>
                                        <p className="font-bold text-slate-500">¡Nadie ha escrito todavía!</p>
                                        <p className="text-xs max-w-[200px] text-center uppercase tracking-widest leading-loose">Di hola a tus compañeros colaboradores</p>
                                    </div>
                                ) : (
                                    mensajes.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1 animate-in slide-in-from-bottom-2`}>
                                                {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">{msg.sender_nombre}</span>}
                                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                                                    <p className="text-sm leading-relaxed">{msg.mensaje}</p>
                                                    <div className={`text-[8px] font-black uppercase tracking-widest mt-1 opacity-60 ${isMe ? 'text-blue-50 text-right' : 'text-slate-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-6 border-t border-slate-200 bg-white">
                                <form onSubmit={handleEnviar} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        placeholder="Escribe un mensaje a tus colaboradores..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!nuevoMensaje.trim()}
                                        className="bg-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all shrink-0"
                                    >
                                        <Send className="w-6 h-6 ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 p-12 text-center">
                            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                <MessageCircle className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Chat de Colaboradores</h3>
                            <p className="text-slate-400 max-w-xs text-sm font-bold uppercase tracking-widest leading-loose">
                                Selecciona un proyecto para hablar con los otros profesores
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

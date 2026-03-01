import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageSquare, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Grupo } from '../types';

interface Mensaje {
    id: string;
    sender_id: string;
    profesor_user_id: string;
    alumno_user_id: string;
    alumno_nombre: string;
    mensaje: string;
    created_at: string;
    leido: boolean;
}

interface AlumnoChatInfo {
    id: string;
    nombre: string;
    grupoNombre: string;
}

interface ModalChatAlumnosDocenteProps {
    isOpen: boolean;
    onClose: () => void;
    docenteId: string;
    docenteNombre: string;
    grupos: Grupo[];
}

export function ModalChatAlumnosDocente({ isOpen, onClose, docenteId, docenteNombre, grupos }: ModalChatAlumnosDocenteProps) {
    const [alumnos, setAlumnos] = useState<AlumnoChatInfo[]>([]);
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string | null>(null);
    const [mensajes, setMensajes] = useState<Record<string, Mensaje[]>>({});
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Extraer alumnos de los grupos y resolver sus UUIDs reales
    useEffect(() => {
        if (isOpen && grupos.length > 0) {
            const extraerAlumnos = async () => {
                // Extraer todos los nombres de miembros únicos
                const allNames = new Set<string>();
                const nameToGroup: Record<string, string> = {};

                grupos.forEach(grupo => {
                    grupo.miembros.forEach(miembro => {
                        const nombreStr = typeof miembro === 'string' ? miembro : (miembro as any).nombre;
                        if (nombreStr && !allNames.has(nombreStr)) {
                            allNames.add(nombreStr);
                            nameToGroup[nombreStr] = grupo.nombre;
                        }
                    });
                });

                if (allNames.size === 0) {
                    setAlumnos([]);
                    return;
                }

                // Resolver los nombres a UUIDs reales consultando profiles
                const namesArray = Array.from(allNames);
                const { data: perfilesData, error } = await supabase
                    .from('profiles')
                    .select('id, nombre')
                    .in('nombre', namesArray);

                if (error) {
                    console.error("Error al resolver perfiles de alumnos:", error);
                    return;
                }

                const alumnosResueltos: AlumnoChatInfo[] = (perfilesData || []).map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    grupoNombre: nameToGroup[p.nombre] || ''
                }));

                setAlumnos(alumnosResueltos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
            };

            extraerAlumnos();
        }
    }, [isOpen, grupos]);

    // Cargar mensajes desde Supabase
    useEffect(() => {
        if (!isOpen || alumnos.length === 0 || !docenteId) return;

        const cargarMensajes = async () => {
            const alumnoIds = alumnos.map(a => a.id);
            const { data, error } = await supabase
                .from('mensajes_profesor_alumno')
                .select('*')
                .eq('profesor_user_id', docenteId)
                .in('alumno_user_id', alumnoIds)
                .order('created_at', { ascending: true });

            if (!error && data) {
                const groupedMessages: Record<string, Mensaje[]> = {};
                data.forEach(msg => {
                    const aluId = msg.alumno_user_id;
                    if (!groupedMessages[aluId]) groupedMessages[aluId] = [];
                    groupedMessages[aluId].push(msg);
                });
                setMensajes(groupedMessages);
            }
        };

        cargarMensajes();

        const subscription = supabase.channel(`chat_doc_${docenteId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'mensajes_profesor_alumno',
                filter: `profesor_user_id=eq.${docenteId}`
            }, payload => {
                cargarMensajes();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [isOpen, alumnos, docenteId]);

    useEffect(() => {
        // Scroll al final cuando cambian los mensajes
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes, alumnoSeleccionado]);

    const handleEnviarMensaje = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!nuevoMensaje.trim() || !alumnoSeleccionado) return;

        const alumAct = alumnos.find(a => a.id === alumnoSeleccionado);
        if (!alumAct) return;

        const newMessageTexto = nuevoMensaje.trim();
        setNuevoMensaje('');

        // Optimistic UI Update
        const tempMsg: Mensaje = {
            id: Date.now().toString(),
            sender_id: docenteId,
            profesor_user_id: docenteId,
            alumno_user_id: alumnoSeleccionado,
            alumno_nombre: alumAct.nombre,
            mensaje: newMessageTexto,
            created_at: new Date().toISOString(),
            leido: false
        };

        setMensajes(prev => {
            const thread = prev[alumnoSeleccionado] || [];
            return { ...prev, [alumnoSeleccionado]: [...thread, tempMsg] };
        });

        // Insert to DB
        const { error } = await supabase
            .from('mensajes_profesor_alumno')
            .insert([{
                alumno_user_id: alumnoSeleccionado,
                profesor_user_id: docenteId,
                alumno_nombre: alumAct.nombre,
                mensaje: newMessageTexto,
                sender_id: docenteId,
                leido: false
            }]);

        if (error) {
            console.error("Error al enviar mensaje:", error);
        }
    };

    // Marcar mensajes recibidos como leídos al abrir conversación
    const marcarComoLeido = async (alumnoId: string) => {
        await supabase
            .from('mensajes_profesor_alumno')
            .update({ leido: true })
            .eq('alumno_user_id', alumnoId)
            .eq('profesor_user_id', docenteId)
            .neq('sender_id', docenteId)
            .eq('leido', false);

        // Actualizar estado local
        setMensajes(prev => {
            const thread = prev[alumnoId];
            if (!thread) return prev;
            return {
                ...prev,
                [alumnoId]: thread.map(m => m.sender_id !== docenteId ? { ...m, leido: true } : m)
            };
        });
    };

    const getTiempoTranscurrido = (createdString: string) => {
        const timestamp = new Date(createdString).getTime();
        const ahora = Date.now();
        const difMinutos = Math.floor((ahora - timestamp) / 60000);
        if (difMinutos < 1) return 'Ahora mismo';
        if (difMinutos < 60) return `hace ${difMinutos} min`;
        const difHoras = Math.floor(difMinutos / 60);
        if (difHoras < 24) return `hace ${difHoras} h`;
        return new Date(timestamp).toLocaleDateString();
    };

    if (!isOpen) return null;

    const alumnosFiltrados = alumnos.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    const mensajesChatActivo = alumnoSeleccionado ? (mensajes[alumnoSeleccionado] || []) : [];
    const alumActual = alumnos.find(a => a.id === alumnoSeleccionado);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

                {/* COLUMNA IZQUIERDA: CONTACTOS */}
                <div className={`w-full md:w-80 flex-col border-r border-slate-200 bg-slate-50 ${alumnoSeleccionado ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 md:p-6 bg-white border-b border-slate-200 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-fuchsia-600" />
                                Alumnos
                            </h2>
                            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar alumno..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {alumnosFiltrados.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                Ningún alumno encontrado
                            </div>
                        ) : (
                            alumnosFiltrados.map(alum => {
                                const ultMsgs = mensajes[alum.id] || [];
                                const ultMsg = ultMsgs.length > 0 ? ultMsgs[ultMsgs.length - 1] : null;
                                const noLeidos = ultMsgs.filter(m => m.sender_id !== docenteId && !m.leido).length;

                                return (
                                    <button
                                        key={alum.id}
                                        onClick={() => { setAlumnoSeleccionado(alum.id); marcarComoLeido(alum.id); }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${alumnoSeleccionado === alum.id ? 'bg-fuchsia-100/50 outline outline-2 outline-fuchsia-200' : 'hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alumnoSeleccionado === alum.id ? 'bg-fuchsia-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-bold text-sm truncate ${alumnoSeleccionado === alum.id ? 'text-fuchsia-900' : 'text-slate-700'}`}>{alum.nombre}</h3>
                                                {ultMsg && <span className="text-[9px] font-bold text-slate-400">{getTiempoTranscurrido(ultMsg.created_at).split(' ')[0]}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 justify-between mt-0.5">
                                                <p className={`text-xs truncate flex-1 min-w-0 ${noLeidos > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                                    {ultMsg ? ultMsg.mensaje : <span className="italic text-slate-400">Sin mensajes</span>}
                                                </p>
                                            </div>
                                        </div>
                                        {noLeidos > 0 && (
                                            <div className="w-5 h-5 rounded-full bg-fuchsia-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {noLeidos}
                                            </div>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: SECCIÓN CHAT */}
                <div className={`flex-1 flex flex-col bg-white ${!alumnoSeleccionado ? 'hidden md:flex' : 'flex'}`}>
                    {alumnoSeleccionado ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-[72px] border-b border-slate-200 px-4 md:px-6 flex items-center gap-4 shrink-0 bg-white">
                                <button
                                    onClick={() => setAlumnoSeleccionado(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-black text-slate-800 tracking-tight leading-tight">{alumActual?.nombre}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Alumno • {alumActual?.grupoNombre}
                                    </p>
                                </div>

                                <div className="hidden md:flex">
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                                {mensajesChatActivo.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                                            <MessageSquare className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-600">Inicia una conversación</p>
                                            <p className="text-sm">Escribe a este alumno para enviarle un comunicado directo.</p>
                                        </div>
                                    </div>
                                ) : (
                                    mensajesChatActivo.map((msg, i) => {
                                        const isMe = msg.sender_id === docenteId;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe ? 'bg-fuchsia-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                                                    <p className="text-[13px] leading-relaxed break-words">{msg.mensaje}</p>
                                                    <div className={`flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="px-4 py-4 md:px-6 md:py-5 border-t border-slate-200 bg-white">
                                <form onSubmit={handleEnviarMensaje} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        placeholder="Escribe un mensaje al alumno..."
                                        className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all font-medium text-slate-700"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!nuevoMensaje.trim()}
                                        className="w-12 h-12 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        <Send className="w-5 h-5 ml-1" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hidden md:flex"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="font-bold text-slate-600 text-lg">Selecciona un alumno</p>
                            <p className="text-sm mt-2">Elige un contacto de la lista para enviarle un mensaje.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

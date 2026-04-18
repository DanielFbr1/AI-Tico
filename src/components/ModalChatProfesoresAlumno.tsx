import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageSquare, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { getAsignaturaStyles } from '../data/asignaturas';

interface HistorialItem {
    id: number;
    nombre: string;
    codigo: string;
    asignatura: string;
    curso: string;
    profesor_id?: string;
    profesor_nombre?: string;
}

interface Mensaje {
    id: string;
    sender_id: string;
    profesor_user_id: string;
    alumno_user_id: string;
    alumno_nombre: string;
    mensaje: string;
    created_at: string;
    leido: boolean;
    tarea_id?: string;
    tarea_titulo?: string;
}

interface ModalChatProfesoresAlumnoProps {
    isOpen: boolean;
    onClose: () => void;
    alumnoId: string;
    alumnoNombre: string;
    historialClases: HistorialItem[];
}

export function ModalChatProfesoresAlumno({ isOpen, onClose, alumnoId, alumnoNombre, historialClases }: ModalChatProfesoresAlumnoProps) {
    const [profesores, setProfesores] = useState<{ id: string, nombre: string, asignatura: string }[]>([]);
    const [profesorSeleccionado, setProfesorSeleccionado] = useState<string | null>(null);
    const [mensajes, setMensajes] = useState<Record<string, Mensaje[]>>({});
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cargar profesores REALES que crearon los proyectos del alumno
    useEffect(() => {
        if (isOpen && historialClases.length > 0) {
            const cargarProfesores = async () => {
                try {
                    const proyIds = historialClases.map(hc => hc.id);

                    // 1. Obtener propietarios (created_by)
                    const { data: proyectosData, error: proyError } = await supabase
                        .from('proyectos')
                        .select('id, created_by, asignatura, nombre')
                        .in('id', proyIds);

                    if (proyError || !proyectosData) {
                        console.error("Error al cargar proyectos para profesores", proyError);
                        return;
                    }

                    // 2. Obtener colaboradores de esos mismos proyectos
                    const { data: colaboradoresData, error: colabError } = await supabase
                        .from('proyecto_colaboradores')
                        .select('proyecto_id, profesor_id')
                        .in('proyecto_id', proyIds);

                    if (colabError) {
                        console.error("Error al cargar colaboradores de proyectos", colabError);
                    }

                    // Obtener UUIDs únicos de profesores (propietarios + colaboradores)
                    const ownerIds = proyectosData.map(p => p.created_by).filter(Boolean);
                    const colabIds = colaboradoresData ? colaboradoresData.map(c => c.profesor_id).filter(Boolean) : [];
                    const profesorIds = [...new Set([...ownerIds, ...colabIds])];

                    if (profesorIds.length === 0) {
                        setProfesores([]);
                        return;
                    }

                    // 3. Buscar los perfiles de todos esos profesores
                    const { data: perfilesData, error: perfilError } = await supabase
                        .from('profiles')
                        .select('id, nombre, email')
                        .in('id', profesorIds);

                    if (perfilError || !perfilesData) {
                        console.error("Error al cargar perfiles de profesores", perfilError);
                        return;
                    }

                    const profesEncontrados: { id: string, nombre: string, asignatura: string }[] = [];
                    const seenProfs = new Set<string>();

                    // Mapear perfiles a la lista final
                    perfilesData.forEach(perfil => {
                        if (seenProfs.has(perfil.id)) return;
                        if (perfil.nombre?.trim().toLowerCase().includes('profesor general')) return;

                        // Encontrar asignatura asociada (priorizar proyecto actual o el primero que encontremos)
                        const proyAsociado = proyectosData.find(p => p.created_by === perfil.id) 
                                           || proyectosData.find(p => colaboradoresData?.some(c => c.proyecto_id === p.id && c.profesor_id === perfil.id));

                        let displayName = perfil.nombre;
                        if (!displayName || displayName === perfil.email) {
                            displayName = (perfil as any).email?.split('@')[0] || 'Profesor';
                            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                        }

                        seenProfs.add(perfil.id);
                        profesEncontrados.push({
                            id: perfil.id,
                            nombre: displayName,
                            asignatura: proyAsociado?.asignatura || 'General'
                        });
                    });

                    setProfesores(profesEncontrados);
                } catch (error) {
                    console.error("Error al cargar profesores", error);
                }
            };

            cargarProfesores();
        }
    }, [isOpen, historialClases]);

    // Cargar mensajes desde Supabase
    useEffect(() => {
        if (!isOpen || !alumnoId) return;

        const cargarMensajes = async () => {
            const { data, error } = await supabase
                .from('mensajes_profesor_alumno')
                .select('*')
                .eq('alumno_user_id', alumnoId)
                .order('created_at', { ascending: true }); // Los más antiguos primero

            if (!error && data) {
                // Agrupar mensajes por profesor_user_id
                const groupedMessages: Record<string, Mensaje[]> = {};
                data.forEach(msg => {
                    const profId = msg.profesor_user_id;
                    if (!groupedMessages[profId]) groupedMessages[profId] = [];
                    groupedMessages[profId].push(msg);
                });
                setMensajes(groupedMessages);
            }
        };

        cargarMensajes();

        // Suscripción a nuevos mensajes
        const subscription = supabase.channel(`chat_alu_${alumnoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'mensajes_profesor_alumno',
                filter: `alumno_user_id=eq.${alumnoId}`
            }, payload => {
                const newMessage = payload.new as Mensaje;
                
                // Solo añadir si es del otro usuario o si no existe en nuestro estado local
                setMensajes(prev => {
                    const profId = newMessage.profesor_user_id;
                    const thread = prev[profId] || [];
                    
                    // Verificar si ya existe (para evitar duplicados de actualizaciones optimistas)
                    if (thread.some(m => m.id === newMessage.id)) return prev;
                    
                    return {
                        ...prev,
                        [profId]: [...thread, newMessage]
                    };
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'mensajes_profesor_alumno',
                filter: `alumno_user_id=eq.${alumnoId}`
            }, payload => {
                const updatedMessage = payload.new as Mensaje;
                setMensajes(prev => {
                    const profId = updatedMessage.profesor_user_id;
                    const thread = prev[profId] || [];
                    return {
                        ...prev,
                        [profId]: thread.map(m => m.id === updatedMessage.id ? updatedMessage : m)
                    };
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [isOpen, alumnoId]);

    useEffect(() => {
        // Scroll al final cuando cambian los mensajes
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes, profesorSeleccionado]);

    const handleEnviarMensaje = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!nuevoMensaje.trim() || !profesorSeleccionado) return;

        const newMessageTexto = nuevoMensaje.trim();
        const tempId = `temp-${Date.now()}`;
        setNuevoMensaje('');

        // Optimistic Update
        const optimisticMsg: Mensaje = {
            id: tempId,
            sender_id: alumnoId,
            profesor_user_id: profesorSeleccionado,
            alumno_user_id: alumnoId,
            alumno_nombre: alumnoNombre,
            mensaje: newMessageTexto,
            created_at: new Date().toISOString(),
            leido: false
        };

        setMensajes(prev => ({
            ...prev,
            [profesorSeleccionado]: [...(prev[profesorSeleccionado] || []), optimisticMsg]
        }));

        // Insert to DB
        const { data, error } = await supabase
            .from('mensajes_profesor_alumno')
            .insert([{
                alumno_user_id: alumnoId,
                profesor_user_id: profesorSeleccionado,
                alumno_nombre: alumnoNombre,
                mensaje: newMessageTexto,
                sender_id: alumnoId,
                leido: false
            }])
            .select()
            .single();

        if (error) {
            console.error("Error al enviar mensaje:", error);
            // Remove optimistic message on error
            setMensajes(prev => ({
                ...prev,
                [profesorSeleccionado]: (prev[profesorSeleccionado] || []).filter(m => m.id !== tempId)
            }));
            toast.error('No se pudo enviar el mensaje');
        } else if (data) {
            // Replace optimistic message with actual data from server
            setMensajes(prev => ({
                ...prev,
                [profesorSeleccionado]: (prev[profesorSeleccionado] || []).map(m => m.id === tempId ? data : m)
            }));
        }
    };

    // Marcar mensajes recibidos como leídos al abrir una conversación
    const marcarComoLeido = async (profesorId: string) => {
        await supabase
            .from('mensajes_profesor_alumno')
            .update({ leido: true })
            .eq('alumno_user_id', alumnoId)
            .eq('profesor_user_id', profesorId)
            .neq('sender_id', alumnoId)
            .eq('leido', false);

        // Actualizar estado local también
        setMensajes(prev => {
            const thread = prev[profesorId];
            if (!thread) return prev;
            return {
                ...prev,
                [profesorId]: thread.map(m => m.sender_id !== alumnoId ? { ...m, leido: true } : m)
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

    const profesFiltrados = profesores.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    const mensajesChatActivo = profesorSeleccionado ? (mensajes[profesorSeleccionado] || []) : [];
    const profActual = profesores.find(p => p.id === profesorSeleccionado);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

                {/* COLUMNA IZQUIERDA: CONTACTOS */}
                <div className={`w-full md:w-80 flex-col border-r border-slate-200 bg-slate-50 ${profesorSeleccionado ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 md:p-6 bg-white border-b border-slate-200 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-fuchsia-600" />
                                Profesores
                            </h2>
                            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar profesor..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {profesFiltrados.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                Ningún profesor encontrado
                            </div>
                        ) : (
                            profesFiltrados.map(profe => {
                                const ultMsgs = mensajes[profe.id] || [];
                                const ultMsg = ultMsgs.length > 0 ? ultMsgs[ultMsgs.length - 1] : null;
                                const noLeidos = ultMsgs.filter(m => m.sender_id !== alumnoId && !m.leido).length;

                                return (
                                    <button
                                        key={profe.id}
                                        onClick={() => { setProfesorSeleccionado(profe.id); marcarComoLeido(profe.id); }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border-2 text-left group ${profesorSeleccionado === profe.id
                                            ? 'bg-fuchsia-50 border-fuchsia-200'
                                            : 'bg-white border-transparent hover:border-slate-100'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border-2 ${profesorSeleccionado === profe.id ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200'}`}>
                                            {profe.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-bold truncate text-sm leading-tight ${profesorSeleccionado === profe.id ? 'text-fuchsia-900' : 'text-slate-700 group-hover:text-slate-900'}`}>{profe.nombre}</h3>
                                                {ultMsg && (
                                                    <span className={`text-[10px] whitespace-nowrap ml-2 ${profesorSeleccionado === profe.id ? 'text-fuchsia-400 font-bold' : 'text-slate-400 font-medium'}`}>
                                                        {getTiempoTranscurrido(ultMsg.created_at)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className={`text-[11px] truncate flex-1 min-w-0 ${noLeidos > 0 ? 'text-slate-800 font-bold' : (profesorSeleccionado === profe.id ? 'text-fuchsia-600' : 'text-slate-500')} tracking-tight`}>
                                                    {ultMsg ? ultMsg.mensaje : `Profesor de ${profe.asignatura}`}
                                                </p>
                                                {noLeidos > 0 && (
                                                    <span className="shrink-0 ml-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                                                        {noLeidos}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: SECCIÓN CHAT */}
                <div className={`flex-1 flex flex-col bg-white ${!profesorSeleccionado ? 'hidden md:flex' : 'flex'}`}>
                    {profesorSeleccionado ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-[72px] border-b border-slate-200 px-4 md:px-6 flex items-center gap-4 shrink-0 bg-white sticky top-0 z-10">
                                <button
                                    onClick={() => setProfesorSeleccionado(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-black text-slate-800 tracking-tight leading-tight">{profActual?.nombre}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Profesor de {profActual?.asignatura}
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
                                            <p className="text-sm">Escribe a tu profesor si tienes dudas sobre la clase.</p>
                                        </div>
                                    </div>
                                ) : (
                                    mensajesChatActivo.map((msg, i) => {
                                        const isMe = msg.sender_id === alumnoId;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe ? 'bg-fuchsia-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                                                    {msg.tarea_titulo && (
                                                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 py-0.5 px-2 rounded-md ${isMe ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                                            Tarea: {msg.tarea_titulo}
                                                        </div>
                                                    )}
                                                    <p className="text-[13px] leading-relaxed break-words">{msg.mensaje}</p>
                                                    <div className={`flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && (
                                                            <span className="ml-1 tracking-tighter text-[11px]">
                                                                {msg.leido ? '✓✓' : '✓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="px-4 py-4 md:px-6 md:py-5 border-t border-slate-200 bg-white sticky bottom-0 z-10">
                                <form onSubmit={handleEnviarMensaje} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        placeholder="Escribe un mensaje al profesor..."
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
                        <div className="h-full relative flex flex-col items-center justify-center text-slate-400">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hidden md:flex"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="font-bold text-slate-600 text-lg">Selecciona un chat</p>
                            <p className="text-sm mt-2">Elige un profesor de la lista para enviarle un mensaje.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

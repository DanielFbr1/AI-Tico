import { X, Sparkles, MessageSquare, Brain, Mic, Volume2, Globe, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Grupo } from '../types';
import { MentorConfigChat } from './MentorConfigChat';

interface ModalConfiguracionIAProps {
    onClose: () => void;
    grupo?: Grupo; // Si existe, configura solo este grupo
    proyectoId?: string; // Si no hay grupo, usa este ID para actualizar TODOS
}

export function ModalConfiguracionIA({ onClose, grupo, proyectoId }: ModalConfiguracionIAProps) {
    // Estados iniciales basados en el grupo (o defaults)
    const [nivelExigencia, setNivelExigencia] = useState<string>(grupo?.configuracion?.nivel_exigencia || 'Medio');
    const [tono, setTono] = useState<string>(grupo?.configuracion?.tono || 'Divertido');
    const [nivelApoyo, setNivelApoyo] = useState<string>(grupo?.configuracion?.nivel_apoyo || 'Guía');
    const [formatoRespuesta, setFormatoRespuesta] = useState<string>(grupo?.configuracion?.formato_respuesta || 'Detallado');
    const [frecuenciaEmojis, setFrecuenciaEmojis] = useState<boolean>(
        grupo?.configuracion?.usar_emojis !== undefined ? grupo.configuracion.usar_emojis : true
    );

    // NUEVOS ESTADOS para Voz y Micro
    const [vozActivada, setVozActivada] = useState(grupo?.configuracion?.voz_activada ?? true);
    const [microfonoActivado, setMicrofonoActivado] = useState(grupo?.configuracion?.microfono_activado ?? true);

    // NUEVO ESTADO para Instrucciones
    const [instrucciones, setInstrucciones] = useState(grupo?.configuracion?.instrucciones_comportamiento || '');

    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(false);

    const isGlobal = !grupo && !!proyectoId;

    useEffect(() => {
        const fetchIAConfig = async () => {
            if (!proyectoId) return;
            setCargando(true);
            try {
                if (isGlobal) {
                    const { data, error } = await supabase
                        .from('proyectos')
                        .select('config_ia_global, instrucciones_ia_global')
                        .eq('id', proyectoId)
                        .single();

                    if (error) throw error;
                    if (data) {
                        const config = data.config_ia_global || {};
                        setNivelExigencia(config.nivel_exigencia || 'Medio');
                        setTono(config.tono || 'Divertido');
                        setNivelApoyo(config.nivel_apoyo || 'Guía');
                        setFormatoRespuesta(config.formato_respuesta || 'Detallado');
                        setVozActivada(config.voz_activada ?? true);
                        setMicrofonoActivado(config.microfono_activado ?? true);
                        setFrecuenciaEmojis(config.usar_emojis ?? true);
                        setInstrucciones(data.instrucciones_ia_global || '');
                    }
                } else if (grupo) {
                    // Si ya tenemos el grupo con su configuración, no hace falta fetch
                    // Pero si queremos asegurar datos frescos:
                    const { data, error } = await supabase
                        .from('grupos')
                        .select('configuracion')
                        .eq('id', grupo.id)
                        .single();
                    if (!error && data?.configuracion) {
                        const config = data.configuracion;
                        setNivelExigencia(config.nivel_exigencia || 'Medio');
                        setTono(config.tono || 'Divertido');
                        setNivelApoyo(config.nivel_apoyo || 'Guía');
                        setFormatoRespuesta(config.formato_respuesta || 'Detallado');
                        setVozActivada(config.voz_activada ?? true);
                        setMicrofonoActivado(config.microfono_activado ?? true);
                        setFrecuenciaEmojis(config.usar_emojis ?? true);
                        setInstrucciones(config.instrucciones_comportamiento || '');
                    }
                }
            } catch (error) {
                console.error('Error fetching IA config:', error);
                // toast.error('Error al cargar configuración actual');
            } finally {
                setCargando(false);
            }
        };

        fetchIAConfig();
    }, [proyectoId, grupo, isGlobal]);

    const handleGuardar = async (autoGuardado: boolean = false) => {
        if (!autoGuardado) setGuardando(true);

        try {
            const newConfig = {
                ...(grupo ? grupo.configuracion : {}),
                voz_activada: vozActivada,
                microfono_activado: microfonoActivado,
                usar_emojis: frecuenciaEmojis,
                instrucciones_comportamiento: instrucciones,
                tono: tono,
                nivel_exigencia: nivelExigencia,
                nivel_apoyo: nivelApoyo,
                formato_respuesta: formatoRespuesta
            };

            if (grupo) {
                // Actualizar UN grupo
                const { error } = await supabase
                    .from('grupos')
                    .update({ configuracion: newConfig })
                    .eq('id', grupo.id);

                if (error) throw error;
                if (!autoGuardado) toast.success('Ajustes del grupo actualizados');
            } else if (proyectoId) {
                // 1. Actualizar TODOS los grupos de este proyecto
                const { error: errorGrupos } = await supabase
                    .from('grupos')
                    .update({ configuracion: newConfig })
                    .eq('proyecto_id', proyectoId);

                if (errorGrupos) throw errorGrupos;

                // 2. Actualizar la configuración GLOBAL en la tabla proyectos
                const { error: errorProyecto } = await supabase
                    .from('proyectos')
                    .update({
                        config_ia_global: newConfig,
                        instrucciones_ia_global: instrucciones
                    })
                    .eq('id', proyectoId);

                if (errorProyecto) throw errorProyecto;

                if (!autoGuardado) toast.success('Ajustes aplicados globalmente');
            } else {
                if (!autoGuardado) toast.error('Error: No se pudo identificar el proyecto activo');
            }
            if (!autoGuardado) onClose();
        } catch (error) {
            console.error('Error saving config:', error);
            if (!autoGuardado) toast.error('Error al guardar configuración');
        } finally {
            setGuardando(false);
        }
    };

    // Auto-save whenever internal instructions/settings are updated by AI
    const handleAISettingsUpdate = (newInst: string, newSet: any) => {
        if (newInst !== undefined) setInstrucciones(newInst);

        if (newSet) {
            if (newSet.tono) setTono(newSet.tono as any);
            if (newSet.nivel_exigencia) setNivelExigencia(newSet.nivel_exigencia as any);
            if (newSet.nivel_apoyo) setNivelApoyo(newSet.nivel_apoyo as any);
            if (newSet.formato_respuesta) setFormatoRespuesta(newSet.formato_respuesta as any);
        }

        // Timeout para asegurar que react ha batcheado los sets antes del guardado.
        setTimeout(() => {
            handleGuardar(true);
            toast.success("✨ Instrucciones actualizadas y guardadas por la IA");
        }, 100);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
                {/* Header - More Compact */}
                <div className={`px-6 py-4 text-white flex items-center justify-between shrink-0 ${isGlobal ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            {isGlobal ? <Globe className="w-5 h-5 text-blue-300" /> : <Sparkles className="w-5 h-5 text-yellow-300" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                Ajustes Mentor IA
                                {isGlobal && <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Global</span>}
                            </h2>
                            <p className={`${isGlobal ? 'text-slate-400' : 'text-purple-100'} font-medium text-xs`}>
                                {isGlobal ? 'Configuración para TODOS los grupos' : `Personaliza para ${grupo?.nombre || 'este grupo'}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 bg-gray-50 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* COLUMNA IZQUIERDA: CHAT (ASISTENTE) */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-100 ring-4 ring-indigo-50/50">
                                <label className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide mb-2">
                                    <Bot className="w-5 h-5 text-indigo-600" />
                                    Tu Asistente Tico
                                </label>
                                <p className="text-xs text-indigo-500 font-medium mb-4">
                                    Configura el comportamiento o pídeme ayuda pedagógica.
                                </p>
                                <MentorConfigChat
                                    currentInstructions={instrucciones}
                                    onUpdateInstructions={(newInst) => handleAISettingsUpdate(newInst, null)}
                                    onUpdateSettings={(settings) => handleAISettingsUpdate(undefined as any, settings)}
                                    currentTone={tono}
                                />
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: CONFIGURACIÓN RÁPIDA */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Personalidad y Prompt Manual */}
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-indigo-100 flex flex-col">
                                <label className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide mb-2">
                                    Instrucción de Comportamiento
                                </label>
                                <p className="text-[10px] text-gray-500 mb-2 font-medium">
                                    Texto secreto que define cómo actúa Tico con el alumno. Puedes editarlo o pedirle a Tico en el chat que lo haga por ti.
                                </p>
                                <textarea
                                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-none transition-all"
                                    placeholder="Ej: Actúa como un experto en Roma antigua..."
                                    value={instrucciones}
                                    onChange={(e) => setInstrucciones(e.target.value)}
                                />
                            </div>
                            {/* Resumen de Ajustes Detectados */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Formato</span>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-black uppercase tracking-tight">{formatoRespuesta}</span>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tono</span>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-black uppercase tracking-tight">{tono}</span>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Exigencia</span>
                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[11px] font-black uppercase tracking-tight">{nivelExigencia}</span>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center shadow-sm">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Apoyo</span>
                                    <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[11px] font-black uppercase tracking-tight">{nivelApoyo}</span>
                                </div>
                            </div>

                            {/* Toggles de Hardware/UI */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${vozActivada ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Volume2 className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">Voz de Tico</span>
                                    </div>
                                    <button
                                        onClick={() => setVozActivada(!vozActivada)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${vozActivada ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${vozActivada ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${microfonoActivado ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Mic className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">Micrófono</span>
                                    </div>
                                    <button
                                        onClick={() => setMicrofonoActivado(!microfonoActivado)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${microfonoActivado ? 'bg-purple-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${microfonoActivado ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${frecuenciaEmojis ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">Usar Emojis</span>
                                    </div>
                                    <button
                                        onClick={() => setFrecuenciaEmojis(!frecuenciaEmojis)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${frecuenciaEmojis ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${frecuenciaEmojis ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase tracking-widest text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => handleGuardar(false)}
                        disabled={guardando}
                        className={`px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 ${guardando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {guardando ? 'Guardando...' : 'Aplicar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}

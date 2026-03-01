import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';
import { Grupo } from '../types';
import { generarRespuestaIA } from '../services/ai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { voiceService } from '../services/voiceService';

interface Mensaje {
  id: string;
  tipo: 'alumno' | 'ia';
  contenido: string;
  categoria: 'Metacognitiva' | 'Técnica' | 'Organizativa' | 'Creativa';
  timestamp: Date;
}

interface ChatIAProps {
  grupo: Grupo;
  onNuevoMensaje?: (mensaje: Mensaje) => void;
  readOnly?: boolean;
  mostrarEjemplo?: boolean;
  proyectoNombre?: string;
  contextoIA?: string;
}

const mensajesEjemplo: Mensaje[] = [
  {
    id: 'ex-1',
    tipo: 'alumno',
    contenido: '¿Cómo podemos empezar a organizar el podcast sobre cambio climático?',
    categoria: 'Organizativa',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: 'ex-2',
    tipo: 'ia',
    contenido: 'Es una gran pregunta. Antes de dividir tareas, ¿habéis pensado qué impacto queréis causar en vuestros oyentes? ¿Qué es lo más importante que deberían aprender?',
    categoria: 'Creativa',
    timestamp: new Date(Date.now() - 3500000)
  },
  {
    id: 'ex-3',
    tipo: 'alumno',
    contenido: 'Queremos que entiendan que reciclar no es suficiente, hay que reducir el consumo.',
    categoria: 'Metacognitiva',
    timestamp: new Date(Date.now() - 3400000)
  },
  {
    id: 'ex-4',
    tipo: 'ia',
    contenido: 'Interesante enfoque. ¿Cómo creéis que podríais estructurar el guion para que ese mensaje sea el corazón del episodio sin que parezca un simple sermón?',
    categoria: 'Creativa',
    timestamp: new Date(Date.now() - 3300000)
  }
];

const preguntasSugeridas = [
  { texto: "¿Por dónde empezamos este proyecto?", categoria: 'Organizativa' as const },
  { texto: "¿Qué pasos deberíamos seguir ahora?", categoria: 'Organizativa' as const },
  { texto: "¿Cómo podemos mejorar nuestra idea?", categoria: 'Creativa' as const },
  { texto: "¿Qué nos falta para completar la tarea?", categoria: 'Metacognitiva' as const }
];

export function MentorChat({ grupo, onNuevoMensaje, readOnly, mostrarEjemplo, proyectoNombre, contextoIA }: ChatIAProps) {
  const { user, perfil } = useAuth();
  const isReadOnly = readOnly ?? false;
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [categoriaMensaje, setCategoriaMensaje] = useState<Mensaje['categoria']>('Creativa');
  const [escribiendo, setEscribiendo] = useState(false);
  const [loading, setLoading] = useState(true);
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- NUEVO: ESTADOS DE VOZ Y ESCRITURA MEJORADOS ---
  const [displayedContent, setDisplayedContent] = useState('');
  const [typingId, setTypingId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);


  // CONFIGURACIÓN: Por defecto muteado (true) y chequeo de permisos de Admin (grupo.configuracion)
  // Si config es undefined, asumimos TRUE (permitido) por compatibilidad
  const vozPermitidaAdmin = grupo.configuracion?.voz_activada ?? true;
  const microPermitidoAdmin = grupo.configuracion?.microfono_activado ?? true;

  // Inicializar estado muteado dependiendo del servicio PERO forzar mute si el Admin no permite voz
  const [isMuted, setIsMuted] = useState(!vozPermitidaAdmin || voiceService.isMuted());

  // Sincronizar cambios en config para mutear si el admin lo apaga en caliente
  useEffect(() => {
    if (!vozPermitidaAdmin) {
      setIsMuted(true);
      if (typeof voiceService.setMuted === 'function') {
        voiceService.setMuted(true);
      }
    }
  }, [vozPermitidaAdmin]);

  /* --- MODIFICACIÓN: USO DE GROQ WHISPER (Grabación de Audio) --- */
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
          // Import dynamic to avoid circular dependency issues if any, though regular import is fine here
          const { transcribirAudio } = await import('../services/ai');
          const text = await transcribirAudio(audioBlob);
          if (text) {
            setInputMensaje((prev) => prev + (prev ? ' ' : '') + text);
          }
        } catch (error) {
          console.error("Error transcribing:", error);
          toast.error("Error al transcribir audio");
        } finally {
          setIsTranscribing(false);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleListening = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleMute = () => {
    const newMutedState = voiceService.toggleMute();
    setIsMuted(newMutedState);
    if (!newMutedState) {
      toast.info("Audio activado 🔊");
    } else {
      toast.info("Audio silenciado 🔇");
    }
  };

  const cleanTextForTTS = (text: string) => {
    return text
      .replace(/[*#_`]/g, '') // Markdown chars
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1F200}-\u{1F2FF}\u{1F004}\u{1F0CF}\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F18E}\u{1F191}-\u{1F19A}]/gu, '') // Emojis
      .trim();
  };

  const speakText = (text: string) => {
    voiceService.speak(text);
  };

  // Efecto de escritura robusto
  useEffect(() => {
    if (!typingId) return;

    const messageToType = mensajes.find(m => m.id === typingId);
    if (!messageToType || !messageToType.contenido) return;

    const text = messageToType.contenido;
    setDisplayedContent('');

    const typeChar = () => {
      // Si ya no estamos escribiendo este mensaje (ej: pulsado Stop), salimos
      setDisplayedContent(prev => {
        if (!typingId) return prev;

        const nextIndex = prev.length + 1;
        if (nextIndex <= text.length) {
          const randomSpeed = Math.floor(Math.random() * 15) + 20;
          typingTimerRef.current = setTimeout(typeChar, randomSpeed);
          return text.substring(0, nextIndex);
        } else {
          setTypingId(null);
          return text;
        }
      });
      scrollToBottom();
    };

    typingTimerRef.current = setTimeout(typeChar, 100);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [typingId]);
  // ----------------------------------------

  useEffect(() => {
    fetchMensajes();
  }, [grupo.id, mostrarEjemplo]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const fetchMensajes = async () => {
    if (mostrarEjemplo) {
      setMensajes(mensajesEjemplo);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensajes_chat')
        .select('*')
        .eq('grupo_id', grupo.id)
        .eq('modo', 'ia')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const adaptiveMessages: Mensaje[] = (data || []).map(m => ({
        id: m.id.toString(),
        tipo: m.tipo === 'assistant' ? 'ia' : 'alumno',
        contenido: m.contenido,
        categoria: 'Creativa', // Default if not in DB
        timestamp: new Date(m.created_at)
      }));

      setMensajes(adaptiveMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const detectarCategoria = (texto: string): Mensaje['categoria'] => {
    const textoLower = texto.toLowerCase();
    if (textoLower.includes('cómo') && (textoLower.includes('siento') || textoLower.includes('pienso') || textoLower.includes('aprendido'))) return 'Metacognitiva';
    if (textoLower.includes('herramienta') || textoLower.includes('programa') || textoLower.includes('técnica')) return 'Técnica';
    if (textoLower.includes('dividir') || textoLower.includes('organizar') || textoLower.includes('repartir')) return 'Organizativa';
    return 'Creativa';
  };

  const enviarMensaje = async (texto?: string, categoria?: Mensaje['categoria']) => {
    if (mostrarEjemplo) {
      toast.info("¡Buen intento! Pero esto es solo una demostración interactiva. El chat real estará disponible cuando te unas a un grupo.");
      return;
    }

    const mensajeTexto = texto || inputMensaje.trim();
    if (!mensajeTexto) return;

    const categoriaDetectada = categoria || detectarCategoria(mensajeTexto);

    // 1. Mensaje temporal del alumno (Optimistic Update)
    const mensajeAlumno: Mensaje = {
      id: `temp-${Date.now()}`,
      tipo: 'alumno',
      contenido: mensajeTexto,
      categoria: categoriaDetectada,
      timestamp: new Date()
    };

    setMensajes((prev) => [...prev, mensajeAlumno]);
    setInputMensaje('');
    setEscribiendo(true);

    // Inicializar AbortController para permitir detener
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 2. Guardar en Base de Datos (Alumno)
      const { error: errorAlumno } = await supabase.from('mensajes_chat').insert([{
        grupo_id: grupo.id,
        usuario_id: user?.id,
        tipo: 'user',
        contenido: mensajeTexto,
        modo: 'ia'
      }]);

      if (errorAlumno) throw errorAlumno;

      // 3. Obtener respuesta de IA con MEMORIA (Historial completo)
      // Pasamos el historial previo. generarRespuestaIA añadirá el mensajeUsuario al final automáticamente.
      const historialParaIA = mensajes.map(m => ({
        role: (m.tipo === 'ia' ? 'assistant' : 'user') as 'assistant' | 'user' | 'system',
        content: m.contenido
      }));

      const respuestaTexto = await generarRespuestaIA(
        mensajeTexto,
        grupo.nombre, // Nombre del Grupo
        mostrarEjemplo ? 'Proyecto Demo' : (proyectoNombre || 'Proyecto'), // Nombre del Proyecto
        historialParaIA,
        grupo.hitos || [], // Tareas del grupo
        proyectoNombre !== 'Proyecto Demo' ? (contextoIA || "") : "", // Contexto IA
        undefined, // configuracion
        controller.signal
      );

      // 4. PREPARAR AUDIO (Búfer de sincronización)
      // No mostramos el mensaje todavía. Esperamos a que ElevenLabs nos dé el audio.
      let audioReady: HTMLAudioElement | null = null;
      try {
        if (!voiceService.isMuted()) {
          audioReady = await voiceService.prepareAudio(respuestaTexto);
        }
      } catch (err) {
        console.error("Error pre-loading audio:", err);
      }

      // 5. Guardar mensaje de IA en Base de Datos
      const { error: errorIA } = await supabase.from('mensajes_chat').insert([{
        grupo_id: grupo.id,
        tipo: 'assistant',
        contenido: respuestaTexto,
        modo: 'ia'
      }]);

      if (errorIA) {
        console.error("Error guardando IA en DB:", errorIA);
      }

      // 5. ACTUALIZAR MÉTRICA: Incrementar interacciones_ia del grupo RPC
      await supabase.rpc('incrementar_interacciones_ia', { grupo_id_param: grupo.id });

      // 6. Mensaje real de IA en local
      const mensajeIA: Mensaje = {
        id: `temp-ia-${Date.now()}`,
        tipo: 'ia',
        contenido: respuestaTexto,
        categoria: categoriaDetectada,
        timestamp: new Date()
      };

      setMensajes((prev) => [...prev, mensajeIA]);

      // 7. REPRODUCIR AUDIO (Sincronizado con el texto que aparece)
      if (!voiceService.isMuted()) {
        voiceService.playAudio(audioReady, respuestaTexto);
      }

      // TRIGGER TYPEWRITER
      setTypingId(mensajeIA.id);

      if (onNuevoMensaje) {
        onNuevoMensaje(mensajeAlumno);
        onNuevoMensaje(mensajeIA);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("🤖 IA detenida por el usuario");
        return;
      }
      console.error("❌ Error grave en backend de Chat:", error);
    } finally {
      setEscribiendo(false);
      abortControllerRef.current = null;
    }
  };

  const detenerIA = () => {
    // 1. Cancelar petición API
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 2. Detener efecto de escritura
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setTypingId(null);
    // 3. Detener voz
    voiceService.stop();
    // 4. Quitar estado cargando
    setEscribiendo(false);
  };


  const getTipoColor = (tipo: Mensaje['categoria']) => {
    switch (tipo) {
      case 'Metacognitiva': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Técnica': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Organizativa': return 'bg-green-100 text-green-700 border-green-300';
      case 'Creativa': return 'bg-orange-100 text-orange-700 border-orange-300';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center bg-white border-2 border-gray-200 rounded-lg">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">Cargando chat socrático...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      {/* Header Eliminado a petición */}


      {/* Mensajes */}
      <div ref={containerRef} className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-4 bg-gray-50">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {isReadOnly ? 'Aún no hay mensajes' : '¡Hola! Soy tu Mentor IA'}
            </h4>
            <p className="text-gray-600 mb-6 max-w-md text-sm">
              {isReadOnly
                ? 'El grupo todavía no ha iniciado la conversación con el mentor socrático.'
                : 'Estoy aquí para ayudaros a reflexionar sobre vuestro proyecto. ¿En qué puedo ayudaros hoy?'}
            </p>
            {!isReadOnly && (
              <div className="w-full max-w-md">
                <div className="grid grid-cols-1 gap-2">
                  {preguntasSugeridas.map((pregunta, index) => (
                    <button
                      key={index}
                      onClick={() => enviarMensaje(pregunta.texto, pregunta.categoria)}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-xs text-gray-700 shadow-sm"
                    >
                      {pregunta.texto}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ... list messages logic ... */
          <>
            {mensajes.map((mensaje) => {
              // Lógica de visualización parcial
              const isTypingThis = typingId === mensaje.id;
              const contentToShow = isTypingThis ? displayedContent : mensaje.contenido;

              return (
                <div
                  key={mensaje.id}
                  className={`mb-3 md:mb-4 ${mensaje.tipo === 'alumno' ? 'flex justify-end' : 'flex justify-start'}`}
                >
                  <div className={`max-w-[90%] md:max-w-[85%] ${mensaje.tipo === 'alumno' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {mensaje.tipo === 'ia' && <Bot className="w-4 h-4 text-gray-600" />}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {mensaje.tipo === 'ia' ? 'Mentor IA' : 'Estudiante'}
                      </span>
                    </div>
                    <div
                      className={`p-2.5 md:p-3 rounded-2xl ${mensaje.tipo === 'alumno'
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100'
                        : 'bg-white border border-slate-100 text-gray-900 rounded-tl-none shadow-sm'
                        }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {contentToShow}
                        {isTypingThis && (
                          <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-500 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {escribiendo && !typingId && (
              /* ... bounce animation ... */
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-gray-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mentor IA</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-900 rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={mensajesEndRef} />
          </>
        )}
      </div>

      {/* Input / ReadOnly Banner */}
      {/* Input / ReadOnly Banner */}
      <div className="border-t border-gray-100 p-3 md:p-4 bg-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        {isReadOnly ? (
          <div className="flex items-center justify-center gap-3 py-2 text-slate-400 italic text-sm">
            <Bot className="w-4 h-4 opacity-50" />
            <span>Modo supervisión: Estás viendo la conversación del grupo</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3 rounded-2xl transition-all ${!isMuted
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                  }`}
                title={isMuted ? "Activar voz" : "Silenciar voz"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              {microPermitidoAdmin && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-2xl transition-all ${isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200'
                    : isTranscribing
                      ? 'bg-amber-100 text-amber-600 animate-pulse'
                      : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                    }`}
                  title={isRecording ? "Detener grabación" : "Dictar respuesta"}
                  disabled={isTranscribing}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMensaje}
                  onChange={(e) => setInputMensaje(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !escribiendo && !typingId && enviarMensaje()}
                  placeholder={isRecording ? "Grabando frase..." : isTranscribing ? "Transcribiendo..." : "Escribe a TICO..."}
                  className="w-full pl-4 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium placeholder:text-slate-400 shadow-inner"
                  disabled={escribiendo || !!typingId}
                />
              </div>

              {escribiendo || typingId ? (
                <button
                  onClick={detenerIA}
                  className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-all flex items-center justify-center border border-rose-100 shrink-0"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => enviarMensaje()}
                  disabled={!inputMensaje.trim()}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 shadow-lg shadow-indigo-200 active:scale-95 shrink-0"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              )}
            </div>
            {/* Mobile helper text or indicators can go here */}
          </div>
        )}
      </div>
    </div>
  );
}

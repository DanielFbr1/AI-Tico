import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Brain, Lightbulb, Volume2, Copy, ThumbsUp, ThumbsDown, Zap, Clock, Users, TrendingUp } from 'lucide-react';
import { Mensaje } from '../types';
import { generarRespuestaIA } from '../services/ai';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface MentorIAProps {
  grupoId: string;
  proyectoId: string;
  departamento: string;
  miembro: string;
}

export function MentorIA({ grupoId, proyectoId, departamento, miembro }: MentorIAProps) {
  // Lógica original mantenida intacta
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setLoading(true);
    
    try {
      const { data: newMsg } = await supabase
        .from('mensajes_chat')
        .insert([{ 
          grupo_id: grupoId, 
          remitente: miembro, 
          contenido: userMsg, 
          tipo: 'alumno' 
        }])
        .select()
        .single();
      
      if (newMsg) {
        setMensajes(prev => [...prev, newMsg]);
      }

      const respuesta = await generarRespuestaIA(
        userMsg, 
        departamento, 
        "Proyecto ABP", 
        mensajes.slice(-6).map(m => ({ 
          role: m.tipo === 'alumno' ? 'user' : 'assistant', 
          content: m.contenido 
        }))
      );

      const { data: iaMsg } = await supabase
        .from('mensajes_chat')
        .insert([{ 
          grupo_id: grupoId, 
          remitente: 'Mentor IA', 
          contenido: respuesta, 
          tipo: 'ia' 
        }])
        .select()
        .single();

      if (iaMsg) {
        setMensajes(prev => [...prev, iaMsg]);
      }
    } catch (error) {
      toast.error('Error con el Mentor IA');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener color según categoría (manteniendo lógica original)
  const getCategoryColor = (categoria?: string) => {
    switch (categoria) {
      case 'Técnica': return 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-l-4 border-blue-500';
      case 'Creativa': return 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-l-4 border-purple-500';
      case 'Organizativa': return 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-l-4 border-emerald-500';
      case 'Metacognitiva': return 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-4 border-amber-500';
      default: return 'bg-white/5 border-l-4 border-slate-500';
    }
  };

  return (
    <div className="relative h-[700px] flex flex-col bg-gradient-to-br from-white/80 to-slate-50/60 dark:from-gray-900/80 dark:to-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl shadow-indigo-500/5 dark:shadow-indigo-900/20 overflow-hidden">
      
      {/* Efecto de fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-32 translate-x-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full translate-y-48 -translate-x-48 blur-3xl" />

      {/* Header moderno */}
      <div className="relative p-6 border-b border-white/20 dark:border-gray-700/30 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 dark:from-indigo-900/90 dark:to-purple-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                Mentor IA Experto
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  Beta v2.0
                </span>
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-white/90 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {departamento}
                </span>
                <span className="text-sm text-white/90 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  {mensajes.filter(m => m.tipo === 'ia').length} respuestas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 group">
              <Volume2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            <button className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 group">
              <Copy className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Indicador de actividad */}
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* Área de mensajes con scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-white/5 dark:to-black/5">
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              ¡Comienza la conversación!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Pregunta a tu mentor IA sobre estrategias, recursos o cualquier duda relacionada con tu proyecto ABP.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-sm">
                ¿Cómo organizar el equipo?
              </span>
              <span className="px-4 py-2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-sm">
                Ideas creativas
              </span>
              <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm">
                Planificación temporal
              </span>
            </div>
          </div>
        ) : (
          <>
            {mensajes.map((mensaje, index) => (
              <div
                key={mensaje.id || index}
                className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                  mensaje.tipo === 'alumno' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Avatar IA */}
                {mensaje.tipo === 'ia' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}

                {/* Mensaje */}
                <div
                  className={`max-w-[75%] rounded-2xl p-4 backdrop-blur-sm ${
                    mensaje.tipo === 'alumno'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                      : `border border-white/20 dark:border-gray-700/30 shadow-lg shadow-black/5 ${getCategoryColor(mensaje.categoria)}`
                  }`}
                >
                  {/* Categoría IA */}
                  {mensaje.tipo === 'ia' && mensaje.categoria && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        mensaje.categoria === 'Técnica' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        mensaje.categoria === 'Creativa' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' :
                        mensaje.categoria === 'Organizativa' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                        'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {mensaje.categoria}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(mensaje.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Contenido */}
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {mensaje.contenido}
                  </p>

                  {/* Footer del mensaje */}
                  <div className={`flex items-center justify-between mt-4 pt-3 ${
                    mensaje.tipo === 'alumno' 
                      ? 'border-t border-white/20' 
                      : 'border-t border-gray-100/20 dark:border-gray-700/30'
                  }`}>
                    <span className="text-xs opacity-80">
                      {mensaje.tipo === 'alumno' ? miembro : 'Mentor IA'}
                    </span>
                    
                    {mensaje.tipo === 'ia' && (
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                          <ThumbsUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                          <ThumbsDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Usuario */}
                {mensaje.tipo === 'alumno' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <span className="font-bold text-white text-sm">
                      {miembro?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Indicador de carga IA */}
        {loading && (
          <div className="flex items-center gap-4 animate-in fade-in">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div className="bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-800/40 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  El mentor está pensando en tu pregunta...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de entrada mejorada */}
      <div className="p-6 border-t border-white/20 dark:border-gray-700/30 bg-gradient-to-b from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-900/20 backdrop-blur-sm">
        <form onSubmit={handleSend} className="space-y-4">
          {/* Sugerencias rápidas */}
          <div className="flex flex-wrap gap-2">
            {[
              '¿Cómo podemos mejorar la colaboración?',
              'Ideas para la presentación final',
              'Gestión eficiente del tiempo'
            ].map((sugerencia, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(sugerencia)}
                className="px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                {sugerencia}
              </button>
            ))}
          </div>

          <div className="relative flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta al mentor IA..."
                className="w-full px-5 py-4 pl-14 pr-16 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-transparent transition-all duration-200"
                disabled={loading}
              />
              
              {/* Icono izquierdo */}
              <div className="absolute left-5 top-1/2 -translate-y-1/2">
                <Lightbulb className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              
              {/* Contador de caracteres */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {input.length}/500
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`px-6 rounded-2xl font-medium transition-all duration-200 flex items-center gap-2 ${
                !input.trim() || loading
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>

          {/* Indicadores de ayuda */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Preguntas técnicas
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Organización
              </span>
            </div>
            <span>Mentor IA • v2.1</span>
          </div>
        </form>
      </div>
    </div>
  );
}
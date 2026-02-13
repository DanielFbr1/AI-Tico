import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { Mensaje } from '../types';
import { generarRespuestaIA } from '../services/ai';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export function MentorIA({ grupoId, proyectoId, departamento, miembro }: any) {
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
      const { data: newMsg } = await supabase.from('mensajes_chat').insert([{ grupo_id: grupoId, remitente: miembro, contenido: userMsg, tipo: 'alumno' }]).select().single();
      setMensajes(prev => [...prev, newMsg]);
      const respuesta = await generarRespuestaIA(userMsg, departamento, "Proyecto ABP", mensajes.slice(-6).map(m => ({ role: m.tipo === 'alumno' ? 'user' : 'assistant', content: m.contenido })));
      const { data: iaMsg } = await supabase.from('mensajes_chat').insert([{ grupo_id: grupoId, remitente: 'Mentor IA', contenido: respuesta, tipo: 'ia' }]).select().single();
      setMensajes(prev => [...prev, iaMsg]);
    } catch (error) {
      toast.error('Error con el Mentor IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[600px] glow">
      <div className="bg-gradient-to-r from-primary to-accent p-6 flex items-center gap-4 text-white">
        <div className="relative">
          <Bot size={32} className="relative z-10" />
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
        </div>
        <div>
          <h3 className="text-2xl font-black">MENTOR EXPERTO IA</h3>
          <p className="text-sm opacity-90">Departamento: {departamento}</p>
        </div>
        <Sparkles className="ml-auto" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        {mensajes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div className="space-y-4">
              <Zap className="h-12 w-12 text-primary mx-auto" />
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">¡Haz tu primera pregunta!</h4>
              <p className="text-slate-600 dark:text-slate-300">El Mentor IA está listo para guiar a tu equipo.</p>
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div
              key={i}
              className={cn(
                "p-4 rounded-2xl max-w-[80%]",
                m.tipo === 'alumno'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              )}
            >
              <div className="font-bold text-xs mb-1">{m.remitente}</div>
              <div>{m.contenido}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800"
          placeholder="Escribe tu pregunta al mentor IA..."
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : <Send />}
        </button>
      </form>
    </div>
  );
}
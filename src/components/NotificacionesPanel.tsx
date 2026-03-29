import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, FileText, MessageSquare, Upload, Award, Hand, Users, ClipboardCheck, Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface Notificacion {
  id: string;
  user_id: string;
  proyecto_id: string | null;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  leida: boolean;
  metadata: any;
  created_at: string;
}

interface NotificacionesPanelProps {
  userId: string;
  proyectoId?: string;
  onNotificationClick?: (notificacion: Notificacion) => void;
  hideHeader?: boolean;
  onUnreadChange?: (count: number) => void;
}

const TIPO_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  tarea_asignada: { icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  tarea_revision: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  mensaje_grupo: { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  recurso_subido: { icon: Upload, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  notas_actualizadas: { icon: Award, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
  mensaje_familia: { icon: MessageSquare, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
  mano_levantada: { icon: Hand, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  evaluacion_grupal: { icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  colaboracion_aceptada: { icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  hito_aprobado: { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  hito_rechazado: { icon: X, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  comentario_tarea: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  general: { icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function NotificacionesPanel({ userId, proyectoId, onNotificationClick, onUnreadChange, hideHeader = false }: NotificacionesPanelProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'no_leidas'>('todas');

  const fetchNotificaciones = async () => {
    let query = supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (proyectoId) {
      query = query.or(`proyecto_id.eq.${proyectoId},proyecto_id.is.null`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setNotificaciones(data);
      if (onUnreadChange) {
        onUnreadChange(data.filter((n: any) => !n.leida).length);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotificaciones();

    const channel = supabase
      .channel(`notificaciones_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchNotificaciones();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, proyectoId]);

  const marcarComoLeida = async (id: string) => {
    setNotificaciones(prev => {
      const newState = prev.map(n => n.id === id ? { ...n, leida: true } : n);
      if (onUnreadChange) {
        onUnreadChange(newState.filter(n => !n.leida).length);
      }
      return newState;
    });
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
  };


  const marcarTodasLeidas = async () => {
    await supabase.from('notificaciones').update({ leida: true }).eq('user_id', userId).eq('leida', false);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const eliminarNotificacion = async (id: string) => {
    setNotificaciones(prev => {
      const newState = prev.filter(n => n.id !== id);
      if (onUnreadChange) {
        onUnreadChange(newState.filter(n => !n.leida).length);
      }
      return newState;
    });
    await supabase.from('notificaciones').delete().eq('id', id);
  };

  const limpiarTodas = async () => {
    await supabase.from('notificaciones').delete().eq('user_id', userId);
    setNotificaciones([]);
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const filtered = filter === 'no_leidas'
    ? notificaciones.filter(n => !n.leida)
    : notificaciones;

  // Agrupar por fecha
  const grouped = filtered.reduce((acc, n) => {
    const date = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = '';
    if (date.toDateString() === today.toDateString()) key = 'Hoy';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Ayer';
    else key = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {} as Record<string, Notificacion[]>);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 relative">
              <Bell className="w-6 h-6" />
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Notificaciones</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
              <button
                onClick={() => setFilter('todas')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'todas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('no_leidas')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'no_leidas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
              >
                Sin Leer
              </button>
            </div>

            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all border border-blue-100"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Leer todas
              </button>
            )}

            {notificaciones.length > 0 && (
              <button
                onClick={limpiarTodas}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all border border-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control de borrado rápido si el header está oculto */}
      {hideHeader && (
        <div className="flex justify-end gap-2">
           {noLeidas > 0 && (
            <button onClick={marcarTodasLeidas} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline">Marcar todas como leídas</button>
           )}
           {notificaciones.length > 0 && (
            <button onClick={limpiarTodas} className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:underline">Limpiar todas</button>
           )}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Cargando notificaciones...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-rose-50 rounded-full flex items-center justify-center mb-6">
            <Bell className="w-10 h-10 text-orange-300" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">
            {filter === 'no_leidas' ? 'Todo leído' : 'Sin notificaciones'}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            {filter === 'no_leidas' ? '¡Estás al día con todo!' : 'Las notificaciones aparecerán aquí en tiempo real'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dateKey}</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              <div className="space-y-2">
                {items.map((notif, idx) => {
                  const config = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.general;
                  const IconComponent = config.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.leida) marcarComoLeida(notif.id);
                        if (onNotificationClick) onNotificationClick(notif);
                      }}
                      className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer animate-in fade-in slide-in-from-left-2 ${
                        !notif.leida
                          ? `bg-white ${config.border} shadow-sm hover:shadow-md border-l-4`
                          : 'bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-100'
                      }`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className={`w-10 h-10 ${config.bg} ${config.color} rounded-xl flex items-center justify-center shrink-0 ${!notif.leida ? 'shadow-sm' : ''}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`font-bold text-sm truncate ${!notif.leida ? 'text-slate-800' : 'text-slate-500'}`}>
                            {notif.titulo}
                          </p>
                          {!notif.leida && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 animate-pulse"></span>
                          )}
                        </div>
                        {notif.descripcion && (
                          <p className="text-xs text-slate-400 font-medium truncate">{notif.descripcion}</p>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-1 inline-block">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); eliminarNotificacion(notif.id); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

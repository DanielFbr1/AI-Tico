import { Edit2, Trash2, Users, MessageSquare, Clock, ArrowRight, ClipboardList } from 'lucide-react';
import { Grupo } from '../types';

interface CardGrupoProps {
  grupo: Grupo;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssignTasks?: () => void;
  onRevisar?: () => void;
  mostrarBotonEditar?: boolean;
  mostrarBotonBorrar?: boolean;
}

export function Card_Grupo({ grupo, onClick, onEdit, onDelete, onAssignTasks, onRevisar, mostrarBotonEditar = false, mostrarBotonBorrar = false }: CardGrupoProps) {
  const getEstadoStyles = (estado: Grupo['estado']) => {
    switch (estado) {
      case 'Completado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'Casi terminado':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
      case 'En progreso':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
      case 'Bloqueado':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20';
    }
  };

  const getProgresoColor = (progreso: number) => {
    if (progreso >= 100) return 'bg-emerald-500';
    if (progreso >= 50) return 'bg-blue-500';
    if (progreso >= 25) return 'bg-amber-500';
    if (progreso >= 25) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const formatTime = (mins?: number) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div
      className="flex flex-col gap-6 p-7 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden"
    >
      {/* Botones de acción rápidos */}
      {(mostrarBotonEditar || mostrarBotonBorrar || onAssignTasks) && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
          {onAssignTasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignTasks();
              }}
              className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
              title="Asignar Tareas con IA"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
          )}

          {mostrarBotonEditar && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
              title="Editar grupo"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {mostrarBotonBorrar && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-all"
              title="Eliminar grupo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div
        onClick={onClick}
        className="cursor-pointer relative z-10 h-full flex flex-col"
      >
        <div className="flex justify-between items-start mb-5">
          {/* Status Badge Removed */}
          {(grupo.hitos || []).some(h => h.estado === 'revision' || h.estado === 'propuesto') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRevisar && onRevisar();
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-200 animate-bounce hover:scale-105 active:scale-95 transition-all z-20"
            >
              <Clock className="w-3 h-3" />
              <span>{(grupo.hitos || []).filter(h => h.estado === 'revision' || h.estado === 'propuesto').length} Pendiente{(grupo.hitos || []).filter(h => h.estado === 'revision' || h.estado === 'propuesto').length !== 1 ? 's' : ''}</span>
            </button>
          )}
          {grupo.pedir_ayuda && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-rose-200 animate-pulse">
              <span>✋ Ayuda</span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-slate-800 leading-tight mb-6 group-hover:text-blue-600 transition-colors tracking-tight uppercase">
          {grupo.nombre}
        </h3>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Progreso</span>
            <span className="text-slate-600 font-black">{grupo.progreso}%</span>
          </div>
          <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-[2px] border border-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgresoColor(grupo.progreso)}`}
              style={{ width: `${grupo.progreso}%` }}
            />
          </div>
        </div>

        <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{grupo.miembros.length} Miembros</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-purple-600">{formatTime(grupo.tiempo_uso_minutos)}</span>
          </div>

          <div className="flex items-center gap-2 text-blue-500/70">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{grupo.interacciones_ia} Consultas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Users, TrendingUp, AlertCircle, CheckCircle2, MoreVertical, MessageSquare, ExternalLink } from 'lucide-react';
import { Grupo } from '../types';
import { cn } from '../lib/utils';

interface Props {
  grupo: Grupo;
  onVerAlumno: (nombre: string) => void;
  onCambiarEstado: (nuevoEstado: Grupo['estado']) => void;
}

export function GrupoCard({ grupo, onVerAlumno, onCambiarEstado }: Props) {
  const getEstadoColor = (estado: Grupo['estado']) => {
    switch (estado) {
      case 'Bloqueado': return 'bg-rose-500';
      case 'En progreso': return 'bg-primary';
      case 'Completado': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="group relative bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <MoreVertical size={18} />
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-card-foreground">{grupo.nombre}</h3>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">{grupo.departamento}</p>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold text-white", getEstadoColor(grupo.estado))}>
            {grupo.estado}
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Progreso</span>
            <span className="text-lg font-bold text-primary">{grupo.progreso}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${grupo.progreso}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {grupo.miembros.map((miembro) => (
            <span
              key={miembro}
              className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm"
            >
              <Users size={14} />
              {miembro}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare size={16} />
              {grupo.interacciones_ia}
            </span>
          </div>
          <button
            onClick={() => onVerAlumno(grupo.nombre)}
            className="text-primary hover:underline font-medium flex items-center gap-1"
          >
            Ver detalles <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
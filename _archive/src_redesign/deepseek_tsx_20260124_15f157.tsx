import React from 'react';
import { 
  Users, 
  TrendingUp, 
  MoreVertical,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart
} from 'lucide-react';
import { Grupo } from '../types';
import { cn } from '../lib/utils';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface Props {
  grupo: Grupo;
  onVerAlumno: (nombre: string) => void;
  onCambiarEstado: (nuevoEstado: Grupo['estado']) => void;
}

export function GrupoCard({ grupo, onVerAlumno, onCambiarEstado }: Props) {
  const getEstadoConfig = (estado: Grupo['estado']) => {
    switch (estado) {
      case 'Bloqueado':
        return {
          color: 'bg-rose-500',
          icon: AlertCircle,
          gradient: 'from-rose-500 to-pink-500',
          text: 'text-rose-600 dark:text-rose-400'
        };
      case 'En progreso':
        return {
          color: 'bg-blue-500',
          icon: TrendingUp,
          gradient: 'from-blue-500 to-cyan-500',
          text: 'text-blue-600 dark:text-blue-400'
        };
      case 'Completado':
        return {
          color: 'bg-emerald-500',
          icon: CheckCircle2,
          gradient: 'from-emerald-500 to-green-500',
          text: 'text-emerald-600 dark:text-emerald-400'
        };
      default:
        return {
          color: 'bg-slate-500',
          icon: Clock,
          gradient: 'from-slate-500 to-gray-500',
          text: 'text-slate-600 dark:text-slate-400'
        };
    }
  };

  const estadoConfig = getEstadoConfig(grupo.estado);
  const EstadoIcon = estadoConfig.icon;

  return (
    <div className="group relative">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main card */}
      <div className="relative glass rounded-3xl border border-border/50 p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
        {/* Status badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5",
            estadoConfig.text,
            "bg-gradient-to-r opacity-90"
          )}>
            <EstadoIcon className="w-3 h-3" />
            {grupo.estado}
          </div>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">{grupo.nombre}</h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {grupo.departamento}
                </span>
                <span className="text-xs text-muted-foreground">
                  {grupo.miembros.length} miembros
                </span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onVerAlumno(grupo.nombre)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCambiarEstado('En progreso')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Marcar en progreso
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Progreso del proyecto</span>
            </div>
            <span className="text-lg font-bold text-foreground">{grupo.progreso}%</span>
          </div>
          <div className="relative">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  grupo.progreso === 100 
                    ? "bg-gradient-to-r from-emerald-500 to-green-500"
                    : grupo.progreso > 50
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                )}
                style={{ width: `${grupo.progreso}%` }}
              />
            </div>
            {/* Progress milestones */}
            <div className="flex justify-between mt-1 px-1">
              {[0, 25, 50, 75, 100].map((milestone) => (
                <div
                  key={milestone}
                  className={cn(
                    "w-1 h-1 rounded-full",
                    grupo.progreso >= milestone ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Team members */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Equipo</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {grupo.miembros.map((miembro, index) => (
              <div
                key={miembro}
                className={cn(
                  "px-3 py-2 rounded-xl flex items-center gap-2",
                  "bg-gradient-to-br from-background to-muted/50 border border-border/50",
                  "hover:border-primary/30 transition-all"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold gradient-text">
                    {miembro.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium">{miembro}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {grupo.interacciones_ia} IA chats
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted" />
            <div className="text-sm text-muted-foreground">
              Última: Hoy
            </div>
          </div>
          
          <button
            onClick={() => onVerAlumno(grupo.nombre)}
            className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm flex items-center gap-2 transition-colors"
          >
            Ver equipo
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
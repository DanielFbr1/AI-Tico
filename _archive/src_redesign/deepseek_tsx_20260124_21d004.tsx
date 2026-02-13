import React from 'react';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

const stats = [
  {
    title: 'Proyectos Activos',
    value: '12',
    change: '+2 este mes',
    icon: Activity,
    color: 'from-blue-500 to-cyan-500',
    trend: 'up'
  },
  {
    title: 'Estudiantes',
    value: '48',
    change: '+5 inscritos',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    trend: 'up'
  },
  {
    title: 'Interacciones IA',
    value: '324',
    change: '+12% desde ayer',
    icon: MessageSquare,
    color: 'from-emerald-500 to-green-500',
    trend: 'up'
  },
  {
    title: 'Tareas Completadas',
    value: '89%',
    change: '+8% esta semana',
    icon: CheckCircle,
    color: 'from-amber-500 to-orange-500',
    trend: 'up'
  },
  {
    title: 'Tiempo Promedio',
    value: '3.2h',
    change: '-15% de mejora',
    icon: Clock,
    color: 'from-indigo-500 to-violet-500',
    trend: 'down'
  },
  {
    title: 'Objetivos Alcanzados',
    value: '75%',
    change: '5 de 8 objetivos',
    icon: Target,
    color: 'from-rose-500 to-pink-500',
    trend: 'up'
  }
];

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analítica del Aula</h2>
          <p className="text-muted-foreground">Métricas de rendimiento y participación</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Esta semana</option>
            <option>Este mes</option>
            <option>Este trimestre</option>
          </select>
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium">
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={cn(
                "glass rounded-2xl border border-border/50 p-6",
                "hover:border-primary/30 transition-all duration-300"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    <TrendingUp className={cn(
                      "w-4 h-4",
                      stat.trend === 'down' && 'rotate-180'
                    )} />
                    {stat.change}
                  </div>
                </div>
                
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br opacity-10"
                )}>
                  <Icon className={cn(
                    "w-6 h-6",
                    stat.color.replace('from-', 'text-').split(' ')[0]
                  )} />
                </div>
              </div>
              
              {/* Mini progress bar */}
              <div className="mt-4">
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r",
                      stat.color
                    )}
                    style={{ 
                      width: `${parseInt(stat.value) > 100 ? 100 : parseInt(stat.value)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engagement Chart */}
      <div className="glass rounded-2xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Participación por Departamento</h3>
            <p className="text-sm text-muted-foreground">Interacciones IA en los últimos 7 días</p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Ciencias', color: 'bg-blue-500' },
              { label: 'Matemáticas', color: 'bg-purple-500' },
              { label: 'Historia', color: 'bg-emerald-500' },
              { label: 'Arte', color: 'bg-amber-500' }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chart visualization */}
        <div className="h-64 flex items-end gap-4">
          {[65, 85, 45, 75, 90, 55, 80].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={cn(
                  "w-full rounded-t-lg transition-all hover:opacity-90",
                  index % 4 === 0 ? "bg-blue-500" :
                  index % 4 === 1 ? "bg-purple-500" :
                  index % 4 === 2 ? "bg-emerald-500" : "bg-amber-500"
                )}
                style={{ height: `${value}%` }}
              />
              <span className="text-xs text-muted-foreground mt-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
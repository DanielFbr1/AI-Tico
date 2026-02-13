import { TrendingUp, Users, MessageSquare, CheckCircle } from 'lucide-react';

const stats = [
  { label: 'Proyectos Activos', value: '12', icon: TrendingUp, change: '+2' },
  { label: 'Estudiantes', value: '48', icon: Users, change: '+5' },
  { label: 'Interacciones IA', value: '324', icon: MessageSquare, change: '+12%' },
  { label: 'Tareas Completadas', value: '89', icon: CheckCircle, change: '+8%' },
];

export function AnalyticsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <stat.icon size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {stat.change} este mes
          </div>
        </div>
      ))}
    </div>
  );
}
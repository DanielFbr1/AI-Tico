import { useState } from 'react';
import { BarChart3, FolderOpen, Users, Settings, LogOut, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function Sidebar_Docente({ itemActivo, onSelect }: any) {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { id: 'resumen', label: 'Dashboard', icon: BarChart3 },
    { id: 'proyectos', label: 'Proyectos', icon: FolderOpen },
    { id: 'mentor', label: 'Mentor IA', icon: Bot },
    { id: 'sala', label: 'Sala', icon: Users },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-r border-slate-200 dark:border-slate-800 flex flex-col gap-2 transition-all duration-300 z-50",
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div className="p-6 flex items-center justify-between">
        {!collapsed && <h1 className="text-2xl font-black text-slate-900 dark:text-white">ABP Mentor</h1>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>
      <div className="flex-1 px-4 space-y-2">
        {items.map(i => (
          <button
            key={i.id}
            onClick={() => onSelect(i.id)}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all",
              itemActivo === i.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <i.icon size={20} />
            {!collapsed && i.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 w-full p-3 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl"
        >
          <LogOut size={20} />
          {!collapsed && 'Salir'}
        </button>
      </div>
    </aside>
  );
}
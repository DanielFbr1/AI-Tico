import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Bot, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar_Docente({ itemActivo, onSelect }: { itemActivo: string; onSelect: (id: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();

  const items: SidebarItem[] = [
    { id: 'resumen', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'proyectos', label: 'Proyectos', icon: FolderKanban, badge: 3 },
    { id: 'mentor-ia', label: 'Mentor IA', icon: Bot },
    { id: 'colaboracion', label: 'Colaboración', icon: Users },
    { id: 'analitica', label: 'Analítica', icon: BarChart3 },
    { id: 'recursos', label: 'Recursos', icon: BookOpen },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen glass border-r border-border/50 flex flex-col transition-all duration-300 z-50",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className={cn(
          "flex items-center gap-3 transition-all",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg gradient-text">ABP Mentor</h1>
                <p className="text-xs text-muted-foreground">Dashboard Docente</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-xl hover:bg-primary/10"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = itemActivo === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "relative",
                isActive && "scale-110"
              )}>
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              
              {!collapsed && (
                <>
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-3 w-1 h-6 bg-primary rounded-full" />
                  )}
                </>
              )}
              
              {/* Hover effect */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
                collapsed && "hidden"
              )} />
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-border/50">
        {!collapsed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="font-bold text-white text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Profesor</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
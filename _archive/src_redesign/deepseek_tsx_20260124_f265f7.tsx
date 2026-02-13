import React, { useState } from 'react';
import { Sidebar_Docente } from '../components/Sidebar_Docente';
import { MentorIA } from '../components/MentorIA';
import { GrupoCard } from '../components/GrupoCard';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { Input } from '../components/ui/input';
import { Search, Filter, Plus, Download } from 'lucide-react';
import { Button } from '../components/ui/button';

// Mock data
const mockGrupos = [
  {
    id: '1',
    nombre: 'Equipo Innovación',
    departamento: 'Ciencias',
    miembros: ['Ana García', 'Luis Martínez', 'Marta Rodríguez'],
    progreso: 75,
    estado: 'En progreso' as const,
    interacciones_ia: 12
  },
  {
    id: '2',
    nombre: 'Math Explorers',
    departamento: 'Matemáticas',
    miembros: ['Carlos Sánchez', 'Sofía López'],
    progreso: 30,
    estado: 'Bloqueado' as const,
    interacciones_ia: 5
  },
  {
    id: '3',
    nombre: 'Historia Viva',
    departamento: 'Historia',
    miembros: ['Pedro Gómez', 'Lucía Fernández', 'Elena Ruiz', 'Jorge Díaz'],
    progreso: 100,
    estado: 'Completado' as const,
    interacciones_ia: 20
  }
];

export function DashboardDocente() {
  const [activeSection, setActiveSection] = useState('resumen');
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeSection) {
      case 'resumen':
        return (
          <div className="space-y-8">
            <AnalyticsDashboard />
            
            <div className="glass rounded-2xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Proyectos Activos</h2>
                  <p className="text-muted-foreground">Seguimiento de equipos de estudiantes</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </Button>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo Proyecto
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockGrupos.map((grupo) => (
                  <GrupoCard
                    key={grupo.id}
                    grupo={grupo}
                    onVerAlumno={() => console.log('Ver alumno:', grupo.nombre)}
                    onCambiarEstado={() => console.log('Cambiar estado')}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'mentor-ia':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Mentor IA Experto</h1>
              <p className="text-muted-foreground">
                Interactúa con el mentor IA para guiar a tus estudiantes en sus proyectos ABP
              </p>
            </div>
            <MentorIA
              grupoId="1"
              proyectoId="proyecto-1"
              departamento="Ciencias"
              miembro="Profesor"
            />
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent animate-spin" />
              </div>
              <h2 className="text-2xl font-bold">Sección en desarrollo</h2>
              <p className="text-muted-foreground">
                Esta funcionalidad estará disponible próximamente
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar_Docente 
        itemActivo={activeSection} 
        onSelect={setActiveSection} 
      />
      
      <main className={activeSection === 'mentor-ia' ? "ml-0 lg:ml-20 xl:ml-72" : "ml-0 lg:ml-72 p-8"}>
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          {activeSection !== 'mentor-ia' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold">
                    {activeSection === 'resumen' && 'Dashboard'}
                    {activeSection === 'proyectos' && 'Gestión de Proyectos'}
                    {activeSection === 'colaboracion' && 'Colaboración'}
                    {activeSection === 'analitica' && 'Analítica Avanzada'}
                  </h1>
                  <p className="text-muted-foreground">
                    Bienvenido de nuevo, profesor. {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder="Buscar proyectos, estudiantes..."
                      className="pl-10 w-64 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <Download className="w-4 h-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Main Content */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
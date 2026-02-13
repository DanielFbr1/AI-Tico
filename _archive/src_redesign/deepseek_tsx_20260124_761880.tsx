import { useState } from 'react';
import { Sidebar_Docente } from '../components/Sidebar_Docente';
import { GrupoCard } from '../components/GrupoCard';
import { MentorIA } from '../components/MentorIA';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import { useAuth } from '../context/AuthContext';

// Mock data
const grupos = [
  { id: '1', nombre: 'Grupo A', departamento: 'Ciencias', miembros: ['Ana', 'Luis', 'Marta'], progreso: 75, estado: 'En progreso', interacciones_ia: 12 },
  { id: '2', nombre: 'Grupo B', departamento: 'Matemáticas', miembros: ['Carlos', 'Sofía'], progreso: 30, estado: 'Bloqueado', interacciones_ia: 5 },
  { id: '3', nombre: 'Grupo C', departamento: 'Historia', miembros: ['Pedro', 'Lucía', 'Elena', 'Jorge'], progreso: 100, estado: 'Completado', interacciones_ia: 20 },
];

export function DashboardDocente() {
  const [activeItem, setActiveItem] = useState('resumen');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeItem) {
      case 'resumen':
        return (
          <div className="space-y-8">
            <AnalyticsOverview />
            <div>
              <h2 className="text-2xl font-bold mb-6">Proyectos Recientes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grupos.map(grupo => (
                  <GrupoCard
                    key={grupo.id}
                    grupo={grupo}
                    onVerAlumno={() => {}}
                    onCambiarEstado={() => {}}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case 'proyectos':
        return <div>Gestión de Proyectos</div>;
      case 'mentor':
        return (
          <div className="max-w-4xl mx-auto">
            <MentorIA
              grupoId="1"
              proyectoId="123"
              departamento="Ciencias"
              miembro="Profesor"
            />
          </div>
        );
      case 'sala':
        return <div>Sala de Colaboración</div>;
      case 'ajustes':
        return <div>Ajustes</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar_Docente itemActivo={activeItem} onSelect={setActiveItem} />
      <main className={activeItem === 'mentor' ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-64 p-8 transition-all duration-300'}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {activeItem === 'resumen' && 'Dashboard'}
              {activeItem === 'proyectos' && 'Proyectos'}
              {activeItem === 'mentor' && 'Mentor IA'}
              {activeItem === 'sala' && 'Sala de Colaboración'}
              {activeItem === 'ajustes' && 'Ajustes'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {user?.email} • Bienvenido al panel de docente
            </p>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
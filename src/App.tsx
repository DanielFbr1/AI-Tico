import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { ProjectDetail } from './pages/ProjectDetail';
import { GroupDetail } from './pages/GroupDetail';
import { DashboardAlumno } from './components/DashboardAlumno';
import { DashboardFamilia } from './components/DashboardFamilia';
import { Proyecto, Grupo } from './types';
import { TicoFullScreenPage } from './pages/TicoGame/TicoFullScreenPage';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';

// Componente para capturar errores críticos y evitar la pantalla en blanco
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
      <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center">
        <h2 className="text-2xl font-black text-rose-600 mb-4">¡Ups! Algo ha fallado</h2>
        <p className="text-slate-600 mb-6 font-medium">La aplicación ha tenido un error inesperado al cargar tu sesión.</p>
        <div className="bg-slate-50 p-4 rounded-xl text-left text-xs font-mono text-rose-500 overflow-auto mb-6">
          {error.message}
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = window.location.origin + '?logout=true';
          }}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          Limpiar y Reintentar
        </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, perfil, loading, signOut } = useAuth();

  // Efecto para "Limpieza de Emergencia" si la pantalla se queda en blanco
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      console.log("🧹 Limpieza de emergencia activada...");
      localStorage.clear();
      supabase.auth.signOut().then(() => {
        window.location.href = window.location.origin;
      });
    }

    // Detectar errores de verificación de email en la URL
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    if (errorParam) {
      const msg = errorDescription
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        : 'Error de verificación';
      console.warn('⚠️ Error de Auth en URL:', errorParam, msg);
      // Mostrar toast con el error
      import('sonner').then(({ toast }) => {
        toast.error('El enlace de verificación ha expirado o no es válido. Solicita uno nuevo desde el registro.', {
          duration: 8000,
        });
      });
      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [currentScreen, setCurrentScreen] = useState<'projects' | 'project-detail' | 'group-detail' | 'tico-full'>('projects');
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);

  const handleOpenTicoFull = () => {
    setCurrentScreen('tico-full');
  };

  const handleCloseTicoFull = () => {
    setCurrentScreen('project-detail');
  };

  // RESET STATE ON LOGOUT
  useEffect(() => {
    if (!user) {
      // Si el usuario se desconecta, limpiamos el estado visual
      setSelectedProject(null);
      setSelectedGrupo(null);
      setCurrentScreen('projects');
    }
  }, [user]);

  const handleSelectProject = (proyecto: Proyecto) => {
    setSelectedProject(proyecto);
    setCurrentScreen('project-detail');
  };

  const handleSelectGrupo = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    setCurrentScreen('group-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setCurrentScreen('projects');
  };

  const handleBackToProjectDetail = () => {
    setSelectedGrupo(null);
    setCurrentScreen('project-detail');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Iniciando sesión segura...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostramos login
  if (!user) {
    return <LoginPage />;
  }

  // Si hay usuario pero el perfil aún está cargando o no se ha procesado
  if (user && !perfil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si es un alumno identificado
  if (perfil && perfil.rol === 'alumno') {
    return (
      <DashboardAlumno
        alumno={perfil}
        onLogout={signOut}
      />
    );
  }

  // Si es familia
  if (perfil && perfil.rol === 'familia') {
    return (
      <DashboardFamilia
        familia={perfil as any}
        onLogout={signOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentScreen === 'projects' && (
        <ProjectsDashboard
          onSelectProject={handleSelectProject}
        />
      )}

      {currentScreen === 'project-detail' && selectedProject && (
        <ProjectDetail
          proyecto={selectedProject}
          onSelectGrupo={handleSelectGrupo}
          onBack={handleBackToProjects}
          onSwitchProject={setSelectedProject}
          onOpenTicoFull={handleOpenTicoFull}
        />
      )}

      {currentScreen === 'tico-full' && selectedProject && (
        <TicoFullScreenPage
          projectId={selectedProject.id}
          organizacionId={selectedProject.organizacion_clase_id || selectedProject.clase} // Prefer organization ID
          onBack={handleCloseTicoFull}
        />
      )}

      {currentScreen === 'group-detail' && selectedGrupo && (
        <GroupDetail
          grupo={selectedGrupo}
          fases={selectedProject?.fases || []}
          rubrica={selectedProject?.rubrica && selectedProject.rubrica.criterios ? selectedProject.rubrica.criterios : []}
          onBack={handleBackToProjectDetail}
        />
      )}
    </div>
  );
}



export default function App() {


  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" richColors />
        <div className="fixed bottom-2 right-2 flex flex-col items-end gap-1 opacity-50 z-50 pointer-events-none">
          <span className="text-[10px] font-mono text-slate-400 bg-white/80 px-2 py-1 rounded-md border border-slate-200 shadow-sm backdrop-blur-sm">
            Tico.AI v1.6.16
          </span>
          {/* The 'session' variable is not defined in this scope. If intended, it should be passed or fetched here. */}
          {/* {session && (
                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-50/80 px-2 py-1 rounded-md border border-emerald-100 shadow-sm backdrop-blur-sm">
                        Online
                    </span>
                )} */}
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

import React, { useState, useEffect } from 'react';
import { Loader2, Key, CheckCircle2 } from 'lucide-react';
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
        <div className="mt-4 px-4 text-[10px] text-gray-400 font-medium tracking-widest uppercase text-center">
          V6.6.5
        </div>
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
          duration: 8000
        });
      });
      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [currentScreen, setCurrentScreen] = useState<'projects' | 'project-detail' | 'group-detail' | 'tico-full'>('projects');
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const VERSION = "V6.6.5";

  // ── Estado para recuperación de contraseña ──
  // Detectar inmediatamente si venimos del flujo de recovery por la URL
  const [showPasswordReset, setShowPasswordReset] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    return urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Detectar evento PASSWORD_RECOVERY de Supabase (backup)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Evento PASSWORD_RECOVERY detectado');
        setShowPasswordReset(true);
      }
    });

    // Limpiar URL si tiene parámetros de recovery
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('type') === 'recovery') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetSuccess(true);
      setTimeout(() => {
        setShowPasswordReset(false);
        setNewPassword('');
        setConfirmPassword('');
        setResetSuccess(false);
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setResetLoading(false);
    }
  };

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
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Iniciando sesión segura...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostramos login
  if (!user) {
    return <LoginPage />;
  }

  // ── Modal de nueva contraseña (sobre cualquier pantalla) ──
  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Fondo */}
        <div className="absolute w-[500px] h-[500px] bg-[#258cf4] rounded-full blur-[120px] top-[-50px] left-[-50px] opacity-40 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-600 rounded-full blur-[150px] bottom-[-100px] right-[-50px] opacity-40 animate-pulse" />

        <div className="w-full max-w-sm relative z-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
              resetSuccess
                ? 'bg-emerald-500/30 border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                : 'bg-amber-500/20 border-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
            }`}>
              {resetSuccess
                ? <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                : <Key className="w-10 h-10 text-amber-400" />
              }
            </div>

            {resetSuccess ? (
              <>
                <h2 className="text-2xl font-bold text-emerald-400 mb-2 tracking-tight">¡Contraseña actualizada!</h2>
                <p className="text-slate-300 text-sm">Redirigiendo...</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Nueva contraseña</h2>
                <p className="text-slate-400 text-sm mb-6">Establece tu nueva contraseña para acceder a tu cuenta.</p>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1 text-left">Nueva contraseña</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white outline-none transition-all text-sm placeholder:text-slate-600"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1 text-left">Repetir contraseña</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white outline-none transition-all text-sm placeholder:text-slate-600"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  {resetError && (
                    <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg text-xs font-medium border border-rose-500/20 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Guardar nueva contraseña
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
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
        alumno={perfil as any}
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

  // Si es profesor
  if (perfil && perfil.rol === 'profesor') {
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
            organizacionId={selectedProject.organizacion_clase_id}
            onBack={handleCloseTicoFull}
          />
        )}

        {currentScreen === 'group-detail' && selectedGrupo && (
          <GroupDetail
            grupo={selectedGrupo}
            fases={selectedProject?.fases || []}
            rubrica={selectedProject?.rubrica && selectedProject.rubrica.criterios ? selectedProject.rubrica.criterios : []}
            onBack={handleBackToProjectDetail}
            proyectoId={selectedProject?.id}
            codigoSala={selectedProject?.codigo_sala}
          />
        )}
      </div>
    );
  }


  // Por si acaso no cae en ningún rol (No debería ocurrir)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Redirigiendo...</p>
      </div>
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">V6.6.5</span>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

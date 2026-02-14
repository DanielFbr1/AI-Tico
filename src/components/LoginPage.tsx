import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Brain, User, GraduationCap, ArrowRight, Key, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const { refreshPerfil } = useAuth();
    const [view, setView] = useState<'selection' | 'teacher-auth' | 'student-verify' | 'student-auth'>('selection');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionData, setSessionData] = useState<any>(null);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [foundProject, setFoundProject] = useState<any>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const targetRole = (view === 'teacher-auth') ? 'profesor' : 'alumno';
            let authEmail = email;

            // Lógica para Alumnos: Generar Email Sintético
            if (targetRole === 'alumno') {
                if (!studentName || !password) {
                    throw new Error("Por favor completa Nombre y Contraseña");
                }
                const cleanUser = studentName.trim().replace(/\s+/g, '').toLowerCase();
                // Si hay código, lo usamos, si no, generamos uno genérico
                // NEW FORMAT: username.student@tico.ia (Simplificado)
                authEmail = `${cleanUser}.student@tico.ia`;
            }

            let sessionData = null;

            if (isSignUp) {
                // Flags para onboarding
                if (targetRole === 'profesor') {
                    localStorage.setItem('isNewTeacher', 'true');
                } else {
                    localStorage.setItem('isNewStudent', 'true');
                }

                // Prepare metadata
                const metaData: any = {
                    rol: targetRole,
                    nombre: targetRole === 'alumno' ? studentName : (email.split('@')[0])
                };

                // Only add codigo_sala if provided
                if (targetRole === 'alumno' && roomCode) {
                    metaData.codigo_sala = roomCode.trim().toUpperCase();
                }

                const { data, error } = await supabase.auth.signUp({
                    email: authEmail,
                    password,
                    options: {
                        data: metaData
                    }
                });

                if (error) {
                    localStorage.removeItem('isNewTeacher');
                    localStorage.removeItem('isNewStudent');
                    throw error;
                }

                if (data.session) {
                    sessionData = data.session;
                    await refreshPerfil();
                } else {
                    // Si no hay sesión inmediata (confirmación email), en nuestro caso de alumno (sintético)
                    // debería haber sesión. Si es profe con email real, avisar.
                    if (targetRole === 'alumno') {
                        // Should not happen with auto-confirm off, but safety check
                        alert('Cuenta creada. Intenta iniciar sesión.');
                        return;
                    }
                    alert('Cuenta creada. Revisa tu email para confirmar.');
                    return;
                }
            } else {
                // Login Normal
                // Recalc email for student based on input name if simple login
                // NOTE: This assumes user knows they are 'name.student@tico.ia'. 
                // UX Improvement: If they type "Juan", auto-suffix it.

                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password
                });
                if (error) throw error;
                sessionData = data.session;
            }

            if (sessionData) {
                // Validar Rol
                const currentRole = sessionData.user?.user_metadata?.rol;
                if (currentRole && currentRole !== targetRole) {
                    // Si intenta entrar como alumno con cuenta de profe o viceversa
                    if (targetRole === 'alumno' && currentRole === 'profesor') {
                        throw new Error("Esta cuenta es de Profesor. Usa el acceso de Profesores.");
                    }
                    if (targetRole === 'profesor' && currentRole === 'alumno') {
                        throw new Error("Esta cuenta es de Alumno. Usa el acceso de Alumnos.");
                    }
                }

                setSessionData(sessionData);
                await refreshPerfil();
            }
        } catch (error: any) {
            console.error(error);
            if (error.message?.toLowerCase().includes("limit") || error.message?.toLowerCase().includes("rate")) {
                setError("🛑 Límite de seguridad alcanzado. Espera unos segundos.");
            } else if (error.message?.includes("Invalid login")) {
                setError("Usuario o contraseña incorrectos.");
            } else {
                setError(error.message || 'Error desconocido al iniciar sesión.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'azure') => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setError("Error iniciando sesión social: " + error.message);
            setLoading(false);
        }
    };

    // Verificación de código solo para redirigir a registro inicialmente
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase
                .from('proyectos')
                .select('*')
                .eq('codigo_sala', roomCode.trim().toUpperCase())
                .single();

            if (error || !data) {
                setError('Código de sala no válido.');
                return;
            }

            setFoundProject(data);
            setView('student-auth');
            setIsSignUp(true);
        } catch (err) {
            setError('Error al verificar el código.');
        } finally {
            setLoading(false);
        }
    };

    if (view === 'selection') {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-[#4f39f6] via-[#7c3aed] to-[#db2777] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-white selection:text-purple-600">

                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] mix-blend-overlay animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-[80px] mix-blend-overlay animate-pulse animation-delay-1000" />
                </div>

                <div className="max-w-5xl w-full relative z-10 flex flex-col items-center justify-center h-full max-h-[900px]">
                    {/* Header */}
                    <div className="text-center mb-8 transform hover:scale-[1.01] transition-transform duration-500 shrink-0">
                        <h1 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-xl filter">
                            AI Tico
                        </h1>
                        <p className="text-xl md:text-2xl text-white/95 font-bold tracking-tight max-w-2xl mx-auto drop-shadow-md leading-tight">
                            Tu compañero inteligente
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 shrink-0">
                        {/* Profesor Card */}
                        <button
                            onClick={() => {
                                setView('teacher-auth');
                                setIsSignUp(false);
                            }}
                            className="group relative bg-white rounded-[2rem] p-6 border-b-[8px] border-slate-200 active:border-b-0 active:translate-y-2 transition-all duration-200 hover:bg-slate-50 text-left shadow-xl shadow-blue-900/20 transform hover:-translate-y-1 overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_0_#1e40af] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <GraduationCap className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">Soy Docente</h2>
                                <p className="text-base text-slate-500 font-medium leading-relaxed mb-4">
                                    Crea experiencias, gestiona equipos y evalúa.
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-slate-100">
                                    <span className="text-blue-600 font-black uppercase tracking-widest text-xs group-hover:underline decoration-2 underline-offset-4">Entrar</span>
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 transform group-hover:rotate-[-45deg]">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Alumno Card */}
                        <button
                            onClick={() => {
                                setView('student-auth'); // DIRECT TO AUTH, SKIP VERIFY
                                setIsSignUp(false);
                            }}
                            className="group relative bg-white rounded-[2rem] p-6 border-b-[8px] border-slate-200 active:border-b-0 active:translate-y-2 transition-all duration-200 hover:bg-slate-50 text-left shadow-xl shadow-pink-900/20 transform hover:-translate-y-1 overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_0_#9f1239] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-rose-600 transition-colors">Soy Alumno</h2>
                                <p className="text-base text-slate-500 font-medium leading-relaxed mb-4">
                                    Únete a tu equipo y completa las misiones.
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-slate-100">
                                    <span className="text-rose-600 font-black uppercase tracking-widest text-xs group-hover:underline decoration-2 underline-offset-4">Entrar</span>
                                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 transform group-hover:rotate-[-45deg]">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isTeacher = view === 'teacher-auth';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative">
                <button
                    onClick={() => {
                        setView('selection');
                        setError('');
                        setEmail('');
                        setPassword('');
                        setStudentName('');
                        setRoomCode('');
                    }}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowRight className="w-6 h-6 rotate-180" />
                </button>

                <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg ${isTeacher ? 'from-blue-500 to-purple-600' : 'from-pink-500 to-rose-600'}`}>
                        {isTeacher ? <GraduationCap className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
                    </div>
                </div>

                <h1 className="text-2xl font-black text-gray-900 text-center mb-2 uppercase tracking-tight">
                    {isTeacher ? 'Panel Docente' : 'Acceso Alumno'}
                </h1>
                <p className="text-gray-500 text-center mb-6 font-medium leading-relaxed text-sm">
                    {isTeacher
                        ? (isSignUp ? 'Crea tu cuenta profesional' : 'Inicia sesión en tu cuenta')
                        : (isSignUp ? 'Crea tu cuenta (Código opcional)' : 'Entra con tu usuario')}
                </p>

                <form onSubmit={handleAuth} className="space-y-4">

                    {/* Campos para ALUMNOS */}
                    {!isTeacher && (
                        <>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nombre de Usuario</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    placeholder="Ej: JuanPerez"
                                    required
                                />
                            </div>
                            {/* Campo Código de Clase eliminado a petición del usuario. Solo nombre. */}
                        </>
                    )}

                    {/* Campos para PROFESORES */}
                    {isTeacher && (
                        <>
                            {/* Social Login solo para profes (opcional, o para todos?) 
                                El usuario solo pidió login sin email para ALUMNOS. Profes siguen igual.
                            */}
                            {!isSignUp && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSocialLogin('google')}
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-600 text-sm"
                                    >
                                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                        Google
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSocialLogin('azure')}
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-600 text-sm"
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="w-4 h-4" />
                                        Microsoft
                                    </button>
                                </div>
                            )}

                            {isSignUp && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tu Nombre</label>
                                    <input
                                        type="text"
                                        value={studentName} // Reutilizamos studentName para nombre del profe
                                        onChange={(e) => setStudentName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                        placeholder="Profesor García"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Profesional</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    placeholder="profe@escuela.edu"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 animate-in slide-in-from-top-2">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${isTeacher ? 'bg-blue-600' : 'bg-rose-600'} text-white`}
                    >
                        {loading ? 'Procesando...' : sessionData ? 'Entrando...' : isSignUp ? 'Crear Cuenta' : 'Entrar'}
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

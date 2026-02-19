import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Brain, User, GraduationCap, ArrowRight, Key, Check, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const { refreshPerfil } = useAuth();
    const [view, setView] = useState<'selection' | 'teacher-auth' | 'student-verify' | 'student-auth' | 'family-auth'>('selection');
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
            const targetRole = (view === 'teacher-auth') ? 'profesor' : (view === 'family-auth') ? 'familia' : 'alumno';
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
                } else if (targetRole === 'familia') {
                    localStorage.setItem('isNewFamily', 'true');
                } else {
                    localStorage.setItem('isNewStudent', 'true');
                }

                // Prepare metadata
                const metaData: any = {
                    rol: targetRole,
                    nombre: targetRole === 'alumno' ? studentName : (studentName || email.split('@')[0])
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
                    localStorage.removeItem('isNewFamily');
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
                // Actualizar el rol al panel elegido (permite multi-rol con un mismo email)
                const currentRole = sessionData.user?.user_metadata?.rol;
                if (currentRole !== targetRole) {
                    // Actualizar metadata del usuario con el nuevo rol
                    await supabase.auth.updateUser({
                        data: { rol: targetRole }
                    });

                    // Actualizar tabla profiles también
                    await supabase.from('profiles').update({
                        rol: targetRole
                    }).eq('id', sessionData.user.id);
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
            } else if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already been registered")) {
                setError("Este email ya tiene cuenta. Usa 'Iniciar sesión' en su lugar.");
                setIsSignUp(false);
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
            <div className="min-h-screen bg-[#4f39f6] flex items-center justify-center p-4 selection:bg-white selection:text-[#4f39f6]">
                <div className="max-w-6xl w-full">
                    {/* Header y Botones de Selección */}
                    <div className="text-center mb-8 md:mb-16">
                        <h1 className="text-6xl md:text-8xl font-black text-white mb-4 md:mb-6 tracking-tight drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                            AI Tico
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-bold tracking-wide">Plataforma de Innovación ABP</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
                        {/* Profesor */}
                        <button
                            onClick={() => {
                                setView('teacher-auth');
                                setIsSignUp(false);
                            }}
                            className="group relative bg-white rounded-3xl p-6 md:p-8 border-b-8 border-gray-200 active:border-b-0 active:translate-y-2 transition-all duration-100 hover:bg-gray-50 overflow-hidden text-left"
                        >
                            <div className="relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#00d4ff] rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-[0_4px_0_#009ac2]">
                                    <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-700 mb-2 md:mb-3 tracking-tight">Soy Profesor/a</h2>
                                <p className="text-slate-500 mb-4 md:mb-6 font-bold leading-relaxed text-sm md:text-base">Gestiona proyectos, evalúa y configura a Tico.</p>
                                <div className="flex items-center justify-end gap-2 text-[#00d4ff] font-black uppercase tracking-widest group-hover:gap-4 transition-all text-sm md:text-base">
                                    <span>Acceso Docente</span>
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </button>

                        {/* Alumno */}
                        <button
                            onClick={() => {
                                setView('student-auth'); // DIRECT TO AUTH, SKIP VERIFY
                                setIsSignUp(false);
                            }}
                            className="group relative bg-white rounded-3xl p-6 md:p-8 border-b-8 border-gray-200 active:border-b-0 active:translate-y-2 transition-all duration-100 hover:bg-gray-50 overflow-hidden text-left"
                        >
                            <div className="relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ff007a] rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-[0_4px_0_#b30055]">
                                    <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-700 mb-2 md:mb-3 tracking-tight">Soy Alumno/a</h2>
                                <p className="text-slate-500 mb-4 md:mb-6 font-bold leading-relaxed text-sm md:text-base">Únete a tu clase, habla con Tico y mira tu progreso.</p>
                                <div className="flex items-center justify-end gap-2 text-[#ff007a] font-black uppercase tracking-widest group-hover:gap-4 transition-all text-sm md:text-base">
                                    <span>Acceso Alumno</span>
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </button>

                        {/* Familia */}
                        <button
                            onClick={() => {
                                setView('family-auth');
                                setIsSignUp(false);
                            }}
                            className="group relative bg-white rounded-3xl p-6 md:p-8 border-b-8 border-gray-200 active:border-b-0 active:translate-y-2 transition-all duration-100 hover:bg-gray-50 overflow-hidden text-left md:col-span-2"
                        >
                            <div className="relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#10b981] rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-[0_4px_0_#059669]">
                                    <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-700 mb-2 md:mb-3 tracking-tight">Soy Familia</h2>
                                <p className="text-slate-500 mb-4 md:mb-6 font-bold leading-relaxed text-sm md:text-base">Consulta las notas y el progreso de tus hijos.</p>
                                <div className="flex items-center justify-end gap-2 text-[#10b981] font-black uppercase tracking-widest group-hover:gap-4 transition-all text-sm md:text-base">
                                    <span>Acceso Familia</span>
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isTeacher = view === 'teacher-auth';
    const isFamily = view === 'family-auth';
    const isTeacherOrFamily = isTeacher || isFamily;

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
                    <div className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg ${isFamily ? 'from-emerald-500 to-teal-600' : isTeacher ? 'from-blue-500 to-purple-600' : 'from-pink-500 to-rose-600'}`}>
                        {isFamily ? <Users className="w-8 h-8 text-white" /> : isTeacher ? <GraduationCap className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
                    </div>
                </div>

                <h1 className="text-2xl font-black text-gray-900 text-center mb-2 uppercase tracking-tight">
                    {isFamily ? 'Panel Familia' : isTeacher ? 'Panel Docente' : 'Acceso Alumno'}
                </h1>
                <p className="text-gray-500 text-center mb-6 font-medium leading-relaxed text-sm">
                    {isFamily
                        ? (isSignUp ? 'Crea tu cuenta familiar' : 'Inicia sesión en tu cuenta')
                        : isTeacher
                            ? (isSignUp ? 'Crea tu cuenta profesional' : 'Inicia sesión en tu cuenta')
                            : (isSignUp ? 'Crea tu cuenta (Código opcional)' : 'Entra con tu usuario')}
                </p>

                <form onSubmit={handleAuth} className="space-y-4">

                    {/* Campos para ALUMNOS */}
                    {!isTeacherOrFamily && (
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
                    {isTeacherOrFamily && (
                        <>
                            {/* Social Login solo para profes */}
                            {isTeacher && !isSignUp && (
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
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                        placeholder={isFamily ? 'María López' : 'Profesor García'}
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{isFamily ? 'Email' : 'Email Profesional'}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    placeholder={isFamily ? 'mama@gmail.com' : 'profe@escuela.edu'}
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
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${isFamily ? 'bg-emerald-600' : isTeacher ? 'bg-blue-600' : 'bg-rose-600'} text-white`}
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

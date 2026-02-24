import { useState, useEffect } from 'react';
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
            // Guardar el rol seleccionado para recuperarlo al volver del OAuth
            const targetRole = (view === 'teacher-auth') ? 'profesor' : (view === 'family-auth') ? 'familia' : 'alumno';
            localStorage.setItem('pendingRole', targetRole);

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

    const BackgroundDesign = () => (
        <div className="absolute inset-0 overflow-hidden bg-[#0A0F1A] z-0 pointer-events-none">
            {/* Base dark background is #0A0F1A */}

            {/* Glowing Orbs (Stitch Design) */}
            <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#258cf4] rounded-full blur-[80px] md:blur-[120px] top-[-50px] left-[-50px] opacity-40 animate-pulse duration-[8s]" />
            <div className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-purple-600 rounded-full blur-[100px] md:blur-[150px] bottom-[-100px] right-[-50px] opacity-40 animate-pulse duration-[10s] delay-1000" />
            <div className="absolute w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-cyan-400 rounded-full blur-[80px] md:blur-[120px] top-[40%] left-[20%] opacity-30 animate-pulse duration-[12s] delay-2000" />

            {/* Digital Particles Overlay (Dotted grid for a kid-friendly tech feel) */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(#258cf4 1.5px, transparent 1.5px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Subtle central glow for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0F1A]/50 to-[#0A0F1A]" />
        </div>
    );

    if (view === 'selection') {
        return (
            <div className="h-[100dvh] w-full bg-[#0A0F1A] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans selection:bg-[#258cf4]/30 selection:text-cyan-200">
                {/* Custom Design Background */}
                <BackgroundDesign />

                {/* Capa 2: Tico (Desktop Absolute - Sobre el pedestal) */}
                <div className="hidden md:block absolute z-10 bottom-[-2%] md:left-[8%] lg:left-[13%] w-[450px] lg:w-[580px] pointer-events-none transition-all duration-500">
                    <img
                        src="/assets/tico_icon.png"
                        alt="Tico Icon"
                        className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    />
                </div>

                {/* Capa 3: UI (Textos y Paneles) */}
                <div className="w-full max-w-7xl relative z-20 flex flex-col h-full p-6 md:p-12 justify-center">

                    {/* Header - Centrado */}
                    <div className="w-full text-center mt-0 md:mt-[-2rem] md:mb-auto shrink-0">
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-2 tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                            AI-Tico
                        </h1>
                        <p className="text-sm md:text-xl text-white font-bold tracking-wide drop-shadow-md">
                            Crea y organiza tus proyectos con IA.
                        </p>
                    </div>

                    {/* Tico Mobile - Solo visible en móvil, entre título y paneles */}
                    <div className="md:hidden w-full flex justify-center my-6 shrink-0">
                        <img
                            src="/assets/tico_icon.png"
                            alt="Tico Icon Mobile"
                            className="w-[200px] h-auto drop-shadow-2xl"
                        />
                    </div>

                    {/* Contenedor de Cuerpo - Para móvil centrado, para desktop paneles a la derecha */}
                    <div className="w-full flex flex-col md:flex-row items-center justify-center md:justify-end md:flex-1 md:mt-24">
                        <div className="w-full max-w-sm md:max-w-md lg:max-w-lg mb-4 md:mb-0">
                            <div className="grid grid-cols-1 gap-3 md:gap-5">
                                {/* Docente */}
                                <button
                                    onClick={() => {
                                        setView('teacher-auth');
                                        setIsSignUp(false);
                                    }}
                                    className="group flex items-center text-left bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400 rounded-2xl p-4 md:p-5 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-cyan-500/30 rounded-xl flex items-center justify-center shrink-0 mr-4 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                        <GraduationCap className="w-6 h-6 md:w-7 md:h-7 text-cyan-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Docente</h2>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-cyan-300 opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </button>

                                {/* Alumno */}
                                <button
                                    onClick={() => {
                                        setView('student-auth');
                                        setIsSignUp(false);
                                    }}
                                    className="group flex items-center text-left bg-white/10 hover:bg-white/20 border border-white/20 hover:border-yellow-400 rounded-2xl p-4 md:p-5 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-yellow-500/30 rounded-xl flex items-center justify-center shrink-0 mr-4 border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                        <User className="w-6 h-6 md:w-7 md:h-7 text-yellow-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Alumno</h2>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-yellow-300 opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </button>

                                {/* Familia */}
                                <button
                                    onClick={() => {
                                        setView('family-auth');
                                        setIsSignUp(false);
                                    }}
                                    className="group flex items-center text-left bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-400 rounded-2xl p-4 md:p-5 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-pink-500/30 rounded-xl flex items-center justify-center shrink-0 mr-4 border border-pink-400/50 shadow-[0_0_20px_rgba(244,114,182,0.3)]">
                                        <Users className="w-6 h-6 md:w-7 md:h-7 text-pink-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Familia</h2>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-pink-300 opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </button>
                            </div>

                            <div className="mt-6 md:mt-8 text-center md:text-right">
                                <span className="text-[10px] md:text-xs text-white/40 font-bold tracking-widest uppercase relative z-30">Sistema Unificado V1.3.9</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isTeacher = view === 'teacher-auth';
    const isFamily = view === 'family-auth';
    const isTeacherOrFamily = isTeacher || isFamily;

    // Theme values for Auth form based on role
    const themeColor = isTeacher ? 'cyan' : isFamily ? 'pink' : 'yellow';
    const ringColorClass = isTeacher ? 'focus:ring-cyan-500/50' : isFamily ? 'focus:ring-pink-500/50' : 'focus:ring-yellow-500/50';
    const borderColorClassActive = isTeacher ? 'focus:border-cyan-500' : isFamily ? 'focus:border-pink-500' : 'focus:border-yellow-500';
    const btnBgClass = isTeacher ? 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.4)]' : isFamily ? 'bg-pink-600 hover:bg-pink-500 shadow-[0_0_20px_rgba(219,39,119,0.4)]' : 'bg-yellow-600 hover:bg-yellow-500 shadow-[0_0_20px_rgba(202,138,4,0.4)]';
    const iconColorClass = isTeacher ? 'text-cyan-400' : isFamily ? 'text-pink-400' : 'text-yellow-400';
    const iconBgClass = isTeacher ? 'bg-cyan-500/20 border-cyan-500/30' : isFamily ? 'bg-pink-500/20 border-pink-500/30' : 'bg-yellow-500/20 border-yellow-500/30';

    return (
        <div className="h-[100dvh] w-full bg-[#0A0F1A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Custom Design Background */}
            <BackgroundDesign />

            <div className="w-full max-w-sm relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                    <button
                        onClick={() => {
                            setView('selection');
                            setError('');
                            setEmail('');
                            setPassword('');
                            setStudentName('');
                            setRoomCode('');
                        }}
                        className="absolute top-5 left-5 text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/5 hover:border-white/20"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>

                    <div className="flex flex-col items-center mb-6 mt-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconBgClass} mb-4`}>
                            {isFamily ? <Users className={`w-6 h-6 ${iconColorClass}`} /> : isTeacher ? <GraduationCap className={`w-6 h-6 ${iconColorClass}`} /> : <User className={`w-6 h-6 ${iconColorClass}`} />}
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                            {isFamily ? 'Acceso Familia' : isTeacher ? 'Acceso Docente' : 'Acceso Alumno'}
                        </h1>
                        <p className="text-slate-400 text-xs mt-1">
                            {isSignUp ? 'Crear nueva cuenta' : 'Ingresa tus credenciales'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-3 md:space-y-4">

                        {/* Campos para ALUMNOS */}
                        {!isTeacherOrFamily && (
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Usuario</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-sm placeholder:text-slate-600`}
                                    placeholder="Ej: JuanPerez"
                                    required
                                />
                            </div>
                        )}

                        {/* Campos para PROFESORES Y FAMILIAS */}
                        {isTeacherOrFamily && (
                            <>
                                {/* Social Login (compact) - Ahora visible tanto en login como registro */}
                                {isTeacherOrFamily && (
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin('google')}
                                            className="flex items-center justify-center gap-2 py-2 bg-white border border-transparent rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-800 text-xs"
                                        >
                                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5" />
                                            Google
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin('azure')}
                                            className="flex items-center justify-center gap-2 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all font-bold text-white text-xs"
                                        >
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="w-3.5 h-3.5" />
                                            Microsoft
                                        </button>
                                    </div>
                                )}

                                {isSignUp && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            className={`w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-sm placeholder:text-slate-600`}
                                            placeholder={isFamily ? 'María López' : 'Profesor García'}
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-sm placeholder:text-slate-600`}
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-sm placeholder:text-slate-600`}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg text-xs font-medium border border-rose-500/20 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 mt-2 rounded-xl font-bold text-sm text-white transition-all ${btnBgClass} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {loading ? 'Procesando...' : sessionData ? 'Entrando...' : isSignUp ? 'Crear Cuenta' : 'Entrar'}
                        </button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
                            >
                                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

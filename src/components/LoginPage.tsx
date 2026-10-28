import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Brain, User, GraduationCap, ArrowRight, Key, Check, Users, Mail, RefreshCw, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const { refreshPerfil } = useAuth();
    const [view, setView] = useState<'selection' | 'teacher-auth' | 'student-verify' | 'student-auth' | 'family-auth' | 'school-auth'>('selection');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [studentName, setStudentName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [schoolCity, setSchoolCity] = useState('');
    const [schoolCode, setSchoolCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionData, setSessionData] = useState<any>(null);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [foundProject, setFoundProject] = useState<any>(null);
    const [emailSent, setEmailSent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [confirmed, setConfirmed] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const targetRole = (view === 'teacher-auth') ? 'profesor' : (view === 'family-auth') ? 'familia' : (view === 'school-auth') ? 'colegio' : 'alumno';
            const authEmail = email.trim();

            if (targetRole === 'colegio' && isSignUp && !schoolName.trim()) {
                throw new Error("Por favor, introduce el nombre del colegio o institución.");
            }

            let sessionData = null;

            if (isSignUp) {
                // Validación previa para colegio: comprobar si ya existe con ese nombre
                if (targetRole === 'colegio') {
                    const { data: existingSchool } = await supabase
                        .from('colegios')
                        .select('id, nombre')
                        .ilike('nombre', schoolName.trim())
                        .maybeSingle();

                    if (existingSchool) {
                        throw new Error(`El colegio "${existingSchool.nombre}" ya está registrado en el sistema. Inicia sesión o contacta con el administrador.`);
                    }
                }

                // Flags para onboarding
                if (targetRole === 'profesor') {
                    // El tutorial se activará tras crear el primer proyecto
                } else if (targetRole === 'familia') {
                    localStorage.setItem('isNewFamily', 'true');
                } else if (targetRole === 'colegio') {
                    localStorage.setItem('isNewSchool', 'true');
                    localStorage.setItem('pendingSchoolName', schoolName.trim());
                    localStorage.setItem('pendingSchoolCity', schoolCity.trim());
                } else {
                    localStorage.setItem('isNewStudent', 'true');
                }

                // Prepare metadata
                const metaData: any = {
                    rol: targetRole,
                    nombre: studentName || (targetRole === 'colegio' ? schoolName.trim() : email.split('@')[0]),
                    colegio_nombre: targetRole === 'colegio' ? schoolName.trim() : undefined,
                    ciudad: targetRole === 'colegio' ? schoolCity.trim() : undefined
                };

                // Only add codigo_sala if provided
                if (targetRole === 'alumno' && roomCode) {
                    metaData.codigo_sala = roomCode.trim().toUpperCase();
                }

                const { data, error } = await supabase.auth.signUp({
                    email: authEmail,
                    password,
                    options: {
                        data: metaData,
                        emailRedirectTo: window.location.origin
                    }
                });

                if (error) {
                    localStorage.removeItem('isNewTeacher');
                    localStorage.removeItem('isNewStudent');
                    localStorage.removeItem('isNewFamily');
                    localStorage.removeItem('isNewSchool');
                    throw error;
                }

                if (data.session) {
                    sessionData = data.session;
                    
                    // Si es colegio y tenemos sesión inmediata, creamos el registro institucional
                    if (targetRole === 'colegio') {
                        const { data: newSchool, error: schoolErr } = await supabase
                            .from('colegios')
                            .insert({
                                nombre: schoolName.trim(),
                                ciudad: schoolCity.trim() || undefined,
                                email_contacto: authEmail,
                                codigo_institucional: schoolCode.trim() || ('COL-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
                                created_by: data.session.user.id
                            })
                            .select()
                            .single();

                        if (!schoolErr && newSchool) {
                            await supabase.from('profiles').update({
                                colegio_id: newSchool.id,
                                colegio_nombre: newSchool.nombre,
                                rol: 'colegio'
                            }).eq('id', data.session.user.id);
                        }
                    }

                    await refreshPerfil();
                } else {
                    // No hay sesión inmediata → se requiere confirmación por email
                    // Guardar el rol elegido para que se aplique al confirmar
                    localStorage.setItem('pendingRole', targetRole);
                    if (targetRole === 'colegio') {
                        localStorage.setItem('pendingSchoolName', schoolName.trim());
                        localStorage.setItem('pendingSchoolCity', schoolCity.trim());
                    }
                    setEmailSent(true);
                    setResendCooldown(60);
                    return;
                }
            } else {
                // Login Normal
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password
                });
                if (error) throw error;
                sessionData = data.session;
            }

            if (sessionData) {
                // SIEMPRE actualizar el rol al panel elegido (permite multi-rol con un mismo email)
                await supabase.auth.updateUser({
                    data: { rol: targetRole }
                });

                // Si es colegio, asegurar que exista el registro en la tabla colegios
                if (targetRole === 'colegio') {
                    const { data: userSchool } = await supabase
                        .from('colegios')
                        .select('id, nombre')
                        .or(`created_by.eq.${sessionData.user.id},email_contacto.eq.${authEmail}`)
                        .maybeSingle();

                    let assignedSchoolId = userSchool?.id;
                    let assignedSchoolName = userSchool?.nombre;

                    if (!userSchool) {
                        // Crear registro base del colegio si es la primera vez que entra como colegio
                        const fallbackName = sessionData.user.user_metadata?.colegio_nombre || sessionData.user.user_metadata?.nombre || 'Colegio Principal';
                        const { data: createdSchool } = await supabase
                            .from('colegios')
                            .insert({
                                nombre: fallbackName,
                                email_contacto: authEmail,
                                codigo_institucional: 'COL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                                created_by: sessionData.user.id
                            })
                            .select()
                            .single();
                        
                        if (createdSchool) {
                            assignedSchoolId = createdSchool.id;
                            assignedSchoolName = createdSchool.nombre;
                        }
                    }

                    await supabase.from('profiles').update({
                        rol: targetRole,
                        colegio_id: assignedSchoolId,
                        colegio_nombre: assignedSchoolName
                    }).eq('id', sessionData.user.id);
                } else {
                    await supabase.from('profiles').update({
                        rol: targetRole
                    }).eq('id', sessionData.user.id);
                }

                setSessionData(sessionData);
                await refreshPerfil();
            }
        } catch (error: any) {
            console.error(error);
            const msg = (error?.message || '').toLowerCase();
            if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed') || error?.name === 'AuthRetryableFetchError') {
                setError("🔌 No se puede conectar con el servidor de autenticación (Supabase). El proyecto puede estar pausado o sin conexión. Inténtalo más tarde.");
            } else if (error.message?.toLowerCase().includes("limit") || error.message?.toLowerCase().includes("rate")) {
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
            const targetRole = (view === 'teacher-auth') ? 'profesor' : (view === 'family-auth') ? 'familia' : (view === 'school-auth') ? 'colegio' : 'alumno';
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

    // Cooldown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // ── Polling: Auto-login tras confirmación de email ──
    // Cada 4 segundos intentamos iniciar sesión con las credenciales.
    // Mientras el email no esté confirmado, Supabase rechaza el login.
    // En cuanto el usuario confirma, el login tiene éxito y entramos.
    useEffect(() => {
        if (!emailSent || !email || !password) return;

        pollingRef.current = setInterval(async () => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (data?.session && !error) {
                    // ¡Confirmado! Detener polling y entrar
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setConfirmed(true);
                    // Pequeña pausa visual para mostrar el check
                    setTimeout(async () => {
                        await refreshPerfil();
                    }, 1200);
                }
            } catch (e) {
                // Aún no confirmado, seguimos intentando
            }
        }, 4000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [emailSent, email, password]);

    const handleResendEmail = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            if (error) throw error;
            setResendCooldown(60);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Error al reenviar el email.');
        } finally {
            setLoading(false);
        }
    };

    // ── Handler: Recuperar contraseña ──
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Introduce tu email para recuperar la contraseña.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '?type=recovery'
            });
            if (error) throw error;
            setResetEmailSent(true);
        } catch (err: any) {
            setError(err.message || 'Error al enviar el email de recuperación.');
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

    // ── Pantalla de Recuperar Contraseña ──
    if (forgotPassword) {
        return (
            <div className="h-[100dvh] w-full bg-[#0A0F1A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
                <BackgroundDesign />
                <div className="w-full max-w-sm relative z-10">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                            {resetEmailSent
                                ? <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                : <Key className="w-10 h-10 text-amber-400" />
                            }
                        </div>

                        {resetEmailSent ? (
                            <>
                                <h2 className="text-2xl font-bold text-emerald-400 mb-2 tracking-tight">¡Email enviado!</h2>
                                <p className="text-slate-400 text-sm mb-1">Hemos enviado un enlace para restablecer tu contraseña a:</p>
                                <p className="text-cyan-400 font-bold text-sm mb-6 break-all">{email}</p>
                                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                                    <p className="text-slate-300 text-xs leading-relaxed">
                                        📧 Abre el correo y pulsa en el enlace para establecer una nueva contraseña. Revisa también la carpeta de spam.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setForgotPassword(false);
                                        setResetEmailSent(false);
                                        setError('');
                                    }}
                                    className="text-slate-500 hover:text-white text-xs font-medium transition-colors"
                                >
                                    ← Volver al inicio de sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Recuperar contraseña</h2>
                                <p className="text-slate-400 text-sm mb-6">
                                    Introduce tu email y te enviaremos un enlace para restablecerla.
                                </p>

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white outline-none transition-all text-sm placeholder:text-slate-600"
                                        placeholder="correo@ejemplo.com"
                                        required
                                        autoFocus
                                    />

                                    {error && (
                                        <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg text-xs font-medium border border-rose-500/20 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Mail className="w-4 h-4" />
                                        )}
                                        Enviar enlace de recuperación
                                    </button>
                                </form>

                                <button
                                    onClick={() => {
                                        setForgotPassword(false);
                                        setError('');
                                    }}
                                    className="text-slate-500 hover:text-white text-xs font-medium transition-colors mt-4"
                                >
                                    ← Volver al inicio de sesión
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Pantalla de Confirmación de Email (Vía Enlace) ──
    if (emailSent) {
        return (
            <div className="h-[100dvh] w-full bg-[#0A0F1A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
                <BackgroundDesign />
                <div className="w-full max-w-sm relative z-10">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                        {/* Icono — cambia cuando se confirma */}
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center border transition-all duration-700 ${
                            confirmed
                                ? 'bg-emerald-500/30 border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.5)] scale-110'
                                : 'bg-emerald-500/20 border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                        }`}>
                            {confirmed
                                ? <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                                : <Mail className="w-10 h-10 text-emerald-400" />
                            }
                        </div>

                        {confirmed ? (
                            // ─── Estado: Confirmado ───
                            <>
                                <h2 className="text-2xl font-bold text-emerald-400 mb-2 tracking-tight">¡Cuenta confirmada!</h2>
                                <p className="text-slate-300 text-sm mb-4">
                                    Entrando en tu sesión...
                                </p>
                                <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                            </>
                        ) : (
                            // ─── Estado: Esperando confirmación ───
                            <>
                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">¡Casi listo!</h2>
                                <p className="text-slate-400 text-sm mb-1">
                                    Hemos enviado un enlace de confirmación a:
                                </p>
                                <p className="text-cyan-400 font-bold text-sm mb-6 break-all">
                                    {email}
                                </p>

                                <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                                    <p className="text-slate-300 text-xs leading-relaxed">
                                        📧 Abre el correo y pulsa en el botón de <strong>confirmación</strong> para activar tu cuenta. Esta pantalla detectará automáticamente cuando lo hagas.
                                    </p>
                                </div>

                                {/* Indicador de polling activo */}
                                <div className="flex items-center justify-center gap-2 mb-4 text-slate-500 text-[10px] font-medium">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    Esperando confirmación...
                                </div>

                                {error && (
                                    <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg text-xs font-medium border border-rose-500/20 flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Reenviar */}
                                <button
                                    onClick={handleResendEmail}
                                    disabled={loading || resendCooldown > 0}
                                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    {resendCooldown > 0
                                        ? `Reenviar en ${resendCooldown}s`
                                        : 'Reenviar enlace de confirmación'
                                    }
                                </button>

                                {/* Volver */}
                                <button
                                    onClick={() => {
                                        if (pollingRef.current) clearInterval(pollingRef.current);
                                        localStorage.removeItem('pendingRole');
                                        setEmailSent(false);
                                        setIsSignUp(false);
                                        setError('');
                                    }}
                                    className="text-slate-500 hover:text-white text-xs font-medium transition-colors"
                                >
                                    ← Volver al inicio de sesión
                                </button>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">💡 ¿No lo recibes?</p>
                                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                        Revisa tu bandeja de spam o promociones.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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
                    <div className="w-full flex flex-col md:flex-row items-center justify-center md:justify-end md:flex-1 md:mt-16">
                        <div className="w-full max-w-sm md:max-w-md lg:max-w-lg mb-4 md:mb-0">
                            <div className="grid grid-cols-1 gap-2.5 md:gap-3.5">
                                {/* Colegio / Institución */}
                                <button
                                    onClick={() => {
                                        setView('school-auth');
                                        setIsSignUp(false);
                                    }}
                                    className="group flex items-center text-left bg-gradient-to-r from-indigo-900/40 via-white/10 to-white/5 hover:from-indigo-600/30 hover:to-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400 rounded-2xl p-3.5 md:p-4 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-11 h-11 md:w-12 md:h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center shrink-0 mr-3.5 border border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-300" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Colegio</h2>
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">Admin & IA</span>
                                        </div>
                                        <p className="text-[11px] text-indigo-200/70 font-medium">Gestión institucional y asistente RAG</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-indigo-300 opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </button>

                                {/* Docente */}
                                <button
                                    onClick={() => {
                                        setView('teacher-auth');
                                        setIsSignUp(false);
                                    }}
                                    className="group flex items-center text-left bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400 rounded-2xl p-3.5 md:p-4 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-11 h-11 md:w-12 md:h-12 bg-cyan-500/30 rounded-xl flex items-center justify-center shrink-0 mr-3.5 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                        <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-cyan-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Docente</h2>
                                        <p className="text-[11px] text-slate-300/70 font-medium">Proyectos, rúbricas y seguimiento</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-cyan-300 opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </button>

                                {/* Alumno */}
                                <button
                                    onClick={() => {
                                        setView('student-auth');
                                        setIsSignUp(false);
                                    }}
                                    className="group flex items-center text-left bg-white/10 hover:bg-white/20 border border-white/20 hover:border-yellow-400 rounded-2xl p-3.5 md:p-4 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-11 h-11 md:w-12 md:h-12 bg-yellow-500/30 rounded-xl flex items-center justify-center shrink-0 mr-3.5 border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                        <User className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Alumno</h2>
                                        <p className="text-[11px] text-slate-300/70 font-medium">Proyectos, equipo y mentor Tico</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-yellow-300 opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </button>

                                {/* Familia */}
                                <button
                                    onClick={() => {
                                        setView('family-auth');
                                        setIsSignUp(false);
                                    }}
                                    className="group flex items-center text-left bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-400 rounded-2xl p-3.5 md:p-4 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-11 h-11 md:w-12 md:h-12 bg-pink-500/30 rounded-xl flex items-center justify-center shrink-0 mr-3.5 border border-pink-400/50 shadow-[0_0_20px_rgba(244,114,182,0.3)]">
                                        <Users className="w-5 h-5 md:w-6 md:h-6 text-pink-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Familia</h2>
                                        <p className="text-[11px] text-slate-300/70 font-medium">Progreso y comunicación escolar</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-pink-300 opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </button>
                            </div>

                            <div className="mt-4 md:mt-6 text-center md:text-right">
                                <span className="text-[10px] md:text-xs text-white/40 font-bold tracking-widest uppercase relative z-30">AI-Tico Multi-Tenant V7.2.2</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isSchool = view === 'school-auth';
    const isTeacher = view === 'teacher-auth';
    const isFamily = view === 'family-auth';
    const isStudent = view === 'student-auth';

    // Theme values for Auth form based on role
    const ringColorClass = isSchool ? 'focus:ring-indigo-500/50' : isTeacher ? 'focus:ring-cyan-500/50' : isFamily ? 'focus:ring-pink-500/50' : 'focus:ring-yellow-500/50';
    const borderColorClassActive = isSchool ? 'focus:border-indigo-500' : isTeacher ? 'focus:border-cyan-500' : isFamily ? 'focus:border-pink-500' : 'focus:border-yellow-500';
    const btnBgClass = isSchool ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : isTeacher ? 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.4)]' : isFamily ? 'bg-pink-600 hover:bg-pink-500 shadow-[0_0_20px_rgba(219,39,119,0.4)]' : 'bg-yellow-600 hover:bg-yellow-500 shadow-[0_0_20px_rgba(202,138,4,0.4)]';
    const iconColorClass = isSchool ? 'text-indigo-400' : isTeacher ? 'text-cyan-400' : isFamily ? 'text-pink-400' : 'text-yellow-400';
    const iconBgClass = isSchool ? 'bg-indigo-500/20 border-indigo-500/30' : isTeacher ? 'bg-cyan-500/20 border-cyan-500/30' : isFamily ? 'bg-pink-500/20 border-pink-500/30' : 'bg-yellow-500/20 border-yellow-500/30';

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
                            setSchoolName('');
                            setSchoolCity('');
                            setSchoolCode('');
                            setRoomCode('');
                        }}
                        className="absolute top-5 left-5 text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/5 hover:border-white/20"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>

                    <div className="flex flex-col items-center mb-5 mt-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconBgClass} mb-3`}>
                            {isSchool ? <Building2 className={`w-6 h-6 ${iconColorClass}`} /> : isFamily ? <Users className={`w-6 h-6 ${iconColorClass}`} /> : isTeacher ? <GraduationCap className={`w-6 h-6 ${iconColorClass}`} /> : <User className={`w-6 h-6 ${iconColorClass}`} />}
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                            {isSchool ? 'Acceso Colegio' : isFamily ? 'Acceso Familia' : isTeacher ? 'Acceso Docente' : 'Acceso Alumno'}
                        </h1>
                        <p className="text-slate-400 text-xs mt-1">
                            {isSignUp ? (isSchool ? 'Registrar nueva institución educativa' : 'Crear nueva cuenta') : 'Ingresa tus credenciales'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-3 md:space-y-3.5">

                        {/* Social Login (compact) - Visible para todos los roles */}
                        <div className="grid grid-cols-2 gap-2 mb-1">
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

                        {/* Campos específicos de Registro de Colegio */}
                        {isSignUp && isSchool && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Nombre del Colegio / Centro</label>
                                    <input
                                        type="text"
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                        className={`w-full px-3.5 py-2 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-xs placeholder:text-slate-600`}
                                        placeholder="Ej: CEIP Cervantes / Colegio San José"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Ciudad / Localidad</label>
                                        <input
                                            type="text"
                                            value={schoolCity}
                                            onChange={(e) => setSchoolCity(e.target.value)}
                                            className={`w-full px-3 py-2 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-xs placeholder:text-slate-600`}
                                            placeholder="Madrid"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Responsable / Cargo</label>
                                        <input
                                            type="text"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            className={`w-full px-3 py-2 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-xs placeholder:text-slate-600`}
                                            placeholder="Dirección / Jefatura"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Nombre Completo (solo en registro no-colegio) */}
                        {isSignUp && !isSchool && (
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-sm placeholder:text-slate-600`}
                                    placeholder={isStudent ? 'Juan Pérez' : isFamily ? 'María López' : 'Profesor García'}
                                    required
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
                                {isSchool ? 'Email Institucional / Admin' : 'Email'}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-3.5 py-2 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-sm placeholder:text-slate-600`}
                                placeholder={isSchool ? 'direccion@colegio.edu' : 'correo@ejemplo.com'}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-3.5 py-2 bg-[#0B101E]/50 border border-white/10 rounded-xl focus:ring-2 ${ringColorClass} ${borderColorClassActive} text-white outline-none transition-all text-sm placeholder:text-slate-600`}
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
                            className={`w-full py-3 mt-1 rounded-xl font-bold text-sm text-white transition-all ${btnBgClass} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {loading ? 'Procesando...' : sessionData ? 'Entrando...' : isSignUp ? (isSchool ? 'Registrar Colegio' : 'Crear Cuenta') : 'Entrar'}
                        </button>

                        <div className="text-center pt-1.5 space-y-1">
                            {!isSignUp && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForgotPassword(true);
                                        setError('');
                                    }}
                                    className="text-amber-400/70 hover:text-amber-400 text-xs font-medium transition-colors block mx-auto"
                                >
                                    He olvidado mi contraseña
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
                            >
                                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : (isSchool ? '¿Nuevo colegio? Regístrate aquí' : '¿No tienes cuenta? Regístrate')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

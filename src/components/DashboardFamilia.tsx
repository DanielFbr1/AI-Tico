import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { LogOut, Plus, User, ChevronRight, Loader2, X, Eye, EyeOff, Users, AlertCircle, MessageCircle, Trash2, BookOpen } from 'lucide-react';
import { FamiliaNotasAlumno } from './FamiliaNotasAlumno';
import { ChatFamiliaProfesor } from './ChatFamiliaProfesor';
import { toast } from 'sonner';

const VERSION = 'V5.8.52';

interface AlumnoVinculado {
    id: string;
    alumno_user_id: string;
    alumno_nombre: string;
    created_at: string;
}

interface ProfesorInfo {
    id: string;
    nombre: string;
}

interface DashboardFamiliaProps {
    familia: {
        id: string;
        nombre: string;
        rol: 'familia';
    };
    onLogout: () => void;
}

export function DashboardFamilia({ familia, onLogout }: DashboardFamiliaProps) {
    const [alumnos, setAlumnos] = useState<AlumnoVinculado[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalAddOpen, setModalAddOpen] = useState(false);
    const [alumnoADesvincular, setAlumnoADesvincular] = useState<{ id: string; nombre: string } | null>(null);
    const [selectedAlumno, setSelectedAlumno] = useState<AlumnoVinculado | null>(null);

    // Chat state
    const [chatAlumno, setChatAlumno] = useState<AlumnoVinculado | null>(null);
    const [chatProfesor, setChatProfesor] = useState<ProfesorInfo | null>(null);
    const [chatLoading, setChatLoading] = useState<string | null>(null);

    // Form state for adding student
    const [addEmail, setAddEmail] = useState('');
    const [addPassword, setAddPassword] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Unread messages count per alumno
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchAlumnos();
    }, [familia.id]);

    useEffect(() => {
        if (alumnos.length > 0) {
            fetchUnreadCounts();
        }
    }, [alumnos]);

    const fetchAlumnos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('familia_alumnos')
                .select('*')
                .eq('familia_user_id', familia.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setAlumnos(data || []);
        } catch (err) {
            console.error('Error fetching family students:', err);
            toast.error('Error al cargar los alumnos');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCounts = async () => {
        try {
            const { data } = await supabase
                .from('mensajes_familia_profesor')
                .select('alumno_nombre')
                .eq('familia_user_id', familia.id)
                .neq('sender_id', familia.id)
                .eq('leido', false);

            if (data) {
                const counts: Record<string, number> = {};
                data.forEach((msg: any) => {
                    counts[msg.alumno_nombre] = (counts[msg.alumno_nombre] || 0) + 1;
                });
                setUnreadCounts(counts);
            }
        } catch (err) {
            console.error('Error fetching unread counts:', err);
        }
    };

    const handleAddAlumno = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError('');

        try {
            if (!addEmail.trim() || !addPassword.trim()) {
                throw new Error('Completa el email y la contraseña del alumno');
            }

            const studentEmail = addEmail.trim().toLowerCase();

            // Crear cliente temporal SOLO cuando se necesita (evita 403 al inicializar)
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
            const tempSupabase = createClient(
                supabaseUrl || 'https://placeholder.supabase.co',
                supabaseAnonKey || 'placeholder',
                { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'familia-temp-verify-' + Date.now() } }
            );

            const { data: loginData, error: loginError } = await tempSupabase.auth.signInWithPassword({
                email: studentEmail,
                password: addPassword.trim()
            });

            if (loginError) {
                throw new Error('Email o contraseña del alumno incorrectos. Asegúrate de usar las mismas credenciales que usa tu hijo/a para entrar.');
            }

            const studentUserId = loginData.user?.id;
            if (!studentUserId) {
                throw new Error('No se pudo identificar al alumno.');
            }

            // Fetch the actual student name from their profile
            const { data: profileData } = await tempSupabase
                .from('profiles')
                .select('nombre')
                .eq('id', studentUserId)
                .single();

            const studentName = profileData?.nombre || addEmail.split('@')[0];

            await tempSupabase.auth.signOut();

            const yaVinculado = alumnos.some(a => a.alumno_user_id === studentUserId);
            if (yaVinculado) {
                throw new Error('Este alumno ya está vinculado a tu cuenta.');
            }

            const { error: insertError } = await supabase
                .from('familia_alumnos')
                .insert({
                    familia_user_id: familia.id,
                    alumno_user_id: studentUserId,
                    alumno_nombre: studentName
                });

            if (insertError) throw insertError;

            toast.success(`¡${studentName} vinculado correctamente!`);
            setModalAddOpen(false);
            setAddEmail('');
            setAddPassword('');
            fetchAlumnos();

        } catch (err: any) {
            console.error('Error adding student:', err);
            setAddError(err.message || 'Error al vincular el alumno');
        } finally {
            setAddLoading(false);
        }
    };

    const handleRemoveAlumno = async (alumnoId: string, nombre: string) => {
        try {
            const { error } = await supabase
                .from('familia_alumnos')
                .delete()
                .eq('id', alumnoId);

            if (error) throw error;

            setAlumnos(prev => prev.filter(a => a.id !== alumnoId));
            toast.success(`${nombre} desvinculado`);
            setAlumnoADesvincular(null);
        } catch (err) {
            console.error('Error removing student:', err);
            toast.error('Error al desvincular');
        }
    };

    // Selector de profesor state
    const [profesoresDisponibles, setProfesoresDisponibles] = useState<(ProfesorInfo & { proyecto_nombre: string })[]>([]);
    const [pendingChatAlumno, setPendingChatAlumno] = useState<AlumnoVinculado | null>(null);

    const handleOpenChat = async (alumno: AlumnoVinculado) => {
        setChatLoading(alumno.id);
        try {
            // Find ALL groups where this student is a member
            const { data: allGroups } = await supabase.from('grupos').select('id, proyecto_id, miembros');
            const normalizar = (t: string) => (t || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const nombreNorm = normalizar(alumno.alumno_nombre);

            const gruposDelAlumno = (allGroups || []).filter((g: any) => {
                if (!g.miembros) return false;
                return (Array.isArray(g.miembros) ? g.miembros : []).some((m: string) => normalizar(m).includes(nombreNorm));
            });

            if (gruposDelAlumno.length === 0) {
                toast.error('No se encontró un proyecto asociado a este alumno. Asegúrate de que esté en un grupo.');
                setChatLoading(null);
                return;
            }

            // Get unique project IDs
            const proyectoIds = [...new Set(gruposDelAlumno.map((g: any) => g.proyecto_id).filter(Boolean))];

            // Fetch all projects to get created_by (professor)
            const { data: proyectos } = await supabase
                .from('proyectos')
                .select('id, nombre, created_by')
                .in('id', proyectoIds);

            if (!proyectos || proyectos.length === 0) {
                toast.error('No se pudo encontrar al profesor del proyecto.');
                setChatLoading(null);
                return;
            }

            // Get unique professors (deduplicate by created_by)
            const profMap = new Map<string, { id: string; proyecto_nombre: string }>();
            for (const p of proyectos) {
                if (p.created_by && !profMap.has(p.created_by)) {
                    profMap.set(p.created_by, { id: p.created_by, proyecto_nombre: p.nombre });
                }
            }

            // Get professor profiles
            const profIds = [...profMap.keys()];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, nombre, email')
                .in('id', profIds);

            const profesores = profIds.map(pid => {
                const prof = profMap.get(pid)!;
                const profile = (profiles || []).find((p: any) => p.id === pid);
                return {
                    id: pid,
                    nombre: profile?.nombre || profile?.email?.split('@')[0] || 'Profesor/a',
                    proyecto_nombre: prof.proyecto_nombre
                };
            });

            if (profesores.length === 1) {
                // Only one professor → open chat directly
                setChatProfesor({ id: profesores[0].id, nombre: profesores[0].nombre });
                setChatAlumno(alumno);
            } else {
                // Multiple professors → show selector
                setProfesoresDisponibles(profesores);
                setPendingChatAlumno(alumno);
            }
        } catch (err) {
            console.error('Error opening chat:', err);
            toast.error('Error al abrir el chat');
        } finally {
            setChatLoading(null);
        }
    };

    const handleSelectProfesor = (prof: ProfesorInfo) => {
        setChatProfesor({ id: prof.id, nombre: prof.nombre });
        setChatAlumno(pendingChatAlumno);
        setProfesoresDisponibles([]);
        setPendingChatAlumno(null);
    };

    // If in chat view
    if (chatAlumno && chatProfesor) {
        return (
            <ChatFamiliaProfesor
                currentUserId={familia.id}
                currentUserName={familia.nombre}
                currentRole="familia"
                otherUserId={chatProfesor.id}
                otherUserName={chatProfesor.nombre}
                alumnoNombre={chatAlumno.alumno_nombre}
                onBack={() => { setChatAlumno(null); setChatProfesor(null); fetchUnreadCounts(); }}
            />
        );
    }

    // If viewing a specific student's grades
    if (selectedAlumno) {
        return (
            <FamiliaNotasAlumno
                alumno={selectedAlumno}
                onBack={() => setSelectedAlumno(null)}
            />
        );
    }

    // Professor selector modal
    if (profesoresDisponibles.length > 0 && pendingChatAlumno) {
        return (
            <div className="min-h-screen bg-[#fcfdff] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight">¿Con quién quieres hablar?</h2>
                                <p className="text-emerald-100 text-xs font-bold">Sobre: {pendingChatAlumno.alumno_nombre}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {profesoresDisponibles.map((prof) => (
                            <button
                                key={prof.id}
                                onClick={() => handleSelectProfesor(prof)}
                                className="w-full bg-slate-50 hover:bg-emerald-50 rounded-2xl p-4 text-left flex items-center gap-4 transition-all border-2 border-transparent hover:border-emerald-200 active:scale-[0.98] group"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200 shrink-0">
                                    {prof.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
                                        {prof.nombre}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                        📚 {prof.proyecto_nombre}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={() => { setProfesoresDisponibles([]); setPendingChatAlumno(null); }}
                            className="w-full py-3 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-colors"
                        >
                            ← Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfdff]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                                        ¡Hola, {(familia.nombre || 'Familia').split(' ')[0]}!
                                    </h1>
                                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                        {VERSION}
                                    </span>
                                </div>
                                <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                    Panel Familiar • {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} vinculado{alumnos.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onLogout}
                            className="p-2 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Add Student Button */}
                        <button
                            onClick={() => { setModalAddOpen(true); setAddError(''); setAddEmail(''); setAddPassword(''); }}
                            className="w-full mb-8 p-6 bg-white rounded-3xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group flex items-center justify-center gap-3"
                        >
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-black text-slate-700 uppercase tracking-tight text-sm">Añadir Alumno/a</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vincular con email y contraseña</p>
                            </div>
                        </button>

                        {/* Student List */}
                        {alumnos.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight mb-2">Sin alumnos vinculados</h3>
                                <p className="text-slate-400 text-sm font-medium">Pulsa "Añadir Alumno" para vincular a tu primer hijo/a</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Mis Alumnos</h2>
                                {alumnos.map((alumno) => {
                                    const unread = unreadCounts[alumno.alumno_nombre] || 0;
                                    return (
                                        <div
                                            key={alumno.id}
                                            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all"
                                        >
                                            {/* Student Info Row */}
                                            <div className="flex items-center gap-4 mb-5">
                                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-200 shrink-0">
                                                    {alumno.alumno_nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-slate-800 tracking-tight text-xl truncate">{alumno.alumno_nombre}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        Vinculado el {new Date(alumno.created_at).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons - Full Width */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Ver Notas Button */}
                                                <button
                                                    onClick={() => setSelectedAlumno(alumno)}
                                                    className="flex items-center justify-center gap-3 py-4 px-5 bg-emerald-50 text-emerald-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-100 transition-all border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-md active:scale-[0.98]"
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                    Ver Notas
                                                </button>

                                                {/* Chat con Profesor Button */}
                                                <button
                                                    onClick={() => handleOpenChat(alumno)}
                                                    disabled={chatLoading === alumno.id}
                                                    className="relative flex items-center justify-center gap-3 py-4 px-5 bg-blue-50 text-blue-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-100 transition-all border-2 border-blue-100 hover:border-blue-300 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {chatLoading === alumno.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <MessageCircle className="w-5 h-5" />
                                                    )}
                                                    Chat Profe
                                                    {unread > 0 && (
                                                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                                            {unread}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Desvincular - separate, smaller */}
                                            <button
                                                onClick={() => setAlumnoADesvincular({ id: alumno.id, nombre: alumno.alumno_nombre })}
                                                className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all border border-transparent hover:border-rose-200"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Desvincular
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modal Add Student */}
            {modalAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 fade-in duration-200">
                        <button
                            onClick={() => setModalAddOpen(false)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Plus className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-slate-800 text-center mb-2 uppercase tracking-tight">Vincular Alumno</h2>
                        <p className="text-slate-400 text-center mb-6 text-sm font-medium">
                            Introduce el email y la contraseña que tu hijo/a usa para entrar en Tico.
                        </p>

                        <form onSubmit={handleAddAlumno} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    Email del Alumno
                                </label>
                                <input
                                    type="email"
                                    value={addEmail}
                                    onChange={(e) => setAddEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    placeholder="ejemplo@correo.com"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    Contraseña del Alumno
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={addPassword}
                                        onChange={(e) => setAddPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm pr-12"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {addError && (
                                <div className="flex items-start gap-2 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {addError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={addLoading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verificando...
                                    </span>
                                ) : 'Vincular Alumno'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmación Desvincular */}
            {alumnoADesvincular && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 relative animate-in zoom-in-95 fade-in duration-200 text-center">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertCircle className="w-8 h-8" />
                        </div>

                        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">¿Estás seguro?</h2>
                        <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
                            Vas a desvincular a <span className="font-bold text-slate-800">{alumnoADesvincular.nombre}</span>.
                            Dejarás de ver sus notas y progreso.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleRemoveAlumno(alumnoADesvincular.id, alumnoADesvincular.nombre)}
                                className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-xl hover:bg-rose-700 active:scale-[0.98]"
                            >
                                Sí, desvincular
                            </button>
                            <button
                                onClick={() => setAlumnoADesvincular(null)}
                                className="w-full py-3 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-colors"
                            >
                                No, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

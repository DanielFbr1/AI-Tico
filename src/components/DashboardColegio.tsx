import React, { useState, useEffect } from 'react';
import { Colegio, ColegioDocumento, Proyecto } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ColegioChatAsistente } from './colegio/ColegioChatAsistente';
import { ColegioGestorDocumental } from './colegio/ColegioGestorDocumental';
import { ColegioClaustroDocentes } from './colegio/ColegioClaustroDocentes';
import { ColegioPerfilConfig } from './colegio/ColegioPerfilConfig';
import { 
    Building2, 
    Bot, 
    FileText, 
    Users, 
    Settings, 
    LayoutDashboard, 
    LogOut, 
    Sparkles, 
    Loader2, 
    ArrowUpRight, 
    BookOpen, 
    FolderKanban,
    Search,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardColegioProps {
    onLogout: () => Promise<void>;
}

export function DashboardColegio({ onLogout }: DashboardColegioProps) {
    const { user, perfil } = useAuth();
    const [colegio, setColegio] = useState<Colegio | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'resumen' | 'asistente' | 'documentos' | 'claustro' | 'configuracion'>('resumen');

    // Estadísticas para el resumen
    const [stats, setStats] = useState({
        docentesCount: 0,
        proyectosCount: 0,
        documentosCount: 0,
        chunksCount: 0
    });

    useEffect(() => {
        cargarColegio();
    }, [user?.id]);

    const cargarColegio = async () => {
        try {
            setLoading(true);
            if (!user) return;

            // 1. Buscar colegio asociado al usuario
            let query = supabase.from('colegios').select('*');
            if (perfil?.colegio_id) {
                query = query.eq('id', perfil.colegio_id);
            } else {
                query = query.or(`created_by.eq.${user.id},email_contacto.eq.${user.email}`);
            }

            let { data: colegioData, error } = await query.maybeSingle();

            // Si no existe, crear uno automáticamente
            if (!colegioData) {
                const schoolName = perfil?.colegio_nombre || user.user_metadata?.colegio_nombre || user.user_metadata?.nombre || 'Mi Colegio Institucional';
                const { data: newSchool, error: createErr } = await supabase
                    .from('colegios')
                    .insert({
                        nombre: schoolName,
                        email_contacto: user.email,
                        ciudad: user.user_metadata?.ciudad || 'España',
                        codigo_institucional: 'COL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                        created_by: user.id
                    })
                    .select()
                    .single();

                if (!createErr && newSchool) {
                    colegioData = newSchool;
                    await supabase.from('profiles').update({
                        colegio_id: newSchool.id,
                        colegio_nombre: newSchool.nombre,
                        rol: 'colegio'
                    }).eq('id', user.id);
                }
            }

            if (colegioData) {
                setColegio(colegioData as Colegio);
                await cargarEstadisticas(colegioData.id, colegioData.nombre);
            }
        } catch (err) {
            console.error('Error cargando datos del colegio:', err);
            toast.error('Error al cargar la información del colegio');
        } finally {
            setLoading(false);
        }
    };

    const cargarEstadisticas = async (colegioId: string, colegioNombre: string) => {
        try {
            // Documentos
            const { data: docs } = await supabase
                .from('colegio_documentos')
                .select('id, total_chunks')
                .eq('colegio_id', colegioId);

            const docCount = docs?.length || 0;
            const chunkCount = docs?.reduce((acc, d) => acc + (d.total_chunks || 0), 0) || 0;

            // Proyectos
            const { count: projsCount } = await supabase
                .from('proyectos')
                .select('*', { count: 'exact', head: true })
                .or(`colegio_id.eq.${colegioId},colegio.ilike.${colegioNombre}`);

            // Docentes
            const { count: docentsCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('rol', 'profesor')
                .or(`colegio_id.eq.${colegioId},colegio_nombre.ilike.${colegioNombre}`);

            setStats({
                documentosCount: docCount,
                chunksCount: chunkCount,
                proyectosCount: projsCount || 0,
                docentesCount: docentsCount || 0
            });
        } catch (e) {
            console.error('Error cargando estadísticas del colegio:', e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center text-white">
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cargando Panel Institucional...</p>
                </div>
            </div>
        );
    }

    if (!colegio) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl max-w-md text-center shadow-xl border border-slate-200">
                    <Building2 className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-slate-900">Institución no encontrada</h2>
                    <p className="text-xs text-slate-500 my-4">No hemos podido vincular tu cuenta a un centro educativo registrado.</p>
                    <button
                        onClick={cargarColegio}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                    >
                        Reintentar carga
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            {/* Header Superior Principal */}
            <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-indigo-950/80 px-4 md:px-8 py-3.5 flex items-center justify-between text-white shadow-xl">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base md:text-lg font-black tracking-tight text-white leading-tight">
                                {colegio.nombre}
                            </h1>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                Institución
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                            {colegio.ciudad ? `${colegio.ciudad} • ` : ''}Administración & Asistente IA
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            {/* Barra de Pestañas / Navegación */}
            <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-2 sticky top-[61px] z-30 shadow-xs overflow-x-auto">
                <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
                    <button
                        onClick={() => setActiveTab('resumen')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'resumen'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Resumen
                    </button>

                    <button
                        onClick={() => setActiveTab('asistente')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'asistente'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Bot className="w-4 h-4" />
                        Asistente IA del Colegio
                    </button>

                    <button
                        onClick={() => setActiveTab('documentos')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'documentos'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Base Documental (RAG)
                        {stats.documentosCount > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'documentos' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                {stats.documentosCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('claustro')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'claustro'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Claustro de Docentes
                    </button>

                    <button
                        onClick={() => setActiveTab('configuracion')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'configuracion'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        Ajustes & IA
                    </button>
                </div>
            </div>

            {/* Contenido Dinámico */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
                {/* ── 1. RESUMEN INSTITUCIONAL ── */}
                {activeTab === 'resumen' && (
                    <div className="space-y-6">
                        {/* Banner de Bienvenida */}
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white border border-indigo-500/20 shadow-2xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
                            <div className="relative z-10 max-w-2xl">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 mb-3">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Centro Educativo Inteligente
                                </span>
                                <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2">
                                    Panel de Control de {colegio.nombre}
                                </h2>
                                <p className="text-xs md:text-sm text-indigo-200/80 leading-relaxed">
                                    Administra la documentación de tu centro, supervisa la actividad docente y consulta al asistente de IA oficial con conocimiento exclusivo de tus normativas y protocolos.
                                </p>
                            </div>
                        </div>

                        {/* Tarjetas Métricas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div 
                                onClick={() => setActiveTab('claustro')}
                                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Docentes</span>
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Users className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.docentesCount}</h3>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    Profesores vinculados <ArrowUpRight className="w-3 h-3 text-slate-400" />
                                </p>
                            </div>

                            <div 
                                onClick={() => setActiveTab('claustro')}
                                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proyectos</span>
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FolderKanban className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.proyectosCount}</h3>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    Proyectos en curso <ArrowUpRight className="w-3 h-3 text-slate-400" />
                                </p>
                            </div>

                            <div 
                                onClick={() => setActiveTab('documentos')}
                                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documentos RAG</span>
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.documentosCount}</h3>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    {stats.chunksCount} nodos en memoria <ArrowUpRight className="w-3 h-3 text-slate-400" />
                                </p>
                            </div>

                            <div 
                                onClick={() => setActiveTab('asistente')}
                                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de la IA</span>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-emerald-600 tracking-tight">Operativo</h3>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    Asistente activo <ArrowUpRight className="w-3 h-3 text-slate-400" />
                                </p>
                            </div>
                        </div>

                        {/* Accesos Rápidos Principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                                        Consultar al Asistente Institucional
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                                        Haz consultas directas sobre tus normativas, reglamentos y procedimientos escolares. La IA responderá citando los documentos oficiales subidos.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('asistente')}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    Abrir Asistente IA <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                                        Alimentar la Base de Conocimiento (RAG)
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                                        Sube nuevos documentos en PDF, Word, Excel o Texto para enriquecer continuamente el cerebro de tu asistente oficial.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('documentos')}
                                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    Gestionar Documentos <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 2. ASISTENTE IA DEL COLEGIO ── */}
                {activeTab === 'asistente' && (
                    <ColegioChatAsistente colegio={colegio} />
                )}

                {/* ── 3. BASE DOCUMENTAL RAG ── */}
                {activeTab === 'documentos' && (
                    <ColegioGestorDocumental colegio={colegio} />
                )}

                {/* ── 4. CLAUSTRO DE DOCENTES ── */}
                {activeTab === 'claustro' && (
                    <ColegioClaustroDocentes colegio={colegio} />
                )}

                {/* ── 5. AJUSTES & CONFIGURACIÓN ── */}
                {activeTab === 'configuracion' && (
                    <ColegioPerfilConfig colegio={colegio} onColegioUpdated={setColegio} />
                )}
            </main>
        </div>
    );
}

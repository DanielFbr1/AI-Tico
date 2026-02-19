import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Organizacion } from '../types';
import { Calendar, Building2, BookOpen, School, ChevronRight, Plus, Loader2, GraduationCap, Trash2, Search, X, MessageCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { MensajesFamiliasProfesor } from './MensajesFamiliasProfesor';

interface SessionPanelProps {
    onSelectClase: (clase: Organizacion, breadcrumb: Organizacion[]) => void;
    nombreProfesor: string;
    initialPath?: Organizacion[];
}

export function SessionPanel({ onSelectClase, nombreProfesor, initialPath = [] }: SessionPanelProps) {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Organizacion[]>([]);
    const [path, setPath] = useState<Organizacion[]>(initialPath);

    // Estado para crear nuevo item
    const [newItemName, setNewItemName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Estado para búsqueda y chat
    const [searchTerm, setSearchTerm] = useState('');
    const [showMensajesFamilias, setShowMensajesFamilias] = useState(false);
    const [unreadFamilyMessages, setUnreadFamilyMessages] = useState(0);

    // Nivel actual basado en la profundidad del path
    const currentLevel = path.length;

    const getNivelInfo = (level: number) => {
        switch (level) {
            case 0: return {
                tipo: 'curso' as const,
                label: 'Cursos Escolares',
                placeholder: 'Ej: 2024-2025',
                icon: <Calendar className="w-5 h-5 text-blue-500" />,
                bg: 'bg-blue-50 border-blue-100',
                text: 'text-blue-700'
            };
            case 1: return {
                tipo: 'colegio' as const,
                label: 'Colegios',
                placeholder: 'Ej: CEIP Cervantes',
                icon: <Building2 className="w-5 h-5 text-emerald-500" />,
                bg: 'bg-emerald-50 border-emerald-100',
                text: 'text-emerald-700'
            };
            case 2: return {
                tipo: 'etapa' as const,
                label: 'Etapas Educativas',
                placeholder: 'Selecciona una etapa',
                icon: <BookOpen className="w-5 h-5 text-purple-500" />,
                bg: 'bg-purple-50 border-purple-100',
                text: 'text-purple-700'
            };
            case 3: return {
                tipo: 'clase' as const,
                label: 'Clases / Grupos',
                placeholder: 'Ej: 1º A, 4 años, Clase de los Leones...',
                icon: <School className="w-5 h-5 text-orange-500" />,
                bg: 'bg-orange-50 border-orange-100',
                text: 'text-orange-700'
            };
            default: return { tipo: 'curso' as const, label: '', placeholder: '', icon: null, bg: '', text: '' };
        }
    };

    const currentLevelInfo = getNivelInfo(currentLevel);

    useEffect(() => {
        fetchItems();
    }, [path]);

    useEffect(() => {
        fetchUnreadFamilyMessages();
    }, []);

    const fetchUnreadFamilyMessages = async () => {
        try {
            if (!user) return;
            const { data, error } = await supabase
                .from('mensajes_familia_profesor')
                .select('id')
                .eq('profesor_user_id', user.id)
                .neq('sender_id', user.id)
                .eq('leido', false);

            if (!error && data) {
                setUnreadFamilyMessages(data.length);
            }
        } catch (err) {
            console.error('Error fetching unread family messages:', err);
        }
    };

    const fetchItems = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from('profesor_organizacion')
                .select('*')
                .eq('profesor_id', user.id)
                .eq('tipo', currentLevelInfo.tipo)
                .order('created_at', { ascending: true });

            if (currentLevel === 0) {
                query = query.is('parent_id', null);
            } else {
                const parentId = path[path.length - 1].id;
                query = query.eq('parent_id', parentId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async (e: React.FormEvent | string) => {
        if (typeof e !== 'string') e.preventDefault();

        const nombre = typeof e === 'string' ? e : newItemName;

        // Comprobar que hay nombre
        if (!nombre.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
        }

        if (!user) return;

        setIsCreating(true);
        try {
            const parentId = currentLevel > 0 ? path[path.length - 1].id : null;

            const { error } = await supabase.from('profesor_organizacion').insert({
                profesor_id: user.id,
                tipo: currentLevelInfo.tipo,
                nombre: nombre.trim(),
                parent_id: parentId
            });

            if (error) throw error;

            setNewItemName('');
            fetchItems();
            toast.success(`${currentLevelInfo.label} añadido correctamente`);
        } catch (error) {
            console.error('Error creating item:', error);
            toast.error('Error al crear elemento');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteItem = async (e: React.MouseEvent, id: string, nombre: string) => {
        e.stopPropagation();
        if (!confirm(`¿Estás seguro de eliminar "${nombre}"? Se borrarán todos los elementos contenidos en él.`)) return;

        try {
            const { error } = await supabase.from('profesor_organizacion').delete().eq('id', id);
            if (error) throw error;
            fetchItems();
            toast.success('Elemento eliminado');
        } catch (error: any) {
            console.error('Error deleting item:', error);
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const handleItemClick = (item: Organizacion) => {
        // Clear search when navigating deeper
        setSearchTerm('');
        if (item.tipo === 'clase') {
            onSelectClase(item, path);
        } else {
            setPath([...path, item]);
            setNewItemName('');
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        setSearchTerm('');
        if (index === -1) {
            setPath([]);
        } else {
            setPath(path.slice(0, index + 1));
        }
    };

    const handleLogout = async () => {
        await signOut();
    };

    // Filter items based on search term
    const filteredItems = items.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showMensajesFamilias) {
        return (
            <MensajesFamiliasProfesor
                profesorId={user?.id || ''}
                profesorNombre={user?.email?.split('@')[0] || 'Profesor'}
                onBack={() => { setShowMensajesFamilias(false); fetchUnreadFamilyMessages(); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfdff] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-100/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-slate-800" />
                                Sesión de {nombreProfesor}
                            </h1>

                            {/* Breadcrumb */}
                            <div className="flex flex-wrap items-center gap-2 mt-4 text-sm font-medium">
                                <button
                                    onClick={() => handleBreadcrumbClick(-1)}
                                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${path.length === 0 ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <GraduationCap className="w-4 h-4" />
                                    Inicio
                                </button>
                                {path.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                        <button
                                            onClick={() => handleBreadcrumbClick(index)}
                                            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${index === path.length - 1 && currentLevel > 0 ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {/* Icono según nivel */}
                                            {index === 0 && <Calendar className="w-3.5 h-3.5" />}
                                            {index === 1 && <Building2 className="w-3.5 h-3.5" />}
                                            {index === 2 && <BookOpen className="w-3.5 h-3.5" />}
                                            {index === 3 && <School className="w-3.5 h-3.5" />}

                                            {item.nombre}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowMensajesFamilias(true)}
                                className="relative flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-black transition-all border-2 border-emerald-200 hover:border-emerald-400 shadow-sm"
                                title="Mensajes de Familias"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-xs uppercase tracking-widest hidden md:inline">Familias</span>
                                {unreadFamilyMessages > 0 && (
                                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                        {unreadFamilyMessages}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:bg-rose-100"
                                title="Cerrar Sessión"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Barra de Búsqueda */}
                    <div className="mt-6">
                        <div className="relative group max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={`Buscar ${currentLevelInfo.label.toLowerCase()}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h2 className={`text-2xl font-black flex items-center gap-3 ${currentLevelInfo.text}`}>
                            <div className={`p-2 rounded-xl ${currentLevelInfo.bg}`}>
                                {currentLevelInfo.icon}
                            </div>
                            {currentLevelInfo.label}
                        </h2>

                        {/* Progress Steps */}
                        <div className="hidden md:flex items-center gap-2">
                            {['Curso', 'Colegio', 'Etapa', 'Clase'].map((step, idx) => (
                                <div key={step} className={`h-2 w-8 rounded-full transition-colors ${idx <= currentLevel ? (idx === currentLevel ? 'bg-blue-500' : 'bg-blue-200') : 'bg-slate-100'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                        {/* New Item Card - Siempre primero */}
                        {!searchTerm && (
                            <div className="group relative bg-white border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-[1.5rem] p-6 flex flex-col items-center justify-center gap-6 transition-all duration-300 shadow-sm hover:shadow-md h-full min-h-[200px]">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                                    <Plus className="w-8 h-8 text-blue-500" />
                                </div>
                                <div className="w-full">
                                    {currentLevel === 2 ? (
                                        // Selección de Etapa con Botones
                                        <div className="grid grid-cols-1 gap-2">
                                            {['Infantil', 'Primaria', 'Secundaria', 'Bachillerato', 'FP'].map(etapa => (
                                                <button
                                                    key={etapa}
                                                    onClick={() => handleCreateItem(etapa)}
                                                    disabled={isCreating}
                                                    className="w-full py-2 px-3 bg-slate-50 hover:bg-purple-100 text-slate-700 hover:text-purple-700 rounded-lg text-sm font-bold transition-all border border-slate-200 hover:border-purple-200"
                                                >
                                                    {etapa}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        // Formulario estándar para Curso, Colegio y Clase
                                        <form onSubmit={handleCreateItem}>
                                            <input
                                                type="text"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                placeholder={currentLevelInfo.placeholder}
                                                className="w-full text-center bg-transparent border-b-2 border-slate-100 focus:border-blue-400 outline-none py-2 font-bold text-slate-800 placeholder:text-slate-300 transition-colors mb-4"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newItemName.trim() || isCreating}
                                                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200"
                                            >
                                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Añadir Nuevo'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="col-span-1 md:col-span-2 flex items-center justify-center h-full min-h-[200px]">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        )}

                        {/* Existing Items */}
                        {!loading && filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className="group/card relative bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 h-full min-h-[200px] flex flex-col justify-between overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover/card:opacity-100 transition-opacity z-10`}>
                                    <button
                                        onClick={(e) => handleDeleteItem(e, item.id, item.nombre)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <div className={`w-12 h-12 rounded-2xl ${currentLevelInfo.bg} flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform duration-300`}>
                                        {currentLevelInfo.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 group-hover/card:text-blue-600 transition-colors line-clamp-2 leading-tight">
                                        {item.nombre}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-wide">
                                        {new Date(item.created_at || '').toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover/card:text-blue-400 transition-colors">
                                        {item.tipo === 'clase' ? 'Ir al Aula' : 'Abrir'}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/card:bg-blue-500 group-hover/card:text-white transition-all duration-300">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!loading && filteredItems.length === 0 && searchTerm && (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-slate-400 font-medium">No se encontraron resultados para "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

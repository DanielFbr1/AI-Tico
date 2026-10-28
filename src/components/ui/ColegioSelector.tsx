import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Colegio } from '../../types';
import { Building2, Search, Check, Plus, Loader2, MapPin, Sparkles, ChevronDown } from 'lucide-react';

interface ColegioSelectorProps {
    value?: string; // Nombre del colegio seleccionado
    colegioId?: string; // ID del colegio seleccionado
    onChange: (colegioNombre: string, colegioId?: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export function ColegioSelector({
    value = '',
    colegioId,
    onChange,
    placeholder = 'Buscar o seleccionar colegio...',
    required = false,
    className = ''
}: ColegioSelectorProps) {
    const [colegios, setColegios] = useState<Colegio[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [selectedColegio, setSelectedColegio] = useState<Colegio | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cargar lista de colegios registrados
    useEffect(() => {
        fetchColegios();
    }, []);

    // Sincronizar valor inicial
    useEffect(() => {
        setSearchTerm(value);
        if (value && colegios.length > 0) {
            const found = colegios.find(c => c.nombre.toLowerCase() === value.toLowerCase() || (colegioId && c.id === colegioId));
            if (found) setSelectedColegio(found);
        }
    }, [value, colegioId, colegios]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchColegios = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('colegios')
                .select('*')
                .order('nombre', { ascending: true });

            if (!error && data) {
                setColegios(data as Colegio[]);
            }
        } catch (err) {
            console.error('Error cargando colegios:', err);
        } finally {
            setLoading(false);
        }
    };

    // Colegios filtrados por término de búsqueda
    const filteredColegios = colegios.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.ciudad && c.ciudad.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = (colegio: Colegio) => {
        setSelectedColegio(colegio);
        setSearchTerm(colegio.nombre);
        onChange(colegio.nombre, colegio.id);
        setIsOpen(false);
    };

    const handleQuickRegister = async () => {
        if (!searchTerm.trim()) return;
        try {
            setIsCreatingNew(true);
            const { data: userAuth } = await supabase.auth.getUser();
            
            const { data: newSchool, error } = await supabase
                .from('colegios')
                .insert({
                    nombre: searchTerm.trim(),
                    codigo_institucional: 'COL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                    created_by: userAuth.user?.id
                })
                .select()
                .single();

            if (!error && newSchool) {
                setColegios(prev => [...prev, newSchool as Colegio].sort((a, b) => a.nombre.localeCompare(b.nombre)));
                handleSelect(newSchool as Colegio);
            } else {
                // Fallback directo por si hay restricciones de permisos
                onChange(searchTerm.trim());
                setIsOpen(false);
            }
        } catch (e) {
            console.error('Error registrando colegio rápido:', e);
            onChange(searchTerm.trim());
            setIsOpen(false);
        } finally {
            setIsCreatingNew(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Input contenedor */}
            <div 
                className="relative flex items-center bg-white border border-gray-200 rounded-xl hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm"
                onClick={() => setIsOpen(true)}
            >
                <div className="pl-3.5 pr-1.5 text-blue-500 shrink-0">
                    <Building2 className="w-4 h-4" />
                </div>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        // Notificar el texto actual
                        onChange(e.target.value, undefined);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    required={required}
                    className="w-full py-2 pr-8 pl-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none font-medium"
                />

                <div className="pr-3 text-gray-400 shrink-0 pointer-events-none">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                    )}
                </div>
            </div>

            {/* Dropdown flotante */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-64 flex flex-col">
                    {/* Header informativo */}
                    <div className="px-3.5 py-2 bg-slate-50/80 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            Centros Registrados ({filteredColegios.length})
                        </span>
                        {colegios.length > 0 && <span className="text-emerald-600 font-bold">Activo</span>}
                    </div>

                    {/* Lista scrollable */}
                    <div className="overflow-y-auto p-1.5 space-y-1 custom-scrollbar max-h-48">
                        {filteredColegios.length > 0 ? (
                            filteredColegios.map((col) => {
                                const isSelected = selectedColegio?.id === col.id || searchTerm.toLowerCase() === col.nombre.toLowerCase();
                                return (
                                    <button
                                        key={col.id}
                                        type="button"
                                        onClick={() => handleSelect(col)}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                                            isSelected 
                                                ? 'bg-blue-50/80 text-blue-900 border border-blue-200/60 font-semibold' 
                                                : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-semibold truncate leading-tight">{col.nombre}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                                    {col.ciudad && (
                                                        <span className="flex items-center gap-0.5">
                                                            <MapPin className="w-2.5 h-2.5" />
                                                            {col.ciudad}
                                                        </span>
                                                    )}
                                                    {col.codigo_institucional && (
                                                        <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-500">
                                                            {col.codigo_institucional}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 ml-2">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-3 text-center text-gray-400 text-xs">
                                No se encontraron colegios con "{searchTerm}"
                            </div>
                        )}
                    </div>

                    {/* Botón rápido para registrar si no existe */}
                    {searchTerm.trim() && !colegios.some(c => c.nombre.toLowerCase() === searchTerm.trim().toLowerCase()) && (
                        <div className="p-2 border-t border-gray-100 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={handleQuickRegister}
                                disabled={isCreatingNew}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                            >
                                {isCreatingNew ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                                Registrar e incluir "{searchTerm.trim()}"
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

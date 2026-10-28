import React, { useState, useEffect } from 'react';
import { Colegio, Proyecto } from '../../types';
import { supabase } from '../../lib/supabase';
import { Users, GraduationCap, FolderKanban, Mail, Search, CheckCircle2, UserCheck, School, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocenteItem {
    id: string;
    nombre: string;
    email?: string;
    proyectosCount: number;
    created_at?: string;
}

interface ColegioClaustroDocentesProps {
    colegio: Colegio;
}

export function ColegioClaustroDocentes({ colegio }: ColegioClaustroDocentesProps) {
    const [docentes, setDocentes] = useState<DocenteItem[]>([]);
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (colegio.id || colegio.nombre) {
            cargarClaustro();
        }
    }, [colegio.id, colegio.nombre]);

    const cargarClaustro = async () => {
        try {
            setLoading(true);

            // 1. Obtener proyectos asociados al colegio
            // PostgREST no soporta ilike dentro de .or() junto a UUID — usamos dos queries y las fusionamos
            let projs: Proyecto[] = [];
            if (colegio.id) {
                const { data: byId } = await supabase
                    .from('proyectos').select('*').eq('colegio_id', colegio.id);
                const { data: byName } = await supabase
                    .from('proyectos').select('*').ilike('colegio', `%${colegio.nombre}%`);
                // Fusionar y deduplicar por id
                const merged = [...(byId || []), ...(byName || [])];
                const seen = new Set<string>();
                projs = merged.filter((p: any) => {
                    if (seen.has(p.id)) return false;
                    seen.add(p.id);
                    return true;
                }) as Proyecto[];
            } else {
                const { data: byName } = await supabase
                    .from('proyectos').select('*').ilike('colegio', `%${colegio.nombre}%`);
                projs = (byName || []) as Proyecto[];
            }
            setProyectos(projs);


            // 2. Obtener profesores vinculados
            let profilesQuery = supabase
                .from('profiles')
                .select('*')
                .eq('rol', 'profesor');

            if (colegio.id) {
                profilesQuery = profilesQuery.or(`colegio_id.eq.${colegio.id},colegio_nombre.ilike.%${colegio.nombre}%`);
            } else {
                profilesQuery = profilesQuery.ilike('colegio_nombre', colegio.nombre);
            }

            const { data: profilesData } = await profilesQuery;

            // También recopilar creadores de proyectos si no están explícitamente en profilesData
            const teacherMap = new Map<string, DocenteItem>();

            (profilesData || []).forEach((p: any) => {
                const docProjs = projs.filter(pr => pr.created_by === p.id);
                teacherMap.set(p.id, {
                    id: p.id,
                    nombre: p.full_name || p.nombre || 'Docente',
                    email: p.email,
                    proyectosCount: docProjs.length,
                    created_at: p.created_at
                });
            });

            // Añadir creadores de proyectos que aún no estuvieran mapeados
            projs.forEach(pr => {
                if (pr.created_by && !teacherMap.has(pr.created_by)) {
                    teacherMap.set(pr.created_by, {
                        id: pr.created_by,
                        nombre: 'Docente AI-Tico',
                        proyectosCount: projs.filter(p => p.created_by === pr.created_by).length
                    });
                }
            });

            setDocentes(Array.from(teacherMap.values()));
        } catch (err) {
            console.error('Error cargando claustro de docentes:', err);
            toast.error('Error al cargar la lista de docentes');
        } finally {
            setLoading(false);
        }
    };

    const docentesFiltrados = docentes.filter(d => 
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Métricas del Claustro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white border border-indigo-500/20 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Docentes en Claustro</p>
                        <h4 className="text-3xl font-black mt-1 tracking-tight">{docentes.length}</h4>
                        <p className="text-[11px] text-indigo-200/70 mt-1">Profesores asociados al centro</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-slate-900 p-5 rounded-3xl text-white border border-purple-500/20 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">Proyectos Escolares</p>
                        <h4 className="text-3xl font-black mt-1 tracking-tight">{proyectos.length}</h4>
                        <p className="text-[11px] text-purple-200/70 mt-1">Creados bajo este colegio</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                        <FolderKanban className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Listado de Docentes */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Claustro y Equipo Educativo</h3>
                        <p className="text-xs text-slate-500">Docentes vinculados a {colegio.nombre}</p>
                    </div>

                    {/* Buscador */}
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar docente o email..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <p className="text-xs font-medium">Cargando claustro docente...</p>
                    </div>
                ) : docentesFiltrados.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">No hay docentes registrados todavía</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Cuando los profesores creen proyectos o inicien sesión seleccionando <strong>{colegio.nombre}</strong>, aparecerán listados aquí automáticamente.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {docentesFiltrados.map((doc) => (
                            <div
                                key={doc.id}
                                className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex items-center justify-between shadow-2xs"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                                        {doc.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">{doc.nombre}</h4>
                                        {doc.email && (
                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate font-medium">
                                                <Mail className="w-3 h-3 shrink-0" />
                                                {doc.email}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0 ml-3">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                                        <FolderKanban className="w-3 h-3" />
                                        {doc.proyectosCount} {doc.proyectosCount === 1 ? 'proyecto' : 'proyectos'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { X, Plus, Users, Layout, Sparkles, Bot, GraduationCap } from 'lucide-react';
import { Proyecto, ProyectoEstado, Organizacion } from '../types';
import { AsistenteDisenoProyecto } from './AsistenteDisenoProyecto';
import { ASIGNATURAS } from '../data/asignaturas';

interface ModalCrearProyectoProps {
    onClose: () => void;
    onCrear: (proyecto: Omit<Proyecto, 'id' | 'grupos'>) => void;
    nombreUsuario: string;
    clasesExistentes?: string[];
}

export function ModalCrearProyecto({ onClose, onCrear, nombreUsuario, clasesExistentes = [] }: ModalCrearProyectoProps) {
    const [modo, setModo] = useState<'manual' | 'ia'>('manual');
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Aprendizaje Basado en Proyectos');
    const [clase, setClase] = useState('');
    const [colegio, setColegio] = useState('');
    const [curso, setCurso] = useState('');
    const [etapa, setEtapa] = useState('');
    const [asignatura, setAsignatura] = useState('');
    const [contextoIA, setContextoIA] = useState('');
    const [rubricaIA, setRubricaIA] = useState<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nombre.trim() && clase.trim() && colegio.trim() && curso.trim() && etapa.trim()) {
            onCrear({
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                tipo,
                clase: clase.trim(),
                colegio: colegio.trim(),
                curso: curso.trim(),
                etapa: etapa.trim(),
                estado: 'En preparación' as ProyectoEstado,
                codigo_sala: Math.random().toString(36).substring(2, 8).toUpperCase(),
                fases: [
                    { id: 'f1', nombre: 'Investigación / Pregunta', estado: 'actual' },
                    { id: 'f2', nombre: 'Acción / Desarrollo', estado: 'pendiente' },
                    { id: 'f3', nombre: 'Reflexión / Producto', estado: 'pendiente' },
                ],
                contexto_ia: contextoIA,
                rubrica: rubricaIA,
                asignatura: asignatura || undefined
            });
            onClose();
        } else {
            alert('Por favor, rellena todos los campos obligatorios de ubicación (Colegio, Etapa, Curso y Clase).');
        }
    };

    const handleConfiguracionIA = (config: { descripcion: string; rubrica: any; contexto_ia: string }) => {
        setDescripcion(config.descripcion);
        setContextoIA(config.contexto_ia);
        setRubricaIA(config.rubrica);
        setModo('manual'); // Volvemos al formulario para revisión
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 md:p-8 z-50 animate-in fade-in duration-300 backdrop-blur-sm">
            <div className={`bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col max-h-[90vh] md:max-h-[85vh]`}>

                {/* Header Dinámico */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${modo === 'ia' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                            {modo === 'ia' ? <Sparkles className="w-6 h-6" /> : <Layout className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {modo === 'ia' ? 'Diseñar con Asistente IA' : 'Nuevo Proyecto'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {modo === 'ia' ? 'Conversa para definir tu proyecto ideal' : 'Configura los detalles básicos'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {modo === 'ia' ? (
                    /* MODO ASISTENTE */
                    <div className="p-0">
                        <AsistenteDisenoProyecto
                            onConfiguracionGenerada={handleConfiguracionIA}
                            onCancel={() => setModo('manual')}
                        />
                    </div>
                ) : (
                    /* MODO MANUAL (Formulario clásico + Botón IA) */
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <form id="project-form" onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">

                                {/* Botón IA más compacto */}
                                {!contextoIA && (
                                    <div
                                        className="relative overflow-hidden bg-white border-2 border-indigo-50 rounded-2xl p-5 group cursor-pointer transition-all duration-500 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]"
                                        onClick={() => setModo('ia')}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-all duration-300">
                                                        <Sparkles className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                                                        Asistente Pedagógico
                                                        <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">IA ✨</span>
                                                    </h3>
                                                    <p className="text-slate-500 text-xs font-medium leading-tight">
                                                        ¿Sin tiempo? Deja que Tico diseñe el mapa del proyecto por ti.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="hidden md:flex items-center gap-2 bg-indigo-600 px-5 py-2.5 rounded-xl group-hover:bg-indigo-700 transition-all shadow-md">
                                                <div className="text-white font-black text-xs tracking-widest uppercase">Diseñar ahora</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    {/* COLUMNA IZQUIERDA: Info General */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                required
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                                                placeholder="Ej: Podcast Histórico"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Asignatura</label>
                                                <select
                                                    value={asignatura}
                                                    onChange={(e) => setAsignatura(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                                                >
                                                    <option value="">Selecciona...</option>
                                                    {Object.values(ASIGNATURAS).map((asig) => (
                                                        <option key={asig.id} value={asig.nombre}>
                                                            {asig.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Metodología</label>
                                                <select
                                                    value={tipo}
                                                    onChange={(e) => setTipo(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                                >
                                                    <option>Aprendizaje Basado en Proyectos</option>
                                                    <option>Aprendizaje Basado en Problemas</option>
                                                    <option>Aprendizaje Servicio</option>
                                                    <option>Indagación</option>
                                                    <option>Proyecto Personalizado</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMNA DERECHA: Ubicación + Descripción */}
                                    <div className="space-y-4 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Colegio</label>
                                                    <input
                                                        type="text"
                                                        value={colegio}
                                                        onChange={(e) => setColegio(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                                                        placeholder="IE..."
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Etapa Educativa</label>
                                                    <select
                                                        value={etapa}
                                                        onChange={(e) => setEtapa(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                                                        required
                                                    >
                                                        <option value="">Selecciona...</option>
                                                        <option value="Infantil">Infantil</option>
                                                        <option value="Primaria">Primaria</option>
                                                        <option value="Secundaria">Secundaria</option>
                                                        <option value="Bachillerato">Bachillerato</option>
                                                        <option value="FP">Formación Profesional</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Curso (Año)</label>
                                                    <input
                                                        type="text"
                                                        value={curso}
                                                        onChange={(e) => setCurso(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                                                        placeholder="Ej: 2024-2025"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Clase</label>
                                                    <input
                                                        type="text"
                                                        list="clases-list"
                                                        value={clase}
                                                        onChange={(e) => setClase(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                                                        placeholder="Ej: 5ºA"
                                                        required
                                                    />
                                                    <datalist id="clases-list">
                                                        {clasesExistentes.map(c => <option key={c} value={c} />)}
                                                    </datalist>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DESCRIPCIÓN JUSTO DEBAJO DE LA UBICACIÓN */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Breve Descripción</label>
                                            <textarea
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                rows={2}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm resize-none"
                                                placeholder="Objetivo del proyecto..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mr-3 px-4 md:px-6 py-2.5 md:py-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-black uppercase text-[10px] md:text-xs tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="project-form"
                                className="px-6 md:px-8 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 font-black uppercase text-[10px] md:text-xs tracking-widest"
                            >
                                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                Crear Proyecto
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

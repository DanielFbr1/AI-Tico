import React, { useState } from 'react';
import { X, Plus, Users, Layout, Sparkles, Bot } from 'lucide-react';
import { Proyecto, ProyectoEstado } from '../types';
import { AsistenteDisenoProyecto } from './AsistenteDisenoProyecto';

interface ModalCrearProyectoProps {
    onClose: () => void;
    onCrear: (proyecto: Omit<Proyecto, 'id'>) => void;
    nombreUsuario: string;
    clasesExistentes?: string[];
}

export function ModalCrearProyecto({ onClose, onCrear, nombreUsuario, clasesExistentes = [] }: ModalCrearProyectoProps) {
    const [modo, setModo] = useState<'manual' | 'ia'>('manual');
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Aprendizaje Basado en Proyectos');
    const [clase, setClase] = useState('');
    const [contextoIA, setContextoIA] = useState('');
    const [rubricaIA, setRubricaIA] = useState<any>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nombre.trim()) {
            onCrear({
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                tipo,
                clase,
                estado: 'En preparación' as ProyectoEstado,
                codigo_sala: Math.random().toString(36).substring(2, 8).toUpperCase(),
                fases: [
                    { id: 'f1', nombre: 'Investigación / Pregunta', estado: 'actual' },
                    { id: 'f2', nombre: 'Acción / Desarrollo', estado: 'pendiente' },
                    { id: 'f3', nombre: 'Reflexión / Producto', estado: 'pendiente' },
                ],
                contexto_ia: contextoIA,
                rubrica: rubricaIA
            });
            onClose();
        }
    };

    const handleConfiguracionIA = (config: { descripcion: string; rubrica: any; contexto_ia: string }) => {
        setDescripcion(config.descripcion);
        setContextoIA(config.contexto_ia);
        setRubricaIA(config.rubrica);
        setModo('manual'); // Volvemos al formulario para revisión
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className={`bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden transition-all duration-300 ${modo === 'ia' ? 'max-w-4xl' : ''}`}>

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
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Iteración 4: Violet Magic - Premium, Claro y Vibrante */}
                        {!contextoIA && (
                            <div
                                className="relative overflow-hidden bg-white border-2 border-indigo-50 rounded-2xl p-6 group cursor-pointer transition-all duration-500 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]"
                                onClick={() => setModo('ia')}
                            >
                                {/* Shimmer Effect Animado (Sutil para fondo claro) */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-all duration-300">
                                                <Sparkles className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-md border border-indigo-50 animate-bounce-slow">
                                                <Bot className="w-4 h-4 text-indigo-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                                    Asistente Pedagógico
                                                </h3>
                                                <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                                                    IA ✨
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium">
                                                ¿Sin tiempo? Deja que Tico diseñe el mapa del proyecto por ti.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex items-center gap-3 bg-indigo-600 px-6 py-3 rounded-2xl group-hover:bg-indigo-700 transition-all duration-300 shadow-md shadow-indigo-600/20 group-hover:shadow-indigo-600/40">
                                        <div className="text-center">
                                            <div className="text-white font-black text-sm tracking-tight">Definir con IA</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
                                <input
                                    type="text"
                                    required
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej: Podcast Histórico"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Proyecto</label>
                                    <select
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option>Aprendizaje Basado en Proyectos</option>
                                        <option>Aprendizaje Basado en Problemas</option>
                                        <option>Aprendizaje Servicio</option>
                                        <option>Indagación</option>
                                        <option>Proyecto Personalizado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Clase / Grupo</label>
                                    <input
                                        type="text"
                                        list="clases-list"
                                        value={clase}
                                        onChange={(e) => setClase(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Ej: 4ºA"
                                    />
                                    <datalist id="clases-list">
                                        {clasesExistentes.map(c => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Describe brevemente el proyecto..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mr-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Crear Proyecto
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { X, Plus, Users, Layout, Sparkles, Bot } from 'lucide-react';
import { Proyecto, ProyectoEstado } from '../types';
import { AsistenteDisenoProyecto } from './AsistenteDisenoProyecto';

interface ModalCrearProyectoProps {
    onClose: () => void;
    onCrear: (proyecto: Omit<Proyecto, 'id'>) => void;
    nombreUsuario: string;
}

export function ModalCrearProyecto({ onClose, onCrear, nombreUsuario }: ModalCrearProyectoProps) {
    const [modo, setModo] = useState<'manual' | 'ia'>('manual');
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Radio/Podcast');
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
                    { id: 'f1', nombre: 'Investigación', estado: 'actual' },
                    { id: 'f2', nombre: 'Desarrollo', estado: 'pendiente' },
                    { id: 'f3', nombre: 'Producto Final', estado: 'pendiente' },
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

                        {/* Banner Promocional IA */}
                        {!contextoIA && (
                            <div
                                onClick={() => setModo('ia')}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.01] flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">¿Necesitas ayuda para empezar?</h3>
                                        <p className="text-indigo-100 text-sm">Nuestro asistente pedagógico puede diseñar el proyecto y las rúbricas por ti.</p>
                                    </div>
                                </div>
                                <div className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm group-hover:bg-indigo-50 transition-colors">
                                    Probar IA ✨
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
                                        <option>Radio/Podcast</option>
                                        <option>Canal de YouTube</option>
                                        <option>Periódico Digital</option>
                                        <option>Proyecto Personalizado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Clase / Grupo</label>
                                    <input
                                        type="text"
                                        value={clase}
                                        onChange={(e) => setClase(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Ej: 4ºA"
                                    />
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

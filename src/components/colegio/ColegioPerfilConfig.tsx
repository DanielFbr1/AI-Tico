import React, { useState } from 'react';
import { Colegio, ColegioConfigIA } from '../../types';
import { supabase } from '../../lib/supabase';
import { Building2, Bot, Save, Globe, Shield, Sparkles, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ColegioPerfilConfigProps {
    colegio: Colegio;
    onColegioUpdated: (updated: Colegio) => void;
}

export function ColegioPerfilConfig({ colegio, onColegioUpdated }: ColegioPerfilConfigProps) {
    const [nombre, setNombre] = useState(colegio.nombre || '');
    const [ciudad, setCiudad] = useState(colegio.ciudad || '');
    const [direccion, setDireccion] = useState(colegio.direccion || '');
    const [telefono, setTelefono] = useState(colegio.telefono || '');
    const [emailContacto, setEmailContacto] = useState(colegio.email_contacto || '');
    const [codigoInstitucional, setCodigoInstitucional] = useState(colegio.codigo_institucional || '');

    // Configuración de la IA
    const [nombreAsistente, setNombreAsistente] = useState(colegio.configuracion_ia?.nombre_asistente || `Tico ${colegio.nombre}`);
    const [tono, setTono] = useState(colegio.configuracion_ia?.tono || 'Profesional, amable, educativo y cercano');
    const [instruccionesEspecificas, setInstruccionesEspecificas] = useState(colegio.configuracion_ia?.instrucciones_especificas || '');
    const [permitirBusquedaWeb, setPermitirBusquedaWeb] = useState(colegio.configuracion_ia?.permitir_busqueda_web ?? true);

    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            toast.error('El nombre del colegio no puede estar vacío');
            return;
        }

        setSaving(true);
        try {
            const configIA: ColegioConfigIA = {
                nombre_asistente: nombreAsistente.trim() || `Asistente de ${nombre.trim()}`,
                tono,
                instrucciones_especificas: instruccionesEspecificas.trim(),
                permitir_busqueda_web: permitirBusquedaWeb
            };

            const updatedData = {
                nombre: nombre.trim(),
                ciudad: ciudad.trim() || null,
                direccion: direccion.trim() || null,
                telefono: telefono.trim() || null,
                email_contacto: emailContacto.trim() || null,
                codigo_institucional: codigoInstitucional.trim() || null,
                configuracion_ia: configIA,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('colegios')
                .update(updatedData)
                .eq('id', colegio.id)
                .select()
                .single();

            if (error) throw error;

            toast.success('Configuración y perfil del colegio actualizados con éxito');
            onColegioUpdated(data as Colegio);
        } catch (err: any) {
            console.error('Error guardando configuración del colegio:', err);
            toast.error(`Error al guardar: ${err.message || 'Desconocido'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Información Institucional */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Datos de la Institución Educativa</h3>
                        <p className="text-xs text-slate-500">Información pública y de contacto de tu centro</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Nombre Oficial del Colegio / Centro
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-semibold outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Ciudad / Municipio
                        </label>
                        <input
                            type="text"
                            value={ciudad}
                            onChange={(e) => setCiudad(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-medium outline-none transition-all"
                            placeholder="Ej: Madrid"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Código Institucional / Centro
                        </label>
                        <input
                            type="text"
                            value={codigoInstitucional}
                            onChange={(e) => setCodigoInstitucional(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-medium outline-none transition-all"
                            placeholder="COL-28001"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Email Institucional
                        </label>
                        <input
                            type="email"
                            value={emailContacto}
                            onChange={(e) => setEmailContacto(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-medium outline-none transition-all"
                            placeholder="direccion@colegio.edu"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-medium outline-none transition-all"
                            placeholder="+34 912 345 678"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Dirección Postal
                        </label>
                        <input
                            type="text"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm font-medium outline-none transition-all"
                            placeholder="Calle Mayor 12"
                        />
                    </div>
                </div>
            </div>

            {/* Configuración y Personalidad del Asistente IA */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Personalidad y Comportamiento del Asistente IA</h3>
                        <p className="text-xs text-slate-500">Configura cómo interactúa el asistente oficial de tu centro</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Nombre del Asistente IA
                        </label>
                        <input
                            type="text"
                            value={nombreAsistente}
                            onChange={(e) => setNombreAsistente(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-800 text-sm font-semibold outline-none transition-all"
                            placeholder="Ej: Tico San José / Asistente Virtual"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Tono de Comunicación
                        </label>
                        <select
                            value={tono}
                            onChange={(e) => setTono(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-800 text-sm font-medium outline-none transition-all"
                        >
                            <option value="Profesional, amable, educativo y cercano">Profesional, amable y pedagógico (Recomendado)</option>
                            <option value="Formal, institucional y riguroso">Formal e institucional</option>
                            <option value="Cercano, motivador y dinámico">Cercano, motivador y dinámico</option>
                            <option value="Conciso y directo al grano">Conciso y directo al grano</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                            Directrices e Instrucciones Específicas de la Institución
                        </label>
                        <textarea
                            value={instruccionesEspecificas}
                            onChange={(e) => setInstruccionesEspecificas(e.target.value)}
                            rows={3}
                            placeholder="Ej: Recuerda siempre resaltar nuestro compromiso con la inclusión. En caso de dudas disciplinarias graves, remite siempre a Jefatura de Estudios."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-800 text-sm font-medium outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-indigo-600" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Búsqueda en Internet en Tiempo Real</h4>
                                <p className="text-xs text-slate-500">Permite a la IA buscar información externa si no está en tus documentos</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={permitirBusquedaWeb}
                                onChange={(e) => setPermitirBusquedaWeb(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Botón de Guardado */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Guardar Todos los Cambios
                </button>
            </div>
        </form>
    );
}

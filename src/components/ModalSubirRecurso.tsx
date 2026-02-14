import { useState, useRef } from 'react';
import { Upload, FileText, Video, Music, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Grupo } from '../types';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { Recurso } from '../types';

interface ModalSubirRecursoProps {
    grupo: Grupo;
    proyectoId?: string; // New prop
    onClose: () => void;
    onSuccess: (nuevoRecurso: Recurso) => void;
}

export function ModalSubirRecurso({ grupo, proyectoId, onClose, onSuccess }: ModalSubirRecursoProps) {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [contenidoTexto, setContenidoTexto] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    // Nuevo estado para el tipo seleccionado (Auto-detected)
    const [tipoSeleccionado, setTipoSeleccionado] = useState<Recurso['tipo']>('texto');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const TiposDisponibles: { id: Recurso['tipo']; label: string; icon: any; color: string }[] = [
        { id: 'texto', label: 'Texto / Documento', icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200' },
        { id: 'audio', label: 'Audio / Locución', icon: Music, color: 'text-green-600 bg-green-50 border-green-200' },
        { id: 'video', label: 'Video / Edición', icon: Video, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 'imagen', label: 'Imagen / Diseño', icon: ImageIcon, color: 'text-orange-600 bg-orange-50 border-orange-200' }
    ];

    const Icon = TiposDisponibles.find(t => t.id === tipoSeleccionado)?.icon || FileText;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setArchivo(file);

            // Auto-Detect Type
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) {
                setTipoSeleccionado('audio');
                toast.info("🎙️ Detectado: Audio");
            } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) {
                setTipoSeleccionado('video');
                toast.info("🎬 Detectado: Video");
            } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
                setTipoSeleccionado('imagen');
                toast.info("🖼️ Detectado: Imagen");
            } else {
                setTipoSeleccionado('texto'); // Doc is treated as text/resource
                toast.info("📄 Detectado: Documento");
                setContenidoTexto('');
            }
        }
    };

    const handleSubirRecurso = async () => {
        let finalTitulo = titulo.trim();
        let finalDescripcion = descripcion.trim();

        // Auto-fill title
        if (!finalTitulo && archivo) {
            finalTitulo = archivo.name;
        } else if (!finalTitulo) {
            finalTitulo = 'Sin título';
        }

        if (!finalDescripcion) {
            finalDescripcion = 'Sin descripción';
        }

        if (!archivo && !contenidoTexto.trim()) {
            toast.error('Debes escribir algo o subir un archivo');
            return;
        }

        setUploading(true);
        try {
            let mediaUrl = '';

            // 1. Subir al Storage
            if (archivo) {
                const fileExt = archivo.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                // Use proyecto_id if group is fake (id=0), else group id
                const folderPath = (grupo.id === 0 && proyectoId) ? `global/${proyectoId}` : `${grupo.id}`;
                const filePath = `${folderPath}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('recursos')
                    .upload(filePath, archivo);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('recursos')
                    .getPublicUrl(filePath);

                mediaUrl = data.publicUrl;
            }

            // 2. Insertar en Base de Datos
            const user = (await supabase.auth.getUser()).data.user;

            // Determine Grupo vs Proyecto
            const grupoIdValue = (typeof grupo.id === 'string' ? parseInt(grupo.id) : grupo.id);
            const isGlobal = grupoIdValue === 0 || grupoIdValue < 0;

            const payload: any = {
                // If global (id 0), set grupo_id NULL and proyecto_id
                grupo_id: isGlobal ? null : grupoIdValue,
                proyecto_id: proyectoId, // Always save project ID if available

                grupo_nombre: grupo.nombre,
                tipo: tipoSeleccionado,
                titulo: finalTitulo,
                descripcion: finalDescripcion,
                url: mediaUrl || undefined,
                contenido: tipoSeleccionado === 'texto' ? contenidoTexto : undefined,
                usuario_id: user?.id
            };

            const { data, error } = await supabase
                .from('recursos')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            // Adaptar respuesta
            const nuevoRecurso: Recurso = {
                id: data.id,
                grupoId: data.grupo_id || 0,
                grupoNombre: data.grupo_nombre,
                tipo: data.tipo,
                titulo: data.titulo,
                descripcion: data.descripcion,
                fechaSubida: new Date(data.created_at),
                url: data.url,
                contenido: data.contenido
            };

            toast.success('Recurso publicado con éxito');
            onSuccess(nuevoRecurso);
            onClose();

        } catch (error: any) {
            console.error('Error al subir recurso:', error);
            toast.error(`Error: ${error.message || 'No se pudo subir el recurso'}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Subir Aportación</h3>
                        <p className="text-xs text-slate-500 font-medium">{grupo.id === 0 ? 'Compartir con toda la clase' : 'Compartir con el equipo'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* ZONE 1: SMART UPLOAD (Dynamic Icons) */}
                    <div>
                        <div
                            className={`border-3 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group relative overflow-hidden ${archivo ? 'border-emerald-400 bg-emerald-50/30' : 'border-indigo-100 bg-indigo-50/30 hover:border-indigo-400 hover:bg-indigo-50'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="*" // Accept everything, auto-detect later
                            />

                            {/* Dynamic Icon */}
                            <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${archivo ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-indigo-500'}`}>
                                {archivo ? <Icon className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                            </div>

                            <h4 className="text-lg font-black text-slate-700 mb-1">
                                {archivo ? archivo.name : 'Haz clic o arrastra tu archivo'}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                                {archivo ? `Tipo detectado: ${TiposDisponibles.find(t => t.id === tipoSeleccionado)?.label}` : 'Detectamos el tipo automáticamente'}
                            </p>
                        </div>
                    </div>

                    {/* ZONE 2: Metadata (Optional) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Título (Opcional)</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder={archivo ? archivo.name : "Título del recurso"}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Descripción (Opcional)</label>
                            <input
                                type="text"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm text-slate-700"
                            />
                        </div>
                    </div>

                    {/* ZONE 3: Extra Content (Only for Text type or specific need) */}
                    {!archivo && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Contenido de Texto (Opcional si subes archivo)</label>
                            <textarea
                                value={contenidoTexto}
                                onChange={(e) => setContenidoTexto(e.target.value)}
                                placeholder="Escribe aquí si no subes archivo..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-sm resize-none"
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubirRecurso}
                            disabled={uploading}
                            className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Publicando...
                                </>
                            ) : (
                                'Publicar'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

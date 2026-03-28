import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Video, Music, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Grupo } from '../types';
import { supabase } from '../lib/supabase';
import { Recurso } from '../types';
import { Eye, EyeOff } from 'lucide-react';

interface ModalSubirRecursoProps {
    grupo: Grupo;
    proyectoId?: string;
    onClose: () => void;
    onSuccess: (nuevoRecurso: Recurso) => void;
    esDocente?: boolean;
}

export function ModalSubirRecurso({ grupo, proyectoId, onClose, onSuccess, esDocente = false }: ModalSubirRecursoProps) {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [contenidoTexto, setContenidoTexto] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [tipoSeleccionado, setTipoSeleccionado] = useState<Recurso['tipo']>('texto');
    const [publicado, setPublicado] = useState(true);
    const [esProfesor, setEsProfesor] = useState(esDocente);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkRole = async () => {
            // Si ya sabemos que es docente por prop, no hace falta consultar
            if (esDocente) {
                setEsProfesor(true);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('rol').eq('id', user.id).maybeSingle();
                if (data?.rol === 'profesor') setEsProfesor(true);
            }
        };
        checkRole();
    }, [esDocente]);

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
                setTipoSeleccionado('texto');
                toast.info("📄 Detectado: Documento");
                setContenidoTexto('');
            }
        }
    };

    const handleSubirRecurso = async () => {
        let finalTitulo = titulo.trim();
        let finalDescripcion = descripcion.trim();

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

            if (archivo) {
                const fileExt = archivo.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
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

            const user = (await supabase.auth.getUser()).data.user;
            const grupoIdValue = (typeof grupo.id === 'string' ? parseInt(grupo.id) : grupo.id);
            const isGlobal = grupoIdValue === 0 || grupoIdValue < 0;

            const payload: any = {
                grupo_id: isGlobal ? null : grupoIdValue,
                proyecto_id: proyectoId,
                grupo_nombre: grupo.nombre,
                tipo: tipoSeleccionado,
                titulo: finalTitulo,
                descripcion: finalDescripcion,
                url: mediaUrl || undefined,
                contenido: tipoSeleccionado === 'texto' ? contenidoTexto : undefined,
                usuario_id: user?.id,
                publicado: esProfesor ? publicado : true // Los alumnos siempre publican directamente (o según lógica de grupo)
            };

            const { data, error } = await supabase
                .from('recursos')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            const nuevoRecurso: Recurso = {
                id: data.id,
                grupoId: data.grupo_id || 0,
                grupoNombre: data.grupo_nombre,
                tipo: data.tipo,
                titulo: data.titulo,
                descripcion: data.descripcion,
                fechaSubida: new Date(data.created_at),
                url: data.url,
                contenido: data.contenido,
                publicado: data.publicado
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-0 md:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-none md:rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] w-full max-w-2xl h-full md:h-auto md:max-h-[85vh] animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden relative border border-white/20">

                {/* Header Compacto */}
                <div className="p-5 md:p-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Upload className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">Subir Aportación</h3>
                            <p className="text-[10px] md:text-xs text-indigo-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                {grupo.id === 0 ? 'Clase' : `Equipo: ${grupo.nombre}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 md:p-3 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido Optimizando Altura */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-6 pb-32 md:pb-8 custom-scrollbar">

                    {/* ZONE 1: SMART UPLOAD (Muy Compacto en PC) */}
                    <div className="space-y-3">
                        <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Archivo</label>
                        <div
                            className={`border-4 border-dashed rounded-2xl md:rounded-[2rem] p-6 md:p-6 text-center transition-all cursor-pointer group relative overflow-hidden active:scale-[0.99] border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-400 ${archivo ? 'border-emerald-400 bg-emerald-50/20' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="*"
                            />

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-700 ${archivo ? 'bg-emerald-500 text-white rotate-12 scale-110' : 'bg-white text-indigo-500 group-hover:rotate-6'}`}>
                                    {archivo ? <Icon className="w-6 h-6 md:w-7 md:h-7" /> : <Upload className="w-6 h-6 md:w-7 md:h-7" />}
                                </div>
                                <div className="text-left">
                                    <h4 className="text-base md:text-lg font-black text-slate-900 leading-tight break-all">
                                        {archivo ? archivo.name : 'Haz clic para seleccionar'}
                                    </h4>
                                    <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                                        {archivo ? `Tipo: ${TiposDisponibles.find(t => t.id === tipoSeleccionado)?.label}` : 'Auto-detección activada'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ZONE 2: Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Título</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder={archivo ? archivo.name : "Ej: Boceto"}
                                className="w-full px-5 py-3 md:py-3.5 bg-slate-50 border-2 border-slate-50 rounded-xl md:rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm text-slate-700 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Descripción</label>
                            <input
                                type="text"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="..."
                                className="w-full px-5 py-3 md:py-3.5 bg-slate-50 border-2 border-slate-50 rounded-xl md:rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm text-slate-700 outline-none"
                            />
                        </div>
                    </div>

                    {/* ZONE 3: Visibility (Only for Teachers) */}
                    {esProfesor && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                            <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Estado de Publicación</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setPublicado(true)}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest ${publicado ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <Eye className="w-4 h-4" />
                                    Publicado
                                </button>
                                <button
                                    onClick={() => setPublicado(false)}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest ${!publicado ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-lg shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <EyeOff className="w-4 h-4" />
                                    Borrador
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ZONE 4: Extra Content */}
                    {!archivo && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                            <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tu mensaje</label>
                            <textarea
                                value={contenidoTexto}
                                onChange={(e) => setContenidoTexto(e.target.value)}
                                placeholder="Escribe aquí..."
                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-xl md:rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-600 text-sm resize-none min-h-[100px] outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Fijo Refinado */}
                <div className="p-4 md:p-8 border-t border-slate-50 bg-white/90 backdrop-blur-xl absolute bottom-0 left-0 right-0 md:relative shrink-0 flex items-center justify-between gap-4 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-none">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-6 md:px-10 py-4 text-slate-400 font-black text-[10px] md:text-sm uppercase tracking-[0.2em] hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubirRecurso}
                        disabled={uploading}
                        className="px-8 md:px-14 py-4 md:py-5 bg-slate-900 text-white rounded-[1.1rem] md:rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
                                <span>Publicar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

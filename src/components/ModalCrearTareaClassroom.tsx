import { useState, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Upload, Link2, FileText, Calendar, Clock, Users, Award, Paperclip, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Grupo, TareaDetallada } from '../types';
import { toast } from 'sonner';
import { crearNotificacionMasiva, getAlumnosDelProyecto, getAlumnosDelGrupo } from '../lib/notificaciones';

interface ModalCrearTareaClassroomProps {
    proyectoId: string;
    grupos: Grupo[];
    preselectedGrupoId?: string;
    onClose: () => void;
    onTareaCreada: (tarea: TareaDetallada) => void;
}

interface ArchivoLocal {
    file: File;
    preview: string;
}

export function ModalCrearTareaClassroom({ proyectoId, grupos, preselectedGrupoId, onClose, onTareaCreada }: ModalCrearTareaClassroomProps) {
    const { user } = useAuth();
    const [titulo, setTitulo] = useState('');
    const [instrucciones, setInstrucciones] = useState('');
    const [puntos, setPuntos] = useState(1);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('23:59');
    const [gruposSeleccionados, setGruposSeleccionados] = useState<string[]>(
        preselectedGrupoId ? [preselectedGrupoId] : ['todos']
    );
    const [archivos, setArchivos] = useState<ArchivoLocal[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [enlaceUrl, setEnlaceUrl] = useState('');
    const [mostrarEnlace, setMostrarEnlace] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const quillRef = useRef<ReactQuill>(null);
    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    }), []);

    const quillFormats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet'
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const nuevos = Array.from(e.target.files).map(file => ({
                file,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
            }));
            setArchivos(prev => [...prev, ...nuevos]);
        }
    };

    const removeArchivo = (index: number) => {
        setArchivos(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return '🖼️';
        if (file.type === 'application/pdf') return '📄';
        if (file.type.includes('word') || file.type.includes('document')) return '📝';
        if (file.type.includes('spreadsheet') || file.type.includes('excel')) return '📊';
        if (file.type.includes('presentation') || file.type.includes('powerpoint')) return '📊';
        return '📎';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleGuardar = async () => {
        if (!titulo.trim()) {
            toast.error('El título es obligatorio');
            return;
        }
        if (!user) return;

        setGuardando(true);

        try {
            // 1. Upload files to Supabase Storage
            const archivosSubidos: { nombre: string; url: string; tipo: string; tamano: number }[] = [];

            for (const archivo of archivos) {
                const fileName = `${Date.now()}_${archivo.file.name}`;
                const filePath = `tareas/${proyectoId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('recursos')
                    .upload(filePath, archivo.file);

                if (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    toast.error(`Error al subir ${archivo.file.name}`);
                    continue;
                }

                const { data: publicUrl } = supabase.storage
                    .from('recursos')
                    .getPublicUrl(filePath);

                archivosSubidos.push({
                    nombre: archivo.file.name,
                    url: publicUrl.publicUrl,
                    tipo: archivo.file.type,
                    tamano: archivo.file.size
                });
            }

            // Add link as attachment if provided
            if (enlaceUrl.trim()) {
                archivosSubidos.push({
                    nombre: enlaceUrl.trim(),
                    url: enlaceUrl.trim(),
                    tipo: 'link',
                    tamano: 0
                });
            }

            const tareaBase = {
                proyecto_id: proyectoId,
                titulo: titulo.trim(),
                descripcion: instrucciones.trim() || null,
                fecha_entrega: (() => {
                    if (!fecha) return null;
                    const [year, month, day] = fecha.split('-').map(Number);
                    const [h, m] = hora.split(':').map(Number);
                    return new Date(year, month - 1, day, h, m).toISOString();
                })(),
                archivos_adjuntos: archivosSubidos,
                puntos_maximos: puntos,
                creador_id: user.id,
                estado: 'pendiente'
            };

            // 2. Insert task(s) into DB
            let lastInsertedData = null;

            if (gruposSeleccionados.includes('todos')) {
                // Tarea Global
                const { data, error } = await supabase
                    .from('tareas')
                    .insert({ ...tareaBase, grupo_id: null })
                    .select()
                    .single();
                if (error) throw error;
                lastInsertedData = data;

                // Notificar a todos
                const alumnoIds = await getAlumnosDelProyecto(proyectoId);
                if (alumnoIds.length > 0) {
                    await crearNotificacionMasiva(alumnoIds, {
                        proyectoId,
                        tipo: 'tarea_asignada',
                        titulo: `Nueva tarea: "${titulo.trim()}"`,
                        descripcion: `El profesor ha asignado una nueva tarea a toda la clase. ${puntos > 0 ? `Vale ${puntos} puntos.` : ''}`,
                        metadata: { tarea_id: data.id, grupo_id: 'todos' }
                    });
                }
            } else {
                // Tareas por grupo individual (Bucle de inserción)
                for (const gid of gruposSeleccionados) {
                    const { data, error } = await supabase
                        .from('tareas')
                        .insert({ ...tareaBase, grupo_id: parseInt(gid) })
                        .select()
                        .single();
                    if (error) throw error;
                    lastInsertedData = data;

                    // Notificar por grupo
                    const gNombre = grupos.find(g => String(g.id) === gid)?.nombre || 'tu equipo';
                    const alumnoIds = await getAlumnosDelGrupo(parseInt(gid), proyectoId);
                    if (alumnoIds.length > 0) {
                        await crearNotificacionMasiva(alumnoIds, {
                            proyectoId,
                            tipo: 'tarea_asignada',
                            titulo: `Nueva tarea: "${titulo.trim()}"`,
                            descripcion: `El profesor ha asignado una nueva tarea al equipo ${gNombre}. ${puntos > 0 ? `Vale ${puntos} puntos.` : ''}`,
                            metadata: { tarea_id: data.id, grupo_id: gid }
                        });
                    }
                }
            }

            toast.success('¡Tarea o tareas creadas con éxito! 🎉');
            if (lastInsertedData) onTareaCreada(lastInsertedData);
            onClose();
        } catch (err) {
            console.error('Error creating task:', err);
            toast.error('Error al crear la tarea');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] p-0 md:p-6 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white md:rounded-[2rem] shadow-2xl w-full max-w-7xl min-h-screen md:min-h-0 md:my-8 flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200">
                                <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-lg font-black text-slate-800 tracking-tight">Tarea</span>
                        </div>
                    </div>
                    <button
                        onClick={handleGuardar}
                        disabled={guardando || !titulo.trim() || gruposSeleccionados.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        {guardando ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : null}
                        {guardando ? 'Creando...' : 'Crear tarea'}
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col md:flex-row flex-1 min-h-0">

                    {/* Left Column - Main Content */}
                    <div className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto">

                        {/* Título */}
                        <div className="relative">
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Título*"
                                className="w-full text-lg font-medium text-slate-800 bg-slate-50 border-b-2 border-blue-500 px-4 py-3 rounded-t-xl focus:outline-none focus:bg-blue-50/50 transition-all placeholder:text-slate-400"
                            />
                            {!titulo.trim() && (
                                <span className="text-[11px] text-red-400 font-bold mt-1 block px-1">*Obligatorio</span>
                            )}
                        </div>

                        {/* Instrucciones con Rich Text Editor */}
                        <div className="space-y-0 rich-text-editor">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Instrucciones de la tarea</label>
                            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-300 transition-all">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={instrucciones}
                                    onChange={setInstrucciones}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Escribe aquí los pasos para completar la tarea..."
                                    className="bg-transparent"
                                />
                            </div>
                        </div>

                        {/* Adjuntar */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-700">Adjuntar</span>
                            </div>

                            {/* Attached files preview */}
                            {archivos.length > 0 && (
                                <div className="p-4 space-y-2 border-b border-slate-100">
                                    {archivos.map((archivo, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-all">
                                            <span className="text-xl">{getFileIcon(archivo.file)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{archivo.file.name}</p>
                                                <p className="text-[11px] text-slate-400">{formatFileSize(archivo.file.size)}</p>
                                            </div>
                                            <button
                                                onClick={() => removeArchivo(idx)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Enlace adjunto */}
                            {enlaceUrl && <div className="px-4 py-2 border-b border-slate-100">
                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                    <Link2 className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-blue-700 truncate flex-1">{enlaceUrl}</span>
                                    <button onClick={() => setEnlaceUrl('')} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                </div>
                            </div>}

                            {/* Link input */}
                            {mostrarEnlace && (
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={enlaceUrl}
                                        onChange={(e) => setEnlaceUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-300"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && setMostrarEnlace(false)}
                                    />
                                    <button onClick={() => setMostrarEnlace(false)} className="text-xs text-blue-600 font-bold">OK</button>
                                </div>
                            )}

                            {/* Attachment buttons */}
                            <div className="flex items-center justify-center gap-6 p-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-all group"
                                >
                                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500">Subir</span>
                                </button>

                                <button
                                    onClick={() => setMostrarEnlace(true)}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-all group"
                                >
                                    <div className="w-11 h-11 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white shadow-md shadow-slate-200 group-hover:scale-110 transition-transform">
                                        <Link2 className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500">Enlace</span>
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                            />
                        </div>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="w-full md:w-72 bg-slate-50/80 border-t md:border-t-0 md:border-l border-slate-200 p-6 space-y-6 shrink-0">

                        {/* Para (Clase/Proyecto) */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Para</label>
                            <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-700 truncate">
                                Proyecto actual
                            </div>
                        </div>

                        {/* Asignar a - Selección Múltiple Premium */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" />
                                    Asignar a
                                </label>
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setGruposSeleccionados(['todos'])}
                                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${gruposSeleccionados.includes('todos') ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                    >
                                        Todos
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setGruposSeleccionados([])}
                                        className="text-[9px] font-black uppercase px-2 py-1 bg-slate-200 text-slate-500 rounded-md hover:bg-slate-300 transition-all"
                                    >
                                        Nada
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-2xl border-2 border-slate-100 p-2 space-y-1 max-h-[220px] overflow-y-auto shadow-sm">
                                {grupos.map(g => {
                                    const isSelected = gruposSeleccionados.includes(String(g.id)) || (gruposSeleccionados.includes('todos'));
                                    return (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => {
                                                if (gruposSeleccionados.includes('todos')) {
                                                    // Si estaba "todos", al pulsar uno individual, seleccionamos todos menos ese
                                                    const others = grupos.filter(gr => gr.id !== g.id).map(gr => String(gr.id));
                                                    setGruposSeleccionados(others);
                                                    return;
                                                }
                                                if (gruposSeleccionados.includes(String(g.id))) {
                                                    setGruposSeleccionados(prev => prev.filter(id => id !== String(g.id)));
                                                } else {
                                                    setGruposSeleccionados(prev => [...prev, String(g.id)]);
                                                }
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${
                                                isSelected 
                                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                                : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                isSelected 
                                                ? 'bg-blue-600 border-blue-600' 
                                                : 'bg-white border-slate-300'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white stroke-[4]" />}
                                            </div>
                                            <span className="text-xs font-bold truncate">📁 {g.nombre}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {gruposSeleccionados.length === 0 && (
                                <p className="text-[10px] text-amber-500 font-bold px-2">Selecciona al menos un equipo</p>
                            )}
                        </div>

                        {/* Puntos de Recompensa */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Award className="w-3.5 h-3.5" />
                                Recompensa
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={puntos}
                                onChange={(e) => setPuntos(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-slate-100 text-sm font-black text-slate-700 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-300 shadow-sm"
                                placeholder="0"
                            />
                        </div>

                        {/* Fecha de Entrega */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                Fecha límite
                            </label>
                            <div className="relative group">
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-slate-50 appearance-none shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Hora de Entrega */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Hora límite
                            </label>
                            <div className="relative group">
                                <input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-slate-50 appearance-none shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Visual Summary */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span className="font-bold">{archivos.length} archivo{archivos.length !== 1 ? 's' : ''} adjunto{archivos.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Users className="w-3.5 h-3.5" />
                                    <span className="font-bold">
                                        {gruposSeleccionados.includes('todos') 
                                            ? 'Toda la clase' 
                                            : gruposSeleccionados.length === 0 
                                                ? 'Nadie seleccionado' 
                                                : `${gruposSeleccionados.length} equipo${gruposSeleccionados.length !== 1 ? 's' : ''}`
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Award className="w-3.5 h-3.5" />
                                    <span className="font-bold">{puntos} puntos de tarea</span>
                                </div>
                                {fecha && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="font-bold">{new Date(`${fecha}T${hora}`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

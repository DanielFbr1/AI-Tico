import { useState, useRef } from 'react';
import { X, Upload, Link2, FileText, Calendar, Clock, Users, Award, Paperclip, Trash2, Bold, Italic, Underline, List, Strikethrough } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Grupo, TareaDetallada } from '../types';
import { toast } from 'sonner';

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
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>(preselectedGrupoId || 'todos');
    const [archivos, setArchivos] = useState<ArchivoLocal[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [enlaceUrl, setEnlaceUrl] = useState('');
    const [mostrarEnlace, setMostrarEnlace] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Función para insertar formato en el textarea
    const insertFormatting = (prefix: string, suffix: string = prefix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = instrucciones;
        const selectedText = text.substring(start, end);
        const before = text.substring(0, start);
        const after = text.substring(end);
        const newText = `${before}${prefix}${selectedText || 'texto'}${suffix}${after}`;
        setInstrucciones(newText);
        // Reposicionar cursor
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = selectedText 
                ? start + prefix.length + selectedText.length + suffix.length
                : start + prefix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

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

            // 2. Insert task into DB
            const tareaData = {
                proyecto_id: proyectoId,
                grupo_id: grupoSeleccionado !== 'todos' ? parseInt(grupoSeleccionado) : null,
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

            const { data, error } = await supabase
                .from('tareas')
                .insert(tareaData)
                .select()
                .single();

            if (error) throw error;

            toast.success('¡Tarea creada con éxito! 🎉');
            onTareaCreada(data);
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
            <div className="bg-white md:rounded-[2rem] shadow-2xl w-full max-w-5xl min-h-screen md:min-h-0 md:my-8 flex flex-col overflow-hidden relative">

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
                        disabled={guardando || !titulo.trim()}
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

                        {/* Instrucciones */}
                        <div className="space-y-0">
                            <textarea
                                ref={textareaRef}
                                value={instrucciones}
                                onChange={(e) => setInstrucciones(e.target.value)}
                                placeholder="Instrucciones (opcional)"
                                rows={6}
                                className="w-full text-sm text-slate-600 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                            />
                            {/* Formatting Toolbar */}
                            <div className="flex items-center gap-1 px-2 py-2 bg-slate-50 rounded-b-xl border border-t-0 border-slate-200 -mt-3">
                                <button type="button" onClick={() => insertFormatting('**')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors" title="Negrita">
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => insertFormatting('*')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors" title="Cursiva">
                                    <Italic className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => insertFormatting('<u>', '</u>')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors" title="Subrayado">
                                    <Underline className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => insertFormatting('\n- ', '')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors" title="Lista">
                                    <List className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => insertFormatting('~~')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors" title="Tachado">
                                    <Strikethrough className="w-4 h-4" />
                                </button>
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

                        {/* Asignar a */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Asignar a</label>
                            <select
                                value={grupoSeleccionado}
                                onChange={(e) => setGrupoSeleccionado(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                <option value="todos">👥 Todos los alumnos</option>
                                {grupos.map(g => (
                                    <option key={g.id} value={String(g.id)}>📁 {g.nombre}</option>
                                ))}
                            </select>
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
                                    <span className="font-bold">{grupoSeleccionado === 'todos' ? 'Todos los alumnos' : grupos.find(g => String(g.id) === grupoSeleccionado)?.nombre || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Award className="w-3.5 h-3.5" />
                                    <span className="font-bold">{puntos} puntos de misión</span>
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

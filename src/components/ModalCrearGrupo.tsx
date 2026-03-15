import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, Check, UserPlus, Loader2 } from 'lucide-react';
import { Grupo } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ModalCrearGrupoProps {
  onClose: () => void;
  onCrear: (grupo: Omit<Grupo, 'id'>) => void;
  grupoEditando?: Grupo | null;
  proyectoId?: string;
  codigoSala?: string;
}

const departamentos = [
  { nombre: 'Guion', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: '✍️' },
  { nombre: 'Locución', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '🎤' },
  { nombre: 'Edición', color: 'bg-green-100 text-green-700 border-green-300', icon: '🎬' },
  { nombre: 'Diseño Gráfico', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '🎨' },
  { nombre: 'Vestuario/Arte', color: 'bg-pink-100 text-pink-700 border-pink-300', icon: '👗' },
  { nombre: 'Coordinación', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: '📋' }
];

export function ModalCrearGrupo({ onClose, onCrear, grupoEditando, proyectoId, codigoSala }: ModalCrearGrupoProps) {
  const [nombre, setNombre] = useState(grupoEditando?.nombre || '');
  const [descripcion, setDescripcion] = useState(grupoEditando?.descripcion || '');
  const [miembros, setMiembros] = useState<string[]>(grupoEditando?.miembros || []);
  const [nuevoMiembro, setNuevoMiembro] = useState('');
  const [alumnosClase, setAlumnosClase] = useState<any[]>([]); // Usamos any[] para simplificar la transición de AlumnoConectado a Perfil
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);

  useEffect(() => {
    if (codigoSala) {
      fetchAlumnosClase();
    }
  }, [codigoSala]);

  const fetchAlumnosClase = async () => {
    setLoadingAlumnos(true);
    try {
      // Ahora buscamos a todos los alumnos registrados en este proyecto (por código de sala)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, rol')
        .eq('codigo_sala', codigoSala)
        .eq('rol', 'alumno');

      if (error) throw error;
      setAlumnosClase(data || []);
    } catch (err) {
      console.error('Error fetching class students:', err);
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const handleAgregarMiembro = () => {
    const trimmed = nuevoMiembro.trim();
    if (trimmed) {
      // Búsqueda case-insensitive para evitar duplicados en la lista de miembros
      const alreadyExists = miembros.some(m => m.toLowerCase() === trimmed.toLowerCase());
      if (!alreadyExists) {
        setMiembros([...miembros, trimmed]);
        setNuevoMiembro('');
      } else {
        toast.error('Este alumno ya está en el equipo');
      }
    }
  };

  const handleToggleMiembroOnline = (nombreAlumno: string) => {
    const normalizedName = nombreAlumno.trim();
    const isMember = miembros.some(m => m.toLowerCase() === normalizedName.toLowerCase());

    if (isMember) {
      setMiembros(miembros.filter(m => m.toLowerCase() !== normalizedName.toLowerCase()));
    } else {
      setMiembros([...miembros, normalizedName]);
    }
  };

  const handleEliminarMiembro = (index: number) => {
    setMiembros(miembros.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim() && miembros.length > 0) {
      onCrear({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        miembros,
        estado: grupoEditando?.estado || 'En progreso',
        progreso: grupoEditando?.progreso || 0,
        interacciones_ia: grupoEditando?.interacciones_ia || 0
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-none md:rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[85vh] overflow-hidden flex flex-col relative">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-6 md:p-8 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                <Users className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight">
                  {grupoEditando ? 'Editar Grupo' : 'Crear Nuevo Grupo'}
                </h2>
                <p className="text-[10px] md:text-sm text-blue-100 font-bold uppercase tracking-widest opacity-80">Define los detalles y miembros del equipo</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all md:absolute md:top-6 md:right-6">
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pb-32 md:pb-8">
          <div className="space-y-6 md:space-y-8">
            {/* Nombre del grupo */}
            <div className="group">
              <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">
                Nombre del Grupo / Proyecto
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 text-sm md:text-base outline-none"
                placeholder="Ej: Equipo Alpha..."
                autoFocus
              />
            </div>

            {/* Descripción del Grupo (Opcional) */}
            <div className="group">
              <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">
                Descripción del Proyecto (Opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-600 text-sm md:text-base min-h-[120px] md:min-h-[150px] resize-none outline-none"
                placeholder="¿Qué objetivos tiene este equipo?"
              />
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Buscador / Añadidor Manual */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                Añadir Alumno manualmente
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoMiembro}
                  onChange={(e) => setNuevoMiembro(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarMiembro())}
                  className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 text-sm outline-none"
                  placeholder="Nombre del alumno..."
                />
                <button
                  type="button"
                  onClick={handleAgregarMiembro}
                  disabled={!nuevoMiembro.trim()}
                  className="px-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Selección de Alumnos Registrados */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                  Alumnos en la Sala ({codigoSala})
                </div>
                <button 
                  type="button" 
                  onClick={fetchAlumnosClase}
                  className="text-[9px] text-emerald-600 hover:text-emerald-700 underline font-black uppercase tracking-tighter"
                >
                  Actualizar lista
                </button>
              </label>
              <div className="bg-emerald-50/50 rounded-[2rem] p-4 md:p-6 border-2 border-emerald-100/50 min-h-[120px]">
                {loadingAlumnos ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                ) : alumnosClase.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {alumnosClase.map((alumno: any) => {
                      const isSelected = miembros.some(m => m.toLowerCase() === alumno.nombre.toLowerCase());
                      return (
                        <button
                          key={alumno.id}
                          type="button"
                          onClick={() => handleToggleMiembroOnline(alumno.nombre)}
                          className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl border-2 transition-all text-[11px] md:text-xs font-black uppercase tracking-wider flex items-center gap-2 active:scale-95 ${isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200'
                            : 'bg-white text-emerald-700 border-white hover:border-emerald-200'
                            }`}
                        >
                          {isSelected && <Check className="w-3 md:w-4 h-3 md:h-4" />}
                          {alumno.nombre}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4">
                    <p className="text-emerald-700/60 text-[11px] md:text-xs font-black uppercase tracking-widest leading-relaxed">No hay alumnos registrados con el código todavía.</p>
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-emerald-100 flex justify-center">
                  <span className="text-[9px] md:text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] animate-pulse italic">✨ Toca para añadir</span>
                </div>
              </div>
            </div>

            {/* Lista de Miembros seleccionados */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                <span>Equipo Seleccionado</span>
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg text-[9px] md:text-[10px]">{miembros.length} Miembros</span>
              </label>
              <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-3 md:p-4 min-h-[100px] max-h-[180px] md:max-h-[220px] overflow-y-auto space-y-2 custom-scrollbar">
                {miembros.map((miembro, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 shadow-sm rounded-xl group transition-all animate-in slide-in-from-left-2 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black">
                        {index + 1}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{miembro}</span>
                    </div>
                    <button type="button" onClick={() => handleEliminarMiembro(index)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {miembros.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                    <Users className="w-6 h-6 text-slate-200 mb-2" />
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed px-4">Selecciona alumnos arriba para formar el equipo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form >

        {/* Footer Adaptado */}
        <div className="p-4 md:p-8 border-t border-slate-100 bg-white/80 backdrop-blur-md absolute bottom-0 left-0 right-0 md:relative shrink-0 flex items-center gap-3 md:gap-4 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-4 text-slate-500 font-black text-[11px] md:text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl md:min-w-[140px] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nombre.trim() || miembros.length === 0}
            className="flex-[2] md:flex-none px-8 md:px-12 py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100 transition-all flex items-center justify-center gap-3"
          >
            <Check className="w-5 h-5" />
            <span>{grupoEditando ? 'Guardar Cambios' : 'Crear Equipo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
import { X, Award, TrendingUp, MessageSquare, Target, Brain, CheckCircle2, AlertCircle, Trophy, Star, Calendar, Clock, Flame, Users, FileText, Lightbulb, Pencil, Save, Info, Loader2, Plus, Trash2 } from 'lucide-react';
import { Grupo, Rubrica } from '../types';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { fetchPuntosProyecto } from '../lib/puntos';
import { crearNotificacion, getAlumnoIdByName } from '../lib/notificaciones';

interface PerfilAlumnoProps {
  alumno: string;
  grupo: Grupo;
  onClose: () => void;
  rubrica?: Rubrica;
}

interface EvaluacionIndividual {
  nombre: string;
  puntos: number;
  comentario: string;
}

interface ComentarioAlumno {
  id: string;
  contenido: string;
  created_at: string;
  autor_id?: string;
}

export function PerfilAlumno({ alumno, grupo, onClose, rubrica }: PerfilAlumnoProps) {
  const [asistenciaStats, setAsistenciaStats] = useState({ present: 0, total: 0, percentage: 100 });
  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<EvaluacionIndividual[]>([]);
  const [notaGrupal, setNotaGrupal] = useState<number | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioAlumno[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isSavingComentario, setIsSavingComentario] = useState(false);
  const [puntosTotales, setPuntosTotales] = useState<number>(0);
  const [tareasAlumno, setTareasAlumno] = useState<any[]>([]);
  const [entregasTareas, setEntregasTareas] = useState<any[]>([]);

  useEffect(() => {
    fetchEvaluacion();
    fetchAsistenciaData();
    fetchNotaGrupal();
    fetchComentarios();
    fetchMisPuntos();
    fetchTareasData();
  }, [alumno, grupo.id]);

  const fetchMisPuntos = async () => {
    try {
      const puntosProyecto = await fetchPuntosProyecto(grupo.proyecto_id!);
      const match = puntosProyecto.find((p: any) => p.alumno_nombre === alumno);
      setPuntosTotales(match ? match.puntos : 0);
    } catch (e) {
      console.error("Error fetching points:", e);
    }
  };

  const fetchComentarios = async () => {
    try {
      const { data, error } = await supabase
        .from('comentarios_alumno')
        .select('*')
        .eq('proyecto_id', grupo.proyecto_id)
        .eq('alumno_nombre', alumno)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComentarios(data || []);
    } catch (e) {
      console.error("Error fetching comments:", e);
    }
  };

  const handleSaveComentario = async () => {
    if (!nuevoComentario.trim()) return;
    setIsSavingComentario(true);
    try {
      const { error } = await supabase
        .from('comentarios_alumno')
        .insert({
          proyecto_id: grupo.proyecto_id,
          alumno_nombre: alumno,
          contenido: nuevoComentario
        });

      if (error) throw error;
      toast.success("Comentario añadido");
      setNuevoComentario('');
      fetchComentarios();

      // Enviar Notificación al Alumno
      if (grupo.proyecto_id) {
          const alumnoId = await getAlumnoIdByName(alumno, grupo.proyecto_id);
          if (alumnoId) {
              await crearNotificacion({
                  userId: alumnoId,
                  proyectoId: grupo.proyecto_id,
                  tipo: 'notas_actualizadas',
                  titulo: '¡Nueva observación del profesor!',
                  descripcion: `Tu profesor ha añadido una nota en tu historial.`,
                  metadata: { view: 'perfil' }
              });
          }
      }
    } catch (e) {
      console.error("Error saving comment:", e);
      toast.error("Error al guardar comentario");
    } finally {
      setIsSavingComentario(false);
    }
  };

  const handleDeleteComentario = async (id: string) => {
    if (!confirm("¿Borrar este comentario?")) return;
    try {
      const { error } = await supabase
        .from('comentarios_alumno')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Comentario eliminado");
      setComentarios(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error("Error deleting comment:", e);
      toast.error("Error al eliminar");
    }
  };

  const fetchNotaGrupal = async () => {
    try {
      const { data } = await supabase
        .from('evaluaciones_grupales')
        .select('nota_final')
        .eq('grupo_id', grupo.id)
        .eq('proyecto_id', grupo.proyecto_id)
        .single();

      if (data) setNotaGrupal(data.nota_final);
    } catch (e) {
      console.error("Error fetching group grade:", e);
    }
  };

  const fetchAsistenciaData = async () => {
    try {
      const { data: allFechas } = await supabase
        .from('asistencia')
        .select('fecha')
        .eq('proyecto_id', grupo.proyecto_id);

      const uniqueDays = new Set(allFechas?.map(f => f.fecha)).size;

      const { count: presentCount } = await supabase
        .from('asistencia')
        .select('*', { count: 'exact', head: true })
        .eq('proyecto_id', grupo.proyecto_id)
        .eq('alumno_nombre', alumno)
        .eq('presente', true);

      const pCount = presentCount || 0;
      const total = uniqueDays || 1;

      setAsistenciaStats({
        present: pCount,
        total: uniqueDays,
        percentage: Math.round((pCount / total) * 100)
      });
    } catch (e) {
      console.error("Error fetching asistencia:", e);
    }
  };

  const fetchTareasData = async () => {
    try {
      const { data: tareas } = await supabase
        .from('tareas')
        .select('*')
        .eq('proyecto_id', grupo.proyecto_id)
        .or(`grupo_id.eq.${grupo.id},grupo_id.is.null`);
      
      setTareasAlumno(tareas || []);

      const { data: entregas } = await supabase
        .from('entregas_tareas')
        .select('*')
        .eq('grupo_id', grupo.id);
      
      setEntregasTareas(entregas || []);
    } catch (e) {
      console.error("Error fetching tasks data:", e);
    }
  };

  const fetchEvaluacion = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('alumno_nombre', alumno)
        .eq('proyecto_id', grupo.proyecto_id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching evaluation:', error);
      }

      if (data && data.criterios) {
        const normalizedCriterios = data.criterios.map((c: any) => ({
          nombre: c.nombre || c.criterio,
          puntos: Number(c.puntos),
          comentario: c.comentario || ''
        }));
        setEvaluacion(normalizedCriterios);
        return normalizedCriterios;
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getNivelFromPuntos = (puntos: number | string) => {
    const p = Number(puntos);
    if (p >= 9) return 'Sobresaliente';
    if (p >= 7) return 'Notable';
    if (p >= 5) return 'Suficiente';
    return 'Insuficiente';
  };

  const horasReales = grupo.tiempo_uso_minutos
    ? (grupo.tiempo_uso_minutos / 60).toFixed(1)
    : "0.0";

  const notaMedia = evaluacion.length > 0
    ? evaluacion.reduce((sum, e) => sum + Number(e.puntos || 0), 0) / evaluacion.length
    : 0;

  const tareasCompletadasTareas = tareasAlumno.filter(t => t.estado === 'aprobado' || t.estado === 'completado').length;
  const totalTareasTareas = tareasAlumno.length;

  const notasTareas = tareasAlumno.map(t => {
    if (t.grupo_id !== null) {
      return (t.estado === 'aprobado' || t.estado === 'completado') ? t.puntos_maximos : 0;
    } else {
      const entrega = entregasTareas.find(e => e.tarea_id === t.id);
      return entrega?.calificacion || 0;
    }
  });

  const notaMediaTareas = notasTareas.length > 0 
    ? notasTareas.reduce((sum, n) => sum + n, 0) / notasTareas.length 
    : 0;

  const getNivelColor = (puntos: number | string) => {
    const nivel = getNivelFromPuntos(puntos);
    switch (nivel) {
      case 'Sobresaliente': return 'bg-green-600 text-white';
      case 'Notable': return 'bg-blue-600 text-white';
      case 'Suficiente': return 'bg-yellow-600 text-white';
      case 'Insuficiente': return 'bg-red-600 text-white';
    }
  };

  const getBarColor = (puntos: number | string) => {
    const nivel = getNivelFromPuntos(puntos);
    switch (nivel) {
      case 'Sobresaliente': return 'bg-green-600';
      case 'Notable': return 'bg-blue-600';
      case 'Suficiente': return 'bg-yellow-600';
      case 'Insuficiente': return 'bg-red-600';
    }
  };

  const getNivelIcon = (puntos: number | string) => {
    const nivel = getNivelFromPuntos(puntos);
    switch (nivel) {
      case 'Sobresaliente': return <Trophy className="w-4 h-4" />;
      case 'Notable': return <CheckCircle2 className="w-4 h-4" />;
      case 'Suficiente': return <Star className="w-4 h-4" />;
      case 'Insuficiente': return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getDepartamentoColor = (departamento: string) => {
    const colores: { [key: string]: string } = {
      'Guion': 'from-purple-600 to-purple-800',
      'Locución': 'from-blue-600 to-blue-800',
      'Edición': 'from-green-600 to-green-800',
      'Diseño Gráfico': 'from-orange-600 to-orange-800',
      'Vestuario/Arte': 'from-pink-600 to-pink-800',
      'Coordinación': 'from-indigo-600 to-indigo-800'
    };
    return colores[departamento] || 'from-gray-600 to-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-[98vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col transform transition-all scale-100 border border-white/20">
        <div className={`bg-gradient-to-r ${getDepartamentoColor('General')} text-white relative overflow-hidden shrink-0`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl"></div>

          <div className="relative z-10 px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-2xl md:text-3xl font-black border-2 border-white/20 shrink-0">
                <span className={`bg-gradient-to-br ${getDepartamentoColor('General')} bg-clip-text text-transparent`}>
                  {alumno.charAt(0).toUpperCase()}
                </span>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-black drop-shadow-sm tracking-tight leading-none mb-1">{alumno}</h2>
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-white/80">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {grupo.nombre}</span>
                  <span>•</span>
                  <span>General</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="bg-white/10 rounded-2xl px-4 md:px-5 py-1.5 md:py-2 backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center min-w-[80px] md:min-w-[100px]">
                <div className="text-white/70 text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none mb-1">Nota Grupal</div>
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-2xl md:text-3xl font-black tracking-tighter shadow-black drop-shadow-md">{notaMedia.toFixed(1)}</span>
                  <span className="text-[10px] md:text-xs font-bold opacity-60">/10</span>
                </div>
              </div>

              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm text-white border border-white/10 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f9fc]">
          <div className="max-w-[100%] mx-auto flex flex-col gap-6 md:gap-8">
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-5 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Rendimiento Clave
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-none mb-1">{asistenciaStats.percentage}%</div>
                    <div className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Asist.</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center text-pink-600 shrink-0">
                    <Clock className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-none mb-1">{horasReales}h</div>
                    <div className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Tiempo</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                    <Award className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-none mb-1">{tareasCompletadasTareas}/{totalTareasTareas}</div>
                    <div className="text-[8px] md:text-xs font-bold text-amber-500 uppercase tracking-wider leading-none">Tareas</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-fuchsia-50 rounded-xl md:rounded-2xl flex items-center justify-center text-fuchsia-600 shrink-0 shadow-sm">
                    <TrendingUp className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-3xl lg:text-4xl font-black text-fuchsia-600 leading-none mb-1">{notaMediaTareas.toFixed(1)}</div>
                    <div className="text-[8px] md:text-xs font-bold text-fuchsia-500 uppercase tracking-wider leading-none">Media Tar.</div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-4 md:p-6 shadow-sm border border-indigo-200 flex items-center gap-3 md:gap-4 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                    <Star className="w-5 h-5 md:w-8 md:h-8" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl md:text-3xl lg:text-4xl font-black text-indigo-600 leading-none mb-1">{puntosTotales}</div>
                    <div className="text-[8px] md:text-xs font-bold text-indigo-500 uppercase tracking-wider leading-none">Puntos</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
              {/* EVALUACIÓN POR RÚBRICA */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <Target className="w-6 h-6 text-indigo-600" />
                  Evaluación Rúbrica
                </h3>

                {loading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evaluacion.length > 0 ? (
                      evaluacion.map((item, index) => (
                        <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <h4 className="font-bold text-slate-700 text-sm leading-tight">{item.nombre}</h4>
                            <div className="text-right">
                              <span className="text-xl font-black text-slate-900 leading-none">{Number(item.puntos).toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400 font-bold ml-0.5">/10</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${getBarColor(item.puntos)} transition-all duration-700`} style={{ width: `${Number(item.puntos) * 10}%` }}></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-40">
                        <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Sin datos de rúbrica</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CALIFICACIONES DE TAREAS (TAREAS) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <Award className="w-6 h-6 text-amber-500" />
                  Tareas y Notas
                </h3>

                <div className="space-y-3">
                  {tareasAlumno.map((tarea, index) => {
                    const entrega = entregasTareas.find(e => e.tarea_id === tarea.id);
                    const nota = tarea.grupo_id !== null
                      ? ((tarea.estado === 'aprobado' || tarea.estado === 'completado') ? tarea.puntos_maximos : 0)
                      : (entrega?.calificacion || 0);

                    const isAprobado = tarea.estado === 'aprobado' || tarea.estado === 'completado' || (entrega && entrega.calificacion >= 5);

                    return (
                      <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isAprobado ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          {isAprobado ? <CheckCircle2 className="w-6 h-6" /> : <Award className="w-6 h-6 opacity-40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight truncate mb-1">{tarea.titulo}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest ${tarea.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : tarea.estado === 'revisar' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {tarea.estado || 'Pendiente'}
                            </span>
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none opacity-60">• {tarea.grupo_id ? 'Grupal' : 'Indiv.'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 bg-white px-2 py-1 rounded-lg border border-slate-100">
                          <div className={`text-lg font-black leading-none ${nota >= 9 ? 'text-emerald-600' : nota >= 7 ? 'text-blue-600' : nota >= 5 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {Number(nota).toFixed(1)}
                          </div>
                          <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Ptos</div>
                        </div>
                      </div>
                    );
                  })}

                  {tareasAlumno.length === 0 && (
                    <div className="text-center py-10 opacity-40">
                      <Plus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Sin tareas asignadas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* OBSERVACIONES Y NOTAS PRIVADAS */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <FileText className="w-6 h-6 text-purple-600" />
                  Observaciones
                </h3>

                <div className="mb-6">
                  <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Escribe una observación privada sobre el alumno..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all text-sm font-medium"
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{comentarios.length} notas guardadas</span>
                    <button
                      onClick={handleSaveComentario}
                      disabled={!nuevoComentario.trim() || isSavingComentario}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200 text-sm"
                    >
                      {isSavingComentario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Guardar
                    </button>
                  </div>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {comentarios.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Sin observaciones</p>
                    </div>
                  ) : (
                    comentarios.map((comentario) => (
                      <div key={comentario.id} className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 relative group animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-gray-700 font-medium text-sm leading-relaxed whitespace-pre-wrap">{comentario.contenido}</p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-yellow-100/50">
                          <span className="text-[10px] uppercase font-bold text-yellow-600/60">
                            {new Date(comentario.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteComentario(comentario.id)}
                            className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-8 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all font-black text-lg shadow-xl active:scale-[0.98] uppercase tracking-widest"
          >
            Cerrar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}
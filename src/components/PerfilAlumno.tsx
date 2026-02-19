import { X, Award, TrendingUp, MessageSquare, Target, Brain, CheckCircle2, AlertCircle, Trophy, Star, Calendar, Clock, Flame, Users, FileText, Lightbulb, Pencil, Save, Info, Loader2, Plus, Trash2 } from 'lucide-react';
import { Grupo, Rubrica } from '../types';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchEvaluacion();
    fetchAsistenciaData();
    fetchNotaGrupal();
    fetchComentarios();
  }, [alumno, grupo.id]);

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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100">
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

        <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fc]">
          <div className="max-w-4xl mx-auto flex flex-col gap-10">
            <section>
              <h3 className="text-lg font-black text-slate-800 mb-5 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Rendimiento Clave
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-white rounded-2xl p-3 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-5 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Users className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <div className="text-xl md:text-4xl font-black text-slate-900 leading-none mb-1">{notaGrupal !== null ? notaGrupal : '-'}</div>
                    <div className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Nota Grupal</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-5 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <div className="text-xl md:text-4xl font-black text-slate-900 leading-none mb-1">{asistenciaStats.percentage}%</div>
                    <div className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Asist.</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-5 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-purple-50 rounded-xl md:rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
                    <MessageSquare className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <div className="text-xl md:text-4xl font-black text-slate-900 leading-none mb-1">{Math.floor(grupo.interacciones_ia / Math.max(1, grupo.miembros.length))}</div>
                    <div className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">IA</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 md:p-6 shadow-sm border border-slate-200 flex items-center gap-3 md:gap-5 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center text-pink-600 shrink-0">
                    <Clock className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <div className="text-xl md:text-4xl font-black text-slate-900 leading-none mb-1">{horasReales}h</div>
                    <div className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Tiempo</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* EVALUACIÓN */}
              <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Evaluación del Proyecto
                </h3>

                {loading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-bold">Cargando criterios...</p>
                  </div>
                ) : evaluacion.length > 0 ? (
                  <div className="space-y-5">
                    {evaluacion.map((item, index) => {
                      const cleanComment = (item.comentario || '').replace('Nota sincronizada con grupo: ', '').trim();
                      const hasComment = cleanComment.length > 0;

                      return (
                        <div key={index} className={`bg-gray-50 rounded-xl border-2 border-gray-200 transition-all hover:bg-white hover:shadow-md ${hasComment ? 'p-4 md:p-6' : 'p-3 md:p-4 items-center'}`}>
                          <div className={`flex flex-col md:flex-row justify-between ${hasComment ? 'items-start' : 'items-center'} gap-4`}>
                            <div className="flex-1 w-full md:mr-6">
                              <h4 className={`font-bold text-gray-900 text-lg ${hasComment ? 'mb-2' : 'mb-0'}`}>{item.nombre}</h4>
                              {hasComment && (
                                <p className="text-gray-700 font-medium text-base leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-sm inline-block">
                                  {cleanComment}
                                </p>
                              )}
                            </div>

                            <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 min-w-full md:min-w-[120px]">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] md:text-xs font-bold rounded-lg shadow-sm border border-white/20 uppercase tracking-wider ${getNivelColor(item.puntos)}`}>
                                {getNivelIcon(item.puntos)}
                                <span className="hidden sm:inline">{getNivelFromPuntos(item.puntos)}</span>
                                <span className="sm:hidden">{getNivelFromPuntos(item.puntos).slice(0, 4)}.</span>
                              </span>
                              <div className="text-2xl md:text-3xl font-black text-gray-900 leading-none flex items-baseline gap-1">
                                {Number(item.puntos).toFixed(1)}
                                <span className="text-xs md:text-sm text-gray-400 font-bold">/10</span>
                              </div>
                            </div>
                          </div>

                          {hasComment && (
                            <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden mt-4">
                              <div
                                className={`h-full transition-all duration-500 ${getBarColor(item.puntos)}`}
                                style={{ width: `${(Number(item.puntos) / 10) * 100}%` }}
                              />
                            </div>
                          )}
                          {!hasComment && (
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
                              <div
                                className={`h-full transition-all duration-500 opacity-50 ${getBarColor(item.puntos)}`}
                                style={{ width: `${(Number(item.puntos) / 10) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-blue-50 p-8 rounded-3xl border-2 border-dashed border-blue-200 text-center">
                    <Info className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                    <p className="text-blue-900 font-bold">El grupo aún no ha sido evaluado.</p>
                  </div>
                )}
              </div>

              {/* COMENTARIOS Y OBSERVACIONES */}
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-purple-600" />
                    Observaciones y Notas
                  </h3>

                  <div className="mb-6">
                    <textarea
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      placeholder="Escribe una observación privada sobre el alumno..."
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all text-sm font-medium"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSaveComentario}
                        disabled={!nuevoComentario.trim() || isSavingComentario}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
                      >
                        {isSavingComentario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Nota
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {comentarios.length === 0 ? (
                      <div className="text-center py-10 opacity-50">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-bold text-gray-400">Sin observaciones registradas</p>
                      </div>
                    ) : (
                      comentarios.map((comentario) => (
                        <div key={comentario.id} className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 relative group animate-in fade-in slide-in-from-bottom-2">
                          <p className="text-gray-700 font-medium text-sm leading-relaxed whitespace-pre-wrap">{comentario.contenido}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-yellow-100/50">
                            <span className="text-[10px] uppercase font-bold text-yellow-600 opacity-60">
                              {new Date(comentario.created_at).toLocaleDateString()} • {new Date(comentario.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => handleDeleteComentario(comentario.id)}
                              className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Eliminar nota"
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
        </div>

        <div className="bg-white px-8 py-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-6 py-5 bg-gray-900 text-white rounded-3xl hover:bg-black transition-all font-black text-xl shadow-xl active:scale-[0.98]"
          >
            CERRAR PERFIL
          </button>
        </div>
      </div>
    </div>
  );
}
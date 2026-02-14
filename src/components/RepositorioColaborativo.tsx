import { FileText, Video, Music, Image as ImageIcon, Download, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Recurso, Grupo } from '../types';
import { RecursoCard } from './RecursoCard';


interface RepositorioColaborativoProps {
  grupo: Grupo;
  todosLosGrupos: Grupo[];
  esDocente?: boolean;
  mostrarEjemplo?: boolean;
  className?: string; // Permitir estilos extra
  filterByGroupId?: string | number;
  hideTitle?: boolean;
  proyectoId?: string | number;
  refreshTrigger?: any;
}

// Recursos de ejemplo
const recursosEjemplo: Recurso[] = [
  {
    id: 'rec1',
    grupoId: 1,
    grupoNombre: 'Grupo 1 – Guion',
    tipo: 'texto',
    titulo: 'Plantilla de Escaleta Radiofónica',
    descripcion: 'Estructura básica para organizar los tiempos y secciones del programa de radio.',
    contenido: '1. SINTONÍA DE APERTURA (20")\n2. PRESENTACIÓN LOCUTORES (15")\n3. TITULARES DEL DÍA (40")\n4. ENTREVISTA PRINCIPAL (3\'00")\n5. SECCIÓN DE DEPORTES (1\'30")\n6. SINTONÍA DE CIERRE (20")',
    fechaSubida: new Date()
  },
  {
    id: 'rec2',
    grupoId: 2,
    grupoNombre: 'Grupo 2 – Locución',
    tipo: 'audio',
    titulo: 'Ejemplo de Entonación Noticiosa',
    descripcion: 'Grabación de prueba mostrando cómo enfatizar los verbos en una noticia de impacto.',
    fechaSubida: new Date(Date.now() - 86400000)
  },
  {
    id: 'rec3',
    grupoId: 3,
    grupoNombre: 'Grupo 3 – Edición',
    tipo: 'video',
    titulo: 'Tutorial: Efecto de "Fading" en Audacity',
    descripcion: 'Videotutorial corto sobre cómo suavizar las entradas y salidas de música.',
    fechaSubida: new Date(Date.now() - 172800000)
  }
];

// ...
export function RepositorioColaborativo({ grupo, mostrarEjemplo = false, className = '', esDocente = false, filterByGroupId, hideTitle = false, proyectoId, refreshTrigger }: RepositorioColaborativoProps) {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<Recurso | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // ...

  useEffect(() => {
    if (mostrarEjemplo) {
      setRecursos((recursosEjemplo as unknown) as Recurso[]);
    } else {
      const fetchRecursos = async () => {
        try {
          // Fetch de recursos reales
          let query = supabase
            .from('recursos')
            .select('*')
            .order('created_at', { ascending: false });

          if (proyectoId) {
            query = query.eq('proyecto_id', proyectoId);
          }

          if (filterByGroupId) {
            query = query.eq('grupo_id', filterByGroupId);
          }

          const { data, error } = await query;

          if (error) throw error;

          const recursosMapeados: Recurso[] = (data || []).map(r => ({
            id: r.id,
            grupoId: r.grupo_id,
            grupoNombre: r.grupo_nombre,
            tipo: r.tipo as any,
            titulo: r.titulo,
            descripcion: r.descripcion,
            fechaSubida: new Date(r.created_at),
            url: r.url,
            contenido: r.contenido,
            usuario_id: r.usuario_id
          }));

          setRecursos(recursosMapeados);
        } catch (err) {
          console.error("Error fetching resources:", err);
          toast.error("Error al cargar recursos compartidos");
        }
      };

      fetchRecursos();

      // Suscripción a cambios en tiempo real
      const channel = supabase
        .channel(`recursos_db_${filterByGroupId || proyectoId || 'all'}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'recursos',
            filter: filterByGroupId ? `grupo_id=eq.${filterByGroupId}` : (proyectoId ? `proyecto_id=eq.${proyectoId}` : undefined)
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const r = payload.new;
              if (filterByGroupId && String(r.grupo_id) !== String(filterByGroupId)) return;
              if (proyectoId && String(r.proyecto_id) !== String(proyectoId)) return;

              const nuevo: Recurso = {
                id: r.id,
                grupoId: r.grupo_id,
                grupoNombre: r.grupo_nombre,
                tipo: r.tipo as any,
                titulo: r.titulo,
                descripcion: r.descripcion,
                fechaSubida: new Date(r.created_at),
                url: r.url,
                contenido: r.contenido,
                usuario_id: r.usuario_id
              };
              setRecursos(prev => [nuevo, ...prev]);
              if (!esDocente) toast("¡Nuevo recurso!");
            }
            if (payload.eventType === 'DELETE') {
              setRecursos(prev => prev.filter(r => r.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [mostrarEjemplo, filterByGroupId, proyectoId, refreshTrigger]);

  const handleDescargar = async (recurso: Recurso) => {
    if (recurso.tipo === 'texto' && recurso.contenido) {
      const blob = new Blob([recurso.contenido], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recurso.titulo}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Descarga iniciada');
    } else if (recurso.url) {
      try {
        const response = await fetch(recurso.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const ext = recurso.url.split('.').pop() || 'dat';
        a.download = `${recurso.titulo}.${ext}`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Descarga iniciada');
      } catch (e) {
        console.error("Download error", e);
        window.open(recurso.url, '_blank');
      }
    }
  };

  const handleBorrarRecurso = async (recurso: Recurso) => {
    if (!mostrarEjemplo && !recurso.usuario_id) return;

    if (confirm("¿Estás seguro de que quieres borrar este recurso? Esta acción no se puede deshacer.")) {
      try {
        if (mostrarEjemplo) {
          setRecursos(recursos.filter(r => r.id !== recurso.id));
          if (recursoSeleccionado?.id === recurso.id) setRecursoSeleccionado(null);
          toast.success("Recurso borrado (Simulación)");
          return;
        }

        if (recurso.url) {
          const urlObj = new URL(recurso.url);
          const pathParts = urlObj.pathname.split('/recursos/');
          if (pathParts[1]) {
            const storagePath = pathParts[1];
            await supabase.storage.from('recursos').remove([storagePath]);
          }
        }

        const { error } = await supabase
          .from('recursos')
          .delete()
          .eq('id', recurso.id);

        if (error) throw error;

        setRecursos(prev => prev.filter(r => r.id !== recurso.id));
        if (recursoSeleccionado?.id === recurso.id) setRecursoSeleccionado(null);
        toast.success("Recurso eliminado correctamente");

      } catch (error: any) {
        console.error("Error deleting:", error);
        toast.error("Error al borrar: " + error.message);
      }
    }
  };

  const getTipoIcon = (tipo: Recurso['tipo']) => {
    switch (tipo) {
      case 'texto': return FileText;
      case 'video': return Video;
      case 'audio': return Music;
      case 'imagen': return ImageIcon;
    }
  };

  const getTipoColor = (tipo: Recurso['tipo']) => {
    switch (tipo) {
      case 'texto': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'video': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'audio': return 'bg-green-100 text-green-700 border-green-300';
      case 'imagen': return 'bg-orange-100 text-orange-700 border-orange-300';
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Lista de recursos */}
      <div className={`${filterByGroupId || hideTitle ? '' : 'bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200'}`}>
        {!filterByGroupId && !hideTitle && <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight uppercase">Recursos compartidos</h3>}


        {recursos.length > 0 ? (
          <div className={`${filterByGroupId ? 'flex flex-col gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
            {recursos.map((recurso) => (
              <RecursoCard
                key={recurso.id}
                recurso={recurso}
                onClick={setRecursoSeleccionado}
                onClickDelete={(mostrarEjemplo || (recurso.usuario_id && true)) ? (r) => { // Simplificado: validaremos dentro de handleDelete
                  handleBorrarRecurso(r);
                } : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50">
            <p className="text-slate-400 font-medium text-sm">Aún no hay recursos compartidos.</p>
          </div>
        )}
      </div>

      {/* Modal de vista de recurso - Moved to Portal for Z-Index safety */}
      {recursoSeleccionado && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-8 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                {(() => {
                  const Icon = getTipoIcon(recursoSeleccionado.tipo);
                  return <Icon size={120} />;
                })()}
              </div>
              <div className="relative z-10 pr-12">
                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 ${getTipoColor(recursoSeleccionado.tipo)}`}>
                  {recursoSeleccionado.tipo}
                </span>
                <h3 className="text-2xl font-black tracking-tight mb-2 leading-tight">{recursoSeleccionado.titulo}</h3>
                <p className="text-slate-400 text-sm font-medium">{recursoSeleccionado.grupoNombre}</p>
              </div>
              <button
                onClick={() => setRecursoSeleccionado(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-md z-50"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <p className="text-slate-600 mb-8 font-medium leading-relaxed text-lg">{recursoSeleccionado.descripcion}</p>

              {recursoSeleccionado.tipo === 'texto' && (
                <>
                  {/* Si hay contenido de texto simple */}
                  {recursoSeleccionado.contenido && (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-inner mb-6">
                      <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {recursoSeleccionado.contenido}
                      </p>
                    </div>
                  )}

                  {recursoSeleccionado.url && (
                    <div className="space-y-4">
                      {/* Document Card */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white border border-slate-100 rounded-xl text-purple-600">
                            <FileText className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Documento Adjunto</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">PDF / DOC / TXT</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {showPreview ? 'Ocultar' : 'Ver'}
                          </button>
                        </div>
                      </div>

                      {/* Preview Iframe */}
                      {showPreview && (
                        <div className="w-full h-[500px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                          <iframe
                            src={recursoSeleccionado.url}
                            className="w-full h-full"
                            title="Document Preview"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {recursoSeleccionado.tipo === 'imagen' && recursoSeleccionado.url && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                  <img
                    src={recursoSeleccionado.url}
                    alt={recursoSeleccionado.titulo}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {recursoSeleccionado.tipo === 'audio' && recursoSeleccionado.url && (
                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                  <audio controls className="w-full">
                    <source src={recursoSeleccionado.url} />
                    Tu navegador no soporta el elemento de audio.
                  </audio>
                </div>
              )}

              {recursoSeleccionado.tipo === 'video' && recursoSeleccionado.url && (
                <div className="rounded-3xl overflow-hidden border border-slate-800 bg-black">
                  <video controls className="w-full aspect-video">
                    <source src={recursoSeleccionado.url} />
                    Tu navegador no soporta el elemento de video.
                  </video>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-100 flex gap-4">
                <button
                  onClick={() => handleDescargar(recursoSeleccionado)}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-purple-600 transition-all font-bold uppercase tracking-widest text-xs shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Descargar Archivo
                </button>

                {/* Botón Borrar (Solo visible si es ejemplo o tiene usuario_id y coincide, o si es docente) */}
                {(mostrarEjemplo || recursoSeleccionado.usuario_id) && (
                  <button
                    onClick={() => handleBorrarRecurso(recursoSeleccionado)}
                    className="px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-100 hover:text-rose-700 transition-colors font-bold uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    Borrar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, MoreVertical, Download, Upload, Plus, Trash2,
  Save, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  HelpCircle, Info, LayoutGrid, Table, BookOpen, Users, CheckCircle2,
  Target, ClipboardCheck, Sparkles, Pencil, FileText, Loader2, User
} from "lucide-react";
import { utils, writeFile } from 'xlsx';
import { Rubrica, Criterio, Grupo } from '../types';
import { ModalEvaluacionGrupal } from './ModalEvaluacionGrupal';
import { PerfilAlumno } from './PerfilAlumno';
import { supabase } from '../lib/supabase';
import { generarNivelesRubrica } from '../services/ai';
import { toast } from 'sonner';

interface EvaluacionRubricasProps {
  rubrica?: Rubrica;
  grupos?: Grupo[];
  proyectoId?: string;
  tareasProyecto?: any[];
  entregasProyecto?: any[];
}

const criteriosDefault: Criterio[] = [
  {
    nombre: 'Colaboración y trabajo en equipo',
    descripcion: 'Capacidad para trabajar de forma coordinada, respetar roles y aportar al grupo',
    niveles: {
      insuficiente: { puntos: '0-4', descripcion: '' },
      suficiente: { puntos: '5-6', descripcion: '' },
      notable: { puntos: '7-8', descripcion: '' },
      sobresaliente: { puntos: '9-10', descripcion: '' }
    }
  },
  {
    nombre: 'Creatividad e Innovación',
    descripcion: 'Originalidad en las propuestas y soluciones aportadas al proyecto',
    niveles: {
      insuficiente: { puntos: '0-4', descripcion: '' },
      suficiente: { puntos: '5-6', descripcion: '' },
      notable: { puntos: '7-8', descripcion: '' },
      sobresaliente: { puntos: '9-10', descripcion: '' }
    }
  },
  {
    nombre: 'Uso de Herramientas TIC',
    descripcion: 'Destreza y adecuación en el uso de las herramientas digitales propuestas',
    niveles: {
      insuficiente: { puntos: '0-4', descripcion: '' },
      suficiente: { puntos: '5-6', descripcion: '' },
      notable: { puntos: '7-8', descripcion: '' },
      sobresaliente: { puntos: '9-10', descripcion: '' }
    }
  }
];

export function EvaluacionRubricas({ rubrica, grupos = [], proyectoId, tareasProyecto = [], entregasProyecto = [] }: EvaluacionRubricasProps) {
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [evaluacionesGrupales, setEvaluacionesGrupales] = useState<Record<string, number>>({});
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [uniqueCriteria, setUniqueCriteria] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ nombre: string, grupo: Grupo } | null>(null);

  const [localCriterios, setLocalCriterios] = useState<Criterio[]>([]);
  const [isGlobalAiGenerating, setIsGlobalAiGenerating] = useState(false);

  useEffect(() => {
    if (proyectoId) {
      setLocalCriterios([]);
      setEvaluacionesGrupales({});
      setAllEvaluations([]);
      setUniqueCriteria([]);
    }
  }, [proyectoId]);

  useEffect(() => {
    if (rubrica?.criterios && rubrica.criterios.length > 0) {
      setLocalCriterios(rubrica.criterios);
    } else if (localCriterios.length === 0) {
      setLocalCriterios(criteriosDefault);
    }
  }, [rubrica, proyectoId]);

  useEffect(() => {
    if (localCriterios.length === 0) return;
    const timeoutId = setTimeout(() => {
      handleSaveRubric(true);
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [localCriterios]);

  const grupoMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    grupos.forEach(g => {
      map[g.id] = g.nombre;
    });
    return map;
  }, [grupos]);

  const criteriosActivos = React.useMemo(() => {
    return localCriterios.map(c => c.nombre);
  }, [localCriterios]);

  useEffect(() => {
    fetchEvaluacionesGrupales();
  }, [grupos, proyectoId]);

  const fetchEvaluacionesGrupales = async () => {
    try {
      if (!proyectoId) return;

      const { data: groupData } = await supabase
        .from('evaluaciones_grupales')
        .select('grupo_id, nota_final')
        .eq('proyecto_id', proyectoId);

      if (groupData) {
        const map: Record<string, number> = {};
        groupData.forEach((d: any) => { map[d.grupo_id] = d.nota_final; });
        setEvaluacionesGrupales(map);
      }

      const { data: evalData } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('proyecto_id', proyectoId);

      if (evalData) {
        setAllEvaluations(evalData);
      }

    } catch (e) {
      console.error("Error fetching evals", e);
    }
  };

  const updateCriterio = (index: number, field: keyof Criterio, value: any) => {
    const newCriterios = [...localCriterios];
    newCriterios[index] = { ...newCriterios[index], [field]: value };
    setLocalCriterios(newCriterios);
  };

  const addCriterio = () => {
    setLocalCriterios([
      ...localCriterios,
      {
        nombre: 'Nuevo Criterio',
        descripcion: 'Descripción del criterio...',
        niveles: [
          { puntos: '0-4', descripcion: '' },
          { puntos: '5-6', descripcion: '' },
          { puntos: '7-8', descripcion: '' },
          { puntos: '9-10', descripcion: '' }
        ]
      }
    ]);
  };

  const removeCriterio = (index: number) => {
    // Confirmation removed as requested
    const newCriterios = localCriterios.filter((_, i) => i !== index);
    setLocalCriterios(newCriterios);
    // Auto-save after removal
    setTimeout(() => handleSaveRubric(true), 100);
  };

  const handleLevelChange = (criterioIndex: number, levelIndex: number, newText: string) => {
    const newCriterios = [...localCriterios];
    const crit = { ...newCriterios[criterioIndex] };
    let nivelesArray: any[] = Array.isArray(crit.niveles) ? [...crit.niveles] : Object.values(crit.niveles || {});
    while (nivelesArray.length <= levelIndex || nivelesArray.length < 4) {
      const defaultPoints = ['0-4', '5-6', '7-8', '9-10'];
      nivelesArray.push({ puntos: defaultPoints[nivelesArray.length] || '0', descripcion: '' });
    }
    nivelesArray[levelIndex] = { ...nivelesArray[levelIndex], descripcion: newText };
    crit.niveles = nivelesArray;
    newCriterios[criterioIndex] = crit;
    setLocalCriterios(newCriterios);
  };

  const handleGlobalAiGeneration = async () => {
    setIsGlobalAiGenerating(true);
    try {
      const newCriterios = [];
      for (const crit of localCriterios) {
        // Enviar el contexto del criterio para una mejor generación
        const nivelesGenerados = await generarNivelesRubrica(`${crit.nombre}: ${crit.descripcion || ''}`);

        // Validación robusta para evitar [object Object]
        const safeNiveles = (Array.isArray(nivelesGenerados) && nivelesGenerados.length >= 4)
          ? nivelesGenerados.map(n => {
            if (typeof n === 'string') return n;
            if (n && typeof n === 'object') return (n as any).descripcion || (n as any).content || JSON.stringify(n);
            return String(n);
          })
          : ["Sin descripción", "Sin descripción", "Sin descripción", "Sin descripción"];

        newCriterios.push({
          ...crit,
          niveles: [
            { puntos: '0-4', descripcion: safeNiveles[0] },
            { puntos: '5-6', descripcion: safeNiveles[1] },
            { puntos: '7-8', descripcion: safeNiveles[2] },
            { puntos: '9-10', descripcion: safeNiveles[3] }
          ]
        });
        // Esperar un poco para evitar Rate Limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setLocalCriterios(newCriterios);
      await handleSaveRubric(true);
      toast.success("Rúbrica completada con inteligencia artificial ✨");
    } catch (e) {
      console.error("Error generating global rubric", e);
      toast.error("Hubo un error al generar la rúbrica.");
    } finally {
      setIsGlobalAiGenerating(false);
    }
  };

  const handleSaveRubric = async (silent = false) => {
    if (!proyectoId) return;
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({
          rubrica: {
            criterios: localCriterios,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', proyectoId);
      if (error) throw error;
      if (!silent) toast.success("Rúbrica guardada y sincronizada.");
    } catch (e) {
      console.error("Error saving rubric", e);
      if (!silent) toast.error("Error al guardar la rúbrica.");
    }
  };

  const exportToExcel = async () => {
    try {
      // 1. Sheet for Grades
      const excelData = allEvaluations.map((ev: any) => {
        const grupoNombre = grupoMap[ev.grupo_id] || (ev.grupo_id ? String(ev.grupo_id).replace('grupo-', 'Grupo ') : 'Sin Grupo');

        // Use ONLY current rubric criteria for export
        const criteriosObj: any = {};
        let sumaPuntos = 0;
        let numCriterios = 0;

        criteriosActivos.forEach(nombreCrit => {
          const match = ev.criterios?.find((c: any) => (c.nombre || c.criterio) === nombreCrit);
          const puntosVal = match ? Number(match.puntos) : 0;
          criteriosObj[nombreCrit] = puntosVal;
          sumaPuntos += puntosVal;
          numCriterios++;
        });

        let notaFinalCalculada = numCriterios > 0 ? sumaPuntos / numCriterios : Number(ev.nota_final) || 0;
        if (notaFinalCalculada > 10) notaFinalCalculada = 10;

        return {
          'Grupo': grupoNombre,
          'Alumno': ev.alumno_nombre,
          'Media Criterios': Number(notaFinalCalculada.toFixed(2)),
          ...criteriosObj
        };
      });
      excelData.sort((a: any, b: any) => a.Grupo.localeCompare(b.Grupo) || a.Alumno.localeCompare(b.Alumno));
      const wsGrades = utils.json_to_sheet(excelData);

      // 2. Sheet for Rubric Definition
      const rubricExcelData = localCriterios.map(c => {
        let nivelesArr = Array.isArray(c.niveles) ? c.niveles : Object.values(c.niveles || {});
        const getDesc = (idx: number) => nivelesArr[idx]?.descripcion || '-';

        return {
          'Criterio': c.nombre,
          'Descripción': c.descripcion || '',
          'Insuficiente (0-4)': getDesc(0),
          'Suficiente (5-6)': getDesc(1),
          'Notable (7-8)': getDesc(2),
          'Sobresaliente (9-10)': getDesc(3)
        };
      });
      const wsRubric = utils.json_to_sheet(rubricExcelData);

      // 3. Sheet for Task Performance
      const taskExcelData = allEvaluations.map((ev: any) => {
        const grupoNombre = grupoMap[ev.grupo_id] || (ev.grupo_id ? String(ev.grupo_id).replace('grupo-', 'Grupo ') : 'Sin Grupo');
        const totalT = tareasProyecto.filter(t => !t.grupo_id || String(t.grupo_id) === String(ev.grupo_id));
        const entregasG = entregasProyecto.filter(e => String(e.grupo_id) === String(ev.grupo_id));

        let sumaNotas = 0;
        const individualTasks: any = {};
        totalT.forEach(tarea => {
           const entrega = entregasG.find(e => String(e.tarea_id) === String(tarea.id));
           const nota = (entrega && entrega.calificacion !== null) ? Number(entrega.calificacion) : 0;
           sumaNotas += nota;
           individualTasks[tarea.titulo] = nota;
        });
        const mediaTareas = totalT.length > 0 ? (sumaNotas / totalT.length) : 0;

        return {
          'Grupo': grupoNombre,
          'Alumno': ev.alumno_nombre,
          'Progreso': `${entregasG.length}/${totalT.length}`,
          'Media Tareas': Number(mediaTareas.toFixed(2)),
          ...individualTasks
        };
      });
      taskExcelData.sort((a: any, b: any) => a.Grupo.localeCompare(b.Grupo) || a.Alumno.localeCompare(b.Alumno));
      const wsTasks = utils.json_to_sheet(taskExcelData);

      const wb = utils.book_new();
      utils.book_append_sheet(wb, wsGrades, "Calificaciones Rúbrica");
      utils.book_append_sheet(wb, wsTasks, "Misiones (Tareas)");
      utils.book_append_sheet(wb, wsRubric, "Definición Rúbrica");
      writeFile(wb, "Evaluacion_Detallada_TicoAI.xlsx");
    } catch (err) {
      console.error("Error exporting to excel", err);
      toast.error("Error al exportar a Excel");
    }
  };

  const memoizedRubrica = React.useMemo(() => ({
    id: 'current',
    proyecto_id: proyectoId || '',
    criterios: localCriterios,
    created_at: '',
    updated_at: ''
  }), [proyectoId, localCriterios]);

  return (
    <div className="flex flex-col gap-4">
      {selectedGrupo && (
        <ModalEvaluacionGrupal
          grupo={selectedGrupo}
          onClose={() => setSelectedGrupo(null)}
          onSave={fetchEvaluacionesGrupales}
          rubricaProyecto={localCriterios}
          onRubricChange={setLocalCriterios}
        />
      )}

      {selectedStudent && (
        <PerfilAlumno
          alumno={selectedStudent.nombre}
          grupo={selectedStudent.grupo}
          onClose={() => {
            setSelectedStudent(null);
            fetchEvaluacionesGrupales();
          }}
          rubrica={memoizedRubrica}
        />
      )}

      <div className="flex justify-between items-end mb-0">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <Users className="w-5 h-5 text-indigo-600" />
          EVALUACIÓN POR EQUIPOS
        </h2>
        <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"><Download className="w-4 h-4" />Exportar Excel</button>
      </div>

      <div className="space-y-2">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-[2.5rem] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map(grupo => {
              const nota = evaluacionesGrupales[grupo.id];
              const isEvaluado = nota !== undefined;
              return (
                <div key={grupo.id} onClick={() => setSelectedGrupo(grupo)} className={`group bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${isEvaluado ? 'border-green-100 bg-green-50/20' : 'border-slate-100 hover:border-indigo-300'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl shadow-inner ${isEvaluado ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-400'}`}><Users className="w-6 h-6" /></div>
                      <div>
                        <h3 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{grupo.nombre}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{grupo.miembros.length} Integrantes</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Criterios</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${isEvaluado ? 'text-green-600' : 'text-slate-300'}`}>{isEvaluado ? nota.toFixed(1) : '--'}</span>
                        <span className="text-xs font-bold text-slate-300">/10</span>
                      </div>
                    </div>
                    {isEvaluado ? (
                      <div className="p-2 bg-green-500 text-white rounded-lg shadow-lg shadow-green-100"><CheckCircle2 className="w-5 h-5" /></div>
                    ) : (
                      <div className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Pendiente</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-12">
          {/* TABLA 1: EVALUACIÓN POR RÚBRICA */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                Evaluación por Rúbrica (Criterios)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-black tracking-widest">Equipo</th>
                    <th className="px-6 py-4 font-black tracking-widest">Estudiante</th>
                    <th className="px-6 py-4 font-black tracking-widest text-center bg-indigo-50/50 text-indigo-700">Media Criterios</th>
                    {criteriosActivos.map((c, i) => <th key={`${c}-${i}`} className="px-6 py-4 font-black tracking-widest text-center">{c}</th>)}
                    <th className="px-6 py-4 font-black tracking-widest text-center sticky right-0 bg-slate-50 border-l border-slate-200">Perfil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {allEvaluations.sort((a, b) => (grupoMap[a.grupo_id] || '').localeCompare(grupoMap[b.grupo_id] || '') || a.alumno_nombre.localeCompare(b.alumno_nombre)).map((ev, idx) => {
                    let notaVisual = 0;
                    if (ev.criterios && Array.isArray(ev.criterios)) {
                      let sum = 0; let count = 0;
                      criteriosActivos.forEach(nombreCrit => {
                        const crit = ev.criterios.find((x: any) => (x.nombre === nombreCrit || x.criterio === nombreCrit));
                        if (crit) { sum += Number(crit.puntos || 0); count++; }
                      });
                      if (count > 0) notaVisual = sum / count;
                    }
                    if (notaVisual === 0 && ev.nota_final) notaVisual = Number(ev.nota_final);
                    return (
                      <tr key={ev.id || `row-crit-${idx}`} className="hover:bg-indigo-50/30 transition-colors group/row text-slate-600">
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-[11px] font-black uppercase">{grupoMap[ev.grupo_id] || '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-black">{ev.alumno_nombre}</td>
                        <td className="px-6 py-4 text-center font-black text-indigo-600 bg-indigo-50/20 text-lg">
                          {notaVisual.toFixed(1)}
                        </td>
                        {criteriosActivos.map((c, i) => {
                          const crit = ev.criterios?.find((x: any) => (x.nombre === c || x.criterio === c));
                          const puntos = crit ? Number(crit.puntos) : 0;
                          return (
                            <td key={`${ev.id || idx}-${c}-${i}`} className="px-6 py-4 text-center font-black text-slate-500">
                              {crit ? puntos.toFixed(1) : '-'}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover/row:bg-[#fbfbff] border-l border-slate-100 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                          <button onClick={() => {
                            const fullGrupo = grupos.find(g => g.id === ev.grupo_id);
                            if (fullGrupo) setSelectedStudent({ nombre: ev.alumno_nombre, grupo: fullGrupo });
                          }} className="p-2 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all flex items-center gap-2 mx-auto font-black border-2 border-indigo-50 shadow-sm active:scale-95 group/btn">
                            <User className="w-4 h-4" />
                            <span className="text-[10px] uppercase tracking-widest hidden group-hover/btn:inline">Ver Perfil</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: EVALUACIÓN POR TAREAS */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Evaluación por Tareas (Entregas)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-black tracking-widest">Equipo</th>
                    <th className="px-6 py-4 font-black tracking-widest">Estudiante</th>
                    <th className="px-6 py-4 font-black tracking-widest text-center bg-amber-50/50 text-amber-700">Entrega</th>
                    <th className="px-6 py-4 font-black tracking-widest text-center bg-blue-50/50 text-blue-700">Media Tareas</th>
                    {tareasProyecto.map((t, i) => (
                      <th key={`task-header-${t.id}`} className="px-6 py-4 font-black tracking-widest text-center min-w-[120px]">
                        <span className="truncate block max-w-[150px]">{t.titulo}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {allEvaluations.sort((a, b) => (grupoMap[a.grupo_id] || '').localeCompare(grupoMap[b.grupo_id] || '') || a.alumno_nombre.localeCompare(b.alumno_nombre)).map((ev, idx) => {
                    const totalT = tareasProyecto.filter(t => !t.grupo_id || String(t.grupo_id) === String(ev.grupo_id));
                    const entregasG = entregasProyecto.filter(e => String(e.grupo_id) === String(ev.grupo_id));
                    
                    let sumaNotas = 0;
                    totalT.forEach(tarea => {
                       const entrega = entregasG.find(e => String(e.tarea_id) === String(tarea.id));
                       if (entrega && entrega.calificacion !== null && entrega.calificacion !== undefined) {
                         sumaNotas += Number(entrega.calificacion);
                       }
                    });
                    const mediaTareas = totalT.length > 0 ? (sumaNotas / totalT.length) : 0;

                    return (
                      <tr key={ev.id || `row-task-${idx}`} className="hover:bg-blue-50/30 transition-colors group/row text-slate-600">
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-[11px] font-black uppercase">{grupoMap[ev.grupo_id] || '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-black">{ev.alumno_nombre}</td>
                        <td className="px-6 py-4 text-center font-black text-amber-600 bg-amber-50/20">
                          {entregasG.length}/{totalT.length}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-blue-600 bg-blue-50/20 text-lg">
                          {mediaTareas.toFixed(1)}
                        </td>
                        {tareasProyecto.map((tarea) => {
                          // Solo mostrar nota si la tarea está asignada al grupo del estudiante o es global
                          const esAsignada = !tarea.grupo_id || String(tarea.grupo_id) === String(ev.grupo_id);
                          if (!esAsignada) return <td key={`td-task-${tarea.id}-${idx}`} className="px-6 py-4 text-center text-slate-200 bg-slate-50/30">-</td>;

                          const entrega = entregasG.find(e => String(e.tarea_id) === String(tarea.id));
                          const calif = (entrega && entrega.calificacion !== null) ? Number(entrega.calificacion) : 0;
                          
                          return (
                            <td key={`td-task-${tarea.id}-${idx}`} className={`px-6 py-4 text-center font-black ${calif >= 5 ? 'text-green-600' : 'text-red-400'}`}>
                              {entrega && entrega.calificacion !== null ? calif.toFixed(1) : '0.0'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>

        <div className="pt-12 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg"><Target className="w-5 h-5 text-indigo-600" /></div>
              <h3 className="font-bold text-lg text-slate-800">Rúbrica de evaluación</h3>
            </div>
            <button onClick={handleGlobalAiGeneration} disabled={isGlobalAiGenerating || localCriterios.length === 0} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isGlobalAiGenerating ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-md'}`}>
              {isGlobalAiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
              {isGlobalAiGenerating ? 'Generando...' : 'Autocompletar con IA'}
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-700 w-1/4">Criterio</th>
                    <th className="px-3 py-3 font-bold text-center text-red-700 bg-red-50/50 min-w-[100px] md:min-w-[140px]">
                      <span className="hidden md:inline">Insuficiente</span>
                      <span className="md:hidden">Insuf.</span>
                    </th>
                    <th className="px-3 py-3 font-bold text-center text-orange-700 bg-orange-50/50 min-w-[100px] md:min-w-[140px]">
                      <span className="hidden md:inline">Suficiente</span>
                      <span className="md:hidden">Sufic.</span>
                    </th>
                    <th className="px-3 py-3 font-bold text-center text-blue-700 bg-blue-50/50 min-w-[100px] md:min-w-[140px]">
                      <span className="hidden md:inline">Notable</span>
                      <span className="md:hidden">Notab.</span>
                    </th>
                    <th className="px-3 py-3 font-bold text-center text-green-700 bg-green-50/50 min-w-[100px] md:min-w-[140px]">
                      <span className="hidden md:inline">Sobresaliente</span>
                      <span className="md:hidden">Sobres.</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localCriterios.map((criterio, index) => {
                    let nivelesArray = Array.isArray(criterio.niveles) ? [...criterio.niveles] : Object.values(criterio.niveles || {});
                    while (nivelesArray.length < 4) nivelesArray.push({ puntos: ['0-4', '5-6', '7-8', '9-10'][nivelesArray.length] || '0', descripcion: '' });
                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4 border-r border-slate-100 align-top relative group/cell min-w-[150px] md:min-w-[300px]">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <input type="text" value={criterio.nombre} onChange={(e) => updateCriterio(index, 'nombre', e.target.value)} className="font-bold text-slate-800 text-sm mb-1 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none" />
                              <textarea value={criterio.descripcion || ''} onChange={(e) => updateCriterio(index, 'descripcion', e.target.value)} className="text-xs text-slate-500 w-full bg-transparent border-transparent focus:border-indigo-300 rounded resize-none focus:bg-white transition-all outline-none" rows={2} />
                            </div>
                            <button
                              onClick={() => removeCriterio(index)}
                              className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all shadow-sm border border-transparent hover:border-red-100 shrink-0"
                              title="Eliminar criterio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        {nivelesArray.slice(0, 4).map((nivel: any, idx) => (
                          <td key={idx} className="px-2 py-2 border-r border-slate-100 last:border-0 align-top">
                            <textarea value={nivel.descripcion || ''} onChange={(e) => handleLevelChange(index, idx, e.target.value)} className={`w-full h-32 px-3 py-2 text-xs rounded-lg border border-transparent resize-none transition-all outline-none focus:border-indigo-300 focus:bg-white ${idx === 0 ? 'text-red-700 bg-red-50/50' : idx === 1 ? 'text-orange-700 bg-orange-50/50' : idx === 2 ? 'text-blue-700 bg-blue-50/50' : 'text-green-700 bg-green-50/50'}`} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
              <button onClick={addCriterio} className="flex items-center gap-2 px-6 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Plus className="w-5 h-5" />Añadir Criterio</button>
            </div>
          </div>
        </div>
    </div>
  );
}
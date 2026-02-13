import React, { useState, useEffect } from 'react';
import { DetalleGrupo } from '../components/DetalleGrupo';
import { Grupo, ProyectoFase, Criterio } from '../types';
import { ModalCrearGrupo } from '../components/ModalCrearGrupo';
import { ModalAsignarTareas } from '../components/ModalAsignarTareas';
import { PerfilAlumno } from '../components/PerfilAlumno';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface GroupDetailProps {
    grupo: Grupo;
    fases: ProyectoFase[];
    rubrica: Criterio[];
    onBack: () => void;
    onViewFeedback?: () => void;
}

export function GroupDetail({ grupo: initialGrupo, fases, rubrica, onBack, onViewFeedback }: GroupDetailProps) {
    const [grupo, setGrupo] = useState<Grupo>(initialGrupo);

    useEffect(() => {
        setGrupo(initialGrupo);
    }, [initialGrupo]);

    useEffect(() => {
        setGrupo(initialGrupo);
    }, [initialGrupo]);
    const [showModalGrupo, setShowModalGrupo] = useState(false);
    const [showModalAsignar, setShowModalAsignar] = useState(false);
    const [alumnoParaEvaluar, setAlumnoParaEvaluar] = useState<{ nombre: string, grupo: Grupo } | null>(null);

    const handleCrearOEditarGrupo = async (grupoData: Omit<Grupo, 'id'>) => {
        try {
            const { error } = await supabase
                .from('grupos')
                .update({
                    nombre: grupoData.nombre,
                    miembros: grupoData.miembros,
                    // No sobrescribimos estado/progreso al editar info básica aquí
                })
                .eq('id', grupo.id);

            if (error) throw error;

            // Actualizar estado local
            setGrupo({ ...grupo, ...grupoData });
            toast.success('Grupo actualizado');
            setShowModalGrupo(false);
        } catch (error: any) {
            console.error('Error updating group:', error);
            toast.error(`Error al actualizar: ${error.message}`);
        }
    };

    const handleAsignarTareas = async (nuevosHitos: any[]) => {
        try {
            const updatedHitos = [...(grupo.hitos || []), ...nuevosHitos];
            // Recalculate progress logic here if needed, usually backend handles or we estimate
            // Simple logic:
            const total = updatedHitos.length;
            const aprobados = updatedHitos.filter((h: any) => h.estado === 'aprobado').length;
            const nuevoProgreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;

            const { error } = await supabase
                .from('grupos')
                .update({
                    hitos: updatedHitos,
                    progreso: nuevoProgreso
                })
                .eq('id', grupo.id);

            if (error) throw error;

            setGrupo({ ...grupo, hitos: updatedHitos, progreso: nuevoProgreso });
            toast.success("Tareas asignadas correctamente");
            setShowModalAsignar(false);
        } catch (error) {
            console.error('Error assigning tasks:', error);
            toast.error("Error al asignar tareas");
        }
    };

    const handleDeleteHito = async (faseId: string, hitoTitulo: string) => {
        try {
            const updatedHitos = (grupo.hitos || []).filter(h => !(h.fase_id === faseId && h.titulo === hitoTitulo));

            // Recalculate progress logic here
            const total = updatedHitos.length;
            const aprobados = updatedHitos.filter((h: any) => h.estado === 'aprobado').length;
            const nuevoProgreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;

            const { error } = await supabase
                .from('grupos')
                .update({
                    hitos: updatedHitos,
                    progreso: nuevoProgreso
                })
                .eq('id', grupo.id);

            if (error) throw error;

            setGrupo({ ...grupo, hitos: updatedHitos, progreso: nuevoProgreso });
            toast.success("Tarea eliminada correctamente");
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error("Error al eliminar la tarea");
        }
    };

    useEffect(() => {
        setGrupo(initialGrupo);
    }, [initialGrupo]);

    return (
        <>
            <DetalleGrupo
                grupo={grupo}
                fases={fases}
                rubrica={rubrica}
                onBack={onBack}
                onViewFeedback={onViewFeedback}
                onEditGroup={() => setShowModalGrupo(true)}
                onAssignTask={() => setShowModalAsignar(true)}
                onViewStudent={(alumno) => setAlumnoParaEvaluar({ nombre: alumno, grupo })}
                onDeleteHito={handleDeleteHito}
            />

            {showModalGrupo && (
                <ModalCrearGrupo
                    onClose={() => setShowModalGrupo(false)}
                    onCrear={handleCrearOEditarGrupo}
                    proyectoId={String(grupo.proyecto_id || '1')}
                    grupoEditando={grupo}
                />
            )}

            {showModalAsignar && (
                <ModalAsignarTareas
                    grupoNombre={grupo.nombre}
                    faseId={fases.length > 0 ? fases[0].id : '1'}
                    onClose={() => setShowModalAsignar(false)}
                    onSave={handleAsignarTareas}
                />
            )}

            {alumnoParaEvaluar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <PerfilAlumno
                            alumno={alumnoParaEvaluar.nombre}
                            grupo={alumnoParaEvaluar.grupo}
                            onClose={() => setAlumnoParaEvaluar(null)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

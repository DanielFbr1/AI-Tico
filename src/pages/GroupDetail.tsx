import React, { useState, useEffect } from 'react';
import { DetalleGrupo } from '../components/DetalleGrupo';
import { Grupo, ProyectoFase, Criterio } from '../types';
import { ModalCrearGrupo } from '../components/ModalCrearGrupo';
import { ModalCrearTareaClassroom } from '../components/ModalCrearTareaClassroom';
import { PerfilAlumno } from '../components/PerfilAlumno';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface GroupDetailProps {
    grupo: Grupo;
    fases: ProyectoFase[];
    rubrica: Criterio[];
    proyectoId?: string;
    codigoSala?: string;
    onBack: () => void;
    onViewFeedback?: () => void;
}

export function GroupDetail({ grupo: initialGrupo, fases, rubrica, proyectoId, codigoSala, onBack, onViewFeedback }: GroupDetailProps) {
    const [grupo, setGrupo] = useState<Grupo>(initialGrupo);

    useEffect(() => {
        setGrupo(initialGrupo);
    }, [initialGrupo]);

    useEffect(() => {
        setGrupo(initialGrupo);
    }, [initialGrupo]);
    const [showModalGrupo, setShowModalGrupo] = useState(false);
    const [showModalAsignar, setShowModalAsignar] = useState(false);
    const [gruposParaModal, setGruposParaModal] = useState<Grupo[]>([]);
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

    const handleAsignarTareas = () => {
        // Fetch all groups for the modal selector
        const fetchGrupos = async () => {
            try {
                const { data } = await supabase
                    .from('grupos')
                    .select('*')
                    .eq('proyecto_id', grupo.proyecto_id);
                setGruposParaModal(data || [grupo]);
            } catch {
                setGruposParaModal([grupo]);
            }
        };
        fetchGrupos();
        setShowModalAsignar(true);
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

    const refreshGrupo = async () => {
        try {
            const { data, error } = await supabase
                .from('grupos')
                .select('*')
                .eq('id', grupo.id)
                .single();
            if (error) throw error;
            if (data) setGrupo(data);
        } catch (err) {
            console.error('Error refreshing group data:', err);
        }
    };

    return (
        <>
            <DetalleGrupo
                grupo={grupo}
                fases={fases}
                rubrica={rubrica}
                onBack={onBack}
                onViewFeedback={onViewFeedback}
                onEditGroup={() => setShowModalGrupo(true)}
                onAssignTask={handleAsignarTareas}
                onViewStudent={(alumno) => setAlumnoParaEvaluar({ nombre: alumno, grupo })}
                onDeleteHito={handleDeleteHito}
                onUpdateIA={refreshGrupo}
            />

            {showModalGrupo && (
                <ModalCrearGrupo
                    onClose={() => setShowModalGrupo(false)}
                    onCrear={handleCrearOEditarGrupo}
                    proyectoId={String(grupo.proyecto_id || '1')}
                    codigoSala={codigoSala}
                    grupoEditando={grupo}
                />
            )}

            {showModalAsignar && (
                <ModalCrearTareaClassroom
                    proyectoId={proyectoId || String(grupo.proyecto_id || '')}
                    grupos={gruposParaModal.length > 0 ? gruposParaModal : [grupo]}
                    preselectedGrupoId={String(grupo.id)}
                    onClose={() => setShowModalAsignar(false)}
                    onTareaCreada={() => {
                        toast.success("Tarea creada correctamente");
                        setShowModalAsignar(false);
                    }}
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

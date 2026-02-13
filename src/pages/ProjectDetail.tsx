import { DashboardDocente } from '../components/DashboardDocente';
import { TutorialInteractivo } from '../components/TutorialInteractivo';
import { Grupo, Proyecto } from '../types';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PASOS_TUTORIAL, GRUPOS_MOCK } from '../data/mockData';
import { toast } from 'sonner';

interface ProjectDetailProps {
    proyecto: Proyecto;
    onSelectGrupo: (grupo: Grupo) => void;
    onBack: () => void;
    onSwitchProject: (proyecto: Proyecto) => void;
    onUpdateProjectValues?: (updatedProject: Proyecto) => void;
}

export function ProjectDetail({ proyecto, onSelectGrupo, onBack, onSwitchProject }: ProjectDetailProps) {
    const [localGrupos, setLocalGrupos] = useState<Grupo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState<import('../types').DashboardSection>('grupos');

    const [isDemoMode, setIsDemoMode] = useState(() => {
        return localStorage.getItem(`is_demo_project_${proyecto.id}`) === 'true';
    });

    useEffect(() => {
        setIsDemoMode(localStorage.getItem(`is_demo_project_${proyecto.id}`) === 'true');
    }, [proyecto.id]);

    // Estado del tutorial: Mostrar SOLO si acaba de registrarse (isNewTeacher)
    // O si nunca lo ha visto y queremos forzarlo (opcional, pero el usuario pidió solo al registrarse)
    const [showTutorial, setShowTutorial] = useState(() => {
        const isNewTeacher = localStorage.getItem('isNewTeacher') === 'true';
        if (isNewTeacher) {
            // Es nuevo registro, mostramos y limpiamos la marca de "nuevo"
            // (La marca de "visto" se pondrá cuando lo termine o cierre)
            localStorage.removeItem('isNewTeacher');
            return true;
        }
        return false;
    });

    // Use Ref to track previous state for diffing (Robust Alerting)
    const prevGruposRef = useStateRef(localGrupos);

    function useStateRef(initialValue: Grupo[]) {
        const ref = React.useRef(initialValue);
        useEffect(() => {
            ref.current = localGrupos;
        }, [localGrupos]);
        return ref;
    }

    const checkForAlerts = (newGrupos: Grupo[]) => {
        const oldGrupos = prevGruposRef.current;
        newGrupos.forEach(newGroup => {
            const oldGroup = oldGrupos.find(og => og.id === newGroup.id);
            // Detect Hand Raise
            // Si antes no pedía ayuda y ahora sí (o si es nuevo y pide ayuda)
            if (newGroup.pedir_ayuda && (!oldGroup || !oldGroup.pedir_ayuda)) {
                toast.warning(`✋ El grupo "${newGroup.nombre}" pide ayuda!`, {
                    duration: 5000,
                    className: '!rounded-[2rem] !border-amber-200 !bg-amber-50'
                });
            }
        });
    };

    useEffect(() => {
        fetchGrupos();

        // Realtime Subscription (Generic Trigger)
        const channel = supabase.channel(`project_groups_${proyecto.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'grupos',
                    filter: `proyecto_id=eq.${proyecto.id}`
                },
                (payload) => {
                    console.log('Cambio detectado en grupos:', payload);
                    fetchGrupos(true); // Silent re-fetch, logic inside fetchGrupos handles checks
                }
            )
            .subscribe((status) => {
                console.log(`Realtime Teacher Status for ${proyecto.id}:`, status);
            });

        // Polling Fallback
        const intervalId = setInterval(() => {
            fetchGrupos(true).catch(e => console.error(e));
        }, 4000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
        };
    }, [proyecto.id]);

    const handleClaseChange = async (nuevaClase: string) => {
        try {
            const { data, error } = await supabase
                .from('proyectos')
                .select('*')
                .eq('clase', nuevaClase)
                .single();

            if (error || !data) {
                if (confirm(`No hay ningún proyecto creado para la clase ${nuevaClase}. ¿Quieres crear uno nuevo?`)) {
                    onBack(); // Volver al dashboard para crear uno
                }
                return;
            }

            // Cambiar al proyecto encontrado
            onSwitchProject(data);
        } catch (err) {
            console.error('Error switching class:', err);
        }
    };

    const fetchGrupos = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('grupos')
                .select('*')
                .eq('proyecto_id', proyecto.id);
            if (error) throw error;

            const newGrupos = data || [];
            if (silent) {
                // Only alert on silent updates (realtime/polling) to avoid alert loops on initial load
                checkForAlerts(newGrupos);
            }
            setLocalGrupos(newGrupos);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleTutorialComplete = () => {
        // Marcamos como visto por si acaso queremos usarlo en el futuro
        localStorage.setItem('tutorial_docente_seen', 'true');
        setShowTutorial(false);
    };

    const handleCrearGrupo = async (nuevoGrupo: Omit<Grupo, 'id'>) => {
        try {
            // Temporary fix: Exclude 'descripcion' until migration is applied
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { descripcion, ...datosGrupo } = nuevoGrupo;

            const { data, error } = await supabase
                .from('grupos')
                .insert([{ ...datosGrupo, proyecto_id: proyecto.id }])
                .select();
            if (error) throw error;
            // We add the description back to the local state so the user sees it immediately even if not saved to DB
            if (data) setLocalGrupos([...localGrupos, { ...data[0], descripcion: nuevoGrupo.descripcion }]);
        } catch (err) {
            console.error('Error creating group:', err);
        }
    };

    const handleEditarGrupo = async (id: number | string, grupoEditado: Omit<Grupo, 'id'>) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _, ...datosSinId } = grupoEditado as any; // Safe cast to remove ID if present

            const { error } = await supabase
                .from('grupos')
                .update(datosSinId)
                .eq('id', id);

            if (error) throw error;

            // Update local state with the full object (including ID)
            setLocalGrupos(localGrupos.map(g => g.id === id ? { ...g, ...grupoEditado, id } : g));
        } catch (err) {
            console.error('Error editing group:', err);
            toast.error('Error al actualizar el grupo');
        }
    };

    const handleEliminarGrupo = async (id: number | string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este grupo?')) return;
        try {
            const { error } = await supabase
                .from('grupos')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setLocalGrupos(localGrupos.filter(g => g.id !== id));
        } catch (err) {
            console.error('Error deleting group:', err);
        }
    };

    const handleLimpiarDatos = async () => {
        try {
            const { error } = await supabase
                .from('grupos')
                .delete()
                .eq('proyecto_id', proyecto.id);
            if (error) throw error;
            setLocalGrupos([]);
            setIsDemoMode(false);
            localStorage.removeItem(`is_demo_project_${proyecto.id}`);
        } catch (err) {
            console.error('Error clearing groups:', err);
        }
    };

    const handleCargarEjemplo = async () => {
        // Generic milestones for any group
        const HITOS_GENERICOS = [
            { id: 'h1', titulo: 'Definir objetivos del equipo', estado: 'aprobado', fase_id: 'f1' },
            { id: 'h2', titulo: 'Asignar roles internos', estado: 'en_progreso', fase_id: 'f1' },
            { id: 'h3', titulo: 'Investigación preliminar', estado: 'pendiente', fase_id: 'f1' },
            { id: 'h4', titulo: 'Primera propuesta de valor', estado: 'pendiente', fase_id: 'f2' }
        ];

        const gruposEjemplo = GRUPOS_MOCK.map((g, index) => ({
            nombre: g.nombre,
            // departamento: removed
            progreso: g.progreso,
            estado: g.estado,
            interacciones_ia: 3 + index, // Varied interactions
            miembros: g.miembros,
            proyecto_id: proyecto.id,
            hitos: HITOS_GENERICOS // All groups get generic milestones
        }));

        try {
            // 1. Insertar Grupos con Hitos
            const { data: gruposCreados, error } = await supabase
                .from('grupos')
                .insert(gruposEjemplo)
                .select();

            if (error) throw error;

            if (gruposCreados) {
                // 2. Insertar Mensajes de Chat para cada grupo
                const mensajesParaInsertar = gruposCreados.flatMap(grupo => [
                    {
                        grupo_id: grupo.id,
                        tipo: 'user', // Alumno
                        contenido: `Hola Mentor, somos el equipo "${grupo.nombre}". ¿Por dónde nos recomiendas empezar?`,
                        created_at: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        grupo_id: grupo.id,
                        tipo: 'assistant', // IA
                        contenido: `¡Hola equipo! Me alegra saludaros. Para arrancar con fuerza, ¿habéis revisado los requisitos de la fase actual? Es clave tener eso claro antes de dividir tareas.`,
                        created_at: new Date(Date.now() - 3500000).toISOString()
                    },
                    {
                        grupo_id: grupo.id,
                        tipo: 'user', // Alumno
                        contenido: 'Sí, ya lo hemos mirado. Vamos a empezar repartiendo roles.',
                        created_at: new Date(Date.now() - 3400000).toISOString()
                    }
                ]);

                const { error: errorChat } = await supabase
                    .from('mensajes_chat')
                    .insert(mensajesParaInsertar);

                if (errorChat) console.error("Error creating chat examples:", errorChat);

                setLocalGrupos([...localGrupos, ...gruposCreados]);
                setIsDemoMode(true);
                localStorage.setItem(`is_demo_project_${proyecto.id}`, 'true');
            }
        } catch (err) {
            console.error('Error loading example groups:', err);
        }
    };

    const handleUpdateProjectName = async (newName: string) => {
        try {
            const { error } = await supabase
                .from('proyectos')
                .update({ nombre: newName })
                .eq('id', proyecto.id);

            if (error) throw error;

            if (onSwitchProject) {
                onSwitchProject({ ...proyecto, nombre: newName });
            }

        } catch (err) {
            console.error('Error updating project name:', err);
            alert('Error al actualizar el nombre del proyecto');
        }
    };

    return (
        <div className="relative">
            <DashboardDocente
                onSelectGrupo={onSelectGrupo}
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                grupos={localGrupos}
                mostrandoEjemplo={isDemoMode}
                onCargarEjemplo={handleCargarEjemplo}
                onLimpiarDatos={handleLimpiarDatos}
                onCrearGrupo={handleCrearGrupo}
                onEditarGrupo={handleEditarGrupo}
                onEliminarGrupo={handleEliminarGrupo}
                onIniciarTutorial={() => setShowTutorial(true)}
                onCambiarProyecto={onBack}
                onClaseChange={handleClaseChange}
                proyectoActual={{
                    id: proyecto.id,
                    nombre: proyecto.nombre,
                    tipo: proyecto.tipo,
                    codigo_sala: proyecto.codigo_sala,
                    clase: proyecto.clase,
                    fases: proyecto.fases,
                    rubrica: proyecto.rubrica
                }}
                onUpdateProjectName={handleUpdateProjectName}
            />

            {showTutorial && (
                <TutorialInteractivo
                    pasos={PASOS_TUTORIAL}
                    onComplete={handleTutorialComplete}
                    onSkip={handleTutorialComplete}
                />
            )}
        </div>
    );
}

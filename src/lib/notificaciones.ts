import { supabase } from './supabase';

type TipoNotificacion = 
  | 'tarea_asignada'
  | 'tarea_revision'
  | 'mensaje_grupo'
  | 'recurso_subido'
  | 'notas_actualizadas'
  | 'mensaje_familia'
  | 'mano_levantada'
  | 'evaluacion_grupal'
  | 'colaboracion_aceptada'
  | 'hito_aprobado'
  | 'hito_rechazado'
  | 'general';

interface CrearNotificacionParams {
  userId: string;
  proyectoId?: string;
  tipo: TipoNotificacion;
  titulo: string;
  descripcion?: string;
  metadata?: Record<string, any>;
}

/**
 * Crea una notificación para un usuario específico
 */
export async function crearNotificacion({
  userId,
  proyectoId,
  tipo,
  titulo,
  descripcion,
  metadata = {}
}: CrearNotificacionParams) {
  try {
    const { error } = await supabase.from('notificaciones').insert({
      user_id: userId,
      proyecto_id: proyectoId || null,
      tipo,
      titulo,
      descripcion: descripcion || null,
      metadata,
      leida: false
    });

    if (error) {
      console.error('Error creando notificación:', error);
    }
  } catch (err) {
    console.error('Error inesperado creando notificación:', err);
  }
}

/**
 * Crea notificaciones para múltiples usuarios a la vez
 */
export async function crearNotificacionMasiva(
  userIds: string[],
  params: Omit<CrearNotificacionParams, 'userId'>
) {
  if (userIds.length === 0) return;

  try {
    const rows = userIds.map(uid => ({
      user_id: uid,
      proyecto_id: params.proyectoId || null,
      tipo: params.tipo,
      titulo: params.titulo,
      descripcion: params.descripcion || null,
      metadata: params.metadata || {},
      leida: false
    }));

    const { error } = await supabase.from('notificaciones').insert(rows);

    if (error) {
      console.error('Error creando notificaciones masivas:', error);
    }
  } catch (err) {
    console.error('Error inesperado creando notificaciones masivas:', err);
  }
}

/**
 * Obtiene los user_ids de los alumnos de un proyecto
 */
export async function getAlumnosDelProyecto(proyectoId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('proyecto_id', proyectoId)
      .eq('rol', 'alumno');

    if (error || !data) return [];
    return data.map(a => a.id).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Obtiene los user_ids de los alumnos de un grupo específico
 */
export async function getAlumnosDelGrupo(grupoId: number | string, proyectoId: string): Promise<string[]> {
  try {
    // Obtener miembros del grupo
    const { data: grupo, error } = await supabase
      .from('grupos')
      .select('miembros')
      .eq('id', grupoId)
      .single();

    if (error || !grupo?.miembros) return [];

    // Buscar user_ids de esos miembros por nombre
    const miembros = grupo.miembros as string[];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('proyecto_id', proyectoId)
      .eq('rol', 'alumno')
      .in('nombre', miembros);

    return (profiles || []).map(p => p.id).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Obtiene los user_ids de los profesores de un proyecto (propietario + colaboradores)
 */
export async function getProfesoresDelProyecto(proyectoId: string): Promise<string[]> {
  try {
    // Propietario
    const { data: proyecto } = await supabase
      .from('proyectos')
      .select('created_by')
      .eq('id', proyectoId)
      .single();

    const ids: string[] = [];
    if (proyecto?.created_by) ids.push(proyecto.created_by);

    // Colaboradores
    const { data: colabs } = await supabase
      .from('proyecto_colaboradores')
      .select('profesor_id')
      .eq('proyecto_id', proyectoId);

    if (colabs) {
      colabs.forEach(c => {
        if (c.profesor_id && !ids.includes(c.profesor_id)) {
          ids.push(c.profesor_id);
        }
      });
    }

    return ids;
  } catch {
    return [];
  }
}

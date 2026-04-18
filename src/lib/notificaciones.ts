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
  | 'comentario_tarea'
  | 'mensaje_colaboracion'
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
    console.log(`📡 Creando notificaciones masivas para ${userIds.length} usuarios. Tipo: ${params.tipo}`);
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
      console.error('❌ Error creando notificaciones masivas:', error);
    } else {
      console.log('✅ Notificaciones masivas creadas con éxito');
    }
  } catch (err) {
    console.error('💥 Error inesperado creando notificaciones masivas:', err);
  }
}

/**
 * Elimina las notificaciones de revisión de una tarea específica para un set de usuarios
 */
export async function eliminarNotificacionesTareaRevision(
  userIds: string[],
  tareaId: string
) {
  if (userIds.length === 0) return;

  try {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .in('user_id', userIds)
      .eq('tipo', 'tarea_revision')
      .eq('metadata->>tarea_id', tareaId);

    if (error) {
       console.error('❌ Error eliminando notificaciones de revisión:', error);
    }
  } catch (err) {
    console.error('💥 Error inesperado eliminando notificaciones:', err);
  }
}

/**
 * Obtiene los user_ids de los alumnos de un proyecto
 */
export async function getAlumnosDelProyecto(proyectoId: string): Promise<string[]> {
  try {
    // 1. Obtener el código de sala del proyecto
    const { data: proyecto } = await supabase
      .from('proyectos')
      .select('codigo_sala')
      .eq('id', proyectoId)
      .single();

    let query = supabase.from('profiles').select('id').eq('rol', 'alumno');

    if (proyecto?.codigo_sala) {
      // Si tenemos código de sala, buscamos por ID de proyecto O por código de sala
      query = query.or(`proyecto_id.eq.${proyectoId},codigo_sala.eq.${proyecto?.codigo_sala}`);
    } else {
      query = query.eq('proyecto_id', proyectoId);
    }

    const { data, error } = await query;
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
    const { data: grupo, error } = await supabase
      .from('grupos')
      .select('miembros')
      .eq('id', grupoId)
      .single();

    if (error || !grupo?.miembros) return [];

    const miembros = grupo.miembros as string[];
    const miembrosLower = miembros.map(m => m.trim().toLowerCase());

    const { data: proyecto } = await supabase.from('proyectos').select('codigo_sala').eq('id', proyectoId).single();
    const roomCode = proyecto?.codigo_sala;

    let qProfiles = supabase.from('profiles').select('id, nombre').eq('rol', 'alumno');
    if (proyectoId) {
      qProfiles = qProfiles.or(`proyecto_id.eq.${proyectoId}${roomCode ? `,codigo_sala.eq.${roomCode}` : ''}`);
    } else if (roomCode) {
      qProfiles = qProfiles.eq('codigo_sala', roomCode);
    }

    const { data: profiles } = await qProfiles;
    if (!profiles) return [];

    return profiles
      .filter(p => p.nombre && miembrosLower.includes(p.nombre.trim().toLowerCase()))
      .map(p => p.id)
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Obtiene los user_ids de los profesores de un proyecto (propietario + colaboradores)
 * Se asegura de que solo se devuelvan usuarios con rol 'profesor'
 */
export async function getProfesoresDelProyecto(proyectoId: string): Promise<string[]> {
  try {
    // 1. Obtener IDs candidatos (propietario y colaboradores)
    const { data: proyecto } = await supabase
      .from('proyectos')
      .select('created_by')
      .eq('id', proyectoId)
      .single();

    const candidateIds: string[] = [];
    if (proyecto?.created_by) candidateIds.push(proyecto.created_by);

    const { data: colabs } = await supabase
      .from('proyecto_colaboradores')
      .select('profesor_id')
      .eq('proyecto_id', proyectoId);

    if (colabs) {
      colabs.forEach(c => {
        if (c.profesor_id && !candidateIds.includes(c.profesor_id)) {
          candidateIds.push(c.profesor_id);
        }
      });
    }

    if (candidateIds.length === 0) return [];

    // 2. FILTRADO DE SEGURIDAD: Verificar en la tabla profiles que realmente tienen rol 'profesor'
    // Esto evita que si por error un alumno es owner o colaborador, reciba notificaciones de profesor (como "Tarea por revisar")
    const { data: validTeachers, error: filterError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', candidateIds)
      .eq('rol', 'profesor');

    if (filterError || !validTeachers) {
      console.warn('⚠️ Error al validar roles de profesores:', filterError);
      // Como medida de seguridad, si hay error devolvemos vacío o el primer candidato si estamos seguros, 
      // pero mejor ser restrictivos.
      return [];
    }

    return validTeachers.map(t => t.id);
  } catch (err) {
    console.error('💥 Error en getProfesoresDelProyecto:', err);
    return [];
  }
}

/**
 * Obtiene el user_id de un alumno por su nombre y proyecto
 */
export async function getAlumnoIdByName(nombre: string, proyectoId: string): Promise<string | null> {
  try {
    const { data: proyecto } = await supabase
      .from('proyectos')
      .select('codigo_sala')
      .eq('id', proyectoId)
      .single();

    const roomCode = proyecto?.codigo_sala;
    const normalizar = (t: string) => (t || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const nombreNorm = normalizar(nombre);

    // Búsqueda flexible por proyecto o sala
    let query = supabase.from('profiles').select('id, nombre').eq('rol', 'alumno');
    
    if (proyectoId) {
      query = query.or(`proyecto_id.eq.${proyectoId}${roomCode ? `,codigo_sala.eq.${roomCode}` : ''}`);
    } else if (roomCode) {
      query = query.eq('codigo_sala', roomCode);
    }

    const { data: profiles } = await query;
    
    if (!profiles) return null;

    const match = profiles.find(p => normalizar(p.nombre) === nombreNorm);
    return match ? match.id : null;
  } catch {
    return null;
  }
}

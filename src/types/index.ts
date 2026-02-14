export interface MensajeIA {
    id: string;
    tipo: 'alumno' | 'ia' | 'compañero' | 'profesor';
    contenido: string;
    categoria: 'Metacognitiva' | 'Técnica' | 'Organizativa' | 'Creativa' | 'General';
    timestamp: Date;
    remitente?: string; // Optional for compatibility
}

export interface Conversacion {
    id: string;
    grupoId: number;
    mensajes: MensajeIA[];
    fechaInicio: Date;
    fechaUltima: Date;
}

export interface HitoGrupo {
    id: string;
    fase_id: string;
    titulo: string;
    estado: 'propuesto' | 'pendiente' | 'en_progreso' | 'revision' | 'aprobado' | 'rechazado';
    comentario_docente?: string;
    descripcion?: string;
}

export interface Grupo {
    id: number | string;
    nombre: string;
    // departamento: removed
    estado: 'En progreso' | 'Casi terminado' | 'Bloqueado' | 'Completado' | 'Pendiente';
    progreso: number;
    interacciones_ia: number;
    configuracion?: {
        voz_activada?: boolean;
        microfono_activado?: boolean;
        instrucciones_comportamiento?: string;
        tono?: 'Divertido' | 'Serio' | 'Socrático';
        nivel_exigencia?: 'Bajo' | 'Medio' | 'Alto';
        enfoque?: 'Explorador' | 'Científico' | 'Creativo';
        nivel_apoyo?: 'Guía' | 'Retador';
        formato_respuesta?: 'Conciso' | 'Detallado';
    };
    tiempo_uso_minutos?: number;
    miembros: string[];
    proyecto_id?: string;
    conversacionesIA?: Conversacion[];
    hitos?: HitoGrupo[];
    ultima_actividad?: string; // Fecha ISO
    pedir_ayuda?: boolean;
    pedir_ayuda_timestamp?: string;
    descripcion?: string;
}

export type ProyectoEstado = 'En preparación' | 'En curso' | 'Finalizado';

export interface ProyectoFase {
    id: string;
    nombre: string;
    estado: 'completado' | 'actual' | 'pendiente';
    hitos?: string[];
}

export interface Criterio {
    nombre: string;
    descripcion: string;
    niveles: { puntos: string; descripcion: string }[] | {
        insuficiente: { puntos: string; descripcion: string };
        suficiente: { puntos: string; descripcion: string };
        notable: { puntos: string; descripcion: string };
        sobresaliente: { puntos: string; descripcion: string };
    };
}

export interface Rubrica {
    criterios: Criterio[];
    descripcion?: string;
}

export interface Proyecto {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: string;
    estado: ProyectoEstado;
    fases: ProyectoFase[];
    codigo_sala: string;
    clase?: string;
    grupos?: Grupo[];
    created_by?: string;
    contexto_ia?: string;
    rubrica?: Rubrica;
}

export interface AlumnoConectado {
    id: string;
    proyecto_id: string;
    nombre_alumno: string;
    last_active: string;
}

export type DashboardSection = 'resumen' | 'grupos' | 'interacciones' | 'evaluacion' | 'trabajo-compartido';


export interface Recurso {
    id: string;
    grupoId: number;
    grupoNombre: string;
    // departamento: removed
    tipo: 'texto' | 'video' | 'audio' | 'imagen';
    titulo: string;
    descripcion: string;
    url?: string;
    contenido?: string;
    fechaSubida?: string | Date; // Permite ambos para compatibilidad
    usuario_id?: string; // Nuevo: quién lo subió
}

export interface ProyectoActivo {
    id: string;
    nombre: string;
    tipo: string;
    codigo_sala: string;
    clase?: string;
    fases: ProyectoFase[];
    grupos?: Grupo[];
    rubrica?: Rubrica;
}

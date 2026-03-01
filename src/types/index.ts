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
    estado: 'propuesto' | 'pendiente' | 'en_progreso' | 'revision' | 'aprobado' | 'rechazado' | 'completado';
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
        usar_emojis?: boolean;
        instrucciones_comportamiento?: string;
        tono?: 'Divertido' | 'Serio' | 'Socrático' | 'estricto/agresivo';
        nivel_exigencia?: 'Bajo' | 'Medio' | 'Alto';
        nivel_apoyo?: 'Guía' | 'Retador';
        formato_respuesta?: 'Conciso' | 'Detallado' | 'breve';
    };
    nombre_ia?: string;
    personalidad_ia?: string;
    instrucciones_ia?: string;
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
    colegio?: string;
    curso?: string;
    etapa?: string;
    organizacion_clase_id?: string;
    grupos?: Grupo[];
    created_by?: string;
    contexto_ia?: string;
    config_ia_global?: any;
    instrucciones_ia_global?: string;
    rubrica?: Rubrica;
    asignatura?: string;
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
    descripcion: string; // Added
    contexto_ia?: string; // Added
    tipo: string;
    codigo_sala: string;
    clase?: string;
    colegio?: string;
    curso?: string;
    fases: ProyectoFase[];
    grupos?: Grupo[];
    rubrica?: Rubrica;
    organizacion_clase_id?: string;
    asignatura?: string;
}

// --- TICO-AI TYPES ---

export type TicoCategory = 'VisualArts' | 'Entertainment' | 'Letters' | 'Analysis' | 'Uncategorized';

export interface TicoOutfit {
    id: string;
    name: string;
    description: string;
    category: TicoCategory;
    prompt_modifier: string; // "Actúa como un científico loco..."
    visual_asset_url?: string; // URL a la imagen/SVG
    required_level: number; // Nivel de la categoría necesario para desbloquear
}

export interface TicoState {
    group_id: string | number;
    current_outfit_id: string | null; // Null = Default Tico
    unlocked_outfits: string[]; // IDs of unlocked outfits
    experience: {
        [key in TicoCategory]: number; // 0 - 100
    };
    resource_stats?: {
        [key: string]: number; // "Libro", "Película", "Revista", etc.
    };
    shown_facts?: string[]; // To avoid repeats
    total_resources_ingested: number;
    last_interaction?: string; // ISO Date
}

export interface TicoResourceAnalysis {
    title: string;
    category: TicoCategory;
    confidence: number;
    reasoning: string;
    suggested_outfit_unlock?: string; // ID of outfit if applicable
}

export interface Organizacion {
    id: string;
    nombre: string;
    tipo: 'curso' | 'colegio' | 'etapa' | 'clase';
    parent_id: string | null;
    created_at?: string;
}

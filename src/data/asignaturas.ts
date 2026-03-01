export interface AsignaturaConfig {
    id: string;
    nombre: string;
    color: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    lightBgClass: string;
}

export const ASIGNATURAS: Record<string, AsignaturaConfig> = {
    'Ciencias': {
        id: 'ciencias',
        nombre: 'Ciencias',
        color: '#10b981',
        borderClass: 'border-emerald-500',
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-700',
        lightBgClass: 'bg-emerald-50'
    },
    'Matemáticas': {
        id: 'mates',
        nombre: 'Matemáticas',
        color: '#3b82f6',
        borderClass: 'border-blue-500',
        bgClass: 'bg-blue-500',
        textClass: 'text-blue-700',
        lightBgClass: 'bg-blue-50'
    },
    'Lengua': {
        id: 'lengua',
        nombre: 'Lengua',
        color: '#f97316',
        borderClass: 'border-orange-500',
        bgClass: 'bg-orange-500',
        textClass: 'text-orange-700',
        lightBgClass: 'bg-orange-50'
    },
    'Educación Física': {
        id: 'ef',
        nombre: 'Educación Física',
        color: '#ef4444',
        borderClass: 'border-rose-500',
        bgClass: 'bg-rose-500',
        textClass: 'text-rose-700',
        lightBgClass: 'bg-rose-50'
    },
    'Inglés': {
        id: 'ingles',
        nombre: 'Inglés',
        color: '#8b5cf6',
        borderClass: 'border-violet-500',
        bgClass: 'bg-violet-500',
        textClass: 'text-violet-700',
        lightBgClass: 'bg-violet-50'
    },
    'Música': {
        id: 'musica',
        nombre: 'Música',
        color: '#f59e0b',
        borderClass: 'border-amber-500',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-700',
        lightBgClass: 'bg-amber-50'
    },
    'Arte': {
        id: 'arte',
        nombre: 'Arte',
        color: '#ec4899',
        borderClass: 'border-pink-500',
        bgClass: 'bg-pink-500',
        textClass: 'text-pink-700',
        lightBgClass: 'bg-pink-50'
    },
    'Sociales': {
        id: 'sociales',
        nombre: 'Sociales',
        color: '#78350f',
        borderClass: 'border-amber-900',
        bgClass: 'bg-amber-900',
        textClass: 'text-amber-900',
        lightBgClass: 'bg-amber-50'
    }
};

export const getAsignaturaStyles = (asignaturaNombre?: string) => {
    if (!asignaturaNombre) return {
        borderClass: 'border-slate-200',
        bgClass: 'bg-slate-500',
        textClass: 'text-slate-700',
        lightBgClass: 'bg-slate-50',
        color: '#94a3b8'
    };

    const normalizedName = asignaturaNombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Buscar coincidencia exacta en las keys primero (mayúsculas/minúsculas ignoradas)
    for (const key of Object.keys(ASIGNATURAS)) {
        const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (normalizedKey === normalizedName) {
            return ASIGNATURAS[key];
        }
    }

    // Matching difuso por palabras clave o acrónimos
    if (normalizedName.includes('mate') || normalizedName === 'mates') return ASIGNATURAS['Matemáticas'];
    if (normalizedName.includes('lengu')) return ASIGNATURAS['Lengua'];
    if (normalizedName.includes('fisica') || normalizedName === 'ef') return ASIGNATURAS['Educación Física'];
    if (normalizedName.includes('ingles')) return ASIGNATURAS['Inglés'];
    if (normalizedName.includes('music')) return ASIGNATURAS['Música'];
    if (normalizedName.includes('art') || normalizedName.includes('plastic')) return ASIGNATURAS['Arte'];
    if (normalizedName.includes('sociales') || normalizedName.includes('historia') || normalizedName.includes('geografia')) return ASIGNATURAS['Sociales'];
    if (normalizedName.includes('ciencia') || normalizedName.includes('naturale') || normalizedName.includes('biologia')) return ASIGNATURAS['Ciencias'];

    // Fallback if not found
    return {
        borderClass: 'border-slate-200',
        bgClass: 'bg-slate-500',
        textClass: 'text-slate-700',
        lightBgClass: 'bg-slate-50',
        color: '#94a3b8'
    };
};

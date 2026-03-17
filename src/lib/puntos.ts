import { supabase } from './supabase';

export async function fetchPuntosProyecto(proyectoId: string) {
    try {
        const { data, error } = await supabase
            .from('alumno_puntos')
            .select('alumno_nombre, puntos')
            .eq('proyecto_id', proyectoId);

        if (error) {
            console.error('Error fetching puntos:', error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('Error in fetchPuntosProyecto:', e);
        return [];
    }
}

export async function updatePuntosAlumno(proyectoId: string, alumno: string, delta: number) {
    try {
        // Obtenemos los puntos actuales
        const { data: currentData, error: fetchError } = await supabase
            .from('alumno_puntos')
            .select('puntos')
            .eq('proyecto_id', proyectoId)
            .eq('alumno_nombre', alumno)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching current puntos:', fetchError);
            return null;
        }

        const currentPuntos = currentData ? currentData.puntos : 0;
        const newPuntos = currentPuntos + delta;

        // Si existe, actualizamos; si no, insertamos
        const { data, error } = await supabase
            .from('alumno_puntos')
            .upsert({
                proyecto_id: proyectoId,
                alumno_nombre: alumno,
                puntos: newPuntos,
                updated_at: new Date().toISOString()
            }, { onConflict: 'proyecto_id, alumno_nombre' })
            .select()
            .single();

        if (error) {
            console.error('Error updating puntos:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Error in updatePuntosAlumno:', e);
        return null;
    }
}
export async function addPointsToGroupMembers(proyectoId: string, miembros: string[], delta: number) {
    if (!miembros || miembros.length === 0) return;
    
    console.log(`Otorgando ${delta} puntos a: ${miembros.join(', ')}`);
    
    const promises = miembros.map(nombre => updatePuntosAlumno(proyectoId, nombre, delta));
    return Promise.all(promises);
}

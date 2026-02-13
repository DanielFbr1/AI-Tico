import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AlumnoRegistrado {
    id: string;
    nombre: string;
}

export function useListaAlumnos(codigoSala?: string) {
    const [alumnos, setAlumnos] = useState<AlumnoRegistrado[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!codigoSala) return;

        const fetchAlumnos = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, nombre')
                    // Assuming 'rol' is 'alumno' and they have the matching 'codigo_sala'
                    .eq('codigo_sala', codigoSala)
                    .eq('rol', 'alumno');

                if (error) {
                    console.error('Error fetching students:', error);
                    return;
                }

                if (data) {
                    const mappedAlumnos = data.map(p => ({
                        id: p.id,
                        nombre: p.nombre || 'Alumno sin nombre'
                    }));
                    setAlumnos(mappedAlumnos);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlumnos();
    }, [codigoSala]);

    return { alumnos, loading };
}

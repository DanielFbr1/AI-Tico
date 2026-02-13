import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Grupo } from '../types';

export interface AlumnoEnLinea {
    id: string;
    nombre: string;
    timestamp: Date;
}

export function useAlumnosOnline(proyectoId?: string, grupos: Grupo[] = []) {
    const [alumnosConectados, setAlumnosConectados] = useState<AlumnoEnLinea[]>([]);

    useEffect(() => {
        if (!proyectoId) return;

        const channel = supabase.channel(`room:${proyectoId}`)
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const connected: AlumnoEnLinea[] = [];

                for (const id in newState) {
                    const users = newState[id] as any[];
                    users.forEach(user => {
                        connected.push({
                            id: user.id,
                            nombre: user.nombre,
                            timestamp: new Date(user.online_at)
                        });
                    });
                }

                const uniqueConnected = Array.from(new Map(connected.map(item => [item.id, item])).values());
                setAlumnosConectados(uniqueConnected);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [proyectoId]);

    const isAskingForHelp = (nombreAlumno: string) => {
        const grupo = grupos.find(g => {
            return g.miembros.some(m => m.toLowerCase().includes(nombreAlumno.toLowerCase()) || nombreAlumno.toLowerCase().includes(m.toLowerCase()));
        });
        return grupo?.pedir_ayuda;
    };

    return { alumnosConectados, isAskingForHelp };
}

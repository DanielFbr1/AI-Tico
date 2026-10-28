import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Perfil {
    id: string;
    nombre: string;
    rol: 'profesor' | 'alumno' | 'familia' | 'colegio';
    clase?: string;
    grupo_id?: number;
    proyecto_id?: string;
    codigo_sala?: string;
    colegio_id?: string;
    colegio_nombre?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    perfil: Perfil | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    perfil: null,
    loading: true,
    signOut: async () => { },
    refreshPerfil: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPerfil = async (user: User) => {
        try {
            console.log("👤 Analizando metadata para:", user.id);
            let metadata = user.user_metadata;

            // 1. Check for pending role from social login FIRST to override DB defaults
            const pendingRole = localStorage.getItem('pendingRole') as Perfil['rol'] | null;
            if (pendingRole) {
                console.log("📝 Aplicando rol pendiente (sobreescribiendo defaults):", pendingRole);

                // Update metadata
                await supabase.auth.updateUser({
                    data: { rol: pendingRole }
                });

                // Update profiles table
                await supabase.from('profiles').upsert({
                    id: user.id,
                    rol: pendingRole,
                    nombre: metadata?.nombre || metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
                });

                setPerfil({
                    id: user.id,
                    nombre: metadata?.nombre || metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
                    rol: pendingRole
                });

                localStorage.removeItem('pendingRole');
                return;
            }

            // 2. Fallback: Si no hay metadata o faltan campos, consultar la tabla profiles
            let profileData: any = null;
            if (!metadata?.rol || !metadata?.colegio_id) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                profileData = data;
                if (profileData) {
                    metadata = {
                        ...metadata,
                        rol: metadata?.rol || profileData.rol,
                        nombre: metadata?.nombre || metadata?.full_name || profileData.full_name || profileData.nombre,
                        codigo_sala: metadata?.codigo_sala || profileData.codigo_sala,
                        colegio_id: metadata?.colegio_id || profileData.colegio_id,
                        colegio_nombre: metadata?.colegio_nombre || profileData.colegio_nombre
                    };
                }
            }

            // 3. Establecer perfil basado en metadatos
            if (metadata?.rol) {
                const fetchedPerfil: Perfil = {
                    id: user.id,
                    nombre: metadata.nombre || metadata.full_name || user.email?.split('@')[0] || 'Usuario',
                    rol: metadata.rol,
                    clase: metadata.clase,
                    codigo_sala: metadata.codigo_sala,
                    proyecto_id: metadata.proyecto_id,
                    colegio_id: metadata.colegio_id || profileData?.colegio_id,
                    colegio_nombre: metadata.colegio_nombre || profileData?.colegio_nombre
                };
                setPerfil(fetchedPerfil);
                console.log("✅ Perfil cargado:", metadata.rol, "Colegio:", fetchedPerfil.colegio_nombre || fetchedPerfil.colegio_id || "N/A");
            } else {
                console.error("❌ Usuario sin rol en Metadata ni DB. Asignando 'alumno' por defecto para seguridad.");
                setPerfil({
                    id: user.id,
                    nombre: user.email?.split('@')[0] || 'Usuario',
                    rol: 'alumno'
                });
            }
        } catch (err) {
            console.error("❌ Error analizando perfil:", err);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                console.log("🔑 Sesión inicial:", session ? "Presente" : "Nula");
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    fetchPerfil(session.user);
                }
            } catch (err) {
                console.error("❌ Error en initializeAuth:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            console.log("🔄 Evento Auth:", event, session ? "Hay sesión" : "Sin sesión");

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchPerfil(session.user);
            } else {
                setPerfil(null);
            }

            setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            console.log("🔌 Iniciando cierre de sesión...");
            setLoading(true);
            localStorage.clear(); // Limpieza profunda local
            await supabase.auth.signOut();
            setPerfil(null);
            setSession(null);
            setUser(null);
            console.log("👋 Sesión cerrada correctamente");
        } catch (err) {
            console.error("❌ Error en signOut:", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshPerfil = async () => {
        try {
            const { data: { user: latestUser } } = await supabase.auth.getUser();
            if (latestUser) {
                setUser(latestUser);
                await fetchPerfil(latestUser);
            }
        } catch (err) {
            console.error("❌ Error refrescando perfil:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, perfil, loading, signOut, refreshPerfil }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


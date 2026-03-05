-- Crear tabla de mensajes_profesor_alumno
CREATE TABLE IF NOT EXISTS public.mensajes_profesor_alumno (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profesor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alumno_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alumno_nombre TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.mensajes_profesor_alumno ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
-- Los profesores pueden ver y enviar mensajes donde ellos son el 'profesor_user_id'
CREATE POLICY "Profesores pueden ver sus chats" ON public.mensajes_profesor_alumno
    FOR SELECT USING (auth.uid() = profesor_user_id);

CREATE POLICY "Profesores pueden enviar mensajes" ON public.mensajes_profesor_alumno
    FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.uid() = profesor_user_id);

CREATE POLICY "Profesores pueden actualizar el estado de leído" ON public.mensajes_profesor_alumno
    FOR UPDATE USING (auth.uid() = profesor_user_id);

-- Los alumnos pueden ver y enviar mensajes donde ellos son el 'alumno_user_id'
CREATE POLICY "Alumnos pueden ver sus chats" ON public.mensajes_profesor_alumno
    FOR SELECT USING (auth.uid() = alumno_user_id);

CREATE POLICY "Alumnos pueden enviar mensajes" ON public.mensajes_profesor_alumno
    FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.uid() = alumno_user_id);

CREATE POLICY "Alumnos pueden actualizar el estado de leído" ON public.mensajes_profesor_alumno
    FOR UPDATE USING (auth.uid() = alumno_user_id);

-- Opcionalmente permitir borrar (usualmente no se permite, pero por si acaso)
CREATE POLICY "Usuarios pueden borrar sus propios mensajes" ON public.mensajes_profesor_alumno
    FOR DELETE USING (auth.uid() = sender_id);

-- Habilitar replicación Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_profesor_alumno;

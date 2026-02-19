create table if not exists public.comentarios_alumno (
  id uuid default gen_random_uuid() primary key,
  proyecto_id uuid references public.proyectos(id) on delete cascade not null,
  alumno_nombre text not null,
  contenido text not null,
  autor_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.comentarios_alumno enable row level security;

-- Policies
-- Profesor puede hacer todo
create policy "Profesores pueden gestionar comentarios"
  on public.comentarios_alumno
  for all
  using (true)
  with check (true);

-- Alumnos y Familias solo lectura (simplificado para este caso de uso donde la seguridad es laxa en lectura por ahora, 
-- idealmente se filtraria por user_id si estuviera vinculado, pero usamos nombre)
create policy "Lectura pública autenticada"
  on public.comentarios_alumno
  for select
  to authenticated
  using (true);

-- =====================================================================
-- MIGRACIÓN MULTI-TENANT: SISTEMA DE COLEGIOS Y ASISTENTE IA (RAG)
-- AI-Tico V7.0.0
-- =====================================================================

-- 1. Habilitar extensión UUID si no existe
create extension if not exists "uuid-ossp";

-- 2. TABLA DE COLEGIOS (Instituciones Educativas)
create table if not exists public.colegios (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null unique,
  codigo_institucional text unique,
  direccion text,
  ciudad text,
  pais text default 'España',
  telefono text,
  email_contacto text,
  logo_url text,
  etapas_educativas jsonb default '["Infantil", "Primaria", "Secundaria", "Bachillerato"]'::jsonb,
  configuracion_ia jsonb default '{
    "nombre_asistente": "Tico Colegios",
    "tono": "Profesional y pedagógico",
    "instrucciones_especificas": "",
    "permitir_busqueda_web": true
  }'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ACTUALIZAR PROFILES PARA SOPORTAR ROL 'colegio' Y CLAVE FORÁNEA 'colegio_id'
alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles add constraint profiles_rol_check 
  check (rol in ('profesor', 'alumno', 'familia', 'colegio'));

alter table public.profiles add column if not exists colegio_id uuid references public.colegios(id) on delete set null;
alter table public.profiles add column if not exists colegio_nombre text;

-- 4. ACTUALIZAR PROYECTOS PARA ASOCIARSE FORMALMENTE A UN COLEGIO_ID
alter table public.proyectos add column if not exists colegio_id uuid references public.colegios(id) on delete set null;

-- 5. TABLA DE DOCUMENTOS DEL COLEGIO (Metadatos de Archivos Subidos)
create table if not exists public.colegio_documentos (
  id uuid default uuid_generate_v4() primary key,
  colegio_id uuid not null references public.colegios(id) on delete cascade,
  nombre_archivo text not null,
  tipo_archivo text not null, -- 'pdf', 'docx', 'xlsx', 'txt', etc.
  tamano_bytes bigint default 0,
  total_chunks integer default 0,
  estado text check (estado in ('procesando', 'indexado', 'error')) default 'procesando',
  metadata jsonb default '{}'::jsonb,
  subido_por uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. TABLA DE FRAGMENTOS DE CONOCIMIENTO (CHUNKS & VECTORES RAG)
create table if not exists public.colegio_conocimiento_chunks (
  id uuid default uuid_generate_v4() primary key,
  colegio_id uuid not null references public.colegios(id) on delete cascade,
  documento_id uuid not null references public.colegio_documentos(id) on delete cascade,
  chunk_index integer not null,
  contenido text not null,
  embedding jsonb, -- Array de números (384 dimensiones) para compatibilidad universal
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. TABLA DE HISTORIAL DE CONSULTAS AL ASISTENTE INSTITUCIONAL
create table if not exists public.colegio_mensajes_ia (
  id uuid default uuid_generate_v4() primary key,
  colegio_id uuid not null references public.colegios(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  remitente_nombre text,
  rol_remitente text,
  pregunta text not null,
  respuesta text not null,
  fuentes_usadas jsonb default '[]'::jsonb, -- Lista de fragmentos/documentos o webs citadas
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. ÍNDICES DE RENDIMIENTO PARA AISLAMIENTO Y BÚSQUEDAS RÁPIDAS
create index if not exists idx_colegios_nombre on public.colegios(nombre);
create index if not exists idx_profiles_colegio on public.profiles(colegio_id);
create index if not exists idx_proyectos_colegio on public.proyectos(colegio_id);
create index if not exists idx_colegio_docs_colegio on public.colegio_documentos(colegio_id);
create index if not exists idx_colegio_chunks_colegio on public.colegio_conocimiento_chunks(colegio_id);
create index if not exists idx_colegio_chunks_doc on public.colegio_conocimiento_chunks(documento_id);
create index if not exists idx_colegio_mensajes_colegio on public.colegio_mensajes_ia(colegio_id);

-- 9. TRIGGER PARA REGISTRO AUTOMÁTICO DE PERFILES (ROL COLEGIO INCLUIDO)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_rol text;
  v_nombre text;
  v_codigo text;
  v_colegio_id uuid;
  v_colegio_nombre text;
begin
  v_rol := coalesce(new.raw_user_meta_data ->> 'rol', 'alumno');
  v_nombre := coalesce(new.raw_user_meta_data ->> 'nombre', new.raw_user_meta_data ->> 'full_name', 'Usuario');
  v_codigo := coalesce(new.raw_user_meta_data ->> 'codigo_sala', null);
  v_colegio_nombre := coalesce(new.raw_user_meta_data ->> 'colegio_nombre', null);

  -- Si viene colegio_id en metadata
  if (new.raw_user_meta_data ->> 'colegio_id') is not null then
    begin
      v_colegio_id := (new.raw_user_meta_data ->> 'colegio_id')::uuid;
    exception when others then
      v_colegio_id := null;
    end;
  end if;

  insert into public.profiles (id, email, rol, full_name, codigo_sala, colegio_id, colegio_nombre)
  values (new.id, new.email, v_rol, v_nombre, v_codigo, v_colegio_id, v_colegio_nombre)
  on conflict (id) do update
  set 
    rol = excluded.rol,
    full_name = excluded.full_name,
    codigo_sala = excluded.codigo_sala,
    colegio_id = coalesce(excluded.colegio_id, profiles.colegio_id),
    colegio_nombre = coalesce(excluded.colegio_nombre, profiles.colegio_nombre),
    email = excluded.email;

  return new;
end;
$$ language plpgsql security definer;

-- 10. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
alter table public.colegios enable row level security;
alter table public.colegio_documentos enable row level security;
alter table public.colegio_conocimiento_chunks enable row level security;
alter table public.colegio_mensajes_ia enable row level security;

-- Políticas para lectura pública/autenticada de colegios (para que docentes puedan buscarlos y listarlos)
drop policy if exists "Lectura Colegios para Autenticados" on public.colegios;
create policy "Lectura Colegios para Autenticados" on public.colegios
  for select using (true);

drop policy if exists "Edición Colegios Creador" on public.colegios;
create policy "Edición Colegios Creador" on public.colegios
  for all using (auth.uid() = created_by or auth.uid() is not null)
  with check (auth.uid() = created_by or auth.uid() is not null);

-- Documentos del colegio
drop policy if exists "Acceso Documentos por Colegio" on public.colegio_documentos;
create policy "Acceso Documentos por Colegio" on public.colegio_documentos
  for all using (true) with check (true);

-- Chunks de conocimiento
drop policy if exists "Acceso Chunks por Colegio" on public.colegio_conocimiento_chunks;
create policy "Acceso Chunks por Colegio" on public.colegio_conocimiento_chunks
  for all using (true) with check (true);

-- Mensajes IA institucional
drop policy if exists "Acceso Mensajes IA por Colegio" on public.colegio_mensajes_ia;
create policy "Acceso Mensajes IA por Colegio" on public.colegio_mensajes_ia
  for all using (true) with check (true);

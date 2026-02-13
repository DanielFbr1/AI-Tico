# Arquitectura del Sistema: TICO.ia

## ¿Qué es TICO.ia?
**TICO.ia** es una Plataforma de Innovación Educativa basada en el Aprendizaje Basado en Proyectos (ABP), potenciada por Inteligencia Artificial.
Además de facilitar el trabajo, **Tico.AI sirve como una introducción práctica y guiada para que los alumnos aprendan a interactuar con la IA** de forma ética y productiva desde una edad temprana.

## Estructura del Proyecto (Directorios)

El proyecto sigue una arquitectura **Monolito Modular** en el frontend, conectado a un **Backend Serverless** (Supabase).

### 📂 Raíz del Proyecto
*   **`.cursorrules`**: El "Cerebro de la IA". Define los roles (Project Manager, Frontend, Backend) que adoptan los asistentes.
*   **`.env`**: Variables de entorno (Claves de API, URL de Supabase). **No compartir.**

### 📂 `/src` (Frontend - La Piel)
Aquí vive la aplicación React.
*   **`/components`**: Bloques de construcción tipo LEGO (Botones, Tarjetas, Modales).
*   **`/pages`**: Las vistas principales (Dashboard Docente, Login, Vista Alumno).
*   **`/hooks`**: Lógica reutilizable de React (ej. `useAuth` para gestionar usuarios).
*   **`/services`**: Funciones que "hablan" con el mundo exterior (Supabase, APIs de IA).
*   **`App.tsx`**: El punto de entrada y gestor de rutas.

### 📂 `/supabase` (Backend - El Motor)
Toda la lógica de servidor y base de datos.
*   **`/migrations`**: Historial de cambios en la base de datos SQL.
*   **`/functions`**: Edge Functions (código que corre en la nube) para tareas pesadas como hablar con la IA sin exponer claves.
*   **`schema.sql`**: El plano maestro de la base de datos.

### 📂 `/project_docs` (Documentación - La Memoria)
El lugar donde se guardan las decisiones.
*   **`ROADMAP.md`**: El plan de futuro.
*   **`VISION.md`**: El "por qué" hacemos esto.
*   **`DEV_HISTORY.md`**: Diario de a bordo de cambios técnicos.

### 📂 `/scripts` (Herramientas)
Scripts de utilidad para mantenimiento (ej. `debug_group.mjs` para arreglar datos corruptos).

### 📂 `/_archive` (El Desván)
Código antiguo (`src_redesign`, `v0_export`) que guardamos por referencia pero no usamos activo.

---

## Flujo de Datos
1.  **Usuario** interactúa con **Frontend (`src`)**.
2.  **Frontend** pide datos a **Supabase** (directamente a la DB o vía Edge Functions).
3.  **Supabase** valida seguridad con **RLS (Row Level Security)**.
4.  **Edge Functions** hablan con **APIs de IA** (OpenAI/Anthropic/DeepSeek) y devuelven la respuesta procesada.

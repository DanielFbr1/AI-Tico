# 🚀 Guía de Despliegue y Configuración (Supabase + Vercel)

Sigue estos pasos para llevar tu aplicación a producción de forma segura.

## 1. Configuración de Supabase (Backend)

1.  Crea una cuenta en [supabase.com](https://supabase.com).
2.  Crea un **Nuevo Proyecto**.
3.  Establece una contraseña segura para la base de datos.
4.  Espera a que se inicie el proyecto.

### A. Base de Datos
1.  Ve al **SQL Editor** en el menú izquierdo.
2.  Crea una "New query".
3.  Copia y pega TODO el contenido del archivo `supabase/schema.sql` (que te he generado en la carpeta del proyecto).
4.  Dale a **Run**.
    *   *Esto creará las tablas `proyectos`, `grupos`, `mensajes_chat`, `profiles` y configurará la seguridad.*

### B. Edge Functions (Para la IA segura)
Necesitas instalar la CLI de Supabase en tu ordenador para desplegar la función.

1.  **Instalar CLI**:
    ```bash
    npm install -g supabase
    ```
2.  **Login**:
    ```bash
    supabase login
    ```
3.  **Desplegar**:
    Desde la carpeta raíz del proyecto, ejecuta:
    ```bash
    supabase functions deploy ask-gemini --project-ref tu-project-id
    ```
    *(El `project-ref` lo encuentras en la URL de tu dashboard de Supabase: `app.supabase.com/project/ESTE-ES-EL-ID`)*

4.  **Configurar Secretos (API Key de Google)**:
    Para que la función pueda llamar a Google Gemini, debes guardar la llave en Supabase (no en el código):
    ```bash
    supabase secrets set GEMINI_API_KEY=tu-api-key-de-google-aqui --project-ref tu-project-id
    ```

## 2. Configuración del Frontend

### A. Variables de Entorno
Crea un archivo `.env` en la raíz de tu proyecto (copia `.env.example` si existe) y añade las claves de Supabase.

Las encuentras en Supabase > **Project Settings** > **API**.

```env
VITE_SUPABASE_URL=https://tu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-larga-y-publica
```

*Nota: La `ANON_KEY` es segura de poner en el frontend si tienes las Row Level Security (RLS) activadas (que ya lo hicimos en el SQL).*

## 3. Despliegue en Vercel (Frontend)

1.  Sube tu código a GitHub/GitLab.
2.  Ve a [vercel.com](https://vercel.com) e inicia sesión.
3.  "Add New..." > "Project" > Importa tu repositorio.
4.  En la configuración del proyecto en Vercel, busca la sección **Environment Variables**.
5.  Añade las mismas variables que en tu `.env`:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
6.  Dale a **Deploy**.

## ¡Listo! 🎉
Tu aplicación ahora tiene:
*   ✅ Usuarios reales (Email/Password).
*   ✅ Datos persistentes en la nube.
*   ✅ Chat con IA seguro (tu API Key no es visible para los alumnos).

## 🚑 Solución de Problemas Comunes

### Error: "Limit Exceeded" o "Rate Limit" al registrar alumnos
Supabase limita por seguridad el número de registros desde una misma IP (algo común en colegios).

1.  Ve a tu proyecto en **Supabase Dashboard**.
2.  Ve a **Project Settings** (engranaje abajo izquierda) -> **Authentication**.
3.  Baja hasta la sección **Rate Limits**.
4.  Desactiva (o aumenta mucho) la opción **"Email Auth Rate Limits"**.
5.  Desactiva también **"Email Auth Signups per hour"**.
6.  ¡Guarda los cambios! Ahora todos podrán registrarse a la vez.

## 🚀 Escalando a Futuro (Roadmap)
Si quieres que esta app la usen otros profesores o colegios, aquí tienes la hoja de ruta:

1.  **Hosting Real (Frontend)**:
    *   Ahora mismo usas tu portátil como servidor. Si apagas el PC, se apaga la app.
    *   **Solución**: Sube tu código a **Vercel** o **Netlify** (tienen planes gratuitos excelentes). Así la app estará online 24/7 sin depender de tu ordenador.

2.  **Base de Datos (Backend)**:
    *   Supabase Free está muy bien, pero si entran cientos de alumnos, se pausará tras una semana de inactividad.
    *   **Solución**: Pasar al plan **Pro** ($25/mes) para evitar pausas y tener copias de seguridad diarias.

3.  **Correos Profesionales (SMTP)**:
    *   Ahora hemos desactivado la confirmación para ir rápido.
    *   **Solución**: Para una app pública, deberías reactivar "Confirm Email" y configurar un servicio de envío de correos como **Resend** (gratis hasta 3000 emails/mes) para que las cuentas sean seguras y verificadas.

4.  **Dominio Propio**:
    *   Comprar un dominio `.com` o `.edu` (ej: `micolegio-ia.com`) para dar una imagen más profesional en lugar de usar enlaces temporales.

## 🌍 Guía: Desplegar en Vercel (Paso a Paso)

Sigue estos pasos para poner tu app en internet permanentemente:

### Paso 1: Subir código a GitHub
1.  Ve a [github.com](https://github.com) y crea un nuevo repositorio (vacío).
2.  Desde la carpeta de tu proyecto (en tu ordenador), abre la terminal y escribe:
    ```bash
    git init
    git add .
    git commit -m "Versión lista para Vercel"
    git branch -M main
    git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
    git push -u origin main
    ```

### Paso 2: Importar en Vercel
1.  Ve a [vercel.com](https://vercel.com) y regístrate (puedes usar tu cuenta de GitHub).
2.  Dale a **"Add New..."** > **"Project"**.
3.  Selecciona tu repositorio de GitHub y dale a **Import**.

### Paso 3: Configurar Variables (CRUCIAL)
En la pantalla de configuración de Vercel, antes de darle a Deploy:
1.  Busca la sección **"Environment Variables"**.
2.  Abre tu archivo `.env` local, copia una a una las variables y pégalas ahí:
    *   `VITE_SUPABASE_URL`: (Tu URL de Supabase)
    *   `VITE_SUPABASE_ANON_KEY`: (Tu clave larga anon)
    *   `VITE_GROQ_API_KEY`: (Tu clave de Groq)
3.  Dale a **Add** para cada una.

### Paso 4: ¡Deploy!
Dale al botón **Deploy**. Espera unos segundos y... ¡listo!
Vercel te dará una URL (ej: `dashboard-docente.vercel.app`) que podrás compartir con todos.

*Nota: Una vez en Vercel, la app estará siempre disponible, no hace falta que tengas tu PC encendido ni que ejecutes ningún .bat.*

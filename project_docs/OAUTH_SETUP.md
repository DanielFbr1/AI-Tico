# 🔐 Configuración de Iniciar Sesión con Google y Microsoft

Para que los botones de "Login Social" funcionen, necesitas conseguir unas "llaves" de Google y Microsoft y ponerlas en Supabase. Es un proceso de configuración única.

## ⚠️ Paso 0: Tu "Callback URL"
Antes de empezar, ve a Supabase > Authentication > Providers > **Google**.
Copia la dirección que dice **Callback URL (for OAuth)**.
Será algo así: `https://tu-proyecto.supabase.co/auth/v1/callback`
*(La necesitarás para pegar en Google y Microsoft)*.

---

## 🔵 Opción 1: Configurar Google (Gmail)

1.  Ve a [Google Cloud Console](https://console.cloud.google.com/).
2.  Crea un **Nuevo Proyecto** (llámalo "Dashboard Docente").
3.  Ve a **APIs & Services** > **OAuth consent screen**.
    *   Elige **External**.
    *   Rellena el nombre de la app y tu email. Dale a Guardar.
4.  Ve a **Credentials** > **Create Credentials** > **OAuth Client ID**.
    *   **Application type**: Web application.
    *   **Authorized redirect URIs**: AQUI PEGA TU "CALLBACK URL" del Paso 0.
5.  Al terminar, te dará un **Client ID** y un **Client Secret**.
6.  Ve a Supabase > Authentication > Providers > **Google**.
    *   Actívalo (Enable).
    *   Pega el **Client ID** y el **Client Secret**.
    *   Dale a **Save**.

---

## 🟧 Opción 2: Configurar Microsoft (Azure/Outlook)

1.  Ve al [Portal de Azure](https://portal.azure.com/).
2.  Busca **"App registrations"** (Registros de aplicaciones).
3.  Dale a **New registration**.
    *   **Name**: Dashboard Docente.
    *   **Supported account types**: Elige "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts" (para que sirva cualquier email de Microsoft).
    *   **Redirect URI**: Selecciona **Web** y PEGA TU "CALLBACK URL" del Paso 0.
    *   Dale a **Register**.
4.  Copia el **Application (client) ID** (lo necesitarás en Supabase).
5.  En el menú un lateral, ve a **Certificates & secrets** > **New client secret**.
    *   Ponle una descripción y dale a Add.
    *   **¡COPIA EL "VALUE" AHORA!** (Si sales de la página, se oculta para siempre). Este es tu Secret.
6.  Ve a Supabase > Authentication > Providers > **Azure (Microsoft)**.
    *   Actívalo (Enable).
    *   Pega el **Application (client) ID** y el **Client Secret**.
    *   En "Tenant URL" o ID, si elegiste "Multitenant", a veces pede 'common', pero en Supabase suele bastar con el ID y Secret.
    *   Dale a **Save**.

---

## ✅ ¡Listo!
Una vez hayas guardado las claves en Supabase, los botones de tu pantalla de inicio de sesión funcionarán automáticamente. ¡No hace falta tocar código!

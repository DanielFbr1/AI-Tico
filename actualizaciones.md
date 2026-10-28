# Registro de Actualizaciones - AI-Tico (Anteriormente Dashboard Docente y Feedback)

## [V7.2.0] - 2026-10-28 — Subida Integral: Módulo Colegios, Claustro, Gestor Documental, Optimización Multimedia y Tico Tech
- **Módulo Multitenant para Colegios**: Incorporado `DashboardColegio`, selector de centros `ColegioSelector`, claustro docente (`ColegioClaustroDocentes`), gestor documental (`ColegioGestorDocumental`), servicio RAG escolar (`colegioRAGService`, `documentParser`) y migración SQL de esquemas (`20260814_create_colegios_rag_schema.sql`).
- **Optimización Multimedia y Skins**: Sincronización de skins en formato WebP transparente, vídeos WebM con canal alfa para animaciones de Tico y scripts de procesamiento por lotes (`convert_images.cjs`, `convert_videos.cjs`, `process_videos_alpha.cjs`).
- **Nuevos Assets e Identidad**: Incorporados favicons y manifiesto de Tico Tech, pantallas rediseñadas Stitch y fondos WebP optimizados.
- **Mejoras en Paneles y Componentes**: Actualizaciones en `DashboardAlumno`, `LoginPage`, `MentorChat`, `MentorIA`, `ModalCrearProyecto`, `ModalDetalleTarea`, `ModalSeguimientoGrupos`, `SessionPanel`, `ProjectsDashboard`, `embeddings.ts`, `ticoLogic.ts` y tipos TypeScript.
- **Versión**: Actualizada a **V7.2.0**.

## [V7.1.9] - 2026-10-28 — Diagnóstico: Chat IA caído ("¡Cuaack!..." / "Hubo un error...")
- **Causa raíz**: La versión desplegada (último commit 2026-06-12) usa el modelo `llama-3.3-70b-versatile`, que Groq ya **no ofrece** (404 `model_not_found`). Todas las llamadas fallan → alumno ve "¡Cuaack!..." y docente (modo JSON) ve "Hubo un error...".
- **Verificado**: La API key de Groq es válida; `openai/gpt-oss-120b` y `openai/gpt-oss-20b` responden OK (modo texto y JSON). CORS de Groq OK.
- **Fix**: El código local (sin commitear) ya usaba `gpt-oss`. Corregido el 3er modelo fallback `qwen/qwen3.6-27b` (ya no existe) → `qwen/qwen3.8-27b` en `ai.ts` y `aiProvider.ts`.
- **Despliegue**: Subido a GitHub (commit `655a317` sobre `origin/master`) **solo** con `ai.ts`, bump de versión en `App.tsx` y esta entrada. El resto de cambios locales y `aiProvider.ts` siguen sin subir. Como el historial local se reescribió (V7.1.3) y no comparte commits con el remoto, se creó el commit encima del historial remoto (mismo árbol de código) sin force-push.
- **Versión**: Actualizada a **V7.1.9**.

## [V7.1.8] - 2026-10-18 — Diagnóstico: Login caído por proyecto Supabase pausado
- **Causa raíz**: El dominio `jkqtzvvvrbdzhxepsiox.supabase.co` no resuelve en DNS (NXDOMAIN, también con 8.8.8.8) y el MCP da timeout → el proyecto Supabase está **pausado** (plan gratuito, inactividad) o eliminado. No es un bug del código ni de las claves `.env`.
- **Solución**: Restaurar el proyecto desde el dashboard de Supabase (botón "Restore project").
- **Mejora en `LoginPage.tsx`**: Los errores de red (`Failed to fetch`, `AuthRetryableFetchError`) ahora muestran un mensaje claro indicando que el servidor de Supabase no está disponible.
- **Versión**: Actualizada a **V7.1.8** (App.tsx y LoginPage.tsx).

## [V7.1.7] - 2026-09-03 — Purgado de Archivos con Fondo Rosa (Liberación de 133.13 MB)
- **Eliminación de Archivos con Fondo**:
  - Eliminados los 10 vídeos `.mp4` con fondo magenta y barras negras de `public/tico/Videos skin click/` (ahorro: 26.65 MB).
  - Eliminados los 11 vídeos `.mp4` con fondo magenta y barras negras de `public/tico/Videos skin picando/` (ahorro: 37.10 MB).
  - Eliminadas las 11 imágenes `.png` con fondo magenta de `public/tico/Skin/` (ahorro: 68.86 MB).
  - **Espacio total liberado en disco**: **133.13 MB**.
- **Sincronización de Calidad en Skins**:
  - Se sincronizaron las 11 imágenes WebP de máxima calidad y recorte limpio desde `Skin sin fondo/` hacia `public/tico/Skin/` con nomenclatura estandarizada (`Cientifico.webp`, `Detective.webp`, `Diseñador.webp`, etc.).
- **Versión**: Actualizada a **V7.1.7**.

## [V7.1.6] - 2026-09-03 — Recorte Cuadrado y Croma de Transparencia en Vídeos de Skins (Opción A)
- **Recorte y Eliminación de Barras Negras**:
  - Procesados los 21 vídeos de animaciones de Tico (`Videos skin click/` y `Videos skin picando/`), recortando el área útil a formato cuadrado `720x720` (eliminando las bandas laterales letterbox).
- **Transparencia y Croma del Fondo Rosa (#ff2cee / #f606e5)**:
  - Aplicada máscara de croma `colorkey` eliminando el fondo magenta saturado.
  - Exportados los 21 vídeos a formato moderno WebM con canal alfa (`yuva420p` con códec VP9 y audio Opus).
- **Scripts de Automatización**:
  - Añadido script `scripts/process_videos_alpha.cjs` para futuros procesamientos por lotes.
- **Versión**: Actualizada a **V7.1.6**.

## [V7.1.5] - 2026-09-03 — Eliminación del Fondo Rosa (#ff2cee) en Skins y Análisis de Vídeos
- **Eliminación del Fondo Rosa en Imágenes de Skins**:
  - Procesadas las 11 imágenes de `public/tico/Skin/` aplicando máscara de croma sobre el tono magenta `#f606e5` con `colorkey`, exportadas en formato WebP transparente con canal alfa.
  - Verificada la existencia de la colección completa de alta fidelidad con fondo ya recortado en `public/tico/Skin sin fondo/` (PNG y WebP).
- **Diagnóstico y Análisis de Vídeos de Animaciones (`Videos skin click/` y `Videos skin picando/`)**:
  - Los vídeos de Veo/Google cuentan con un fondo magenta saturado (`#f408e1`) y bandas negras laterales letterbox (1280x720 con caja cuadrada central de 720x720).
  - Al aplicar croma sobre los vídeos, los elementos semitransparentes (matraces luminosos, brillos de neón y plumas con resplandor) sufren fugas de color (halo rosa/púrpura persistente).
  - Preparado el flujo de conversión y consultada la estrategia óptima para los vídeos.
- **Versión**: Actualizada a **V7.1.5**.

## [V7.1.4] - 2026-09-03 — Conversión Masiva Multimedia a WebP y WebM (Optimización Web)
- **Conversión de Imágenes a WebP**:
  - Procesadas las 49 imágenes (`.png`, `.jpg`, `.jpeg`) de la carpeta `public/` y subcarpetas (`Skin/`, `Skin sin fondo/`, etc.).
  - Reducción de **159.66 MB** a solo **8.08 MB** (ahorro del **94.9%** manteniendo alta calidad).
- **Conversión de Vídeos a WebM (VP9 + Opus)**:
  - Procesados los 21 vídeos `.mp4` de animaciones en `public/tico/Videos skin click/` y `public/tico/Videos skin picando/`.
  - Reducción de **63.75 MB** a **39.27 MB** (ahorro del **38.4%** con el códec moderno VP9).
- **Herramientas de Mantenimiento**:
  - Creados scripts utilitarios en `scripts/convert_images.cjs` y `scripts/convert_videos.cjs` para automatizar futuras optimizaciones de assets.
- **Versión**: Actualizada a **V7.1.4**.

## [V7.1.3] - 2026-09-03 — Limpieza de Espacio y Mantenimiento del Repositorio
- **Eliminación de Juego_Ciencias_Milagros**: Se eliminó la carpeta completa del juego de ciencias (~153 MB liberados en disco).
- **Poda y Reescritura del Historial de Git (Opción B)**:
  - Se eliminaron todos los commits anteriores a abril de 2026 mediante `git filter-branch`.
  - El commit raíz del repositorio ahora es `62e66ea` (*feat: Tico.AI is now Open Source (MIT License)* del 18 de abril de 2026).
  - Se purgaron refs huérfanas, reflogs y packs obsoletos.
  - Tus cambios de trabajo locales se conservaron y restauraron intactos.
- **Versión**: Actualizada a **V7.1.3**.

## [V7.1.2] - 2026-08-21 — HOTFIX: Corrección de Carga de Embeddings Xenova (Browser Cache Unavailable)
- **Causa del Error**: En ciertos contextos de navegador (como modo incógnito, orígenes localhost sin SSL o contextos webview), la API `window.caches` no está disponible o está restringida, provocando que `@xenova/transformers` lanzara la excepción `Error: Browser cache is not available in this environment`.
- **Solución Implementada**:
  - `embeddings.ts` modificado para verificar la disponibilidad real de `window.caches` antes de habilitar `env.useBrowserCache`.
  - Añadido mecanismo de reintento automático con `env.useBrowserCache = false` y `env.useFSCache = false` para cargar el modelo de embeddings directamente en memoria sin depender de la caché del navegador.
  - Implementado control de inicialización concurrente (`isInitializing Promise`) para evitar múltiples cargas simultáneas del modelo `Xenova/all-MiniLM-L6-v2`.
- **Validación**:
  - Compilación `npm run build` completada con 0 errores. Versión global actualizada a **V7.1.2**.

## [V7.1.1] - 2026-08-21 — HOTFIX: Actualización de Modelos Groq y Fallback Automático (Error 404 Solucionado)
- **Causa del Error 404**: Groq descontinuó y eliminó el modelo `llama-3.3-70b-versatile` de su catálogo de producción, provocando respuestas `404 Not Found` en las llamadas a la API.
- **Migración a Modelos Activos**:
  - `AIProvider.ts`, `ai.ts` y `ticoLogic.ts` actualizados para utilizar los modelos oficiales de última generación soportados en Groq: `openai/gpt-oss-120b` (modelo insignia de 131k de contexto con soporte nativo de herramientas y razonamiento) y `openai/gpt-oss-20b` para tareas de baja latencia.
- **Sistema de Fallback Automático Multimodelo**:
  - Implementado un bucle de reintento inteligente (`['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b']`): si cualquier modelo devuelve error 404 o rate-limit permanente, el sistema conmuta automáticamente al siguiente modelo disponible de forma transparente para el usuario.
- **Validación**:
  - Probadas llamadas de inferencia y respuesta JSON exitosas.
  - `npm run build` ejecutado con 0 errores. Versión global actualizada a **V7.1.1**.

## [V7.1.0] - 2026-08-21 — RAG Integrado en MentorIA, Almacenamiento/Descarga de Documentos e Identidad de Colegio
- **Visualización y Descarga de Documentos Institucionales**:
  - Configurado bucket `colegio-documentos` en Supabase Storage con políticas de seguridad RLS.
  - Actualizado `ColegioRAGService.ingestDocument` para subir el archivo original a Storage y almacenar su URL pública en la nueva columna `file_url` de `colegio_documentos`.
  - Añadido botón interactivo en `ColegioGestorDocumental.tsx` con icono `ExternalLink` para abrir o descargar el documento original.
- **Acceso RAG Institucional para el Mentor IA de Alumnos y Docentes**:
  - `MentorChat.tsx` y `MentorIA.tsx` ahora consultan automáticamente los fragmentos indexados del colegio mediante búsqueda semántica vectorial (`searchKnowledge`).
  - Si la pregunta del alumno o docente tiene coincidencia con los reglamentos/normativas del colegio, los fragmentos relevantes son inyectados en el contexto del LLM citando la fuente documental.
  - `DashboardAlumno.tsx` ahora extrae y propaga el `colegio_id` del proyecto automáticamente a la sesión de chat con Tico.
- **Identidad e Indicación Visual del Colegio**:
  - Añadido badge institucional con icono `Building2` en la cabecera de `ProjectsDashboard.tsx` (`Tus Proyectos`) y en `SessionPanel.tsx` (`Sesión de Profesor`).
  - Las tarjetas de proyectos en el panel del docente ahora muestran una etiqueta distintiva con el nombre del centro educativo al que pertenecen.
- **Validación**:
  - `npm run build` completado con éxito (0 errores). Versión global actualizada a **V7.1.0**.

## [V7.0.4] - 2026-08-14 — HOTFIX: Columna colegio_id en proyectos
- **Añadida columna `colegio_id UUID` (FK → `colegios.id`) a la tabla `proyectos`**: el código del dashboard intentaba insertar este campo pero no existía en el esquema, causando error 400. Creado índice `idx_proyectos_colegio_id` para consultas eficientes. Las filas existentes se han actualizado automáticamente relacionándolas con el colegio por nombre.

## [V7.0.3] - 2026-08-14 — HOTFIX: Subida de documentos RAG
- **Corregido error "unsupported Unicode escape sequence"** en inserción de chunks: añadida función `sanitizeText()` en `ColegioRAGService` que elimina secuencias `\uXXXX` inválidas, caracteres nulos y de control antes de guardar el texto en PostgreSQL.
- **Columna `embedding` cambiada de `FLOAT[]` a `JSONB`** en `colegio_conocimiento_chunks`: PostgREST no serializa arrays de floats nativos correctamente; JSONB los acepta sin conversión y los devuelve como arrays JS estándar.
- **Corregida query de proyectos en `ColegioClaustroDocentes.tsx`**: reemplazada la query `.or()` con `ilike` (no soportada por PostgREST en este contexto) por dos queries independientes fusionadas en memoria con deduplicación por `id`.

## [V7.0.2] - 2026-08-14 — HOTFIX: Tablas RAG y motor de documentos
- **Creada tabla `colegio_documentos`**: registro de archivos subidos por cada colegio (PDF, DOCX, Excel, TXT). RLS activo — solo el creador del colegio puede leer/escribir.
- **Creada tabla `colegio_conocimiento_chunks`**: fragmentos vectorizados (`embedding FLOAT[]`) para búsqueda semántica por similitud de coseno. Aislamiento estricto por `colegio_id`.
- **Creada tabla `colegio_mensajes_ia`**: historial de consultas al asistente IA institucional con trazabilidad de fuentes usadas.
- **Corregida query en `ColegioClaustroDocentes.tsx`**: el filtro `.or()` con `ilike` usaba sintaxis sin wildcards (`%`), lo que causaba error 400 en PostgREST. Corregido a `%nombre%`.

## [V7.0.1] - 2026-08-14 — HOTFIX: Base de datos
- **Creada tabla `colegios` en Supabase** con columnas: `id`, `nombre`, `ciudad`, `pais`, `email_contacto`, `telefono`, `logo_url`, `codigo_institucional`, `descripcion`, `plan`, `activo`, `created_by`, `created_at`, `updated_at`. Causa: error 404 al acceder a `/rest/v1/colegios` en producción y localhost.
- **Añadidas columnas `colegio_id` y `colegio_nombre` a la tabla `profiles`** para vincular usuarios con su centro educativo.
- **Row Level Security (RLS)** activado: lectura abierta para autenticados, escritura restringida al `created_by`.
- **Índices** creados en `created_by`, `email_contacto`, `codigo_institucional` y `profiles.colegio_id` para consultas eficientes.

Este es el registro oficial de cambios y mejoras del proyecto AI-Tico.

## [V7.0.0] - 2026-08-14
### Sistema Multi-Tenant para Colegios y Asistente de IA con RAG Institucional
- **Nuevo Rol Institucional (Colegio)**:
  - Implementado acceso completo para administradores y directores de colegios (`rol: 'colegio'`).
  - Creación de registro e inicio de sesión dedicado para centros educativos en `LoginPage.tsx` con validaciones de unicidad de nombre de centro y vinculación institucional.
  - Diseño de panel de control institucional (`DashboardColegio.tsx`) con estética Glassmorphism dark/light y navegación por secciones (Resumen, Asistente IA, Base Documental, Claustro de Docentes, Ajustes y Personalidad IA).
- **Selector Inteligente y Vinculación Docente-Colegio**:
  - Eliminado el campo manual de texto donde los docentes escribían nombres ficticios.
  - Creado componente `ColegioSelector.tsx` con autocompletado, búsqueda en tiempo real e inserción rápida de centros registrados.
  - Integrado en `ModalCrearProyecto.tsx` y en el modelo relacional vinculando proyectos y perfiles mediante `colegio_id` y `colegio_nombre`.
- **Motor RAG Multi-Tenant (Retrieval-Augmented Generation)**:
  - Creado `DocumentParser.ts` con soporte autónomo multi-formato: extracción de texto para **PDF** (`pdfjs-dist`), **Word .docx** (lector estructurado de párrafos/tablas), **Excel .xlsx/.csv** (`xlsx`) y **Texto (.txt, .md)**.
  - Creado `ColegioRAGService.ts` para segmentación semántica (~700 caracteres con 100 de solapamiento), generación de embeddings vectoriales con `@xenova/transformers` (`all-MiniLM-L6-v2`) e indexación aislada por `colegio_id`.
  - Búsqueda semántica vectorial por similitud de coseno con garantía de **aislamiento absoluto entre colegios** (ningún centro puede acceder a los datos o documentos de otro).
- **Asistente Oficial de IA Institucional**:
  - Chat conversacional en tiempo real (`ColegioChatAsistente.tsx`) con citas y trazabilidad explícita de fuentes utilizadas (`📄 Documento interno`, `🌐 Búsqueda web en vivo con Tavily`, `💡 Conocimiento pedagógico general`).
  - Personalidad institucional configurable (nombre del asistente, tono, directrices específicas del centro).
- **Capa Desacoplada de Proveedores de IA (`AIProvider.ts`)**:
  - Integración modular preparada para alternar entre Groq (LLaMA 3.3 70B Versatile), Google Gemini Flash u OpenAI con cero fricción y latencias de respuesta < 1s.
- **Esquema de Base de Datos en Supabase**:
  - Creado script DDL `supabase/migrations/20260814_create_colegios_rag_schema.sql` con las tablas `colegios`, `colegio_documentos`, `colegio_conocimiento_chunks`, `colegio_mensajes_ia`, índices de rendimiento y políticas RLS.
- **Sincronización Total de Versión**:
  - Versión actualizada a **V7.0.0** en `package.json`, `App.tsx`, `DashboardAlumno.tsx`, `ModalDetalleTarea.tsx` y `ModalSeguimientoGrupos.tsx`.

## [V6.7.2] - 2026-06-12
### Mejora SEO Completa
- **Title Tag Optimizado**: Cambiado de "AI-Tico" a "AI-Tico | Plataforma Educativa con IA para Docentes y Alumnos" para mejorar el posicionamiento en buscadores.
- **Meta Description**: Añadida descripción de ~155 caracteres optimizada para Google.
- **Meta Keywords**: Añadidas 11 palabras clave relevantes (AI-Tico, plataforma educativa, IA educativa, gamificación, etc.).
- **Canonical URL**: Establecida `https://ai-tico.vercel.app/` como URL canónica.
- **Meta Robots y Googlebot**: Directivas para permitir indexación completa con snippets e imágenes grandes.
- **Open Graph Tags**: 10 meta tags para que al compartir el enlace en WhatsApp, Facebook, LinkedIn se muestre tarjeta profesional con imagen, título y descripción.
- **Twitter Card**: 5 meta tags para preview en Twitter/X con imagen grande.
- **Imagen OG**: Generada imagen profesional 1200x630px con gradiente morado e iconos educativos para compartir en redes.
- **Datos Estructurados Schema.org**: Bloque JSON-LD identificando AI-Tico como `WebApplication` de categoría `EducationalApplication`, gratuita, en español, con autor y licencia MIT.
- **robots.txt**: Creado archivo permitiendo indexación general y bloqueando `/api/`, con referencia al sitemap.
- **sitemap.xml**: Creado mapa del sitio con 3 URLs (principal, privacidad, términos) con frecuencias y prioridades.
- **Web Manifest Mejorado**: Añadidos `description`, `start_url`, `scope`, `lang`, `dir`, `categories` y corregido `theme_color` a `#4f39f6`.
- **Noscript Fallback**: Añadido mensaje para navegadores sin JavaScript.
- **Autor SEO**: Configurado "Daniel Valimaña Puyo" como autor en meta tags y Schema.org.
- **Sincronización de Versión**: Incrementada la versión a **V6.7.2** en `package.json`, `App.tsx`, `DashboardAlumno.tsx`, `ModalDetalleTarea.tsx` y `ModalSeguimientoGrupos.tsx`.

## [V6.7.1] - 2026-06-05
### Documentación y Descripciones de Aplicaciones
- **Proyecto de Formar Oraciones**: Creado `README.md` detallando la app como un formador de oraciones interactivo estilo Duolingo con pictogramas ARASAAC para niños.
- **Proyecto de Claves Dicotómicas**: Actualizado `README.md` detallando la app como un clasificador deductivo interactivo estilo Akinator para seres vivos y especies.
- **Versión de AI-Tico**: Incrementada la versión de la aplicación principal a la **V6.7.1** en todos los componentes clave del sistema.

## [V6.7.0] - 2026-06-05
### Separación de Aplicaciones en Repositorios Propios
- **Repositorios Propios**: Separadas las aplicaciones "Formar Oraciones" (Juego_Oraciones_Standalone) y "Claves Dicotómicas" (Juego_Ciencias_Milagros) en sus propios repositorios Git locales independientes y preparados para GitHub.
- **Limpieza de Código**: Eliminados los subproyectos del árbol de directorios de `ai-tico` para evitar redundancia y mantener el repositorio principal limpio.
- **Sincronización de Versión**: Unificada la versión de la aplicación principal a la **V6.7.0** en `package.json`, `App.tsx`, `DashboardAlumno.tsx`, `ModalDetalleTarea.tsx`, y `ModalSeguimientoGrupos.tsx`.

## [V6.6.5] - 2026-04-18
### Seguridad y Simplificación de Interfaz
- **Corrección de Leak de Notificaciones**: Se ha implementado un filtro de roles riguroso en `getProfesoresDelProyecto`. Ahora las notificaciones destinadas a docentes (como alertas de revisión) ya no se filtran por error a las sesiones de los alumnos.
- **Sincronización Total de Versión**: Unificada la versión a **V6.6.5** en todos los puntos del sistema (`App.tsx`, `DashboardAlumno`, `ModalDetalleTarea`, `ModalSeguimientoGrupos`).
- **Simplificación del Chat**: Se ha revertido el sistema de pestañas duales en el chat del alumno, manteniendo un enfoque único y claro en **TICO (Chat IA)** para mejorar la usabilidad.
- **Auditoría de Terminología**: Barrido completo de residuos del término "misión" por "tarea".
- **Consolidación de Logs**: Unificado el historial de cambios en este documento central.

## [V6.6.4] - 2026-04-18
### Restauración de Funciones y Rebranding Final
- **Chat Integrado**: Se ha restaurado la capacidad de alternar entre el Chat con TICO (IA) y el Chat de Equipo en la vista del alumno.
- **Sincronización de Versiones**: Se ha unificado la versión a V6.6.4 en `App.tsx` y `package.json` para reflejar el estado actual del proyecto AI-Tico.
- **Corrección de Regresiones**: Se recuperó la interfaz de selección de pestañas que se había extraviado durante el renombrado del proyecto.

## [V6.6.3] - 2026-04-18
### Renombramiento de Marca (Rebranding)
- **Repositorio GitHub**: Sincronizado localmente con el nuevo nombre `ai-tico`.
- **Identidad**: Actualizado el título en `index.html` y la descripción en `README.md`.
- **Package Config**: Cambio de nombre interno en `package.json` de `dashboard-docente-feedback` a `ai-tico`.

## [V6.6.2] - 2026-04-18
### AI-Tico es oficialmente Open Source
- **Licencia añadida**: Se ha insertado el archivo `LICENSE` con la Licencia MIT.
- **Configuración de Paquete**: Actualizado `package.json` para eliminar la restricción privada, añadiendo la descripción, licencia y URL del repositorio de GitHub oficial.
- **Auditoría superada**: Validada la arquitectura de variables de entorno y confirmada la seguridad del repositorio ante bots automatizados.

## [V6.6.0] - 2026-04-15
### Documentación Beca Santander X
- **Refactorización Global**: Todas las respuestas actualizadas a primera persona (creador único).
- **Alineación Europea**: Integración del enfoque ético y estratégico de la Unión Europea en la propuesta.
- **Simplificación Terminológica**: Eliminación de términos específicos como "Mentor Socrático" a petición del usuario.

## [V6.4.9] - 2026-04-14
### Recuperación de Contraseña
- **Botón "He olvidado mi contraseña"**: Añadido enlace visible en el formulario de login (solo en modo inicio de sesión, no en registro).
- **Flujo de Recuperación Completo**: Pantalla dedicada para introducir el email, envío del enlace de recuperación vía Supabase, y pantalla de confirmación con instrucciones claras.
- **Formulario de Nueva Contraseña**: Al hacer clic en el enlace del correo, la app detecta el evento `PASSWORD_RECOVERY` y muestra un formulario premium con campos de nueva contraseña y confirmación, con validaciones.

## [V6.4.8] - 2026-04-14
### Corrección de Rol y Auto-Login tras Confirmación
- **Persistencia de Rol al Registrarse**: Se guarda el rol elegido (alumno/profesor/familia) en `localStorage` al registrarse por email, evitando que se asigne un rol incorrecto al confirmar la cuenta.
- **Auto-Login por Polling**: La pantalla de "esperando confirmación" ahora detecta automáticamente cuando el usuario confirma desde el correo. Cada 4 segundos intenta iniciar sesión.

## [V6.4.7] - 2026-04-14
### Simplificación de Registro (Magic Link)
- **Eliminación de OTP**: Se ha eliminado la pantalla de introducción de códigos numéricos.
- **Flujo Directo**: Registro mediante enlace de confirmación en el correo.
- **Estandarización de Nomenclatura**: Reemplazo masivo del término "Misión" por "Tarea" en toda la aplicación.

## [V6.4.6] - 2026-04-08
### Optimización y Limpieza de Datos (Crisis de Cuotas)
- **Vaciado de Mensajería**: Eliminación de registros históricos para reducir el tamaño de la base de datos (Egress handling).
- **Limpieza de Interfaz de Evaluación**: Ocultado de campos de calificación redundantes en estados "Pendiente" o "Revisión".

## [V6.4.4] - 2026-03-31
### Mejoras de Espacio y Corrección de Notificaciones
- **Modales Expandidos**: Aumentado el ancho máximo de los modales a `max-w-7xl`.
- **Corrección de Fuga de Notificaciones**: Los comentarios en tareas ya no activan señales visuales incorrectas en otros canales.

## [V6.4.0] - 2026-03-31
### Mejoras en Asignación de Tareas
- **Selección Múltiple Premium**: Sustitución del selector simple por un panel visual avanzado.
- **Lógica Flexible**: Asignación a múltiples grupos específicos o a toda la clase con un clic.

## [V5.8.6] - 2026-03-20
### Mejoras de Estabilidad
- **Fix Batería del Grupo**: Recálculo automático del progreso al aprobar tareas.
- **Rebranding**: Renombrado "Evidencias" a "Depósito de la Tarea".

## [V5.7.1] - 2026-03-20
### Ajustes de UI Alumno
- **Limpieza de Modal**: Eliminación de títulos redundantes y mejora de la posición de botones de acción superior.

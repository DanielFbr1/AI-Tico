# Registro de Actualizaciones - TICO.ia

## [V5.6.7] - 2026-03-17
### Control Total y Refinamiento del Hub
- **Gestión de Evidencias**: Ahora los alumnos pueden eliminar archivos subidos incorrectamente antes de entregar la misión.
- **Anulación de Entrega**: Se ha añadido la posibilidad de anular un envío "En Revisión" para realizar correcciones de última hora.
- **Mejoras de UX**:
    - El botón de cierre (`X`) del Hub es ahora un 40% más grande y fácil de pulsar.
    - El texto del botón de salida se ha simplificado a "Salir" para una interfaz más limpia.
- **Versión**: Actualización global a V5.6.7.

## [V5.6.6] - 2026-03-17
### Botón de Evidencias Mejorado
- **Claridad Visual**: El botón "Adjuntar Evidencias" se ha transformado en un botón de acción principal ("Subir Archivos de Evidencia") con fondo sólido `indigo-600` y mayor tamaño para que sea inconfundible.
- **Iconografía Directa**: Sustitución del icono de clip por el de subida (`Upload`) para una comunicación visual más clara.
- **Versión**: Actualización global a V5.6.6.

## [V5.6.5] - 2026-03-17
### Visibilidad Total de Misiones en Equipos
- **Fin del Límite de 3**: Se ha eliminado la restricción que solo mostraba las primeras 3 tareas de cada equipo en el panel global (pestaña Comunidad) del alumno.
- **Transparencia de Progreso**: Ahora los alumnos pueden ver la lista completa de misiones de todos los equipos del proyecto, permitiendo una visión clara de la Roadmap global.
- **Versión**: Actualización global a V5.6.5.

## [V5.6.4] - 2026-03-17
### Hub de Misión Compacto (Sin Scroll)
- **Optimización de Layout**: Se ha migrado a un diseño de dos columnas (Principal y Barra Lateral) que maximiza el uso del espacio horizontal y elimina la necesidad de scroll en pantallas estándar.
- **Inspiración "Subir Aportación"**: La estética se ha alineado con la interfaz de entrega del alumno, utilizando tarjetas más limpias, fondos `bg-slate-50` y un escalado de fuentes y paddings más eficiente.
- **Acciones Rápidas**: Los botones de aprobación, rechazo y entrega se han reposicionado para ser accesibles de inmediato sin desplazar el contenido.
- **Jerarquía Visual**: Mejora en la distinción entre instrucciones ("Hoja de Ruta"), herramientas adjuntas y el panel de evidencias del alumno.
- **Limpieza de Interfaz**: Eliminación de títulos y subtítulos redundantes en la vista de tareas del alumno para un diseño más minimalista.
- **Versión**: Actualización global a V5.6.4 (Hub Compacto).

## [V5.6.3] - 2026-03-17
### Nuevo Sistema de Puntos de Misión
- **Transición de Estrellas a Puntos**: Se ha sustituido el sistema visual de "Estrellas" por un sistema de "Puntos de Misión" más coherente y motivador, utilizando el icono de Medalla (`Award`).
- **Sumatonia Automática de Puntos**: Al aprobar una misión desde el panel del docente, los puntos se suman automáticamente al total acumulado de cada alumno (o del equipo asignado).
- **Asignación por Defecto**: Las misiones nuevas ahora tienen un valor predeterminado de 1 punto (ajustable por el docente).
- **Consistencia UI**: Se han actualizado las etiquetas de "XP", "Estrellas" y "Puntos" en todas las vistas (Docente, Alumno y Familia) para usar una terminología unificada.
- **Versión**: Actualización de etiquetas de sistema a V5.6.3.


## [V5.6.2] - 2026-03-17
### Rediseño del Hub de Detalle de Misión
- **Nueva Interfaz "Hub de Misión"**: Rediseño estético completo del modal de detalles de tarea, ahora denominado Hub de Misión para una experiencia más inmersiva.
- **Glassmorphism Premium**: Aplicación de efectos de cristal con desenfoque de fondo y bordes brillantes.
- **Widgets de Información**: Los datos clave (Puntos, Destinatarios, Deadline) se han transformado en widgets visuales modernos con iconografía dinámica.
- **Panel de Entrega Mejorado**: Área de respuesta y adjuntos rediseñada con mejor contraste y jerarquía.
- **Micro-animaciones**: Transiciones suaves y efectos visuales al interactuar con el panel y los estados de misión.
- **Versión**: Actualización de etiquetas a V5.6.2.

## [V5.6.1] - 2026-03-17
### Gestión de Grupo (Visibilidad de Recursos)
- **Acceso Docente a Archivos de Grupo**: Ahora el profesor puede ver todos los archivos, documentos y textos subidos por los alumnos dentro de la gestión detallada de cada grupo.
- **Colaboración Docente-Alumno**: Se ha añadido la capacidad para que el docente comparta archivos directamente dentro de un grupo específico desde la vista de detalles del grupo.
- **Sincronización**: Integración total con `RepositorioColaborativo` para asegurar que el docente tenga una visión completa del trabajo del equipo.
- **Versión**: Actualización de etiquetas visuales a V5.6.1.

## [V5.6.0] - 2026-03-17
### Rediseño de Repositorio (Biblioteca Docente)
- **Estados de Publicación**: Añadida columna `publicado` a la tabla `recursos`.
- **Modo Borrador**: Los profesores ahora pueden subir recursos como "Borrador" (solo visibles para ellos) o "Publicado".
- **Gestión de Estados**: Añadida la posibilidad de publicar un recurso directamente desde la tarjeta o el modal de previsualización si este se encuentra en estado de borrador.
- **Biblioteca Docente Global**: El repositorio global ahora solo muestra recursos subidos por profesores, eliminando el intercambio directo entre alumnos en ese espacio.
- **Filtrado Inteligente**: Al alumnos solo ven contenido publicado por sus profesores en la vista global y contenido publicado por su equipo en la vista de grupo.
- **UI**: Indicadores visuales de "Borrador" en las tarjetas de recursos para el profesor.
- **Seguridad**: Restricción de subida de archivos para alumnos en el espacio global.

## [V5.5.2] - 2026-03-17
### Corregido
- **Revisiones Globales (Docente)**: Se ha solucionado un error en el modal de revisiones pendientes donde las tareas globales (sin grupo asignado) no aparecían para el docente.
- **Categoría "Misiones Globales"**: Se ha añadido una nueva sección virtual en el modal de revisiones para gestionar las tareas enviadas por alumnos que no pertenecen a un grupo específico o que son compartidas para todo el proyecto.
- **Filtrado de Notificaciones**: Corregida la lógica de conteo y filtrado para asegurar que el indicador de "Pendientes" sea coherente con lo que se muestra dentro del modal.

## [V5.5.1] - 2026-03-17
### Ajustado
- **Reubicación de Calendario (Alumno)**: Se ha movido el acceso al calendario junto al botón de horario en el header para un acceso más contextual y rápido.
- **Simplificación de Navegación**: Se han eliminado las pestañas de calendario de la navegación principal y el menú móvil para evitar duplicidad y mejorar el diseño.

## [V5.5.0] - 2026-03-17
### Añadido
- **Calendario para Alumnos**: Nueva sección en el Dashboard del Alumno que permite visualizar sus tareas y fechas límite de forma organizada.
- **Filtrado Inteligente**: El calendario del alumno solo muestra las tareas globales del proyecto y las específicas de su equipo.
- **Modo Lectura de Tarea**: Adaptado el componente `VistaCalendario` y `ModalDetalleTarea` para que los alumnos puedan ver los detalles de la misión sin opciones administrativas.

## [V5.4.4] - 2026-03-17
- **FIX**: Corregido error 400 (Bad Request) al guardar evaluaciones con decimales (como 7.5). Se ha cambiado el tipo de dato de la columna `calificacion` a `numeric`.
- **FIX**: Sincronizados los nombres de columna en el Hub de Misión: ahora se leen correctamente `respuesta_texto` y `archivos_entregados` desde la base de datos para mostrar el trabajo del alumno.
- **MAINTENANCE**: Versión visual actualizada a V5.4.4.

## [V5.4.3] - 2026-03-17
- **FIX**: Corregido error de permisos (RLS) que impedía guardar evaluaciones nuevas por parte del profesor.
- **FIX**: **Escala Forzada a 10**: Eliminada cualquier referencia a 100 puntos en el Hub de Misión y Dashboard. Ahora todo es 0-10 de forma estricta.
- **FEAT**: Añadidos botones de **Aprobado Rápido (10)** y **Rechazo Rápido (0)** en la lista de equipos para agilizar la evaluación.
- **MAINTENANCE**: Versión visual actualizada a V5.4.3.

## [V5.4.2] - 2026-03-17
- **FIX**: Corregido error PGRST204 al guardar evaluaciones (añadida columna `grupo_id` a `entregas_tareas`).
- **FEAT**: Nueva **Escala de Evaluación**: Cambiada la puntuación máxima de 100 a **10 puntos** (ajustado en base de datos y UI).
- **MAINTENANCE**: Versión visual actualizada a V5.4.2.

## [V5.4.1] - 2026-03-17
- **FIX**: Reforzada la persistencia de evaluación en el Hub de Misión.
- **FIX**: Asegurado el guardado de `updated_at` y estado `revisado` para detección instantánea.
- **MAINTENANCE**: Versión visual actualizada a V5.4.1.

## [V5.4.0] - 2026-03-17
- **FEAT**: Implementado **Hub Unificado de Misión**: Integración total de Detalles, Estadísticas y Evaluación en un solo panel.
- **FEAT**: Lógica de **Priorización de Evaluación**: Los equipos con entregas pendientes de nota aparecen automáticamente al principio de la lista.
- **FEAT**: Visor de Perfil de Tarea integrado dentro del Hub (instrucciones y archivos del docente).
- **UX**: Unificado el acceso desde el dashboard: tanto la tarjeta como el botón "Entregas" abren el mismo Hub.
- **UX**: Estados visuales mejorados para diferenciar "Evaluado", "Pendiente de Nota" y "Sin Entrega".
- **MAINTENANCE**: Versión visual actualizada a V5.4.0.

## [V5.3.3] - 2026-03-17
- **FEAT**: Implementadas estadísticas dinámicas en el panel de evaluación (Realizadas, Sin Realizar, Por Evaluar).
- **FEAT**: Restaurado el acceso dual: Clic en tarjeta de misión abre Detalles / Clic en botón abre Evaluación.
- **UX**: Botón "Entregas" restaurado como motor central de calificación y seguimiento.
- **UX**: Visualización destacada de descripción de misión en el panel de evaluación.
- **MAINTENANCE**: Versión visual actualizada a V5.3.3.

## [V5.3.2] - 2026-03-17
- **FEAT**: Implementado sistema de evaluación por deslizamiento (Slider) en el seguimiento de misiones.
- **FEAT**: Unificado el acceso a la evaluación mediante clic directo en la tarjeta de misión.
- **FEAT**: Añadido visor de entregas (texto y archivos) dentro del panel de seguimiento por equipo.
- **UX**: Eliminado botón redundante de Entregas para una interfaz más limpia.
- **MAINTENANCE**: Versión visual actualizada a V5.3.2.

## [V5.3.1] - 2026-03-17
- **FEAT**: Implementado sistema de evaluación activa en `ModalSeguimientoGrupos`.
- **FIX**: Restaurada interactividad de las tarjetas de misión (acceso a detalle unificado).
- **FIX**: Corregidos errores de tipos en la consola de calificación.
- **MAINTENANCE**: Versión visual actualizada a V5.3.1.

## [V5.3.0] - 2026-03-17
### Añadido
- **Filtros Inteligentes**: Nuevo sistema de filtrado en el Control Maestro de Misiones por Estado (Pendiente, Revisión, Completado) y por Equipo.
- **Panel de Seguimiento de Entregas**: Botón "Entregas" en cada misión que abre una matriz de seguimiento para ver qué grupos han entregado y su calificación.
### Mejorado
- **Optimización de Interfaz**: Rediseño compacto de las tarjetas de misiones para mejorar la visibilidad y reducir el scroll necesario.
- **Micro-interacciones**: Animaciones y estados visuales mejorados en el tablero de control.

### [v5.2.0] - 2026-03-17
- **UI: REDISEÑO DEL TABLERO DE MISIONES**: Sustituido el tablero de 3 columnas (Kanban) por la **Lista Maestra de Seguimiento** integrada directamente en el resumen principal. Esta vista permite un control más granular de fechas, puntos y estados desde una sola pantalla.
- **UX: INTEGRACIÓN DE CALENDARIO EN HOME**: La lógica de visualización de tareas del calendario ahora es el centro del dashboard docente, facilitando la gestión masiva de misiones.
- **UI: MANTENIMIENTO DEL PANEL BIOMÉTRICO**: Se ha conservado intacto el panel lateral de progreso global y estadísticas del proyecto (LivingTree).
- **MAINTENANCE**: Versión actualizada a V5.2.0 para Docente y Alumno.

## [v5.1.0] - 2026-03-17
- **UNI: MODAL DE REVISIÓN UNIFICADO**: El panel de revisiones del profesor ahora detecta y muestra tanto los "Hitos de Equipo" manuales como las "Misiones Globales" (tareas).
- **FIX: LÓGICA DE RECHAZO**: Implementado el flujo de retorno a "Pendiente". Cuando el profesor rechaza una tarea o hito, el estado vuelve automáticamente a "pendiente" para que el alumno pueda corregirlo y volver a enviarlo, en lugar de quedar bloqueado como "rechazado".
- **UX: FEEDBACK DE RECHAZO**: Añadido campo de comentario opcional al rechazar tareas globales para proporcionar guías de mejora al estudiante.
- **SYNC: PERSISTENCIA TOTAL**: Se ha vinculado la base de datos `tareas` con el modal de revisiones, asegurando que las acciones del profesor se reflejen instantáneamente en la sesión del alumno vía Realtime.

## [v5.0.0] - 2026-03-17
- **FIX: PERSISTENCIA DE TAREAS (RLS)**: Corregida la política de seguridad RLS en Supabase que impedía a los alumnos actualizar sus propias tareas. Ahora los cambios de estado (ej. de "Pendiente" a "En Revisión") se persisten correctamente tras refrescar la página.

## [v4.9.0] - 2026-03-17
- **FIX: NOTIFICACIONES INTELIGENTES (PROFESOR)**: Implementado un sistema de detección de cambios unificado que alerta al profesor cuando aumenta el número de tareas pendientes de revisión, ya sean misiones globales o propuestas de hitos de los equipos.
- **UI: BOTÓN PARPADEANTE UNIFICADO**: El botón de "Pendientes" en el panel docente ahora cuenta correctamente la suma de todas las revisiones necesarias (Tareas + Hitos), asegurando que el indicador visual y el parpadeo reflejen la carga de trabajo real.
- **SYNC OPTIMIZATION**: Mejorada la consistencia de los estados de Realtime para evitar que las notificaciones se pierdan en transiciones rápidas.

## [v4.8.0] - 2026-03-17
- **UI: RESTAURACIÓN DE BATERÍA (EQUIPO)**: Se ha vuelto a incluir el componente de energía del equipo en la pestaña "Mi Equipo", manteniendo su visibilidad para el progreso grupal mientras se deja oculta en la gestión de tareas.
- **FIX: SINCRONIZACIÓN GLOBAL (ALUMNO)**: Implementada una nueva suscripción Real-time en `DashboardAlumno.tsx` que escucha cambios en todas las tareas del proyecto. Esto asegura que la vista "Comunidad" (Global) se actualice al instante cuando se añaden, completan o modifican tareas de cualquier equipo.
- **MAINTENANCE**: Actualizada la cabecera del alumno a V4.8.0 (Global Sync & UI).

## [v4.7.0] - 2026-03-17
- **UI: LIMPIEZA DE "ENERGÍA DE EQUIPO" (ALUMNO)**: Eliminadas todas las referencias a la energía y porcentajes del 67% en el Dashboard del Alumno (tanto en Equipo como en Centro de Misiones) a petición del docente.
- **FIX: NOTIFICACIONES DOCENTE (REALTIME)**: 
  - Ampliado el filtro de suscripción en `DetalleGrupo.tsx` para capturar tareas globales (de todo el proyecto) además de las específicas del grupo.
  - Reforzada la lógica de notificaciones (`toast.info`) en `DashboardDocente.tsx` para asegurar que el profesor reciba alertas instantáneas de nuevas revisiones de forma robusta.
  - Añadidos logs de depuración para monitorizar eventos de sincronización en la sesión del profesor.
- **MAINTENANCE**: Actualizada la cabecera del alumno a V4.7.0 (Core Fixes).

## [v4.6.0] - 2026-03-17
- **UI: REINTEGRACIÓN DE BATERÍA (ALUMNO)**: El componente `LivingTree` vuelve a estar visible en la sección "Mi Equipo", permitiendo a los alumnos visualizar su energía y progreso de forma dinámica.
- **FIX: SINCRONIZACIÓN Y ESTABILIDAD**: 
  - Eliminado el polling de seguridad que causaba reversiones de estado. Ahora el sistema confía 100% en las suscripciones de Realtime de Supabase, garantizando que el estado "En Revisión" persista correctamente.
- **MEJORA: VISTA GLOBAL**: Optimizada la actualización de tareas de otros equipos en la pestaña global para una experiencia de comunidad más fluida.
- **MAINTENANCE**: Actualizada la cabecera del alumno a V4.6.0 (Sync & UI Fix).

## [v4.5.0] - 2026-03-17
- **FIX: BASE DE DATOS (MIGRACIÓN)**: 
  - Añadidas las columnas `contenido_alumno` y `archivos_alumno` a la tabla `tareas`, eliminando el Error 400 al intentar entregar trabajos.
  - Actualizados los Check Constraints para permitir el estado `expirado`.
- **FIX: TIEMPO REAL (SUPABASE)**:
  - Habilitada la replicación (REPLICA IDENTITY FULL) para la tabla `tareas`.
  - Añadida oficialmente la tabla `tareas` a la publicación de Realtime, permitiendo que las misiones aparezcan al instante sin refrescar.
- **MEJORA DE SINCRONIZACIÓN**:
  - Simplificadas las suscripciones en los dashboards para una respuesta más rápida ante cambios.

## [v4.4.0] - 2026-03-17
- **UNIFICACIÓN DE PANELES (DOCENTE)**:
  - El apartado de "Misiones del Equipo" en el detalle del grupo ahora utiliza el sistema de **4 paneles** (Pendientes, En Revisión, Completado y Expirado) para una gestión visual idéntica a la del alumno.
  - Botones de acción rápida: **Aprobar** y **Rechazar** disponibles directamente en las tarjetas de la columna "En Revisión".
- **SISTEMA DE NOTIFICACIONES REALTIME**:
  - El docente ahora recibe notificaciones instantáneas (`toast.info`) cuando un alumno envía una misión para revisión, independientemente de la sección en la que se encuentre.
- **ESTABILIDAD Y SINCRONIZACIÓN**:
  - Corregido bug que provocaba que las tareas volvieran a estado "Pendiente" tras ser enviadas por el alumno. Se han optimizado las suscripciones de Supabase para evitar colisiones de estado.
  - Actualización de tipos globales para soportar el estado `expirado` en todas las interfaces de tareas e hitos.
- **MAINTENANCE**: Actualizada la cabecera del alumno a V4.4.0 (Sync & Notify).

## [v4.3.0] - 2026-03-16
- **PANEL DE TAREAS 4 COLUMNAS (ALUMNO)**: 
  - Las tareas ahora se organizan en 4 paneles estratégicos: **Pendientes**, **En Revisión**, **Completado** y **Expirado**.
  - Acciones directas: Botón "Enviar" directamente desde la tarjeta de tarea para agilizar el flujo de trabajo.
- **ENTREGA DE TAREAS (ALUMNO)**:
  - Los alumnos ahora pueden escribir una respuesta de texto y adjuntar múltiples archivos directamente en la ficha de la tarea.
  - Los archivos se suben de forma segura a Supabase Storage y se vinculan automáticamente a la misión.
- **FLUJO DOCENTE SIMPLIFICADO**:
  - Eliminado el selector manual de estados para el profesor.
  - Implementados botones de acción directa: **Aprobar** y **Rechazar** cuando una tarea entra en estado de revisión.
- **VERSIONADO**: Actualizada la cabecera del alumno a V4.3.0 (Interactive).

## [v4.2.0] - 2026-03-16
- **SISTEMA DE TAREAS DEL ALUMNO**: 
  - Las tareas del alumno ahora son clickables y abren el detalle completo (estilo Classroom).
  - Lógica de estados: los alumnos solo pueden enviar a "revisión". Solo el docente puede "aprobar" o "rechazar" (completar).
  - Eliminación de tareas: restringida solo a docentes.
- **VISTA DE COMUNIDAD**: Cada equipo muestra sus misiones asignadas; las misiones completadas aparecen tachadas para una visualización clara del progreso global.
- **PROGRESO UNIFICADO**: El progreso de los grupos en los dashboards de docente y alumno ahora se calcula basándose en la tabla de `tareas` unificada.
- **REACONDICIONAMIENTO UI**: Centro de misiones del alumno restaurado al estilo familiar "Mapa de Ruta" pero con la nueva funcionalidad de misiones interactivas.
- **CORRECCIONES**: Eliminado el banner de ayuda innecesario, corrección de errores de sintaxis y duplicados de iconos en `DashboardAlumno.tsx`.

## [v2.0.0] - 2026-03-16
- **UNIFICACIÓN DE TAREAS**: Las tareas del calendario Classroom reemplazan al sistema antiguo de hitos.
- **Kanban Global**: Ahora lee de la tabla `tareas` en vez de `grupos.hitos`. Cada tarjeta es clickable y navega al calendario.
- **Progreso**: Calculado desde la tabla `tareas` (aprobadas/total). Antes usaba hitos JSONB.
- **ModalCrearTareaClassroom**: Acepta `preselectedGrupoId` para pre-seleccionar grupo. Guarda con `estado: 'pendiente'`.
- **VistaCalendario**: Badges de estado por colores (pendiente, en curso, revisión, aprobada, rechazada). Selector de estado en detalle.
- **GroupDetail.tsx**: Usa `ModalCrearTareaClassroom` en vez de `ModalAsignarTareas`.
- **Notificaciones**: Realtime en `ProjectDetail.tsx` detecta cambios de estado de tareas a `'revision'` y notifica al docente.
- **BBDD**: Columna `estado` añadida a tabla `tareas` con constraint de valores válidos e índices.
- **Reversibilidad**: `grupos.hitos` se mantiene intacto. `ModalAsignarTareas`, `ModalRevisionHitos`, `RoadmapView` y `MentorIA` no fueron modificados.

## [v1.9.0] - 2026-03-16
- **Nuevo**: Apartado de **Calendario de Tareas** en el Dashboard Docente con vista mensual y vista de lista.
- **Nuevo**: **Crear Tarea estilo Google Classroom**: modal completo con título, instrucciones, subida de archivos adjuntos, selector de grupo/clase, puntos configurables y fecha de entrega.
- **Nuevo**: **Vista Detalle de Tarea**: al hacer clic en una tarea se abre su ficha completa con instrucciones, adjuntos descargables, metadatos y opción de eliminar.
- **Base de datos**: Creadas las tablas `tareas` y `entregas_tareas` en Supabase con políticas RLS para seguridad.
- **Realtime**: Las tareas se sincronizan en tiempo real mediante Supabase Realtime.
- **Tipos TS**: Añadidos `TareaDetallada`, `EntregaTarea` y `ArchivoAdjunto` en los tipos globales.
- **Navegación**: Nuevo botón "Calendario" en el sidebar y en la barra inferior móvil del Dashboard.

## [v1.8.8] - 2026-03-16
- **Error corregido**: Solucionado el problema visual del texto `=20` en los correos electrónicos mediante la optimización del encoding y minificado de la plantilla HTML.
- **Despliegue**: Subida de todas las mejoras de la rama (v1.8.4 - v1.8.8) a producción en Vercel.

## [v1.8.7] - 2026-03-16
- **Error corregido**: Solucionado el problema de mensajes duplicados en los chats de Profesores/Familias y Grupos.
- **Error corregido**: Reparada la plantilla de email que mostraba variables sin procesar (ej. `${senderName}`).
- **Mejora**: Sincronización de chat más robusta basada exclusivamente en Real-time.

## [v1.8.6] - 2026-03-16
- **Mejora**: Optimización de la plantilla de correo para máxima compatibilidad. Se ha sustituido el diseño basado en Flexbox por tablas HTML tradicionales para evitar que el contenido se vea "cortado" en clientes como Outlook o Gmail móvil.
- **Mejora**: Aumento del límite de caracteres en la previsualización del mensaje en el email.

## [v1.8.5] - 2026-03-16
- **Mejora**: Migración de la cuenta de envío de notificaciones a `valimanadesigns@gmail.com`.
- **Mejora**: Rediseño visual de las notificaciones por email con una estética más moderna y colores corporativos (Coral Tico).

## [v1.8.4] - 2026-03-16
- **Mejora**: Entrada automática al detalle de un grupo inmediatamente después de crearlo.
- **Mejora**: Ordenación global de proyectos en el dashboard. Ahora los proyectos (propios y compartidos) se ordenan por fecha de actividad reciente (creación o unión), apareciendo siempre lo más nuevo arriba.

## [v1.8.3] - 2026-03-16
- **Mejora**: Ahora es posible crear equipos/grupos sin necesidad de añadir alumnos en el momento. Los alumnos pueden ser asignados después desde el tablero de gestión.
- **Corregido**: Limpieza de código en el sistema de creación de grupos (estandarización de la columna descripción).

## [v1.8.2] - 2026-03-16
- **Mejora**: Los proyectos aceptados ahora aparecen automáticamente en el dashboard sin necesidad de refrescar la página (Real-time).
- **Mejora**: Al crear un nuevo grupo, este aparece ahora arriba del todo (ordenado por ID más reciente).
- **Corregido**: Estructura de suscripciones y limpieza de memoria en el dashboard.

## [v1.8.1] - 2026-03-16
- **Mejora**: Habilitada la visibilidad de proyectos compartidos en el dashboard (se eliminó el filtro restrictivo).
- **Mejora**: Entrada automática al proyecto inmediatamente después de su creación.

## [v1.8.0] - 2026-03-16
- **Mejorado**: Acceso total para colaboradores. Ahora los colaboradores aceptados pueden gestionar grupos, recursos, chat y evaluaciones del proyecto compartido.
- **Corregido**: Restricción de acceso que impedía a los colaboradores "entrar" en los proyectos desde su dashboard.

## [v1.7.7] - 2026-03-16
- **Corregido**: Error crítico 500 en la carga de proyectos causado por recursividad infinita en las políticas de seguridad (RLS).
- **Mejorado**: Estructura de permisos de colaboración más eficiente y lineal.
- **Estabilizado**: Acceso garantizado tanto para dueños como para colaboradores en el dashboard.

## Versión 1.2.7 (Juego Oraciones - Arreglo Definitivo Drag & Drop Tablets)
- **Reversión Híbrida Inteligente:** Se recupera el Arrastre y el Toque Simple.
- **Bloqueo nativo del scroll (`touch-none`):** Se ha añadido la clase CSS a las tarjetas y cajas para que los navegadores móviles como Android o Safari no intenten desplazar la pantalla al interactuar con ellas. Esto es la pieza central que soluciona de raíz el fallo clásico del Polyfill.
- **Arrastre instántaneo (50ms):** Reducido sustancialmente el retraso inicial al tocar una tarjeta. Gracias al bloqueo de scroll, ahora el dedo "engancha" la tarjeta de forma casi automática, sin necesidad de dejar el dedo quieto y pulsado medio segundo.

## Versión 1.2.5 (Juego de Oraciones - Interacción Táctil y Diccionario)
- **Modo Tacto Inteligente:** Eliminado el problemático "Drag & Drop" en tablets, siendo sustituido por un sistema de toques secuenciales. Se selecciona la carta deseada con un tap (destacándose visualmente) y se mueve a su posición presionando el slot vacío.
- **Diccionario:** Integrada la lectura de superlativos ("rapidísimo") hacia su raíz para que ARASAAC devuelva el pictograma correspondiente en los dictados extremos sin arrojar un error 404.

## Versión 1.2.4 (Corrección de Eventos Táctiles y Mejoras UI)
- **Correcciones Tablets:** Afinadas las configuraciones del Polyfill para pantallas móviles. Añadido `touch-action: none` sobre los elementos jugables, previniendo que la pantalla scrollee accidentalmente, además de introducir un límite temporal de milisegundos para diferenciar entre toques normales y arrastres intencionales.
- **Aciertos:** Color azul para la estadística de final de nivel que permite a los docentes identificar el progreso rápidamente.

## Versión 1.2.3 (Juego de Oraciones - UX Pediátrica)
- **Game Over Positivo:** Rediseño íntegro de la pantalla final. El contador de fallos (Aciertos: X/10) ha sido reducido a un texto discreto inferior para uso exclusivo del docente. El foco principal para el niño ahora es una enorme tarjeta de recompensa dorada que celebra los "Puntos Mágicos" ganados, evitando deprimir al estudiante tras la sesión.

## Versión 1.2.2 (Juego de Oraciones - Soporte Tablet y Audio)
- **Soporte para Tablets:** Implementado un sistema ("polyfill") para habilitar el arrastrar y soltar (drag & drop) nativamente en pantallas táctiles como iPads y tablets Samsung.
- **Control de Audio (Mute):** Agregado botón universal para silenciar completamente el audio en la aplicación y corregido fallo para que el audio se desbloquee automáticamente al arrancar el juego en un dispositivo móvil.

## Versión 1.2.1 (Ortografía Independiente, Puntuaciones Dinámicas y UX)
- **Separación Ortográfica:** El sistema de "Evaluar Ortografía" en el juego de oraciones ahora tiene dos opciones divididas e independientes: "Mayúsculas Iniciales" y "Acentos y Tildes", permitiendo una personalización aún más fina para cada alumno.
- **Corrección In-Situ:** Cuando los alumnos cometen un error armando la oración, las tarjetas ya no rebotan a la bandeja inferior. Ahora se quedan "pegadas" en la pantalla de juego para que el alumno analice su error y pueda corregirlo visualmente simplemente intercambiando las posiciones. 
- **Puntuación Dinámica:** Los puntos obtenidos por cada acierto ahora escalan con la dificultad elegida (Fácil = 1 pt, Medio = 2 pts, Difícil = 3 pts, Extremo = 5 pts). El total se muestra en la pantalla de victoria final.
- **Ampliación de Límite de Rondas:** Se agregaron opciones para partidas más largas, permitiendo configurar hasta 60 ejercicios.
- **Menú Simétrico y Simplificado:** Se reorganizaron los componentes del menú principal para obtener simetría bilateral agrupando Ortografía debajo de Tipo de Letra. Se limpiaron las viñetas numéricas ("1.", "2.", "3.", etc.) en los títulos de opciones, modernizando el panel principal.

## Versión 1.2.0 (Módulo Ortográfico)
- **Modo Estricto de Ortografía:** Se agregó una nueva opción de configuración paramétrica ("Evaluar Ortografía"). Cuando está activada, el juego audita de forma estricta asegurando que los estudiantes:
  - Usen la tarjeta mayúscula correcta y de forma obligatoria al inicio de la oración o en nombres propios.
  - Respeten las tildes y acentos diacríticos (las variantes con y sin tilde ahora se evalúan como tarjetas distintas).
- En el "Modo Extremo" (Dictado), el sistema ahora detecta si la palabra está bien pero falló la tilde/mayúscula, devolviendo un aviso educativo en vez de un fallo genérico.

## Versión 1.1.2 (Juego de Oraciones)
- **UI Simétrica:** Se reorganizó el panel principal de configuración creando una vista balanceada (2 controles a la izquierda, 2 a la derecha).
- **Textos simplificados:** Se limpiaron las descripciones en los selectores de cantidad de palabras para una lectura más rápida y directa.
- **Lógica No-Repetitiva de Oraciones:** Implementado un sistema de "Barajado Inteligente" (tipo mazo de cartas) que memoriza las oraciones jugadas. Esto garantiza que no se repetirá ninguna oración de una misma longitud hasta que el usuario haya visto y jugado el 100% de las variaciones disponibles.

## Versión 1.1.1 (Juego de Oraciones)
- **Mejoras en Oración Personalizada:** Se eliminó texto innecesario y se agregó un botón "IR" para jugar un único ejercicio de forma rápida con la oración escrita.
- **Simplificación de interacciones:** Se removió la configuración de audio del menú principal, dejando la voz automática siempre activa.
- **Resultados Detallados:** La pantalla de final de partida ahora muestra explícitamente el nivel de dificultad en el que se ha jugado.

## Versión 1.1.0 (Juego de Oraciones)
- **Selección de Rondas:** Se añadió un selector que permite elegir libremente la cantidad de ejercicios por partida (5, 10, 15, 20, 25, 30).
- **Diccionario ARASAAC Mejorado:** Ampliación intensiva del diccionario interno. Ahora todos los verbos, sustantivos (incluyendo plurales convertidos a singulares automáticamente) y adjetivos cuentan con su respectivo pictograma asegurado en las dificultades Fácil y Media.

## Versión 1.0.9 (Juego de Oraciones)
- **Límite de Rondas**: Se implementó un límite de 10 ejercicios por partida para estructurar mejor el juego.
- **Puntuación por Aciertos**: Se añadió un contador de aciertos que evalúa si la oración fue completada correctamente al primer intento.
- **Pantalla de Finalización**: Al acabar las rondas, se muestra una ventana de resultados. La puntuación resalta en un color (verde, amarillo, naranja o morado) dependiendo del nivel de dificultad seleccionado previamente.

## Versión 1.6.0
- **Panel de control unificado**: Ahora el docente puede ver todos sus proyectos desde una única pantalla, eliminando la navegación fragmentada basada en carpetas previas.
- **Búsqueda Avanzada**: Añadida una barra de búsqueda y filtros para identificar proyectos más rápido según el año académico, curso, etapa y nombre.
- **Datos Reubicados**: En la creación del proyecto se recaba la información obligatoriamente útil como etapa, año, colegio y clase.
- **Orden inteligente de Proyectos**: Se añadió lógica para recordar los proyectos recientemente abiertos en el dispositivo y colocarlos de primero en la vista, además de agrupar las clases según el último proyecto accedido.

## Versión 4.1.0
- **Recientes Primero**: Los alumnos ahora verán sus últimas 6 clases conectadas de primero en el historial.
- **Explorador de Clases**: Agregamos un Modal interactivo que le permite a todos los alumnos administrar y buscar cómodamente sobre el resto de las clases en las que participan.

## Versión 4.1.1
- **Documentación Funcional**: Se ha creado y añadido a la base del proyecto el archivo `features.md` el cual recolecta un resumen en formato de lista de las principales funcionalidades de la plataforma.

## Versión 1.6.12 (Confirmación de Email en Registro)
- **Pantalla de Verificación de Email**: Al registrarse como Docente o Familia, se muestra una pantalla visual con instrucciones para verificar el email en lugar de un simple `alert()`.
- **Reenvío de Email**: Añadido botón para reenviar el email de confirmación con cooldown de 60 segundos para evitar spam.
- **Redirección Post-Confirmación**: Configurado `emailRedirectTo` en el registro para que el enlace de confirmación redirija correctamente a la app.
- **Detección de Enlaces Expirados**: La app ahora detecta errores de verificación en la URL y muestra un toast informativo cuando un enlace ha expirado o es inválido.

## Versión 1.6.13 (Verificación por Código OTP)
- **Código OTP de 6 dígitos**: El registro ahora envía un código numérico al email en lugar de un enlace, solucionando el problema de escáneres de seguridad que consumían los enlaces de verificación.
- **Pantalla OTP Premium**: Interfaz con 6 cajas individuales para introducir el código, con auto-focus, soporte de pegar (paste) y feedback visual.
- **Verificación Manual**: El usuario introduce el código recibido por email y lo verifica directamente en la app con `verifyOtp`.

## Versión 1.6.14 (Notificaciones de Chat por Email)
- **Notificaciones por Email**: Al enviar un mensaje en el chat profesor-familia, el destinatario recibe una notificación por email con el contenido del mensaje y un enlace para abrir la app.
- **Edge Function `notify-chat`**: Nueva función serverless desplegada en Supabase que envía emails automáticos vía Gmail SMTP.
- **Database Trigger**: Trigger `trigger_notify_chat` en la tabla `mensajes_familia_profesor` que dispara la Edge Function automáticamente al insertar un nuevo mensaje.

## Versión 1.6.15 (Login con Email Real para Alumnos)
- **Email Real para Alumnos**: Los alumnos ahora inician sesión con email real + contraseña, igual que profesores y familias. Se eliminó el email sintético `@tico.ia`.
- **Verificación OTP Unificada**: Todos los roles (alumno, profesor, familia) usan el mismo flujo de verificación OTP de 8 dígitos al registrarse.
- **Login Social para Alumnos**: Los alumnos ahora pueden registrarse/iniciar sesión con Google o Microsoft.
- **Formulario Unificado**: Todos los roles comparten el mismo formulario de login con campos de nombre, email y contraseña.

## Versión 1.6.16 (Fix Multi-rol con Mismo Email)
- **Rol Siempre Sincronizado**: Al iniciar sesión, el rol se actualiza siempre al panel elegido (docente/alumno/familia), no solo cuando difiere. Esto garantiza que si entras por "Docente", siempre accedes como docente.
- **Await en refreshPerfil**: Corregido el timing en `AuthContext.tsx` para que `fetchPerfil` se complete antes de continuar, evitando lecturas de rol desactualizado.

## v1.6.20
- **Chat de Grupo en Tiempo Real**: Implementada sincronización instantánea tanto para profesores como para alumnos.
- **Actualizaciones Optimistas**: Ahora los mensajes aparecen inmediatamente al enviarlos, eliminando la sensación de retraso.
- **Canales Dedicados**: Refactorización del sistema de suscripciones para usar canales únicos por grupo, mejorando la fiabilidad del Realtime.

## v1.7.0 (16/03/2026): Implementación de colaboración multi-docente.
    - Nuevo botón "Unirse a Proyecto" en el panel de proyectos.
    - Sistema de peticiones de colaboración con notificaciones Realtime.
    - Panel de gestión para aceptar/rechazar colaboradores (estilo revisión tareas).
    - Acceso compartido a proyectos para múltiples docentes.

## v1.6.22: Integración del botón de Horario Personal en el Dashboard Docente (acceso rápido junto al código de la clase).

## v1.6.21
- **Sincronización en tiempo real de archivos y recursos compartidos (Supabase Realtime)**: Actualizaciones instantáneas en el repositorio colaborativo sin recarga.

## v1.6.19
- Corregido error en las notificaciones del chat docente: los avisos rojos ahora desaparecen correctamente en tiempo real al leer los mensajes.
- Mejorada la sincronización del contador de mensajes no leídos entre componentes.

## v1.6.18
- Añadida funcionalidad para añadir alumnos manualmente a los grupos mediante nombre.
- Mejorada la gestión de miembros en el modal de grupos (búsqueda case-insensitive).
- Añadido botón de actualización manual de la lista de alumnos en la sala.
- Corregido error en el toggle de miembros que podía causar duplicados.

## Versión 1.6.17 (Observaciones Visibles en Panel Familia)
- **Fix Observaciones**: Las observaciones del profesor ahora se muestran correctamente en el panel de familia. Se corrigió un bug de coincidencia case-sensitive en los nombres de alumnos entre tablas.
- **Sección Siempre Visible**: La sección "Observaciones del Profesor" ahora aparece siempre, mostrando "Sin observaciones registradas" cuando no hay ninguna.
- **Consultas Case-Insensitive**: Todas las consultas de evaluaciones, asistencia, comentarios y puntos usan `ilike` para evitar desajustes de mayúsculas/minúsculas.
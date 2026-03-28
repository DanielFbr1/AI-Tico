# Registro de Actualizaciones - Tico.AI

## [V5.8.69] - 2026-03-28
### Nuevo
- **Generación Automática de Notificaciones**: Se han integrado disparadores de notificaciones en toda la plataforma:
    - **Creación de Tareas**: Notifica automáticamente a todos los alumnos implicados (grupo o clase completa).
    - **Subida de Recursos**: Notifica a los alumnos cuando el profesor publica nuevo material.
    - **Evaluación de Misiones**: Los alumnos reciben una alerta inmediata cuando su trabajo ha sido calificado y aprobado.
    - **Entrega de Tareas**: Los profesores reciben notificaciones cuando un equipo envía una misión para revisión.
    - **Mano Levantada (Dudas)**: Notificación persistente para el profesor cuando un equipo necesita ayuda urgente.
- **Librería de Mensajería Centralizada**: Implementación de `notificaciones.ts` para gestionar el envío masivo y selectivo de alertas.
- **Sincronización Global de Versión**: Actualizada la plataforma a la V5.8.69 para asegurar la persistencia de las nuevas notificaciones.

## [V5.8.68] - 2026-03-28
### Nuevo
- **Sistema de Notificaciones**: Nuevo apartado de notificaciones en tiempo real tanto para profesores como para alumnos.
- **Profesor**: Las notificaciones aparecen debajo de Evaluación en el sidebar. Incluye tipos como: tarea enviada a revisión, mensajes de familias, mano levantada, etc.
- **Alumno**: Las notificaciones aparecen entre Chat y Mis Notas en la navegación. Incluye tipos como: nueva tarea asignada, nuevo mensaje de grupo, recurso subido, notas actualizadas, etc.
- **Base de Datos**: Creada tabla `notificaciones` con políticas RLS y suscripción en tiempo real.
- **Sincronización Global de Versión**: Actualizada la plataforma a la V5.8.68.

## [V5.8.67] - 2026-03-28
### Corregido
- **Subida de Archivos para Colaboradores**: Se ha corregido un error que impedía a los profesores colaboradores subir archivos como borradores en proyectos compartidos. Ahora el modal de subida reconoce correctamente su rol de docente independientemente de quién sea el dueño del proyecto.
- **Sincronización Global de Versión**: Actualizada la plataforma a la V5.8.67 en todos los dashboards y archivos de configuración para mantener la consistencia.

## [V5.8.66] - 2026-03-23
### Corregido
- **Tutorial Docente**: Ahora el tutorial interactivo solo se activa automáticamente cuando el profesor crea su **primer proyecto**. Se ha eliminado el trigger automático al registrarse para evitar que aparezca al unirse a proyectos existentes como colaborador.
- **Sincronización de Versiones**: Actualizada la versión visual en todos los paneles (Docente, Alumno, App) para reflejar la V5.8.66.

## [V5.8.65] - 2026-03-23
### Mensajería
- **Sincronización Profesor-Alumno:** Se ha corregido un fallo donde los profesores no aparecían automáticamente en el chat del alumno al unirse a un proyecto. Ahora, el profesor propietario aparece de inmediato.
- **Soporte Multi-Profesor:** El sistema ahora detecta y muestra a todos los profesores colaboradores de un proyecto en la lista de contactos del alumno, permitiendo una comunicación directa con todo el equipo docente.
- **Historial Dinámico:** Se ha optimizado la carga del historial de clases para incluir el proyecto activo actual, incluso antes de que el alumno sea asignado a un grupo específico.


## [V5.8.64] - 2026-03-22
### TFG / Documentación
- **Metodología (4.1):** Redacción completa de las fases de diseño (Figma a código) y arquitectura técnica accesible (Frontend/Backend/IA).
- **Guía Didáctica (4.2.1):** Desarrollo del perfil docente: gestión de proyectos con IA, rúbricas y monitoreo en tiempo real.
- **Experiencia del Alumno (4.2.2):** Explicación del Mentor Socrático (DUA), economía de fichas y progreso visual del avatar/cohete.
- **Herramientas Transversales (4.2.3):** Inclusión de ruletas, dados y generadores de equipos para la gestión de aula.

## [V5.8.63] - 2026-03-21
### Estilizado
- **Ampliación Perfil Alumno (Vista Docente):** Se ha maximizado el tamaño de la ventana de perfil (98vw) y se ha rediseñado a 3 columnas para mostrar simultáneamente la Evaluación Rúbrica, el detalle de Misiones con sus notas y las Observaciones privadas.
- **Sincronización Total de Versión:** Actualización global a la **V5.8.63** para asegurar coherencia en todos los dispositivos.

## [V5.8.62] - 2026-03-21
### Estilizado
- **Finalización Perfil Alumno (Vista Docente):** Se ha corregido definitivamente el "Rendimiento Clave" en el perfil del alumno visto por el profesor. Se eliminaron las métricas de IA y se ajustó la rejilla a 5 columnas alineadas en una sola fila.
- **Sincronización Total de Versión:** Actualización global a la **V5.8.62** para validación del despliegue en todos los dashboards.

## [V5.8.61] - 2026-03-21
### Mantenimiento
- **Sincronización de Versión:** Se ha unificado la versión en todos los componentes del sistema (Dashboard Docente, Alumno, Familia y Modales) para evitar confusiones y asegurar que todos los usuarios visualicen la versión más reciente.

## [V5.8.60] - 2026-03-21
### Estilizado
- **Simplificación de Estadísticas:** Se han eliminado las métricas de "Preguntas a la IA" de los perfiles de los alumnos y del panel de "Mis Notas" para centrar la atención en el rendimiento académico directo.
- **Optimización de Layout (5 Paneles):** Los indicadores de rendimiento se han reorganizado en una cuadrícula de 5 columnas en una sola línea, mejorando la coherencia visual y eliminando espacios vacíos en pantallas grandes.

## [V5.8.59] - 2026-03-21
### Mantenimiento
- **Actualización de Versión:** Preparación de la infraestructura para el despliegue de las mejoras de diseño y persistencia de sesión.

## [V5.8.58] - 2026-03-21
### Funcionalidad
- **Persistencia de Sesión (Alumno):** Se ha implementado el auto-seleccionado de la última clase visitada al iniciar sesión. Esto evita que el dashboard aparezca vacío inicialmente.
- **Cálculo de Progreso en Tiempo Real:** Se ha mejorado el cálculo de progreso para que sea dinámico tanto en el dashboard del alumno como en el del docente, incluyendo ahora el estado "revisado" para que la batería de energía muestre el avance correcto.

## [V5.8.57] - 2026-03-21
### Estilizado
- **Colorización de Paneles (Familia):** Se han asignado colores armónicos (Azul, Cian, Esmeralda, Ámbar y Naranja) a cada panel de estadísticas para una mejor distinción visual.
- **Barras de Progreso en Misiones:** Las calificaciones individuales de cada tarea ahora incluyen una mini barra de progreso visual, idéntica a la utilizada en los criterios de rúbrica.

## [V5.8.56] - 2026-03-21

### Estilizado
- **Reordenación de Estadísticas (Familia):** Se han reordenado los paneles de resumen para una mejor jerarquía visual: 1º Media Criterios, 2º Asistencia, 3º Puntos, 4º Media Tareas y 5º Tareas Entregadas.
- **Renombrado de Etiquetas:** Los indicadores ahora utilizan nombres más claros: "MEDIA CRITERIOS" (antes Media Proyecto) y "MEDIA TAREAS" (antes Media Misiones).

## [V5.8.55] - 2026-03-21

### Mejorado
- **Interfaz de Notas (Familia):** Se ha rediseñado la disposición de las calificaciones. Ahora las notas por rúbrica se muestran a la izquierda y las notas por misión/tarea a la derecha en pantallas grandes, optimizando el espacio y facilitando la comparación.

## [V5.8.54] - 2026-03-21

### Mejorado
- **Vinculación de Alumnos (Familia):** Se ha corregido el sistema de vinculación de alumnos. Ahora se permite vincular usando el correo electrónico y contraseña del alumno, adaptándose al nuevo flujo de inicio de sesión simplificado.
- **Vista de Familia mejorada:** Ahora se muestran las tareas entregadas y la media de las tareas directamente en el panel de la familia para un seguimiento más rápido.
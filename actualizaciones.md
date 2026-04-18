# Registro de Actualizaciones - Tico.AI

Este es el registro oficial de cambios y mejoras del proyecto Tico.AI.

## [V6.6.5] - 2026-04-18
### Seguridad y Restauración de Interfaz
- **Corrección de Leak de Notificaciones**: Se ha implementado un filtro de roles riguroso en `getProfesoresDelProyecto`. Ahora las notificaciones destinadas a docentes (como alertas de revisión) ya no se filtran por error a las sesiones de los alumnos.
- **Sincronización Total de Versión**: Unificada la versión a **V6.6.5** en todos los puntos del sistema (`App.tsx`, `DashboardAlumno`, `ModalDetalleTarea`, `ModalSeguimientoGrupos`).
- **Visibilidad de Funciones (Chats)**: Renombrado el menú "Chat IA" a "Chats" para reflejar la funcionalidad dual (TICO + Chat de Equipo) y asegurar que el alumno encuentre la opción de hablar con el grupo que se había reportado como "desaparecida".
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
### Tico.AI es oficialmente Open Source
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

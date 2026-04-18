# Registro de Actualizaciones - Tico.AI

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

### Estado del Proyecto
- **Consulta de Código Abierto**: Verificación del estado de la licencia y configuración de `package.json`.
- **Sincronización de Versión**: Actualizada la versión en `package.json` a 6.6.1 para coincidir con el historial.


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
- **Actualización de Versión**: Sistema actualizado a V6.4.9.

## [V6.4.8] - 2026-04-14
### Corrección de Rol y Auto-Login tras Confirmación
- **Persistencia de Rol al Registrarse**: Se guarda el rol elegido (alumno/profesor/familia) en `localStorage` al registrarse por email, evitando que se asigne un rol incorrecto al confirmar la cuenta.
- **Auto-Login por Polling**: La pantalla de "esperando confirmación" ahora detecta automáticamente cuando el usuario confirma desde el correo. Cada 4 segundos intenta iniciar sesión; en cuanto el email es confirmado, entra directamente sin necesidad de recargar la página.
- **Animación de Confirmación**: Nueva animación visual con icono de check y texto "¡Cuenta confirmada!" al detectar la verificación exitosa.
- **Limpieza de Código OTP**: Eliminado todo el código residual del antiguo flujo de códigos numéricos (handleOtpChange, handleOtpPaste, etc.).
- **Actualización de Versión**: Sistema actualizado a V6.4.8.

## [V6.4.7] - 2026-04-14
### Simplificación de Registro (Magic Link)
- **Eliminación de OTP**: Se ha eliminado la pantalla de introducción de códigos numéricos de 8 dígitos al registrarse.
- **Flujo Directo**: Ahora, al registrarse, el usuario recibe un enlace de confirmación en su correo. Al pulsar el botón "Confirmar" del email, la cuenta se activa automáticamente y redirige a la aplicación.
- **UI de Espera Refactorizada**: Se ha diseñado una nueva pantalla de espera con icono de sobre (Mail) que instruye claramente al usuario sobre los pasos a seguir en su bandeja de entrada.
- **Actualización de Versión**: Sistema actualizado a V6.4.7.

## [V6.4.6] - 2026-04-08
### Optimización y Limpieza de Datos (Crisis de Cuotas)
- **Vaciado de Mensajería**: Se han eliminado todos los registros de las tablas `mensajes_chat`, `mensajes_profesor_alumno`, `mensajes_familia_profesor`, `mensajes_colaboracion` y `notificaciones` para reducir el tamaño de la base de datos.
- **Auditoría de Storage**: Identificados los 15 archivos más pesados en el bucket `recursos` que suman el mayor impacto en la cuota de Egress.
- **Acción Pendiente**: Dado que Supabase protege la eliminación de archivos físicos vía SQL, se ha proporcionado al usuario la lista y el procedimiento para el borrado manual en el dashboard.


## [V6.4.4] - 2026-03-31
### Mejoras de Espacio y Corrección de Notificaciones
- **Modales Expandidos**: Se ha aumentado el ancho máximo de los modales de creación (`ModalCrearTareaClassroom`) y detalle de tareas (`ModalDetalleTarea`) a `max-w-7xl` para aprovechar mejor las pantallas grandes.
- **Corrección de Fuga de Notificaciones**: Los mensajes enviados como comentarios en una tarea ya no activan el aviso parpadeante del botón de "Equipo" en el dashboard del alumno. Ahora cada notificación se queda en el canal correcto.
- **Layout Optimizado**: Se aprovecha mejor el espacio lateral en resoluciones de escritorio.
- **Actualización de Versión**: Sistema actualizado a V6.4.4.

## [V6.4.2] - 2026-03-31
### Refinamiento y Corrección de Errores
- **Limpieza de UI**: Se ha eliminado la opción redundante de "Toda la clase" dentro de la lista de grupos, unificando el control en los botones superiores ("Todos" / "Nada").
- **Corrección de Warning ReactQuill**: Se ha implementado una referencia directa (`useRef`) en el componente `ReactQuill` para mitigar el aviso de deprecación de `findDOMNode`.
- **Mejora en UX**: Al pulsar un grupo individual cuando "Todos" está activo, el sistema ahora selecciona inteligentemente a todo el resto excepto a ese grupo.
- **Actualización de Versión**: Sistema actualizado a V6.4.2.

## [V6.4.0] - 2026-03-31
### Mejoras en Asignación de Tareas
- **Selección Múltiple Premium**: Se ha sustituido el selector simple de grupos por un panel visual avanzado en `ModalCrearTareaClassroom.tsx`.
- **Lógica de Asignación Flexible**: Ahora el profesor puede asignar una misión a varios grupos específicos a la vez, o a toda la clase con un solo clic, facilitando excluir grupos si es necesario.
- **Inserción Masiva**: El sistema genera automáticamente las tareas y notificaciones correspondientes para cada equipo seleccionado.
- **Actualización de Versión**: Sistema actualizado a V6.4.0.

## [V6.3.3] - 2026-03-31
### Solución de Error 400 y Mensajes Duplicados
- **Corrección de Tipos en ID**: Se ha eliminado el envío manual de IDs UUID a columnas de tipo BigInt, eliminando el error 400 (Bad Request) al enviar mensajes.
- **Reconciliación Inteligente**: Ahora los mensajes utilizan un `tempId` local que se reconcilia automáticamente con el `id` real devuelto por la base de datos tras la inserción, garantizando una UI optimista sin duplicidades visuales.
- **Limpieza de Código**: Refactorización del componente `ChatGrupo.tsx` para mejorar la estabilidad y legibilidad.

## [V6.3.6] - 2026-03-30 (Tutorial Técnico)
- **Dominando el Entorno**: Explicación de comandos de navegación (`cd`).
- **Casos de Uso**: Definición de tareas para Gemini CLI vs OpenCode.
- **Prompts de Ahorro**: Introducción de 3 prompts estratégicos para evitar consumo de créditos innecesario.
- Tutorial en su fase final (BLOQUE 4).
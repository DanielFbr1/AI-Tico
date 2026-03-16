# Registro de Actualizaciones - TICO.ia

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
# Historial de Desarrollo y Correcciones

Este documento registra los hitos principales del desarrollo reciente, los errores encontrados y cómo fueron solucionados.

## Hitos Recientes

### Versión 1.6.6: Alineamiento Inferior y Botones Robustos Ajustes IA
* **Objetivo:** Responder a la solicitud del usuario de agrandar los botones de hardware y alinearlos matemáticamente con el fondo del panel del chat izquierdo.
* **Cambios:**
    - `ModalConfiguracionIA.tsx`: Transformadas las columnas en un espacio `h-full flex` para que los elementos se distribuyan automáticamente. Se aplico `mt-auto` al contenedor inferior de *Toggles* (Voz, Micro, Emojis) obligando a que se alineen perfectamente contra el borde de la fila, equiparando su tamaño con la altura total del chat del asistente de la izquierda. Se restauró el tamaño `h-7`, `w-14` y padding de iconos a los botones.
    - `MentorConfigChat.tsx`: El input de chat ahora goza de `h-full` nativo para estirarse hasta ocupar la misma columna en Grid.

### Versión 1.6.5: Pulido UI Configuración IA
* **Objetivo:** Asegurar que todo el contenido del panel (especialmente los botones de hardware de la derecha) quepan simultáneamente en pantalla sin scroll vertical.
* **Cambios:**
    - `ModalConfiguracionIA.tsx`: Múltiples reducciones de padding (`p-4` a `p-3`), gaps y tamaños de caja para compactar. También se ha eliminado el texto secundario de ayuda debajo de "Instrucción de Comportamiento". Las alturas de los switches han pasado de `h-6` a `h-5` y todo queda a la vista al abrir el popup.

### Versión 1.6.4: Rediseño de Configuración IA
* **Objetivo:** Simplificar la interfaz de Ajustes del Mentor IA eliminando indicadores redundantes y unificando el estilo visual del control avanzado.
* **Cambios:**
    - `ModalConfiguracionIA.tsx`: Eliminados los badges de resumen (Tono, Apoyo, Exigencia, Formato) para liberar espacio vertical. El área de texto de `Instrucción de Comportamiento` ha sido completamente rediseñada para compartir la misma estética (bordes y layout) que los controles de hardware inferiores (Altavoz, Emojis, Micros).
    - `MentorConfigChat.tsx`: Simplificado el mensaje de bienvenida inicial del asistente.

### Versión 1.6.3: Auto-guardado y Transparencia en Ajustes de Mentor IA
* **Objetivo:** Garantizar la persistencia inmediata de las reglas dictadas a la IA de ajustes y visibilizar su efecto a los profesores.
* **Cambios:**
    - `ModalConfiguracionIA.tsx`: Añadido un nuevo recuadro de texto (`textarea`) a la derecha que expone al profesor exactamente qué "Behavior Prompt" está deduciendo y aplicando el asistente virtual.
    - Se ha re-escrito la función de guardado interno para soportar el modo silencioso (autoguardado). Ahora, cuando el asistente actualiza su instrucción subyacente porque el profesor se lo pide, la aplicación lo intercepta e impacta inmediatamente en la BDD (Supabase) asegurando que el estudiante lo sufra al instante en su próxima pregunta.

### Versión 1.6.2: Fix Configuración Mentor IA
* **Objetivo:** Asegurar que los ajustes definidos por el docente sobre Tico (Mentor IA) se apliquen de forma estricta en la interfaz y comportamiento del alumno.
* **Cambios:**
    - `MentorChat.tsx`: El botón de control de voz (altavoz) ahora se oculta de la interfaz si el profesor decide desactivar la función.
    - Sincronización de Prompt: Se ha re-cableado la llamada a la API de Groq para que reciba y procese la variable `grupo.configuracion`, respetando así el tono, exigencia y la prohibición de uso de emojis dictada por el profesor.

### Intervención Manual: Limpieza de Base de Datos
* **Objetivo:** Eliminar proyecto desactualizado que aparecía erróneamente en el perfil de los alumnos.
* **Acción:** Se ha eliminado de la tabla `proyectos` en Supabase el registro correspondiente a "mujer rural" (Código de sala: `PG0OC1`).

### Versión 1.6.1: Fix Registro Docente y Chat Alumno-Profesor
*   **Objetivo:** Solucionar errores al registrarse como docente y habilitar las funciones de chat bidireccional entre alumnos y profesores.
*   **Cambios:**
    - Ajuste en `AuthContext.tsx` para forzar la asignación del rol a `profesor` tras el login OAuth, saltándose el rol por defecto del trigger SQL.
    - Creación del script SQL `create_mensajes_profesor_alumno.sql` para generar la tabla de la base de datos correspondiente a los mensajes del chat, implementando a su vez políticas RLS y soporte RealTime.
    - Actualización global de la versión en UI a V1.6.1 conforme a las directivas del usuario.

### Versión 1.5.13: Fix de Datos Dinámicos (Lanzamiento 6 Dados)
*   **Objetivo:** Permitir que se muestre el volumen correcto de dados en la función de lanzamiento (antes todos los arrays simulaban sólamente 3 dados y escondían los demás visualmente).
*   **Cambios:**
    - Ajustado el estado y la función generadora `rollDice` en la Pestaña "Dados", sustituyendo el esquema rígido a una inyección limpia mediante iterador de `Array.from`.
    - Sincronización de versiones en `RuletaModal`, `App`, `Dashboard`, `package.json` hacia `v1.5.13`.


### Versión 1.5.12: Expansión de Dados (Hasta 6)
*   **Objetivo:** Permitir el lanzamiento de un mayor número de dados simultáneos.
*   **Cambios:**
    - Ampliado el selector de cantidad de dados para permitir elegir de 1 a 6 dados.
    - Ajustada la escala visual (`scale-75` / `scale-85`) y el espaciado (`gap-4` / `gap-8`) de los dados en pantalla cuando se lanzan más de 3 para que quepan correctamente en todas las resoluciones.
    - Sincronización de versiones a v1.5.12.


### Versión 1.5.11: Ajuste de Margen en D12
*   **Objetivo:** Mejorar la estética y legibilidad del dado D12 en modo resultado.
*   **Cambios:**
    - Reducción del tamaño de fuente en los dados D12 (selector y resultado) para evitar que los números toquen las líneas del dodecaedro.
    - Sincronización de versiones en todo el proyecto.


### Versión 1.5.10: Renderizado Final D12 Realista
*   **Objetivo:** Mostrar un verdadero dado de 12 caras al presentar el resultado (en lugar de limitar el SVG del Dodecaedro sólo a la selección).
*   **Cambios:**
    *   **Lógica de Vista Condicional**: Se ha reescrito el componente encargado de mostrar los dados rodando. Si el selector está en D6, dibuja un cubo CSS 3D (como antes). Si está en D12, descarta el cubo y dibuja un enorme SVG plano que emula la forma de un dodecaedro regular en perspectiva isómetrica/2D.
    *   **Animación Adaptativa**: En vez de animar CSS en 3D para el D12, el SVG del Dodecaedro rota bidimensionalmente durante la fase de lanzamiento para dar sensación de inercia y azar.
    *   **Incrustación de Resultados**: Los números superiores a 6 ahora se imprimen grande y legiblemente en el propio corazón (cara frontal entera) del SVG Dodecaedro final.
    *   **Sincronización de Versión**: V1.5.10 en pie.


### Versión 1.5.9: Rediseño D12 y Corrección de Animación
*   **Objetivo:** Mejorar la fidelidad visual y funcional del dado de 12 caras (D12).
*   **Cambios:**
    *   **Animación Corregida**: El efecto visual rápido al lanzar los dados ahora alcanza el límite real del dado seleccionado (hasta 12 para los D12), en lugar de estar topado en 6.
    *   **Nuevo Icono D12**: Se ha reemplazado el SVG genérico por un diseño geométrico que emula un dodecaedro regular en perspectiva (2D), garantizando que su distinguibilidad frente al D6 sea inmediata y fiel a su temática.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.9.


### Versión 1.5.8: Tipos de Dados Personalizables (D6 y D12)
*   **Objetivo:** Permitir mayor flexibilidad en los minijuegos de azar seleccionando caras del dado.
*   **Cambios:**
    *   **Selector de Tipo**: Añadida interfaz interactiva para decidir entre dados clásicos (D6) y dodecaedros (D12).
    *   **Iconos Visuales**: Se incluyó un SVG personalizado para representar claramente la opción del dado de 12 caras.
    *   **Lógica Adaptativa**: El resultado del lanzamiento (1 al 3 simultáneos) ahora se calcula en base al tope seleccionado (6 o 12).
    *   **Actualización Global**: Sincronización de versiones a la V1.5.8.

### Versión 1.5.7: Refinamiento de Interfaz (Botones de Borrado)
*   **Objetivo:** Equilibrar la visibilidad de las opciones de borrado sin que distraigan excesivamente.
*   **Cambios:**
    *   **Suavizado Visual**: Se cambió el color de fondo predeterminado de los botones de eliminar de rojo intenso a un gris suave (`bg-slate-100`).
    *   **Interactividad Bajo Demanda**: Los botones ahora solo se vuelven rojos (`hover:bg-red-500`) cuando el usuario posiciona el cursor sobre ellos, manteniendo la interfaz limpia pero funcional.
    *   **Consistencia en Paneles**: Aplicado tanto al panel de participantes de la ruleta como al de grupos generados.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.7.

### Versión 1.5.6: Visibilidad Total en Participantes
*   **Objetivo:** Hacer que la eliminación de alumnos sea intuitiva y rápida en el panel principal.
*   **Cambios:**
    *   **Cruz de Eliminar Siempre Visible**: En el listado de participantes de la ruleta (antes de girar), el botón rojo de eliminar ahora está siempre presente, eliminando la necesidad de pasar el ratón para verlo.
    *   **Estética Coherente**: Se aplicó el mismo estilo de botón rojo sólido (`bg-red-500`) con sombra y texto blanco, unificando la experiencia con el panel de grupos.
    *   **Accesibilidad**: Mejora la experiencia en dispositivos táctiles donde el efecto de "hover" no existe.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.6.

### Versión 1.5.5: Mejora en el Control de Grupos
*   **Objetivo:** Facilitar la eliminación de integrantes en la Ruleta de Equipos.
*   **Cambios:**
    *   **Visibilidad de Eliminación**: Se rediseñó el botón de eliminar alumno (`X`) para que sea más grande y tenga un fondo rojo sólido constante, eliminando cualquier ambigüedad visual.
    *   **Contraste Elevado**: Uso de blanco sobre rojo (bg-red-500) y sombra suave para que el botón destaque sobre cualquier fondo de tarjeta.
    *   **Feedback Táctil**: Ajuste en la escala al pulsar para una sensación más física.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.5.

### Versión 1.5.4: Cambio terminológico a "Resumen"
*   **Objetivo:** Ajustar el nombre del módulo de progreso por petición del usuario.
*   **Cambios:**
    *   **Renombrado Final**: El módulo anteriormente llamado "Estadísticas" ha pasado a llamarse **"Resumen"**.
    *   **Actualización de Mensajes**: Se cambió el estado de "Estadísticas vacías" por **"Resumen vacío"** para mantener la coherencia.
    *   **Mantenimiento de Iconografía**: Se conserva el icono `BarChart3` por su claridad visual, pero bajo la nueva etiqueta.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.4.

### Versión 1.5.3: Refinamiento de Identidad en el Juego
*   **Objetivo:** Adaptar terminología y visuales del Juego de Tico para mayor claridad.
*   **Cambios:**
    *   **Renombrado de Módulo**: La sección "Ticoteca" ha sido renombrada a **"Estadísticas"** para que los alumnos identifiquen mejor dónde ver su progreso.
    *   **Iconografía Renovada**: Se sustituyó el icono de la `Cookie` (galleta mordida) por un icono de `Estadísticas` (BarChart3), aportando un aire más profesional y alineado con el análisis de datos.
    *   **UI Estilizada**: Ajustes en los encabezados de los paneles y descripciones de los botones para reflejar el cambio de nombre.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.3.

### Versión 1.5.2: Estabilización del Sistema de Audio
*   **Objetivo:** Solucionar cortes de música y fallos de AudioContext en el Modo Juego.
*   **Cambios:**
    *   **Fix de Reproducción**: Se corrigió un bug en el `useEffect` de `BackgroundMusic` que detenía la música inmediatamente después de iniciarla debido a una limpieza errónea de dependencias.
    *   **Motor Resiliente**: Se reforzó `TicoAudioEngine` para recuperar el `masterGain` y el `AudioContext` de forma más agresiva en caso de estados suspendidos persistentes.
    *   **Auto-recuperación**: Al pulsar "Unmute", el sistema ahora intenta forzar el inicio del audio si este no se activó por la política de autoplay.
    *   **Logs Técnicos**: Se añadieron logs mínimos de estado para facilitar el diagnóstico de bloqueos de audio en producción.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.2.

### Versión 1.5.1: Refinamiento de Interacción de Equipos
*   **Objetivo:** Sustituir prompts nativos por una UI integrada y más fluida.
*   **Cambios:**
    *   **Input Inline**: Se reemplazó el `prompt()` del navegador por un campo de texto integrado directamente en cada tarjeta de equipo, evitando interrupciones y errores de `null`.
    *   **UI Premium**: Diseño de entrada con bordes suavizados, sombras dinámicas y botones de acción (Check/X) con iconos de Lucide.
    *   **Feedback Visual**: Añadidos mensajes de confirmación (Toasts) al añadir miembros y animaciones de entrada suaves.
    *   **Bail-out Seguro**: Posibilidad de cancelar la adición presionando 'Escape' o el botón de cerrar.
    *   **Actualización Global**: Sincronización de versiones a la V1.5.1.

### Versión 1.5.0: Rediseño del Motor de Equipos V2
*   **Objetivo:** Reubicar resultados y asegurar la edición dinámica.
*   **Cambios:**
    *   **Layout Priorizado**: Los equipos generados ahora se muestran en la columna principal (izquierda), ocupando el lugar del panel de bienvenida para una vista mucho más amplia y clara.
    *   **Añadir Integrantes**: Corregida la lógica del botón "+ AÑADIR" en los grupos; ahora permite añadir miembros de forma persistente.
    *   **UI Estilizada**: Actualizados los paneles de control y el flujo de trabajo para que el "Formador de Grupos" sea más intuitivo.
    *   **Versión**: Upgrade a V1.5.0.

### Versión 1.4.8: Corrección del Motor de Grupos
*   **Objetivo:** Reparar la funcionalidad de generación y edición manual de equipos.
*   **Cambios:**
    *   **Slider de Equipos**: Corregido el rango del slider (1-10) y su dependencia de la lista de miembros locales (`managedMembers`).
    *   **Edición Proyectada**: Habilitada la visibilidad permanente de los botones de borrar integrante y corregida la función de añadir en equipos generados.
    *   **UI Dinámica**: El panel de "Formador de Equipos" ahora se oculta automáticamente cuando hay resultados, optimizando el espacio.
    *   **Actualización Global**: Sincronización de todas las etiquetas de versión a la V1.4.8.

### Versión 1.4.7: Corrección de Superposición Móvil
*   **Objetivo:** Resolver conflictos visuales en dispositivos móviles.
*   **Cambios:**
    *   **Fix de Navegación**: Ocultamiento automático de la barra de navegación global del Dashboard cuando el modal de "Sorteo Mágico" está activo.
    *   **Espacio de Trabajo**: Mejora de la visibilidad de los controles de la ruleta en pantallas pequeñas al eliminar elementos redundantes.
    *   **Actualización Global**: Sincronización de todas las etiquetas de versión a la V1.4.7.

### Versión 1.4.6: Refinamiento y Overlay de Ganador
*   **Objetivo:** Mejorar la experiencia de usuario en el sorteo y sincronizar datos entre modos.
*   **Cambios:**
    *   **Anuncio de Ganador**: Implementado un overlay animado a pantalla completa que celebra al ganador del sorteo.
    *   **Sincronización de Equipos**: Ahora los grupos se generan utilizando la lista de participantes editada localmente.
    *   **Limpieza de UI**: Eliminación de placeholders estáticos y optimización de la navegación móvil (solo Ruleta, Grupos, Dados y Cerrar).
    *   **Actualización Global**: Sincronización de todas las etiquetas de versión a la V1.4.6.

### Versión 1.4.5: Gestión Dinámica de Miembros
*   **Objetivo:** Permitir la edición local de participantes y equipos sin afectar la base de datos.
*   **Cambios:**
    *   **Participantes Editables:** Panel lateral en la ruleta para añadir y eliminar participantes en tiempo real.
    *   **Refactorización de Modos:** Ocultamiento de la ruleta en modo Grupos para priorizar la visualización de equipos.
    *   **Gestión de Equipos:** Funcionalidad para añadir y eliminar miembros directamente dentro de los grupos generados.
    *   **Privacidad de Datos:** Uso de estado local para asegurar que las ediciones temporales no modifiquen la lista de alumnos original.
    *   **Actualización Global:** Sincronización de todas las etiquetas de versión a la V1.4.5.

### Versión 1.4.4: Lanzador de Dados 3D
*   **Objetivo:** Integrar una herramienta de gamificación rápida dentro del modal de la ruleta para lanzamientos de azar.
*   **Cambios:**
    *   **Minijuego de Dados:** Añadida una nueva sección "Dados" con un modelo 3D animado por CSS.
    *   **Lógica de Azar:** Implementación de la función `rollDice` con una secuencia visual de rotación y un resultado final aleatorio (1-6).
    *   **UI Dinámica:** Integración del modo "dados" en la barra de navegación móvil y el conmutador de modos de escritorio.
    *   **Actualización Global:** Sincronización de todas las etiquetas de versión a la V1.4.4.

### Versión 1.4.3: Botón Crystal Magic
*   **Objetivo:** Elevar la calidad visual del botón de la ruleta hacia un estilo más premium ("Crystal Magic").
*   **Cambios:**
    *   **Rediseño Premium:** Botón con estilo de cristal, bordes blancos, sombras profundas y gradientes animados.
    *   **Animaciones CSS:** Inclusión de `spin-slow` para los anillos de energía y efectos de refracción de luz al pasar el cursor.
    *   **Identidad Visual:** Sincronización de todas las etiquetas de versión a la V1.4.3.

### Versión 1.4.2: Ruleta Mágica y Mejoras de UX
*   **Objetivo:** Mejorar la interactividad del minijuego de ruleta y unificar la versión del sistema.
*   **Cambios:**
    *   **Ruleta Mágica:** Se ha movido el botón de "Girar" al centro de la ruleta para una interacción más natural. Se han añadido fondos de color (badges) a los nombres de los alumnos en la ruleta para mejorar la legibilidad.
    *   **Limpieza de UI:** Se ha simplificado el panel lateral de la ruleta, eliminando botones redundantes.
    *   **Versión Unificada:** Actualización de las etiquetas de versión en todo el sistema a la V1.4.2.

### Versión 1.4.1: Mejoras Visuales y Temáticas (SVGs)
*   **Objetivo:** Refinar la calidad visual de la representación del progreso (Nexo / Satélite) y actualizar la terminología.
*   **Cambios:**
    *   **Nexo (Proyecto General):** Integración de cuadrícula holográfica, anillos orbitales más complejos, núcleo multinivel resplandeciente, texturas y partículas rediseñadas con mayor luminosidad y animaciones CSS avanzadas.
    *   **Satélite (Grupos):** Rediseño total de la estructura base del satélite, incluyendo paneles solares detallados (modo rejilla/reflejo), luces de advertencia activas (rojas), estelas de datos y una onda escáner tipo radar visible al 100% de progreso.
    *   **Textos:** Reemplazo de cadenas antiguas ("Jardín de la Clase") por términología temática ("Nexo Global") en el `DashboardAlumno`. Modificación del texto local de `DetalleGrupo` para sincronizar con la visualización del Satélite ("En Órbita").

### Versión 1.4.0: Sistema de Puntos para Alumnos
*   **Objetivo:** Permitir al docente otorgar y restar puntos a los alumnos durante la evaluación de asistencia.
*   **Cambios:**
    *   Creación de la tabla `alumno_puntos` en Supabase con RLS habilitado.
    *   Implementación de controles interactivos (+1, -1) en el `ModalAsistencia`.
    *   Visualización del total de puntos en el `PerfilAlumno` (tarjeta de Rendimiento Clave).
    *   Visualización del total de puntos en la vista `FamiliaNotasAlumno` para los tutores legales.

### 1. Refactorización de "Detalle de Grupo"
*   **Objetivo:** Mejorar la usabilidad y estética del panel de control del profesor para un grupo específico.
*   **Cambios:**
    *   Implementación de un diseño de columnas separadas para Chat de Equipo y Mentor IA.
    *   Adopción de un estilo "Minimalista" para los encabezados (texto + barra de color).
    *   Consolidación de botones de acción ("Configurar IA", "Editar", "Asignar") en una cuadrícula.
    *   Actualización de iconos (ej. `ClipboardList` para tareas).

### 2. Configuración Global de IA
*   **Objetivo:** Permitir al docente gestionar permisos de IA para toda la clase rápidamente.
*   **Solución:** Creación de un modal de configuración accesible desde el header principal que realiza actualizaciones masivas (batch updates) en Supabase.

### 3. Estabilización del Entorno Local
*   **Problema:** El script de lanzamiento abría múltiples pestañas o cargaba versiones cacheadas antiguas.
*   **Solución:**
    *   Se reescribió `ABRIR_DEMO.bat`.
    *   Se aumentó el tiempo de espera del servidor a 20 segundos.
    *   Se desactivó `open: true` en la configuración de Vite para evitar conflictos.
    *   Se añadió un parámetro de "cache-busting" (`?v=%RANDOM%`) a la URL.

## Registro de Errores y Soluciones

### Error: Runtime en `DetalleGrupo.tsx`
*   **Síntoma:** Pantalla blanca o error de "undefined property" al acceder al detalle.
*   **Causa:** Propiedades `fases` o `grupo` no se pasaban correctamente o eran `undefined` en la carga inicial.
*   **Solución:** Se añadieron validaciones condicionales y se aseguró el paso correcto de props desde el componente padre (`DashboardDocente`).

### Error: Botones de Acción "Desaparecidos"
*   **Síntoma:** No se veían los botones de asignar tarea o editar grupo.
*   **Causa:** El renderizado condicional de los botones dependía de props (`onAssignTask`, `onEditGroup`) que no se estaban pasando desde el componente contenedor principal.
*   **Solución:** Se cablearon correctamente los manejadores de eventos desde `App.tsx` -> `DashboardDocente` -> `DetalleGrupo`.

### Error: Chat Invertido y Estilo Pobre
*   **Síntoma:** El chat del mentor aparecía donde debía estar el del grupo, y los encabezados eran poco atractivos.
*   **Solución:**
    *   Se intercambiaron las columnas en el Grid de Tailwind (Mentor Izquierda / Grupo Derecha).
    *   Se rediseñó el CSS de los encabezados para usar un borde inferior de color (`border-b-2`) en lugar de contenedores tipo "píldora".

### Error: Lanzamiento Fallido (Pestaña en Blanco)
*   **Síntoma:** Al ejecutar el script `.bat`, el navegador se abría pero mostraba "No se puede conectar".
*   **Causa:** El navegador intentaba cargar `localhost` antes de que Vite terminara de compilar (`npm run preview`).
*   **Solución:** Aumento drástico del `timeout` en el script bash a 20 segundos antes de invocar al navegador.

---

## Estado Actual del Despliegue
*   **Plataforma:** Vercel
*   **Rama:** `master`
*   **Estado:** Producción estable (v3.8.0).

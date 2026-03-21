# Registro de Actualizaciones - Tico.AI

## [V5.8.51] - 2026-03-21
### Añadido
- **Calificaciones por Tarea para Alumnos:** Nueva sección en "Mis Notas" que muestra el desglose de calificaciones obtenidas en cada misión/tarea específica.
- **Acceso para Familias:** Los padres ahora pueden ver el desglose detallado de las calificaciones por tarea de sus hijos desde el panel familiar.
- **Sincronización de Versiones:** Unificación de la versión del sistema en todos los paneles (Docente, Alumno y Familia).


## [V5.8.50] - 2026-03-21
### Corregido
- **Optimización de Filtros:** Se ha simplificado la lógica interna del filtrado de misiones para evitar errores de tipo y asegurar la detección correcta de estados completados.
- **Navegación Fluida:** Verificada la compatibilidad del atajo al editor en el despliegue de producción.

## [V5.8.49] - 2026-03-21
### Añadido
- **Atajo Directo al Editor:** Al filtrar por grupo específico, el sistema salta el Hub de Misión y abre directamente la entrega del grupo.

## [V5.8.48] - 2026-03-21
### Corregido
- **Filtros de Tareas Inteligentes:** Se ha rediseñado el sistema de filtrado de misiones. Ahora, al seleccionar un grupo específico, el estado "Completado" se calcula únicamente para ese grupo (detectando sus entregas individuales), permitiendo ver misiones como completadas aunque otros grupos no las hayan terminado aún.
- **Contexto de Grupo:** Al filtrar por un grupo, solo se muestran sus misiones específicas y las globales, ocultando las misiones de otros equipos.

## [V5.8.47] - 2026-03-21
### Corregido
- **Consistencia de Progreso:** Se ha unificado la lógica de cálculo de progreso entre la lista de "Gestión de Equipos" y la vista de detalle. Ahora ambos paneles usan el mismo algoritmo riguroso que detecta entregas evaluadas, tareas específicas y misiones globales sincronizadas.

## [V5.8.46] - 2026-03-21
### Corregido
- **Cálculo de Batería:** Se corrigió la detección del estado `evaluada` en la base de datos para misiones globales.
- **Progreso Reactivo:** La batería ahora se calcula localmente al instante para evitar el 0% visual durante la carga.

## [V5.8.45] - 2026-03-21
### Corregido
- **Barra de Progreso (Batería):** Corregido el error donde la batería SVG siempre mostraba 0% en el detalle del grupo. Ahora el progreso se calcula correctamente para cada grupo, teniendo en cuenta tanto las tareas específicas como las globales (mediante la tabla `entregas_tareas`).
- **Sesión del Alumno:** Corregido el bug de la "pantalla en blanco" al iniciar sesión. Ahora el dashboard del alumno auto-selecciona automáticamente el último proyecto visitado si no hay uno activo en su perfil.
- **Navegación Docente:** Se asegura que al hacer clic en un grupo desde la gestión de equipos, se pase el valor de progreso actualizado al panel de detalle.

## [V5.8.44] - 2026-03-21
- **Consistencia**: "version": "5.8.45",.

## [V5.8.43] - 22-03-2026
- **Rediseño de Navegación**:
  - Se ha movido el acceso al **Calendario** desde la barra lateral directamente a la cabecera del proyecto, junto al botón de **Horario**.
  - El botón ahora se resalta visualmente cuando la sección de calendario está activa.
  - Mejora de usabilidad al tener los accesos temporales agrupados en la parte superior.
- **Limpieza de UI**: Eliminado el acceso redundante en el menú lateral.
- **Consistencia**: Salto a V5.8.43.

## [V5.8.42] - 22-03-2026
- **Exportación a Excel Completa**:
  - Se ha añadido una tercera pestaña al archivo Excel llamada **"Misiones (Tareas)"**.
  - Esta hoja contiene el detalle completo de qué nota tiene cada grupo en cada tarea individual, además del ratio de entrega y la media de tareas.
  - El archivo final de exportación ahora incluye: **Calificaciones Rúbrica**, **Misiones (Tareas)** y **Definición de Niveles de Rúbrica**.
- **Consistencia**: Salto a V5.8.42.
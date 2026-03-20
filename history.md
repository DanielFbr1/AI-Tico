# Registro de Cambios - V5.7.8
# Registro de Cambios - V5.8.0
# Registro de Cambios - V5.8.1

## Actualizaciones Realizadas
- **V5.7.9**: Corrección de Restricciones (400) y Visibilidad.
- **Error 400 Solucionado**: Implementado mapeo de estados compatible con la tabla `entregas_tareas`.
- **Visibilidad Inmediata**: Las instrucciones de la misión ahora se ven al instante, eliminando el bloqueo de carga global.
- **Tipado de IDs**: Asegurada la conversión a `bigint` para identificadores de grupo en Supabase.
- **V5.8.5**: Despliegue Final y Depósito Compartido.
- **Adiós "Evidencias"**: Rebranding de la sección de archivos a "Depósito de la Misión" para reflejar un espacio compartido.
- **Sincronización Reforzada**: Forzada la comparación numérica de IDs en Realtime para evitar fallos de tipos.
- **V5.8.4**: Restricción de Unicidad (Saneamiento BD).
- **Archivos Bidireccionales**: Profesores y alumnos ahora comparten el mismo depósito de archivos en cada grupo. El profesor puede subir feedback directamente y el alumno lo ve al instante. Ambos pueden borrar sus archivos.
- **NaN Fix**: Blindaje total de campos numéricos (Puntos y Calificación) para evitar errores de consola.
- **V5.7.7**: Mejoras en Interacción y Navegación Alumno.
- **ModalSeguimientoGrupos**:
    - Eliminados botones "Aprobar", "Rechazar" y "Perfil de Tarea".
    - Filas de grupos ahora clicables para abrir evaluación.
- **ModalDetalleTarea**:
    - Adaptado a diseño classroom de dos columnas.
    - Soporte para `targetGrupoId` para evaluar grupos específicos.
    - Entrada numérica para calificación (1-10) en lugar de barra.
    - Lógica de guardado dual (global y específica de grupo).
    - **Nueva Lógica de Estado**: El estado ahora se muestra con el estilo de los otros campos y se computa automáticamente (Pendiente, En Revisión, Completada, Expirada).
- **Vercel**: Preparado para despliegue.

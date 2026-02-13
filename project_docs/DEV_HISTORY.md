# Historial de Desarrollo y Correcciones

Este documento registra los hitos principales del desarrollo reciente, los errores encontrados y cómo fueron solucionados.

## Hitos Recientes

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

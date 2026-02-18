# 🧪 CHECKLIST DE PRUEBAS — Tico.AI (Pre-Presentación)

> **Versión:** v3.2.5  
> **Fecha de Creación:** 17 de Febrero 2026  
> **URL de Producción:** https://ai-tico.vercel.app  
> **Objetivo:** Verificar que TODAS las funcionalidades de la app funcionan correctamente antes de la presentación.

---

## 📋 Instrucciones

- Marca cada casilla `[ ]` → `[x]` cuando la prueba pase correctamente.
- Si algo falla, anota el **problema** al lado del ítem.
- Realiza TODAS las pruebas en **PC (Chrome)** y en **Móvil (navegador del teléfono)**.
- **Consola del navegador:** Mantén la consola abierta (`F12 > Console`) durante las pruebas. Anota cualquier error rojo.

---

## 🔑 FASE 1: LOGIN Y AUTENTICACIÓN

### 1.1 Página de Login
- [ ] La página carga correctamente sin errores en consola
- [ ] Se muestra el logo/título "Tico.AI" y los botones de login
- [ ] El fondo y los colores se ven correctamente (tonos púrpura/azul)
- [ ] **Botón "Soy Profesor"**: Se muestra con estilo cyan
- [ ] **Botón "Soy Alumno"**: Se muestra con estilo rosa/magenta

### 1.2 Login como Profesor (Google OAuth)
- [ ] Hacer clic en "Soy Profesor" → redirige a Google OAuth
- [ ] Después de autenticarse, se redirige al **Panel de Proyectos** (ProjectsDashboard)
- [ ] No aparecen errores 401 o 403 en la consola
- [ ] El nombre/avatar del profesor se muestra correctamente

### 1.3 Login como Alumno
- [ ] Hacer clic en "Soy Alumno" → pide nombre y código de sala
- [ ] Introducir un **código inválido** → muestra error claro
- [ ] Introducir un **código válido** + nombre → entra al Dashboard Alumno
- [ ] El alumno aparece en la lista de alumnos del proyecto del profesor

### 1.4 Cierre de Sesión
- [ ] **Profesor**: Pulsar "SALIR" → vuelve a la pantalla de login
- [ ] **Alumno**: Pulsar botón de logout → vuelve a la pantalla de login
- [ ] Después de cerrar sesión, recargar la página NO mantiene la sesión anterior

---

## 📁 FASE 2: GESTIÓN DE PROYECTOS (Panel del Profesor)

### 2.1 Panel de Proyectos (ProjectsDashboard)
- [ ] Se muestran los proyectos existentes del profesor
- [ ] Las tarjetas de proyecto muestran: nombre, clase, número de grupos, código de sala
- [ ] **Crear Proyecto**: Pulsar "+" → se abre el modal de creación
  - [ ] Rellenar nombre, descripción, clase → crear proyecto → aparece en la lista
  - [ ] El código de sala se genera automáticamente
- [ ] **Eliminar Proyecto**: Pulsar icono de papelera → confirmación → el proyecto desaparece
- [ ] **Cargar Datos de Ejemplo**: Si existe el botón, crea proyectos de prueba
- [ ] **Buscar Proyecto**: El buscador filtra proyectos por nombre (si existe)

### 2.2 Entrar en un Proyecto (ProjectDetail)
- [ ] Hacer clic en un proyecto → se carga el **Dashboard Docente**
- [ ] El nombre del proyecto y el código de sala se muestran en el header
- [ ] **Renombrar Proyecto** (PC): Clic en el icono de lápiz → cambiar nombre → guardar → se actualiza
- [ ] **Cambiar Proyecto**: Botón "Cambiar" → vuelve al panel de proyectos

---

## 👥 FASE 3: GESTIÓN DE GRUPOS

### 3.1 Sección "Grupos"
- [ ] Se muestra la sección de "Gestión de Equipos"
- [ ] **Crear Grupo**: Pulsar "Crear nuevo grupo"
  - [ ] Rellenar nombre del grupo → añadir miembros manualmente → crear
  - [ ] El grupo aparece en la cuadrícula
- [ ] **Editar Grupo**: Pulsar icono de edición en una tarjeta de grupo
  - [ ] Cambiar nombre o miembros → guardar → se actualiza correctamente
- [ ] **Eliminar Grupo**: Pulsar icono de papelera → confirmación → el grupo desaparece
- [ ] La tarjeta de grupo muestra: nombre, miembros, % progreso, estado

### 3.2 Asignar Tareas a un Grupo
- [ ] En la tarjeta de un grupo, pulsar "Asignar Tareas"
- [ ] Se abre el modal de asignación → crear tarea con título → guardar
- [ ] La tarea aparece en el tablero global de misiones (sección "Tareas")

### 3.3 Detalle del Grupo (GroupDetail)
- [ ] Hacer clic en un grupo → se abre la vista detallada
- [ ] Se muestra: nombre del grupo, lista de miembros, hitos/tareas
- [ ] Botón "Volver" → regresa al Dashboard Docente

---

## 📋 FASE 4: TABLERO DE TAREAS (Sección "Tareas")

### 4.1 Tablero Global de Misiones
- [ ] Se muestran 3 columnas: **Pendientes/Revisión**, **En Curso**, **Completadas**
- [ ] Las tareas se clasifican correctamente en cada columna
- [ ] Cada tarjeta de tarea muestra: nombre del grupo + título de la tarea
- [ ] **Eliminar tarea**: Hover sobre una tarea → aparece icono de papelera → eliminar (con confirmación)

### 4.2 Revisión de Tareas Pendientes
- [ ] Si hay tareas en "Revisión", aparece el botón amarillo "X Pendientes" en el header
- [ ] Pulsar el botón → se abre el **Modal de Revisión de Hitos**
- [ ] Se puede aprobar o rechazar cada tarea individualmente
- [ ] Después de aprobar/rechazar, la tarea cambia de columna

### 4.3 Árbol de Vida (Living Tree)
- [ ] En el panel lateral derecho (PC), se muestra el árbol animado
- [ ] El porcentaje de "Crecimiento Global" se calcula correctamente

---

## 📂 FASE 5: TRABAJO COMPARTIDO (Repositorio)

### 5.1 Repositorio Colaborativo
- [ ] Se muestran los archivos subidos por alumnos y profesor
- [ ] **Subir Archivo (Docente)**: Pulsar "Subir Archivo Docente"
  - [ ] Adjuntar un archivo (imagen, PDF, etc.) → rellenar datos → subir
  - [ ] El archivo aparece en la lista del repositorio
- [ ] Se puede previsualizar o descargar un archivo
- [ ] Los archivos se filtran/agrupan correctamente (si hay filtros)

---

## 📊 FASE 6: EVALUACIÓN

### 6.1 Evaluación por Equipos
- [ ] Se muestra la cuadrícula de grupos con su nota final
- [ ] **Evaluar un grupo**: Clic en la tarjeta de un grupo
  - [ ] Se abre el modal de evaluación grupal
  - [ ] Se puede puntuar cada criterio de la rúbrica
  - [ ] Guardar evaluación → la nota aparece en la tarjeta del grupo
- [ ] **Exportar Excel**: Pulsar "Exportar Excel" → se descarga un archivo .xlsx
  - [ ] El Excel contiene las notas correctas

### 6.2 Tabla de Calificaciones
- [ ] Se muestra la tabla con: Equipo, Estudiante, Nota Final, criterios...
- [ ] Los datos son coherentes con las evaluaciones realizadas
- [ ] **Ver Perfil**: Pulsar botón "Ver Perfil" de un alumno → se abre el PerfilAlumno

### 6.3 Rúbrica de Evaluación
- [ ] Se muestra la tabla de rúbrica con los criterios existentes
- [ ] **Editar nombre/descripción** de un criterio → se guarda automáticamente (auto-save 2s)
- [ ] **Editar niveles** (Insuficiente/Suficiente/Notable/Sobresaliente) → se guarda automáticamente
- [ ] **Añadir Criterio**: Pulsar "Añadir Criterio" → aparece nueva fila
- [ ] **Eliminar Criterio**: Pulsar icono rojo de papelera → se elimina SIN pedir confirmación
- [ ] **Autocompletar con IA** ✨: Pulsar botón → la IA rellena las descripciones de los niveles
  - [ ] Las descripciones generadas tienen sentido pedagógico
  - [ ] No aparecen textos como `[object Object]`
- [ ] **Móvil**: La tabla de rúbrica permite scroll horizontal y el texto no se desborda

---

## 👨‍🏫 FASE 7: HERRAMIENTAS DEL HEADER

### 7.1 Botón "IA MENTOR" (Configurar Mentor IA)
- [ ] Se abre el modal de configuración del Mentor IA
- [ ] Se puede editar el prompt/personalidad de Tico
- [ ] Guardar cambios → se refleja en la interacción del alumno con Tico

### 7.2 Botón "LISTA" (Pasar Lista / Asistencia)
- [ ] Se abre el modal de control de asistencia
- [ ] Se muestra la fecha de hoy y la lista de alumnos
- [ ] Cambiar la fecha → carga la asistencia de ese día
- [ ] Marcar/desmarcar alumnos como presentes
- [ ] "Guardar Registro" → se persiste en Supabase
- [ ] Volver a abrir → los datos se mantienen
- [ ] **El botón NO "espasmodea"** al pulsarlo rápidamente (transición suave)

### 7.3 Botón "TICO" (Pantalla Completa)
- [ ] Pulsar "TICO" → se abre la pantalla completa del juego de Tico

### 7.4 Botón "AZAR" / "RULETA"
- [ ] Se abre el modal de la Ruleta / Sorteo
- [ ] Se pueden sortear alumnos o formar grupos aleatorios

### 7.5 Botón "SALIR"
- [ ] Cierra la sesión correctamente

---

## 🎮 FASE 8: TICO GAME (Pantalla Completa)

### 8.1 Vista Principal
- [ ] Tico se muestra centrado en la pantalla con animación idle
- [ ] El fondo/nido se renderiza correctamente
- [ ] **Círculo de Nivel**: Se ve correctamente centrado con el número de nivel
- [ ] **Barra de progreso** dentro del círculo: Se llena correctamente según recursos ingeridos
- [ ] Música de fondo se reproduce (si está activada)
- [ ] **Botón "Volver a Clase"**: Vuelve al Dashboard Docente

### 8.2 Interacción con Tico
- [ ] Hacer clic en Tico → reproduce una animación y muestra una burbuja de respuesta
- [ ] La burbuja de respuesta se puede cerrar con la "X"
- [ ] **PC**: La burbuja aparece a la derecha de Tico
- [ ] **Móvil**: La burbuja aparece por encima de Tico, centrada

### 8.3 Pestaña "Alimentar" (Recursos)
- [ ] Se muestra el grid de 5 categorías de recursos
- [ ] **Los botones de categoría** se ven correctamente (NO centrados individualmente, bien alineados en grid)
- [ ] Seleccionar una categoría → pedir URL/contenido → enviar
- [ ] Tico "ingiere" el recurso → gana XP → animación de celebración
- [ ] El nivel sube después de ingerir los recursos necesarios (sistema de 3 pasos)

### 8.4 Pestaña "Ticoteca" (Cerebro / Sabiduría)
- [ ] Se muestra el panel de estadísticas con barras de progreso por categoría
- [ ] Los datos coinciden con los recursos ingeridos

### 8.5 Pestaña "Álbum" (Stickers)
- [ ] Se muestra la colección de stickers desbloqueados
- [ ] Los stickers bloqueados aparecen con "?"
- [ ] Al desbloquear un sticker, se muestra la animación de revelación

### 8.6 Responsive (Móvil vs PC)
- [ ] **Móvil**: Tico, burbuja, panel de nivel y botones se ven bien sin solaparse
- [ ] **Móvil**: El texto de respuesta de Tico es legible
- [ ] **Móvil**: El botón "Volver a Clase" es accesible y no queda tapado
- [ ] **PC**: Todo se ve proporcionado y bien distribuido

---

## 🎓 FASE 9: DASHBOARD DEL ALUMNO

### 9.1 Entrada y Vista Principal
- [ ] Después del login, el alumno ve su Dashboard personalizado
- [ ] Se muestra: nombre, grupo al que pertenece, proyecto activo
- [ ] Las secciones principales son navegables

### 9.2 Chat con Tico (Mentor IA)
- [ ] El alumno puede chatear con Tico
- [ ] Las respuestas de la IA son coherentes con el proyecto activo
- [ ] La IA NO da respuestas directas (método socrático)
- [ ] Se puede ver el historial de conversación
- [ ] El chat funciona tanto en PC como en móvil

### 9.3 Tareas del Alumno
- [ ] Se muestran las tareas asignadas a su grupo
- [ ] El alumno puede cambiar el estado de sus tareas (e.g., marcar como "En Revisión")
- [ ] Los cambios se reflejan en el panel del profesor

### 9.4 Subir Archivos (si aplica)
- [ ] El alumno puede subir archivos al repositorio compartido
- [ ] Los archivos subidos aparecen tanto en su vista como en la del profesor

### 9.5 Unirse a Otra Clase
- [ ] El alumno puede unirse a otra clase con un nuevo código de sala
- [ ] El cambio de clase es correcto y carga los datos del nuevo proyecto

---

## 📱 FASE 10: TUTORIAL INTERACTIVO

### 10.1 Iniciar Tutorial
- [ ] **PC**: El botón "Tutorial interactivo" está visible en el sidebar
- [ ] Pulsar el botón → se inicia el tutorial con overlay oscuro
- [ ] El primer paso se muestra con el elemento destacado

### 10.2 Navegación del Tutorial
- [ ] "Siguiente" → avanza al siguiente paso
- [ ] "Anterior" → retrocede al paso anterior
- [ ] La barra de progreso se actualiza correctamente
- [ ] "Saltar tutorial" → cierra el tutorial inmediatamente
- [ ] **El elemento señalado se resalta con un borde azul/púrpura pulsante**

### 10.3 Responsive del Tutorial
- [ ] **Móvil**: El tooltip del tutorial aparece posicionado encima del menú inferior
- [ ] **Móvil**: El tooltip NO queda tapado por el panel de navegación inferior
- [ ] **Móvil**: El ancho del tooltip se adapta a la pantalla (no se desborda)
- [ ] **PC**: El tooltip se posiciona correctamente junto al elemento señalado

---

## 🌐 FASE 11: VERIFICACIONES GENERALES

### 11.1 Consola del Navegador
- [ ] **SIN errores rojos** en la consola al cargar la página
- [ ] **SIN errores 401** del `site.webmanifest` (en producción)
- [ ] **SIN errores 400** de Supabase (columnas inexistentes, etc.)
- [ ] Si aparece el error `tico_state does not exist`, ejecutar la migración SQL pendiente

### 11.2 Rendimiento
- [ ] La app carga en menos de 5 segundos en conexión normal
- [ ] Las transiciones y animaciones son fluidas (60fps)
- [ ] No hay "freezes" o bloqueos al navegar entre secciones

### 11.3 Responsive General
- [ ] **Móvil (< 768px)**: La barra de navegación inferior funciona (5 secciones)
- [ ] **Móvil**: El header no desborda horizontalmente
- [ ] **Tablet**: La interfaz se adapta correctamente
- [ ] **PC** (1920x1080): El sidebar se muestra correctamente

### 11.4 Datos y Persistencia
- [ ] Recargar la página mantiene la sesión (no se cierra)
- [ ] Los cambios en grupos, tareas y evaluaciones se persisten en Supabase
- [ ] Cambiar de dispositivo y loguearse con la misma cuenta → los datos están ahí
- [ ] El progreso de Tico se guarda (localStorage + Supabase si la columna existe)

### 11.5 Versión
- [ ] La etiqueta de versión (`v3.2.x`) aparece en la esquina inferior derecha
- [ ] La versión del código coincide con la versión desplegada

---

## 🛠️ FASE 12: ESCENARIOS EDGE CASE (Casos Límite)

### 12.1 Sin Datos
- [ ] Crear un proyecto nuevo (vacío) → la interfaz muestra estados vacíos amigables
- [ ] Grupo sin miembros → no rompe la visualización
- [ ] Evaluación sin criterios → no produce errores

### 12.2 Datos Erróneos
- [ ] Recargar la página rápidamente durante una operación → no corrompe datos
- [ ] Doble clic en botones de guardar → solo ejecuta una vez (debounce)
- [ ] Perder conexión a Internet → la app no se rompe (muestra error amigable)

### 12.3 Concurrencia
- [ ] Profesor y alumno logueados al mismo tiempo → ambos ven datos actualizados
- [ ] Dos profesores editando el mismo proyecto → los cambios no se pierden

---

## ✅ RESUMEN FINAL

| Fase | Estado | Notas |
|------|--------|-------|
| 1. Login y Autenticación | ⬜ | |
| 2. Gestión de Proyectos | ⬜ | |
| 3. Gestión de Grupos | ⬜ | |
| 4. Tablero de Tareas | ⬜ | |
| 5. Trabajo Compartido | ⬜ | |
| 6. Evaluación | ⬜ | |
| 7. Herramientas del Header | ⬜ | |
| 8. Tico Game | ⬜ | |
| 9. Dashboard Alumno | ⬜ | |
| 10. Tutorial Interactivo | ⬜ | |
| 11. Verificaciones Generales | ⬜ | |
| 12. Escenarios Edge Case | ⬜ | |

> **🎯 Meta**: Todas las casillas marcadas con `[x]` y la columna "Estado" con ✅.  
> **📝 Si algo falla**: Anota el problema y prioriza los que afectan a la demo.

---

## 🗒️ NOTAS DE BUGS ENCONTRADOS

| # | Descripción del Bug | Severidad | Estado |
|---|---------------------|-----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

*Documento generado automáticamente para la presentación de Tico.AI — ¡Buena suerte! 🚀*

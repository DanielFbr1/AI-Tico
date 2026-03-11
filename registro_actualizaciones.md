# Registro de Actualizaciones

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
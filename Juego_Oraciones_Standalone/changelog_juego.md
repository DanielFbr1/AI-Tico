# 📝 Registro de Actualizaciones (Changelog) - Juego Oraciones

## Versión 1.2.7 (Arreglo Definitivo Drag & Drop en Android)
**Fecha:** 11 de marzo de 2026
**Detalles:**
- **Reversión Híbrida Inteligente:** Volvemos a permitir tanto "Arrastrar" como "Un Clic" para mandar las tarjetas, según quiera jugar el niño.
- **Bloqueo de Scroll Táctil (`touch-action: none`):** Añadido el bloqueo de scroll nativo a las tarjetas y las cajas. Esto evita que el navegador móvil (Android/iPad) intente hacer scroll al tocar la carta, permitiendo que el polyfill de Drag & Drop por fin funcione correctamente y sin dar saltos.
- **Sensibilidad Mejorada (50ms):** Reducido drásticamente el tiempo de espera al arrastrar una carta (de 250ms a 50ms) para que el dedo funcione casi exactamente igual de rápido que un ratón en el ordenador.

## Versión 1.2.5 (Interacción Táctil Nativa y DUA)
**Fecha:** 11 de marzo de 2026
**Detalles:**
- **Sistema Híbrido Clic/Toque:** Removido definitivamente el sistema de arrastre para tablets debido a conflictos persistentes con las navegaciones móviles. Se ha implementado un sistema nativo superior de "Tocar para Seleccionar" basado en el Diseño Universal de Aprendizaje (DUA). Ahora, al tocar una tarjeta se resalta en azul, y tocando un hueco vacío, viaja automáticamente allí.
- **Traductor (Rapidisímo):** Añadida la conversión del superlativo "rapidísimo" a "rápido" en el motor interno para que la API de ARASAAC devuelva correctamente su dibujo en lugar de fallar (Error 404).

## Versión 1.2.4 (Corrección de Soltar Táctil y UI del Profesor)
**Fecha:** 11 de marzo de 2026
**Detalles:**
- **Resolución "Soltar" en Tablets:** Solucionado el conflicto entre los eventos propios de las tablets (scroll) y las tarjetas del juego. Ahora las tarjetas deshabilitan su comportamiento táctil por defecto mientras son arrastradas (`touch-action: none`), y se pide una leve retención (`holdToDrag`) de un cuarto de segundo en lugar de arrastre instantáneo para permitir hacer clics fluidos evitando falsos positivos.
- **Botón de Aciertos:** Se ha cambiado la estadística escondida del maestro en el *Game Over* de gris a azul brillante para que logre sobresalir un poco más entre todo el amarillo y sea fácil de leer por pedido de los usuarios.
- **Correcciones Internas:** Añadida solución para neutralizar la advertencia del favicon ausente que ensuciaba la consola del servidor durante las depuraciones.

## Versión 1.2.3 (Rediseño de Recompensas y Motivación)
**Fecha:** 11 de marzo de 2026
**Detalles:**
- **Game Over Positivo:** Rediseño completo de la pantalla final al terminar las rondas. Ahora el elemento principal y gigantesco son los "PUNTOS MÁGICOS" obtenidos, presentados en una tarjeta dorada con animaciones de estrellas, reforzando la sensación de recompensa y logro.
- **Métricas Sutiles para el Docente:** La estadística de "Aciertos a la primera" (ej. 7/10), que antes ocupaba la mayor parte de la pantalla y podía frustrar a estudiantes con baja puntuación, se ha reubicado en una etiqueta pequeña y discreta (al estilo marca de agua en la parte inferior) diseñada específicamente para la rápida consulta del profesor sin amargar la experiencia del alumno.

## Versión 1.2.2 (Soporte Tablet y Mejoras UI)
**Fecha:** 11 de marzo de 2026
**Detalles:**
- **Soporte para Tablets:** Implementado un sistema ("polyfill") para habilitar el arrastrar y soltar (drag & drop) nativamente en pantallas táctiles como iPads y tablets Samsung.
- **Control de Audio (Mute):** Agregada capacidad para silenciar completamente o reactivar el sistema de lectura por voz desde el menú principal y dentro de la partida.
- **Activación de Audio en Dispositivos Móviles:** Mejorada la lógica de inicialización del audio para que los navegadores móviles o tablets no bloqueen el sonido automático que daba problemas antes.

## Versión 1.2.1 (Refinamiento UI y Motor Ortográfico Independiente)
**Fecha:** 9 de marzo de 2026
**Detalles:**
- **Ortografía Selectiva:** Ahora se puede evaluar por separado el respeto a "Mayúsculas Iniciales" y el uso correcto de "Acentos y Tildes". Activar una y no otra permite, por ejemplo, aceptar una oración correcta pero en minúsculas.
- **Corrección Táctil Integrada:** Si un niño se equivoca al arrastrar la tarjeta en la pizarra, las tarjetas involucradas **ya no desaparecen ni se resetean** hacia abajo. Seguirán ahí y podrá moverlas, intercambiarlas o replantear su estrategia viendo la frase completa en la pantalla superior.
- **Diseño de Interfaz:** Limpieza de cabeceras visuales eliminando las viñetas numéricas descriptivas que entorpecían la lectura en pantallas pequeñas.

## Versión 1.2.0 (Motor Ortográfico)
**Fecha:** 9 de marzo de 2026
**Detalles:**
- **Sistema Paramétrico de Ortografía:** Nuevo botón en la configuración para alternar una evaluación estricta (Desactivada por defecto).
- **Validación Sensible a Mayúsculas:** Ahora el inicio de cada oración y los nombres propios requieren el uso de la tarjeta específicamente en mayúscula (ej. "El" vs "el"). 
- **Verificación de Tildes:** Palabras similares como "papa" y "papá" ahora se detectan de forma independiente si la opción está activa.
- **Feedback Sensible:** En el modo Dictado, si el niño falla una tilde o una mayúscula pero la palabra está bien escrita, el juego emitirá una alerta visual/de voz avisándole del error ortográfico en vez de contabilizarlo como algo completamente erróneo.

## Versión 1.1.2
**Fecha:** 9 de marzo de 2026
**Detalles:**
- **Sistema Anti-Repetición:** Añadida una memoria que almacena las frases mostradas. Garantiza que ninguna oración se volverá a repetir hasta que el jugador haya completado exitosamente todas las variaciones disponibles de esa longitud, funcionando como un mazo de cartas que se mezcla solo al terminarse.
- **Rediseño Simétrico:** El panel de configuración ha sido redistribuido. (Izquierda: Dificultad y Texto. Derecha: Rondas y Práctica).
- **Textos Simplificados:** Se limpiaron las guías de texto del input de Longitud para que sean números directos haciendo la lectura más fluida.

## Versión 1.1.1
**Fecha:** 9 de marzo de 2026
**Detalles:**
- **Botón "IR" para Oración Específica:** Convertida la sección de oración libre en una herramienta de "Práctica Especial" con un botón de un solo clic que inicia una partida de 1 solo ejercicio con la frase redactada.
- **Limpieza de Menú:** Eliminada la sección de Audio y Dictado, manteniendo el sintetizador de voz automático de forma nativa e inamovible.
- **Feedback en Resultados:** Ahora se visualiza el nivel de dificultad elegido en la pantalla final de puntuación.

## Versión 1.1.0
**Fecha:** 9 de marzo de 2026
**Detalles:**
- **Selector de Rondas:** Se añadió una nueva sección en el panel de configuración ("5. Cantidad de ejercicios") que permite al jugador elegir cuántas oraciones quiere hacer por ronda (5, 10, 15, 20, 25, 30).
- **Diccionario Masivo:** Se amplió críticamente el diccionario interno de palabras, asegurando que todos los verbos y adjetivos utilizados tengan su color correspondiente (verde y azul).
- **Lematizador Potenciado:** Se mejoró sustancialmente el conversor de palabras para la API de ARASAAC, logrando que todos los sustantivos en plural se transformen a singular y que los nuevos verbos se conviertan a su forma infinitiva, garantizando que tengan su pictograma en las dificultades Fácil y Medio.

## Versión 1.0.9
**Fecha:** 9 de marzo de 2026
**Detalles:**
- **Sistema de Rondas:** Se ha implementado un límite de 10 oraciones por partida.
- **Contador de Aciertos Puros:** Ahora el juego registra si el usuario completa la oración al primer intento (sin fallos previos).
- **Pantalla de Game Over:** Al finalizar las 10 rondas, aparecerá una pantalla de resultados mostrando la puntuación (ej. 8/10).
- **Gamificación por Colores:** La puntuación final se mostrará coloreada dependiendo de la dificultad elegida al principio (Verde para Fácil, Amarillo para Medio, Naranja para Difícil, Morado para Extremo).

## Versión 1.0.8
**Detalles:**
- **Layout de 2 Columnas (Ultra-Panorámico):** Se ha reestructurado por completo la cuadrícula del panel de configuración.
- Ahora las secciones 1 (Dificultad) y 3 (Tipo de Letra) se muestran en la columna izquierda, mientras que las secciones 2 (Audio) y 4 (Oración/Longitud) se muestran en la columna derecha.
- Esto permite aprovechar todo el ancho de la pantalla y garantiza que el botón de "¡JUGAR!" esté siempre visible en la pantalla principal sin ningún tipo de scroll.



## Versión 1.0.8
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Rediseño Compacto del Menú (Zero-Scroll):** Se han ajustado drásticamente todos los márgenes, rellenos (paddings) y tamaños de fuente de la pantalla principal de configuración.
- **Iconos Optimizados:** Los botones de selección de dificultad y tipo de fuente ahora son más pequeños y condensados.
- **Objetivo Cumplido:** Ahora es posible ver todas las opciones del juego (del paso 1 al 4) y el botón de "¡JUGAR!" en una sola pantalla estándar de portátil/tablet sin necesidad de usar la rueda del ratón (scroll).



## Versión 1.0.7
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Ampliación del Diccionario:** Se han añadido 50 oraciones nuevas y variadas a la base de datos interna.
- **Limpieza de Vocabulario:** Se han retirado palabras que no contaban con un pictograma claro en ARASAAC (como "pintadas") sustituyéndolas por sinónimos más visuales ("felices").
- **Mejora del Motor Lematizador:** Se ha enseñado al juego a traducir varios verbos nuevos a infinitivo antes de buscar su imagen (ej. "pesa" -> "pesar", "mira" -> "mirar", "sube" -> "subir").
- **UI Limpia:** Se ha eliminado el subtítulo innecesario "Configura el juego antes de empezar" de la pantalla principal para un diseño más limpio y directo.



## Versión 1.0.6
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Revolución del Motor de Oraciones (Opción 1):** Para garantizar un 100% de éxito pedagógico y evitar cualquier riesgo de frases robóticas, se ha eliminado el algoritmo generador aleatorio.
- **Diccionario Curado Interno:** Se ha implementado una base de datos interna con casi 100 oraciones escritas a mano, garantizando gramática y sentido común perfectos. 
- **Clasificación por Longitud:** Las oraciones curadas están divididas exactamente por longitud (de 2 a 12 palabras) para que el botón de "Longitud Aleatoria" o de "X Palabras" siga funcionando a la perfección, pero extrayendo la frase de la caja fuerte adecuada.



## Versión 1.0.5
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Motor de Oraciones Inteligente (v2):** Se desechó el sistema anterior que intentaba "alargar" frases añadiendo palabras sin sentido al final. Ahora el juego cuenta con plantillas sintácticas lógicas predefinidas para cada longitud (de 2 a 12 palabras).
- **Adiós a frases sin sentido ("con mama el"):** Las frases largas ahora se construyen de forma natural uniendo sujetos compuestos ("El perro y el gato..."), adjetivos ("...grandes..."), verbos ("...corren...") y complementos lógicos dobles ("...en el parque con papá").
- **Concordancia de Sujetos Múltiples:** Ahora el vocabulario está estrictamente clasificado para que el verbo coincida perfectamente en número y sentido con todos los sujetos elegidos antes de mostrar la frase.



## Versión 1.0.4
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Lematizador ARASAAC:** Se añadió un diccionario interno para que los verbos conjugados ("come", "bebe", "llora") se envíen a la API de ARASAAC en su forma infinitiva ("comer", "beber", "llorar"). Esto soluciona el problema de los pictogramas "invisibles" para los verbos.
- **Corrección de Sujetos Plurales Compuestos:** Se identificó y resolvió un fallo gramatical donde oraciones con dos sujetos (ej. "mamá y la abuela") usaban el verbo en singular. Ahora el sistema detecta que es un sujeto compuesto y cambia automáticamente el verbo al plural ("lloran").
- **Dificultad Fácil Mejorada:** Se rediseñó el icono del botón de dificultad "Fácil" para que muestre claramente una imagen y un texto (Dibujo + Texto), haciéndolo mucho más intuitivo para el usuario.
- **Mejora Semántica de Oraciones:** Los sujetos se han dividido en categorías "Animados" e "Inanimados" asegurando que las acciones tengan sentido en el mundo real (ej. evitando que un lápiz corra por el parque).


## Versión 1.0.3
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Generador de Oraciones Aleatorias:** Se eliminó la base de datos fija de 30 oraciones predefinidas. Ahora el juego cuenta con un creador sintáctico en tiempo real.
- **Variabilidad:** Cada vez que se le da a jugar (sin escribir una frase personalizada), el algoritmo escoge aleatoriamente artículos, sujetos (en plural o singular, masculino o femenino), verbos conjugados y complementos para crear una oración que tenga sentido y cumpla con el número de palabras indicado (de 2 a 12).
- **Consistencia Gramatical:** El creador asegura que los artículos coincidan con el género y número del sustantivo, y que el verbo concuerde en singular o plural. Además, se añade mayúscula inicial automáticamente.


## Versión 1.0.2
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Integración ARASAAC Real:** Se eliminaron los emojis estáticos y el sistema ahora usa la API oficial de ARASAAC de forma asíncrona para descargar los pictogramas exactos para sustantivos, verbos y adjetivos.
- **Categorización Automática Avanzada:** Se añadió una base de datos más amplia (categorías por color) para que verbos sean verdes, adjetivos azules, artículos amarillos, etc., de acuerdo a las normas de ARASAAC. Los preposiciones y conjunciones ("y", "en") no buscan pictograma y mantienen su color gris/amarillo.
- **Corrección Lógica de Duplicados:** Se arregló la regla de validación de drag & drop. Ahora es posible usar palabras repetidas (por ejemplo, dos veces "la") indistintamente de su posición original sin que marque error.
- **Limpieza de UX:** Se desactivó el movimiento vertical ("bounce") de la tarjeta de éxito para que el botón de siguiente nivel sea más fácil de clicar.
- **Pantalla de Carga Visial:** Puesto que las imágenes se descargan de internet en vivo cada ronda, se creó una pantalla de carga sutil ("Cargando pictogramas ARASAAC...").


## Versión 1.0.1
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Corrección de Error Crítico:** Se solucionó un problema en el componente `Star` (SVG) donde una propiedad `style` mal formateada causaba que React se bloqueara y dejara la pantalla en blanco al hacer clic en "JUGAR".
- **Indicador de Versión Visual:** Añadido un texto visible en la pantalla de inicio con la versión actual (1.0.1) para llevar mejor el control de las actualizaciones.


## Versión 1.0.0
**Fecha:** 8 de marzo de 2026
**Detalles:**
- **Reconstrucción desde cero:** Se eliminó la versión anterior y se creó un nuevo `index.html` unificado.
- **Tecnologías integradas:** React, ReactDOM, Babel y Tailwind CSS funcionan completamente desde CDN en un solo archivo.
- **Sistema de Pictogramas ARASAAC:** Diccionario con colores estándar (Amarillo, Naranja, Verde, Azul, Gris). Los artículos y preposiciones muestran solo texto.
- **Configuraciones:** 4 Modos de dificultad (Fácil, Medio, Difícil, Extremo/Dictado). Modos de audio automático o manual (lectura por el profesor con botón para revelar el texto). Opciones de MAYÚSCULAS o minúsculas usando la fuente *Patrick Hand*.
- **Oraciones Personalizadas:** Posibilidad de escribir cualquier oración o elegir oraciones aleatorias de 2 a 12 palabras.
- **Juego Interactivo:** Soporte para arrastrar y soltar (Drag & Drop) y clics para mover las tarjetas.
- **Modo Extremo:** Validación inteligente ignorando acentos y signos de puntuación, con reglas estrictas de mayúsculas iniciales si se configura en minúsculas.
- **Feedback Visual y Sonoro:** Uso de animaciones de confeti, alertas visuales y lectura por voz en caso de acertar o fallar.
- **Persistencia:** La puntuación se guarda automáticamente en el navegador usando `localStorage`.

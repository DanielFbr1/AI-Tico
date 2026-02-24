# TÍTULO DEL TRABAJO: Ai-Tico: Diseño y desarrollo de una plataforma educativa basada en Inteligencia Artificial para la gestión del Aprendizaje Basado en Proyectos (ABP) en Educación Primaria.

## RESUMEN (Abstract)
(Máximo 200 palabras) [Escribe aquí un resumen global que incluya: el objetivo principal, la metodología empleada y la conclusión más relevante. Debe ser una síntesis, no una introducción.]

**Palabras clave:** Inteligencia Artificial, Aprendizaje Basado en Proyectos (ABP), Educación Primaria, Gamificación, Inclusión Educativa, Pensamiento Crítico.

La presente memoria describe el diseño, desarrollo e implementación de "Ai-Tico", una plataforma educativa integral impulsada por Inteligencia Artificial (IA) y concebida específicamente para la gestión docente y la estimulación del alumnado bajo la metodología del Aprendizaje Basado en Proyectos (ABP) en la etapa de Educación Primaria. Su génesis responde no solo a un interés académico y tecnológico por explorar el cruce entre la algoritmia y la pedagogía, sino a la detección y resolución de unas necesidades reales, concretas y acuciantes observadas durante las prácticas en un Centro Rural Agrupado (CRA).

En su concepción original, este Trabajo de Fin de Grado (TFG) pretendía materializarse únicamente como un prototipo conceptual no funcional (maquetado a través de herramientas de diseño de interfaces como Figma) con la intención de explorar las posibilidades teóricas de la IA en el aula. No obstante, gracias a una base teórica interdisciplinar fundamentada en un previo paso por el grado de Ingeniería, sumado a las facilidades excepcionales que otorga, en la actualidad, la programación asistida por Inteligencia Artificial (generación y corrección de código mediante LLMs), el proyecto escaló hasta convertirse en una aplicación *Full-Stack* (tanto desarrollo como base de datos) plenamente operativa, escalable y con capacidad para ser desplegada y utilizada globalmente de forma gratuita. Esta evolución metodológica de la creación del software demuestra de primera mano cómo la misma tecnología propuesta para ayudar al estudiante en el aula puede asistir de manera determinante al diseñador y desarrollador pedagógico.

El viraje fundamental hacia la materialización práctica del proyecto se produjo tras el contacto directo con la realidad y las necesidades detectadas durante el periodo de Prácticas Escolares III en el Centro Rural Agrupado (CRA) Valle del Riaza, situado en Milagros (Burgos). Este CRA se caracteriza por un enfoque innovador, un alto grado de autonomía en su alumnado y la apuesta decidida por una formación digital inmersiva; características palpables en decisiones organizativas como la no dependencia de los tradicionales libros de texto y la disposición individual de *tablets* para cada estudiante desde el 2.º curso de Educación Primaria, sumado a la estructuración metodológica de sus aulas, con modelos multigrado (agrupamientos que mezclan niveles, tales como 1.º y 2.º o 3.º y 4.º). En este contexto de máxima flexibilidad organizativa, la dirección del centro fomentó y animó proactivamente la ideación de nuevas herramientas y recursos metodológicos. Fue en este escenario donde se evidenció una carencia fundamental: al prescindir del hilo conductor que tradicionalmente marca el libro de texto, el profesorado demanda, de manera constante, recursos interactivos, versátiles y capaces de ayudarles en la ardua labor de vertebrar y estructurar las clases.

*Ai-Tico* surge, por tanto, como la respuesta tecnológica y pedagógica a esta demanda específica. La herramienta no busca suplir la irremplazable labor del docente, sino erigirse como un andamiaje o "copiloto" metodológico. A través de la plataforma, el docente encuentra apoyo automatizado para planificar los itinerarios de los proyectos (ABP) o generar esquemas de evaluación (rúbricas). Por otro lado, y paralelamente, el alumno halla un entorno gamificado en el que, mediante el acompañamiento lateral de un tutor virtual basado en la mayéutica socrática y un ecosistema de recompensas (el cuidado y personalización del avatar Tico), estimula su autonomía discente, su alfabetización informacional y el desarrollo del pensamiento crítico exigido en el marco de la LOMLOE. Para lograr este ecosistema interactivo, el desarrollo técnico integra diversas modalidades de Inteligencia Artificial, entre las que destacan: IA generativa de texto e indexación de documentos para la labor de tutorización y asistencia al docente, IA de síntesis de voz (*Text-to-Speech*) para dotar al avatar de una dicción natural y accesible, IA de generación de imágenes para la creación de recompensas visuales, y mecanismos de IA con capacidades de búsqueda en red. Si bien la aplicación se beneficia de este estado del arte actual en Inteligencia Artificial, su concepción asume y mitiga las limitaciones metodológicas y técnicas inherentes a los modelos generativos, garantizando en todo momento un uso ético, seguro y supervisado por el docente.

Para exponer con claridad este proceso, el presente trabajo se estructura en un total de ocho apartados. Tras esta primera toma de contacto en la introducción, el capítulo 2 detalla la justificación legislativa (LOMLOE, DUA) y los objetivos del proyecto. El apartado 3 desgrana el marco teórico que fundamenta la propuesta (ABP, gamificación y el rol de la IA en educación). El capítulo 4 explica la metodología seguida para el diseño de la intervención tecnológica y didáctica. El apartado 5 se enfoca en el análisis de resultados, exponiendo las funcionalidades y mecánicas desarrolladas en la propia plataforma. Finalmente, el capítulo 6 recoge las conclusiones extraídas y la prospectiva de mejora, cerrando el documento con las correspondientes referencias bibliográficas (capítulo 7) y anexos (capítulo 8).

<!-- NOTA AL ALUMNO SOBRE TUS PREGUNTAS:
¡Perfecto! El nombre del colegio "CRA Valle del Riaza" y la estructura del documento ya están integrados de forma orgánica y super profesional en los últimos párrafos de la introducción.

He añadido también las modalidades de IA en la Introducción como me pediste, enumerando las funciones clave (Generativa de texto, Text-to-Speech, Generación de imágenes y Búsqueda web), que dan muchísimo valor al despliegue técnico del proyecto.

Sobre tu duda respecto a LAS LIMITACIONES DE LA APP y LA IA:
Mi consejo es que en la Introducción SÓLO HAGAS UNA BREVE MENCIÓN (como la frase que he dejado al final del penúltimo párrafo: "...su concepción asume y mitiga las limitaciones metodológicas y técnicas..."). 

El lugar donde debes EXPLAYARTE y entrar en detalle sobre estas limitaciones (los prompts, los fallos de búsqueda en internet de los LLM, la subida de documentos, las alucinaciones de la IA) debe ser:
1. En el apartado "5. Análisis de Resultados / Desarrollo": Ahí puedes tener un subapartado llamado "5.X. Retos técnicos y Limitaciones", explicando con total transparencia qué cosas fallan todavía y cómo el profesor, con el panel de supervisión, suple esas carencias tecnológicas.
2. En el apartado "6. Conclusiones y Prospectiva": Mencionar que como "trabajo futuro" se espera mejorar esos aspectos a medida que modelos como Gemini vayan siendo más eficientes y precisos.

Mencionar las limitaciones técnicas (no poder subir PDFs enormes, fallos en imágenes generadas...) es MUY POSITIVO. Demuestra rigor, pensamiento crítico y madurez al evaluar tu propio proyecto. A los tribunales les encanta que reconozcas los fallos porque significa que dominas de qué estás hablando y no vendes humo. ¡Así que sí, resérvalo para darle un buen bloque en el capítulo 5!
-->

## 2. Justificación y Objetivos

### 2.1 Justificación
*(Explica aquí la relevancia del proyecto, cómo se alinea con la LOMLOE, el Diseño Universal para el Aprendizaje (DUA) y las necesidades actuales de los docentes y alumnos).*

### 2.2 Objetivo General
Diseñar, desarrollar y evaluar una plataforma educativa (Ai-Tico) impulsada por Inteligencia Artificial que optimice la creación, gestión y evaluación de metodologías de Aprendizaje Basado en Proyectos (ABP), a la vez que fomenta el pensamiento crítico, la inclusión y la motivación del alumnado de Educación Primaria mediante un entorno gamificado.

### 2.3 Objetivos Específicos

#### Dimensión de Apoyo a la Labor Docente:
* **Facilitar** la ideación, planificación y estructuración de proyectos ABP innovadores mediante un asistente generativo de Inteligencia Artificial.
* **Automatizar** el diseño y la creación de rúbricas de evaluación personalizadas y adaptadas al currículo educativo.
* **Proveer** un asistente de IA lateral ("Copiloto") disponible en tiempo real para apoyar al docente en tareas de gestión y resolución de dudas durante las clases.
* **Implementar** un panel de supervisión (dashboard) ético y seguro que permita al profesorado monitorizar las interacciones de los alumnos con la IA y el trabajo colaborativo de los grupos.
* **Gestionar y centralizar** las evaluaciones grupales e individuales integradas de forma fluida con el sistema de entrega de tareas.

#### Dimensión de Experiencia y Aprendizaje del Alumnado:
* **Integrar** un tutor virtual (Mentor IA) basado en el método socrático, diseñado para guiar el aprendizaje mediante la formulación de preguntas, evitando dar respuestas directas y fomentando así el pensamiento crítico.
* **Diseñar** un sistema de gamificación centrado en el cuidado de un avatar virtual ("Tico", estilo Tamagotchi), cuyo bienestar dependa del consumo y contraste de fuentes diversas de información por parte del alumno.
* **Crear** un sistema de recompensas coleccionables (pegatinas/stickers) que evidencie, promueva y gamifique la alfabetización informacional y el proceso de investigación.
* **Personalizar** la experiencia de aprendizaje adaptando dinámicamente el nivel de lenguaje y las respuestas de la IA a las diferentes capacidades, ritmos o Dificultades Específicas de Aprendizaje (DEA) del alumnado.
* **Humanizar** la interacción humano-máquina mediante la integración de síntesis de voz natural y expresiva (acento peninsular nativo) a través de la tecnología de *ElevenLabs*, logrando una comunicación más cercana e inmersiva.

#### Dimensión de Comunidad y Entorno Familiar:
* **Establecer** canales de comunicación seguros e interconectados entre todos los agentes educativos: docente-familia, alumno-alumno y docente-alumno.
* **Ofrecer** un portal de acceso transparente para que las familias puedan realizar un seguimiento continuo del progreso, la implicación en los proyectos y las calificaciones de sus hijos.

## 3. Marco Teórico / Fundamentación
*(Desarrolla aquí la base teórica: qué es el ABP, el rol de la IA en la educación, metodologías activas, gamificación, etc.).*

## 4. Metodología / Diseño de la Intervención
*(Explica cómo has diseñado la aplicación, las tecnologías usadas, la arquitectura del sistema y cómo se implementaría en un aula real).*

## 5. Análisis de Resultados / Desarrollo
*(Muestra aquí lo que has construido: capturas de pantalla, flujos de usuario, cómo funciona Tico, el panel del profesor, pruebas realizadas, etc.).*

## 6. Conclusiones y Prospectiva
*(Resume los logros obtenidos frente a los objetivos planteados y propone futuras mejoras o líneas de investigación).*

## 7. Referencias Bibliográficas
*(Añade aquí los libros, artículos, webs o normativas legales que has consultado, en formato APA).*

## 8. Anexos
*(Incluye material extra como manuales de usuario, fragmentos de código relevantes, ejemplos de respuestas de la IA, etc.).*

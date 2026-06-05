# Herramientas y Tecnologías Usadas en Ai-Tico

Este documento consolida el stack tecnológico completo, librerías, motores de Inteligencia Artificial y herramientas externas utilizadas para el diseño, desarrollo y despliegue de **Ai-Tico**.

---

## 1. Frontend (Desarrollo Visual y UI)

El frontend de la aplicación es la base de todo lo que el profesor y el alumno ven e interactúan.

*   **React (v18):** Librería principal de JavaScript utilizada para construir toda la interfaz de usuario basándose en componentes reutilizables (botones, modales, chats, etc.).
*   **Vite:** Herramienta de compilación ultrarrápida ("bundler") empleada para ensamblar y empaquetar el proyecto.
*   **TypeScript:** Lenguaje base de todo el código de la app, que añade tipado estricto a JavaScript, logrando una arquitectura más segura y previendo errores en desarrollo.
*   **Tailwind CSS:** Framework de diseño elegido para la estilización ('styling') de toda la aplicación. Permite generar la estética moderna (Dark mode, Glassmorphism) que define el proyecto.
*   **Radix UI:** Base de componentes no-estilizados (headless) de muy alta calidad y completamente accesibles (ventanas modales, menús, acordeones y diálogos), fundamentales para garantizar los estándares DUA en la app.
*   **Lucide React:** Librería de iconografía que proporciona todos los iconos de la interfaz.
*   **PWA (Vite PWA Plugin):** Funcionalidad que convierte Ai-Tico en una Aplicación Web Progresiva, posibilitando su instalación nativa en móviles y ordenadores.

---

## 2. Herramientas de Dinamismo, Gráficos y Extras

Complementos técnicos instalados para lograr las funcionalidades completas en las vistas de los estudiantes y docentes:

*   **Recharts:** Librería de visualización de datos utilizada para los gráficos e indicadores estadísticos en el "Resumen" y analítica de los grupos.
*   **@splinetool/react-spline:** Herramienta que renderiza los elementos con modelado 3D interactivos y con sensación de profundidad dentro de la UI.
*   **React Quill:** Editor de texto enriquecido ('Rich Text') empleado habitualmente para que profesores o alumnos escriban textos con formatos.
*   **jsPDF / Excel (xlsx) / html2canvas:** Conjunto de librerías destinadas a generar la exportación de documentos. Permiten a los docentes descargar notas y analíticas en archivos PDF y tablas de Excel legibles.
*   **Sonner:** Utilizado para gestionar las "Toast Notifications" o avisos flotantes no intrusivos en las acciones correctas/incorrectas.
*   **Canvas Confetti:** Generador de animaciones lúdicas de victoria para reforzar positivamente a los alumnos al cumplir misiones interactuando con la interfaz.

---

## 3. Backend, Base de Servicios y Alojamiento

La infraestructura "invisible" que sostiene los datos vivos de la aplicación y la mantiene disponible globalmente.

*   **Supabase:** Actúa como el Backend-as-a-Service (BaaS) principal. Está construido sobre PostgreSQL y se encarga de:
    *   Gestiones de autenticación, logins e inicio de sesión seguros.
    *   Almacenar y encriptar la Base de Datos general.
    *   Sincronización en tiempo real de los chats y puntuaciones usando WebSockets.
*   **Vercel:** Plataforma de alojamiento en la Nube ('Cloud Hosting') donde la aplicación entera está desplegada. Permite un acceso rápido desde cualquier dispositivo y realiza despliegues simultáneos en internet ante nuevos cambios.

---

## 4. Inteligencia Artificial (Motores y Modelos)

La capa que dota del razonamiento "inteligente" (Mentor Socrático, evaluación y creación de contenido).

*   **LLaMA 3.3 70B:** Principal motor LLM (Large Language Model) Open Source de Meta, empleado por su altísima capacidad de razonamiento rápido y rentabilidad para dar el núcleo analítico del Mentor Socrático.
*   **Groq:** Proveedor y plataforma LPU empleada (Cloud API) para ejecutar los modelos LLaMA a velociades altísimas en tiempo real.
*   **Tavily:** Herramienta de motor de búsqueda conectada directamente a la IA (Search API) que se encarga de "romper el límite de conocimiento", dotándola del contexto generalizado de 2026 e información externa real.
*   **OpenRouter:** Enrutador y proveedor de APIs de Inteligencia artificial empleado para acceder unificadamente a diferentes modelos de lenguaje superiores desde una misma interfaz de conexión.
*   **Minimax:** Modelo de Inteligencia Artificial complementario utilizado como cerebro alternativo bajo alta demanda u operaciones de codificación cuando se requieren recursos paralelos.
*   **Hugging Face:** El repositorio masivo donde se interconectan los modelos de IA libres (utilizado como puente para descargar y usar herramientas específicas en los servidores o navegadores).
*   **ElevenLabs:** Modelo AI Text-To-Speech (texto-a-voz) altamente empático y expresivo, empleado para la accesibilidad universal para que el Mentor Tico pueda "hablar" con voces naturales.
*   **Transformers.js (@xenova/transformers):** Modelos de Machine Learning incrustados directamente en el navegador del usuario para tareas locales e instantáneas, como el recorte o remoción de fondos de imagen.
*   **Nano Banana / Veo3:** Modelos de Inteligencia Artificial visual empleados previamente para la ideación, creación de logotipos, animaciones e identidad visual de la mascota (Tico).

---

## 5. Ecosistema de Trabajo y Gestión

Las herramientas empleadas por el equipo o el desarrollador durante la estructuración y programación de Ai-Tico.

*   **Figma:** Principal herramienta de diseño UX/UI. Empleada en las primeras fases metodológicas para conceptualizar las pantallas, el diseño visual y el flujo.
*   **Git y GitHub:** Sistemas primarios de control de versiones en la nube, donde se aloja el código fuente para seguimiento exhaustivo y seguridad anti-pérdidas.
*   **Gemini 3.1 Pro (Vía Agente Antigravity / Jules):** Asistente Artificial ('Agentic AI Coding Assistant') especializado en programación usado como colaborador bajo la técnica de 'Pair-Programming' para co-crear funciones y depurar el código profundo.
*   **OpenCode:** Entorno y agente de programación alternativo (que en conjunto a Minimax) ha servido de apoyo vital a lo largo del desarrollo cuando otros sistemas como Antigravity se saturan o quedan sin cuota, garantizando flujo de trabajo constante e ininterrumpido a nivel de código.
*   **Stitch (Stitch MCP):** Tecnología y conectores orientados a la conversión de prototipos y pantallas estáticas/visuales hacia código directamente, acelerando la formación del Frontend.

# 📊 Límites del Plan Gratuito y Análisis de Optimización

Este documento detalla los límites reales de los servicios que utilizas y analiza si tu aplicación está configurada para aprovecharlos al máximo.

## 1. Supabase (Base de Datos y Tiempo Real)
**Estado actual de tu App:** ✅ **Optimizada**
Tu configuración actual (`schema.sql` y `supabase.js`) usa las conexiones estándar. No hay "cuellos de botella" en el código que limiten esto artificialmente.

| Característica | Límite Gratis (Free Tier) | ¿Tu App lo aprovecha? |
| :--- | :--- | :--- |
| **Conexiones Simultáneas** | **200 clientes** a la vez. | **SÍ.** El código permite conectar hasta que Supabase corte. No hay límite por software. |
| **Usuarios Registrados** | **50,000 usuarios activos** al mes. | **SÍ.** Puedes registrar a todo el colegio sin problemas. |
| **Base de Datos** | **500 MB** de espacio. | **SÍ.** Es suficiente para miles de mensajes de texto. Los chats solo ocupan texto, que es muy ligero. |
| **Ancho de Banda** | **5 GB** al mes. | **SÍ.** Sobrado para texto. Solo se gastaría rápido si subieran muchas fotos/vídeos (que tu app no hace ahora). |

---

## 2. Vercel (Alojamiento Web)
**Estado actual de tu App:** ✅ **Optimizada**
Vercel sirve tu página web (el Frontend).

| Característica | Límite Gratis (Hobby) | ¿Tu App lo aprovecha? |
| :--- | :--- | :--- |
| **Usuarios concurrentes** | **Ilimitado** (Prácticamente). | **SÍ.** Vercel escala automáticamente. Si entran 1000 alumnos, la web cargará. |
| **Ancho de Banda** | **100 GB** al mes. | **SÍ.** Es una barbaridad para una app de texto. Nunca lo llenarás con uso escolar normal. |
| **Tiempo de Ejecución** | 10 segundos por función (Serverless). | **SÍ.** Tu app es SPA (Single Page Application), se ejecuta en el navegador del alumno, así que ni siquiera gastas tiempo de servidor de Vercel. |

---

## 3. Groq (Inteligencia Artificial)
**Estado actual de tu App:** ⚠️ **Limitada por el Proveedor (No por tu código)**
Aquí es donde está el "techo" real de la clase.

| Característica | Límite Gratis (Free Tier) | ¿Tu App lo aprovecha? |
| :--- | :--- | :--- |
| **Peticiones por Minuto (RPM)** | **30 RPM** (Requests Per Minute). | **AL MÁXIMO.** Tu código **NO** tiene frenos. Si 30 alumnos dan a "Enviar" en un minuto, entran las 30. A la 31, Groq dará error. |
| **Tokens por Minuto (TPM)** | **6,000 - 14,000 TPM** (según modelo). | **SÍ.** Usamos `llama-3.3-70b`, que es muy eficiente. |
| **Peticiones por Día** | **14,400 RPD**. | **SÍ.** Tienes de sobra para todo el día escolar. |

### 🔎 Análisis de tu Código (`groq.ts`)
He revisado tu archivo `src/services/groq.ts` para asegurar que no haya límites ocultos:

```typescript
// Tu código actual hace la llamada DIRECTA:
const response = await fetch(GROQ_API_URL, { ... });
```

*   **¿Hay frenos?** **NO.** No hay ningún `setTimeout` ni limitador artificial que diga "espera 5 segundos entre mensajes".
*   **¿Aprovecha el límite?** **SÍ.** Tu app va tan rápido como Groq permita. Si Groq permite 30, tu app manda 30.
*   **Veredicto:** Tu aplicación está configurada para **exprimir al 100%** la velocidad que te regalan. No se puede configurar para "más" porque el límite lo pone Groq en sus servidores, no nosotros en el código.

---

## 💡 Conclusión
Tu aplicación es un **Ferrari sin frenos** en una autopista con límite de velocidad.
*   **El motor (Tu Código):** Puede correr todo lo que quieras.
*   **La autopista (Groq):** Tiene un límite de 30 coches por minuto.

**Tu app YA está configurada para ir al máximo posible gratuito.** No hay ninguna configuración oculta que te esté robando rendimiento.

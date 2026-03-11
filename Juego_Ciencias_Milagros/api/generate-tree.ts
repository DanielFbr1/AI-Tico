import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60; // Límite de 60s

const SpeciesSchema = z.object({
    id: z.string(),
    name: z.string().describe("Nombre de la especie"),
    category: z.string().describe("Categoría (ej: Planta, Invertebrado, Vertebrado)"),
    wikiQuery: z.string().describe("Término de búsqueda para Wikipedia"),
    traits: z.record(z.string(), z.boolean()).describe("Diccionario clave-valor con los rasgos de esta especie (true o false). OJO: Las claves deben coincidir EXACTAMENTE con las claves definidas en QUESTION_DEFS."),
});

const QuestionDefSchema = z.object({
    text: z.object({
        primaria: z.string(),
        eso: z.string(),
        bachillerato: z.string(),
    }),
    pictoId: z.number(),
    fallbackEmoji: z.string(),
});

const OutputSchema = z.object({
    title: z.string().describe("Título para esta clave generada"),
    species: z.array(SpeciesSchema).describe("Lista de especies analizadas en el texto del usuario"),
    questionDefs: z.record(z.string(), QuestionDefSchema).describe("Definiciones de las preguntas (los traits) extraídas del texto. Las claves deben ser camelCase y coincidir con las usadas en los traits de species."),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const prompt = req.body?.prompt;

        if (!prompt) {
            return res.status(400).json({ error: 'Falta el texto de la clave' });
        }

        const { object } = await generateObject({
            model: google('gemini-1.5-flash'),
            schema: OutputSchema,
            prompt: `Genera una clave dicotómica a partir de la petición del usuario, y conviértela en nuestra estructura JSON.
      
      El usuario puede darte solo una lista de especies (tú te inventas las preguntas) o darte las especies y sus pasos.
      
      REGLAS ESTRICTAS PARA CREAR CLAVES DICOTÓMICAS:
      1. Límite de especies: Máximo 10 especímenes.
      2. Divide siempre en dos grupos: basándote en si poseen o no una característica (ej: "con alas" o "sin alas").
      3. Características observables y objetivas: estricto, basadas en rasgos físicos visibles (ej: "tiene 6 patas").
      4. EVITA términos subjetivos: NADA de "grande" o "pequeño". Usa medidas u proporciones (ej: "mayor de 10 cm", "patas más largas que el cuerpo").
      5. No uses características variables dentro de una misma especie.
      6. Repite el proceso de dicotomía para cada grupo hasta separar todos los elementos individuales.
      
      Formato JSON esperado:
      1. Crea la lista de \`species\`.
      2. Crea la lista de \`questionDefs\` (los rasgos dicotómicos).
      3. Las \`features/traits\` en las especies usarán las claves camelCase de \`questionDefs\`, con valor \`true\` o \`false\`.
      4. En \`questionDefs\`, text debe tener 3 niveles de complejidad (primaria, eso, bachillerato).
      5. Pon un pictoId (usa 2287 si dudas) y un fallbackEmoji representativo en cada pregunta.
      
      PETICIÓN DEL USUARIO:
      "${prompt}"`,
        });

        return res.status(200).json(object);
    } catch (e: unknown) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return res.status(500).json({ error: 'Error generando clave dicotómica', details: errorMessage });
    }
}

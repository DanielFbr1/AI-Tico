import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const config = {
    runtime: 'edge', // IMPORTANT: Forces Vercel to use the Web Request API
    maxDuration: 60,
};

const SpeciesSchema = z.object({
    id: z.string().describe("Identificador único simple generado al azar (ej: p100)"),
    name: z.string().describe("Nombre de la especie"),
    category: z.string().describe("Categoría informal (ej: Planta, Pez, Mamífero)"),
    wikiQuery: z.string().describe("Término exacto para buscar fotos de esta especie en Wikipedia"),
    trophicLevel: z.enum(['Productor', 'Consumidor Primario', 'Consumidor Secundario', 'Consumidor Terciario', 'Descomponedor']).describe("Nivel en la pirámide"),
});

const PyramidSchema = z.object({
    title: z.string().describe("Título creativo y claro del ecosistema generado (ej: 'El Misterio del Himalaya')"),
    species: z.array(SpeciesSchema).length(5).describe("Lista EXACTA de 5 especies, una para cada nivel trófico (1 productor, 3 consumidores, 1 descomponedor)"),
    emoji: z.string().describe("Un solo emoji representativo del ecosistema entero (ej: 🌊 para el océano)"),
    colorClass: z.string().describe("Una clase de Tailwind de un color bonito para la carta (ej: 'bg-indigo-500' o 'bg-teal-500')"),
});

export default async function POST(request: Request) {
    try {
        const { prompt } = await request.clone().json(); // clone safeguards against multiple reads

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Falta el texto de descripción' }), { status: 400 });
        }

        const { object } = await generateObject({
            model: google('gemini-1.5-flash'),
            schema: PyramidSchema,
            prompt: `Crea una cadena trófica / pirámide alimentaria de EXACTAMENTE 5 niveles basándote en la petición del usuario.
      
      IMPORTANTE: El usuario puede darte el nombre de un ecosistema (ej: "Sabana") o una lista de 5 especies concretas.
      - Si te da un ecosistema, busca 5 especies reales de ahí. 
      - Si te da especies, úsalas obligatoriamente y estructúralas.
      
      Reglas estrictas:
      1. La cadena SERÁ INVALIDA si no me devuelves EXACTAMENTE 5 especies representadas.
      2. No puedes repetir niveles. Tienen que estar los 5 niveles representados SIN REPETIR NINGUNO: EXACTAMENTE 1 'Productor', EXACTAMENTE 1 'Consumidor Primario', EXACTAMENTE 1 'Consumidor Secundario', EXACTAMENTE 1 'Consumidor Terciario' y EXACTAMENTE 1 'Descomponedor'. Ningún nivel trófico puede aparecer más de una vez en tu respuesta JSON.
      3. Tienen que habitar de forma coherente y lógica en el hábitat.
      4. El campo wikiQuery debe ser lo más específico y científicamente preciso posible en español para que Wikipedia devuelva una foto real (ej: 'Carcharodon carcharias' funciona mejor que 'Tiburón genérico').
      5. En colorClass usa un color de TailwindCSS bonito, por ejemplo 'bg-cyan-500', 'bg-emerald-500', 'bg-sky-600', 'bg-rose-500', etc.
      
      PETICIÓN DEL USUARIO:
      "${prompt}"`,
        });
        return new Response(JSON.stringify(object), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (e: any) {
        console.error(e);
        return new Response(JSON.stringify({ error: 'Error generando pirámide', details: e.message }), { status: 500 });
    }
}

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const config = {
    runtime: 'edge', // IMPORTANT: Forces Vercel to use the Web Request API
    maxDuration: 60,
};

export default async function POST(request: Request) {
    try {
        const { question } = await request.clone().json();

        if (!question) {
            return new Response(JSON.stringify({ error: 'Falta la pregunta' }), { status: 400 });
        }

        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            system: 'Eres un asistente experto en claves dicotómicas para niños de 6 a 8 años. Tu ÚNICA tarea es devolver 1 o máximo 2 emojis que representen de forma visual y divertida la pregunta que se te hace. NO devuelvas texto, NUNCA devuelvas palabras, SOLO los emojis. Por ejemplo, si te dicen "¿Tiene caparazón duro?", respondes "🐢🛡️" o "🐌".',
            prompt: `Pregunta: "${question}"`,
        });

        return new Response(JSON.stringify({ emojis: text.trim() }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (e: unknown) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return new Response(JSON.stringify({ error: 'Error generando emojis', details: errorMessage }), { status: 500 });
    }
}

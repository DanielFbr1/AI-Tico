import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt } = await req.json();
        if (!prompt) throw new Error('Se requiere un prompt');

        // Intentamos obtener varias llaves para rotación/reserva
        const hfKey1 = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGINGFACE_API_KEY_1');
        const hfKey2 = Deno.env.get('HUGGINGFACE_API_KEY_2');

        if (!hfKey1 && !hfKey2) {
            console.error("❌ No API Keys found in secrets");
            return new Response(JSON.stringify({ error: 'No se encontraron las llaves API (HF_TOKEN) en Supabase Secrets' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const keys = [hfKey1, hfKey2].filter(Boolean);
        let lastError = '';

        // Modelo FLUX es excelente para stickers
        const MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

        for (const key of keys) {
            try {
                console.log(`🎨 Generando sticker con prompt: ${prompt}`);
                const response = await fetch(MODEL_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${key}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ inputs: prompt }),
                });

                if (response.ok) {
                    const blob = await response.blob();
                    console.log("✅ Sticker generado con éxito");
                    return new Response(blob, {
                        headers: { ...corsHeaders, 'Content-Type': 'image/jpeg' },
                    });
                } else {
                    const errorMsg = await response.text();
                    lastError = `HF Error ${response.status}: ${errorMsg}`;
                    console.warn(lastError);

                    // Si es 429 (Too Many Requests), intentamos la siguiente llave inmediatamente
                    if (response.status !== 429 && response.status !== 503) {
                        // Si es otro error (como 401), también intentamos la siguiente
                    }
                }
            } catch (err: any) {
                lastError = `Fetch Error: ${err.message}`;
                console.error(lastError);
            }
        }

        // Si llegamos aquí, fallaron todas las llaves
        return new Response(JSON.stringify({
            error: 'Todas las llaves de Hugging Face fallaron',
            details: lastError
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

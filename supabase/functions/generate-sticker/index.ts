import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_KEYS: string[] = [];

const MODELS = [
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
];

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt } = await req.json();
        if (!prompt) throw new Error('Se requiere un prompt');

        const hfKey1 = Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGINGFACE_API_KEY_1');
        const hfKey2 = Deno.env.get('HUGGINGFACE_API_KEY_2');

        let keys = [hfKey1, hfKey2].filter(Boolean);
        if (keys.length === 0) keys = FALLBACK_KEYS;

        let lastError = '';

        for (const modelUrl of MODELS) {
            for (const key of keys) {
                try {
                    console.log(`🎨 Trying ${modelUrl}`);
                    const response = await fetch(modelUrl, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${key}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            inputs: prompt,
                            parameters: {
                                num_inference_steps: modelUrl.includes("schnell") ? 4 : 20,
                                guidance_scale: modelUrl.includes("schnell") ? 0.0 : 7.5
                            },
                            negative_prompt: "ugly background, messy, dirty, unfriendly, mean, scary, distorted, gray background, grey background, dark background, gradient background, shadows, colored background, beige background, textured background, noise, watermark, text, blurry, low resolution, out of frame"
                        }),
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        if (blob.size > 1000) {
                            console.log(`✅ Success (${blob.size} bytes)`);
                            return new Response(blob, {
                                headers: { ...corsHeaders, 'Content-Type': response.headers.get('Content-Type') || 'image/jpeg' },
                            });
                        }
                    } else {
                        const errorMsg = await response.text();
                        lastError = `${response.status}: ${errorMsg}`;
                        console.warn(`⚠️ ${lastError}`);
                    }
                } catch (err: any) {
                    lastError = err.message;
                    console.error(`❌ ${err.message}`);
                }
            }
        }

        return new Response(JSON.stringify({ error: lastError }), {
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

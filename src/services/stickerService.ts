
import { supabase } from '../lib/supabase';

// --- TYPES ---
export interface Sticker {
    id: string;
    group_id: string;
    resource_title: string;
    resource_category: string;
    sticker_url: string;
    created_at: string;
}

// --- CONFIG ---
const BUCKET_NAME = 'stickers';

// --- SERVICE ---

/**
 * Generates a sticker using a Supabase Edge Function with forced Blob handling.
 */
export const generateAndSaveSticker = async (
    resourceTitle: string,
    resourceType: string,
    groupId: string,
    visualContext?: string
): Promise<{ success: boolean; sticker?: Sticker; error?: string }> => {
    try {
        console.log("🚀 [v2.0.0] MOTOR DE PEGATINAS (POLLINATIONS DIRECTO)");
        console.log(`🎨 Generando para: ${resourceTitle}`);

        // 1. Daily Limit DISABLED for testing
        /*
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: todayStickers, error: countError } = await supabase
            .from('resource_stickers')
            .select('id')
            .eq('group_id', groupId)
            .gte('created_at', today.toISOString());

        if (!countError && todayStickers && todayStickers.length >= 3) {
            return {
                success: false,
                error: "¡Límite diario alcanzado! Tico ha dibujado mucho hoy (3/3). Vuelve mañana para más pegatinas."
            };
        }
        */

        // 2. Prepare Prompt (Pop Mart Toy Aesthetic 3.1.0)
        const cleanTitle = resourceTitle.replace(/\[.*?\]/g, '').trim();
        const subjectDescription = visualContext || cleanTitle;
        const simplePrompt = `A high-quality 3D Pop Mart vinyl toy of ${subjectDescription}, thick white die-cut sticker border, extremely cute and friendly, big button eyes, happy face. Set against a solid FLAT WHITE background, studio lighting, plastic texture, vibrant high-contrast colors, centered, 8k resolution, crisp edges.`;

        let blob: Blob | null = null;

        // 3. Llamar a la Edge Function (HuggingFace) - funciona correctamente
        const MAX_RETRIES = 2;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`⏳ Edge Function intento ${attempt + 1}/${MAX_RETRIES + 1}...`);
                const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sticker`;
                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ prompt: simplePrompt })
                });

                if (response.ok) {
                    const fetchedBlob = await response.blob();
                    if (fetchedBlob.size > 2000) {
                        console.log(`✅ Sticker generado (${fetchedBlob.size} bytes)`);
                        blob = fetchedBlob;
                        break;
                    }
                } else {
                    const errText = await response.text();
                    console.warn(`⚠️ Intento ${attempt + 1} falló:`, errText);
                }
            } catch (err) {
                console.warn(`🌐 Error de red (intento ${attempt + 1}):`, err);
            }
            if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 3000));
        }

        // 4. FALLBACK: Pegatina de reserva
        if (!blob || blob.size < 2000) {
            console.log("💾 Usando Pegatina de Reserva (Tico Fallback).");
            const fallbackUrl = '/tico_fallback.png';

            const { data: fallbackData, error: fbError } = await supabase
                .from('resource_stickers')
                .insert([{
                    group_id: groupId,
                    resource_title: cleanTitle,
                    resource_category: resourceType,
                    sticker_url: fallbackUrl
                }])
                .select()
                .single();

            if (fbError) throw fbError;
            return { success: true, sticker: fallbackData };
        }

        // 5. Upload to Supabase Storage
        const fileName = `sticker_${groupId}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 6. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        // 7. Save Metadata to DB
        const { data: insertData, error: dbError } = await supabase
            .from('resource_stickers')
            .insert([{
                group_id: groupId,
                resource_title: cleanTitle,
                resource_category: resourceType,
                sticker_url: publicUrl
            }])
            .select()
            .single();

        if (dbError) throw dbError;

        return { success: true, sticker: insertData };

    } catch (error: any) {
        console.error("❌ Fallo crítico:", error);
        return { success: false, error: "Tico tuvo un problema al dibujar." };
    }
};

/**
 * Retrieves all stickers for a specific group.
 */
export const getStickers = async (groupId: string): Promise<Sticker[]> => {
    try {
        const { data, error } = await supabase
            .from('resource_stickers')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Sticker[];
    } catch (error) {
        return [];
    }
};

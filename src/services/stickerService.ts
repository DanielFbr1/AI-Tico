
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
        console.log("🚀 [VERSIÓN 1.0.4] MOTOR DE PEGATINAS (MODO BLOB)");
        console.log(`🎨 Generando para: ${resourceTitle}`);

        // 1. Check Daily Limit (3 stickers per group per day)
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

        // 2. Prepare Prompt
        const cleanTitle = resourceTitle.replace(/\[.*?\]/g, '').trim();
        const subject = visualContext || cleanTitle;
        const simplePrompt = `A high-quality 3D digital sticker, Pixar style, cute character of ${subject}, white thick die-cut border, solid white background, vibrant colors, 4k render, toy-like appearance, no text, pure white background.`;

        let blob: Blob | null = null;

        // 3. Call Supabase Edge Function con manejo manual de la respuesta
        try {
            console.log("⏳ Invocando generate-sticker...");

            // Usamos fetch directo a la URL de la función para mayor control del BLOB
            const { data: { publicUrl: functionUrl } } = { data: { publicUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sticker` } };

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ prompt: simplePrompt })
            });

            if (response.ok) {
                console.log("✅ Respuesta recibida de la función");
                blob = await response.blob();
            } else {
                const errorText = await response.text();
                console.warn("⚠️ La función devolvió error:", errorText);
            }
        } catch (err) {
            console.error("🌐 Error de red con la función:", err);
        }

        // 4. Final Fallback (If all fails)
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
        const { data: uploadData, error: uploadError } = await supabase.storage
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

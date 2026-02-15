
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

const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

// --- SERVICE ---

/**
 * Generates a sticker using AI via Client-Side Fetch (Direct to Hugging Face).
 * This bypasses Supabase DB network restrictions.
 */
export const generateAndSaveSticker = async (
    resourceTitle: string,
    resourceType: string,
    groupId: string,
    visualContext?: string
): Promise<{ success: boolean; sticker?: Sticker; error?: string }> => {
    try {
        console.log(`🎨 Generando sticker para: ${resourceTitle}${visualContext ? ' (Usando contexto visual)' : ''}`);

        // 1. Prepare Prompt
        const cleanTitle = resourceTitle.replace(/\[.*?\]/g, '').trim();
        const subject = visualContext || cleanTitle;

        const simplePrompt = `Generate a cute, vibrant, 3D collectible sticker. The subject is: '${subject}'. The sticker MUST feature iconic characters or highly recognizable elements from this specific work. The sticker should be rendered in a chubby, friendly, Pixar-like 3D cartoon style. It must have a thick, clear white die-cut outline. Use bright, saturated colors and soft studio lighting. Minimal, plain background within the sticker. Art style: Zespri-like, collectible toy. STRICT RULE: NO TEXT, NO LETTERS, NO NUMBERS, NO CAPTIONS, NO TITLES, NO WATERMARKS. Just the visual subject.`;

        // 2. Call Hugging Face API Directly
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: simplePrompt }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF Client Error:", response.status, errorText);
            throw new Error(`Error de IA (${response.status}): ${errorText}`);
        }

        const blob = await response.blob();
        console.log(`📦 Imagen recibida (${blob.size} bytes), subiendo a Storage...`);

        if (blob.size < 1000) {
            throw new Error("La imagen generada es demasiado pequeña (posible error de API).");
        }

        // 3. Upload to Supabase Storage
        const fileName = `sticker_${groupId}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, blob, {
                contentType: blob.type || 'image/jpeg',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        // 5. Save Metadata to DB
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

        console.log("✅ Sticker guardado exitosamente:", insertData);
        return { success: true, sticker: insertData };

    } catch (error: any) {
        console.error("❌ Error en stickerService:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Retrieves all stickers for a specific group.
 */
export const getStickers = async (groupId: string): Promise<Sticker[]> => {
    const { data, error } = await supabase
        .from('resource_stickers')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching stickers:", error);
        return [];
    }
    return data as Sticker[];
};

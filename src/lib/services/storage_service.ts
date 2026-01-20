import { createClient } from '@/utils/supabase/client';

/**
 * Uploads a generated Digital Twin (GLB or JSON mesh) to Supabase Storage.
 * @param fileBlob The file data to upload
 * @param scanId The ID of the scan this twin belongs to
 */
export async function uploadDigitalTwin(fileBlob: Blob, scanId: string): Promise<string | null> {
    const supabase = createClient();
    const fileName = `${scanId}/digital_twin.json`; // Using JSON for our three.js mock structure

    try {
        const { data, error } = await supabase.storage
            .from('spatial-ledger')
            .upload(fileName, fileBlob, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error("Storage Upload Failed:", error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('spatial-ledger')
            .getPublicUrl(fileName);

        return publicUrl;

    } catch (err) {
        console.error("Storage Service Error:", err);
        return null;
    }
}

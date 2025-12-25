import { supabase } from '../lib/supabase';


interface SaveJournalEntryParams {
    title: string;
    location: string;
    date: string;
    text: string;
    selectedFiles: File[];
    existingMediaUrls: string[];
}

export function useJournalEntry() {

    const saveJournalEntry = async (
        data: SaveJournalEntryParams,
        couple: any, // Typed as any for now to match usage, or better specific type if available
        editingId?: string | null
    ) => {
        const { title, location, date, text, selectedFiles, existingMediaUrls } = data;

        if (!text.trim() || !title.trim() || !date) return;
        if (!couple) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        let uploadedUrls: string[] = [];

        // Upload new images
        if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${couple.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('memories')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('memories')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            }
        }

        const finalMediaUrls = [...existingMediaUrls, ...uploadedUrls];

        if (editingId) {
            // Update existing entry
            const { error } = await supabase
                .from('memories')
                .update({
                    caption: text,
                    title: title || null,
                    location: location || null,
                    media_urls: finalMediaUrls.length > 0 ? finalMediaUrls : null,
                    created_at: new Date(date).toISOString()
                })
                .eq('id', editingId);

            if (error) throw error;
        } else {
            // Insert new entry
            const { error } = await supabase
                .from('memories')
                .insert({
                    couple_id: couple.id,
                    uploader_id: user.id,
                    type: 'journal',
                    caption: text,
                    title: title || null,
                    location: location || null,
                    media_urls: finalMediaUrls.length > 0 ? finalMediaUrls : null,
                    created_at: new Date(date).toISOString()
                });

            if (error) throw error;
        }
    };

    const deleteJournalEntry = async (editingId: string) => {
        const { error } = await supabase
            .from('memories')
            .delete()
            .eq('id', editingId);

        if (error) throw error;
    };

    return {
        saveJournalEntry,
        deleteJournalEntry
    };
}

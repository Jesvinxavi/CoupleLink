import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCoupleData } from '@/hooks/useCoupleData';
import { useAuth } from './AuthContext';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export interface JournalEntry {
    id: string;
    caption: string | null;
    created_at: string;
    uploader_id: string | null;
    title: string | null;
    location: string | null;
    country: string | null;
    media_urls: string[] | null;
    profiles?: {
        first_name: string | null;
        avatar_url: string | null;
    };
    reactions?: {
        id: string;
        emoji: string;
        user_id: string;
    }[];
}

export interface SaveJournalEntryParams {
    title: string;
    location: string;
    date: string;
    text: string;
    selectedFiles: File[];
    existingMediaUrls: string[];
}

interface JournalContextType {
    entries: JournalEntry[];
    loading: boolean;
    refreshEntries: () => Promise<void>;
    saveEntry: (data: SaveJournalEntryParams, editingId?: string | null) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    toggleReaction: (entryId: string, emoji: string) => Promise<void>;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const JournalContext = createContext<JournalContextType | undefined>(undefined);

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export function JournalProvider({ children }: { children: ReactNode }) {
    const { couple } = useCoupleData();
    const { user } = useAuth();

    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const hasLoaded = useRef(false);

    const fetchEntries = useCallback(async () => {
        if (!couple) return;
        try {
            // Only set loading on initial load to prevent flicker
            if (!hasLoaded.current) setLoading(true);

            const { data, error } = await supabase
                .from('memories')
                .select(`
                    *,
                    profiles:uploader_id (
                        first_name,
                        avatar_url
                    ),
                    reactions:journal_reactions (
                        id,
                        emoji,
                        user_id
                    )
                `)
                .eq('couple_id', couple.id)
                .eq('type', 'journal')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data as any);
            hasLoaded.current = true;
        } catch (err) {
            logger.error('JournalContext', 'Error fetching journal entries', err);
        } finally {
            setLoading(false);
        }
    }, [couple]);

    // Initial Fetch
    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    // Realtime Subscription
    useEffect(() => {
        if (!couple) return;

        const channelName = `partner-journal-${couple.id}`;
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'memories',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    const record = payload.new as any;
                    const oldRecord = payload.old as any;
                    // Check if it's a journal entry
                    if (record?.type === 'journal' || oldRecord?.type === 'journal') {
                        fetchEntries();
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'journal_reactions'
                },
                () => {
                    fetchEntries();
                }
            )
            .on('broadcast', { event: 'journal_update' }, () => {
                fetchEntries();
            })
            .subscribe();

        // 30s polling fallback
        const intervalId = setInterval(() => {
            fetchEntries();
        }, 30000);

        // Window focus listener
        const handleFocus = () => {
            fetchEntries();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
            channelRef.current = null;
        };
    }, [couple, fetchEntries]);

    const saveEntry = useCallback(async (data: SaveJournalEntryParams, editingId?: string | null) => {
        const { title, location, date, text, selectedFiles, existingMediaUrls } = data;

        if (!couple || !user) return;
        if (!text.trim() || !title.trim() || !date) return;

        try {
            const uploadedUrls: string[] = [];

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
                // CLEANUP: Check for removed images and delete from storage
                const { data: currentEntry } = await supabase
                    .from('memories')
                    .select('media_urls')
                    .eq('id', editingId)
                    .single();

                if (currentEntry?.media_urls) {
                    const removedUrls = currentEntry.media_urls.filter((url: string) =>
                        !existingMediaUrls.includes(url)
                    );

                    if (removedUrls.length > 0) {
                        const filesToRemove = removedUrls.map((url: string) => {
                            const path = url.split('/memories/')[1];
                            return path;
                        }).filter(Boolean);

                        if (filesToRemove.length > 0) {
                            const { error: removeError } = await supabase.storage
                                .from('memories')
                                .remove(filesToRemove);

                            if (removeError) {
                                logger.error('JournalContext', 'Error removing deleted journal images', removeError);
                            }
                        }
                    }
                }

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

            // Broadcast update
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'journal_update',
                    payload: {}
                });
            }

            fetchEntries();

        } catch (error) {
            logger.error('JournalContext', 'Error saving journal entry', error);
            throw error;
        }
    }, [couple, user, fetchEntries]);

    const deleteEntry = useCallback(async (id: string) => {
        try {
            // 1. Get the entry first to find media URLs
            const { data: entry } = await supabase
                .from('memories')
                .select('media_urls')
                .eq('id', id)
                .single();

            // 2. Delete from Storage if there are media URLs
            if (entry && entry.media_urls && entry.media_urls.length > 0) {
                const filesToRemove = entry.media_urls.map((url: string) => {
                    // Extract path after /memories/
                    // Format is typically: .../storage/v1/object/public/memories/USER_ID/FILE_NAME
                    const path = url.split('/memories/')[1];
                    return path;
                }).filter(Boolean);

                if (filesToRemove.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('memories')
                        .remove(filesToRemove);

                    if (storageError) {
                        logger.error('JournalContext', 'Error deleting files from storage', storageError);
                        // We continue even if storage delete fails, to ensure DB consistency
                    }
                }
            }

            // 3. Delete from DB
            const { error } = await supabase
                .from('memories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Broadcast update
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'journal_update',
                    payload: {}
                });
            }

            fetchEntries();
        } catch (error) {
            logger.error('JournalContext', 'Error deleting journal entry', error);
            throw error;
        }
    }, [fetchEntries]);

    const toggleReaction = useCallback(async (entryId: string, emoji: string) => {
        if (!user) return;

        try {
            // Check if user already reacted with this emoji
            const existingReaction = entries
                .find(e => e.id === entryId)
                ?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

            if (existingReaction) {
                // Remove reaction
                await supabase
                    .from('journal_reactions')
                    .delete()
                    .eq('id', existingReaction.id);
            } else {
                // Add reaction
                await supabase
                    .from('journal_reactions')
                    .insert({
                        memory_id: entryId,
                        user_id: user.id,
                        emoji
                    });
            }

            // Realtime listener will catch this, but we can also broadcast/fetch
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'journal_update',
                    payload: {}
                });
            }
            fetchEntries();
        } catch (err) {
            logger.error('JournalContext', 'Error handling reaction', err);
            throw err;
        }
    }, [entries, user, fetchEntries]);

    const contextValue = useMemo(() => ({
        entries,
        loading,
        refreshEntries: fetchEntries,
        saveEntry,
        deleteEntry,
        toggleReaction
    }), [entries, loading, fetchEntries, saveEntry, deleteEntry, toggleReaction]);

    return (
        <JournalContext.Provider value={contextValue}>
            {children}
        </JournalContext.Provider>
    );
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useJournalContext() {
    const context = useContext(JournalContext);
    if (context === undefined) {
        throw new Error('useJournalContext must be used within a JournalProvider');
    }
    return context;
}

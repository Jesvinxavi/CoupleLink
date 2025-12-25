import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useCoupleData } from '../hooks/useCoupleData';
import { useAuth } from './AuthContext';

export interface Note {
    id: string;
    caption: string;
    created_at: string;
    metadata: {
        seen_at?: string;
    } | null;
}

interface PartnerNotesContextType {
    myLastNote: Note | null;
    partnerLastNote: Note | null;
    loading: boolean;
    sendNote: (caption: string) => Promise<void>;
    markAsSeen: (note: Note) => Promise<void>;
}

const PartnerNotesContext = createContext<PartnerNotesContextType | undefined>(undefined);

export function PartnerNotesProvider({ children }: { children: ReactNode }) {
    const { couple } = useCoupleData();
    const { user } = useAuth();

    const [myLastNote, setMyLastNote] = useState<Note | null>(null);
    const [partnerLastNote, setPartnerLastNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);

    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const fetchNotes = useCallback(async () => {
        if (!couple || !user) return;

        try {
            // Fetch MY last note
            const { data: myData } = await supabase
                .from('memories')
                .select('id, caption, created_at, metadata')
                .eq('couple_id', couple.id)
                .eq('uploader_id', user.id)
                .eq('type', 'sticky_note')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            setMyLastNote(myData as Note | null);

            // Fetch PARTNER'S last note
            const partnerId = couple.user_one_id === user.id ? couple.user_two_id : couple.user_one_id;
            if (partnerId) {
                const { data: partnerData } = await supabase
                    .from('memories')
                    .select('id, caption, created_at, metadata')
                    .eq('couple_id', couple.id)
                    .eq('uploader_id', partnerId)
                    .eq('type', 'sticky_note')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                setPartnerLastNote(partnerData as Note | null);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    }, [couple, user]);

    // Initial Fetch
    useEffect(() => {
        if (!couple) return;
        fetchNotes();
    }, [fetchNotes, couple]);

    // Realtime Subscription
    useEffect(() => {
        if (!couple) return;

        const channelName = `partner-notes-${couple.id}`;
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
                    // Only care about sticky_notes updates or deletes
                    if (record?.type === 'sticky_note' || (payload.old as any)?.type === 'sticky_note') {
                        fetchNotes();
                    }
                }
            )
            .on('broadcast', { event: 'note_update' }, () => {
                fetchNotes();
            })
            .on('broadcast', { event: 'note_seen' }, () => {
                fetchNotes();
            })
            .subscribe();

        // 30s polling fallback
        const intervalId = setInterval(() => {
            fetchNotes();
        }, 30000);

        // Window focus listener for immediate update when returning to app
        const handleFocus = () => {
            fetchNotes();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
            channelRef.current = null;
        };
    }, [couple, fetchNotes]);

    const sendNote = async (caption: string) => {
        if (!couple || !user) return;

        try {
            const { error } = await supabase
                .from('memories')
                .insert({
                    couple_id: couple.id,
                    uploader_id: user.id,
                    type: 'sticky_note',
                    caption: caption.trim(),
                    created_at: new Date().toISOString(),
                    metadata: {}
                });

            if (error) throw error;

            // Broadcast
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'note_update',
                    payload: {}
                });
            }

            fetchNotes();

        } catch (error) {
            console.error('Error sending note:', error);
            throw error;
        }
    };

    const markAsSeen = async (note: Note) => {
        if (!couple || !user) return;

        // Prevent double marking
        if (note.metadata?.seen_at) return;

        try {
            const now = new Date().toISOString();
            const newMetadata = {
                ...(note.metadata || {}),
                seen_at: now
            };

            const { error } = await supabase
                .from('memories')
                .update({ metadata: newMetadata })
                .eq('id', note.id);

            if (error) throw error;

            // Optimistic update
            setPartnerLastNote(prev => prev ? { ...prev, metadata: newMetadata } : null);

            // Broadcast
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'note_seen',
                    payload: { noteId: note.id, seenAt: now }
                });
            }

        } catch (error) {
            console.error('Error marking note seen:', error);
        }
    };

    return (
        <PartnerNotesContext.Provider value={{
            myLastNote,
            partnerLastNote,
            loading,
            sendNote,
            markAsSeen
        }}>
            {children}
        </PartnerNotesContext.Provider>
    );
}

export function usePartnerNotesContext() {
    const context = useContext(PartnerNotesContext);
    if (context === undefined) {
        throw new Error('usePartnerNotesContext must be used within a PartnerNotesProvider');
    }
    return context;
}

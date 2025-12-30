import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCoupleData } from '../hooks/useCoupleData';

export interface Fantasy {
    id: string;
    couple_id: string;
    requester_id: string;
    requester_name?: string;
    requester_avatar?: string;
    fantasy_text: string;
    status: 'pending' | 'approved' | 'completed';
    created_at: string;
    responded_at: string | null;
    completed_at: string | null;
}

interface FantasyBucketListContextType {
    fantasies: Fantasy[];
    pendingCount: number;
    approvedCount: number;
    completedCount: number;
    loading: boolean;
    addFantasy: (text: string) => Promise<void>;
    approveFantasy: (id: string) => Promise<void>;
    vetoFantasy: (id: string) => Promise<void>;
    deleteFantasy: (id: string) => Promise<void>;
    completeFantasy: (id: string) => Promise<void>;
    isRequester: (fantasy: Fantasy) => boolean;
}

const FantasyBucketListContext = createContext<FantasyBucketListContextType | undefined>(undefined);

// Type assertion for tables that don't exist in generated types yet
const db = supabase as any;

export function FantasyBucketListProvider({ children }: { children: ReactNode }) {
    const { couple, userProfile } = useCoupleData();
    const [fantasies, setFantasies] = useState<Fantasy[]>([]);
    const [loading, setLoading] = useState(true);
    // Track IDs we're actively modifying to prevent realtime race conditions
    const ignoredFantasyIds = useRef<Set<string>>(new Set());

    const fetchFantasies = useCallback(async () => {
        if (!couple?.id) return;

        try {
            // We don't set loading to true here to avoid flickering on real-time updates
            // Only set it on initial load if needed, but we handle that with local state

            const { data, error } = await db
                .from('fantasy_bucket_list')
                .select(`
                    *,
                    profiles:requester_id (first_name, avatar_url)
                `)
                .eq('couple_id', couple.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching fantasies:', error);
                return;
            }

            const fantasiesWithNames = (data || []).map((f: any) => ({
                ...f,
                requester_name: f.profiles?.first_name || 'Partner',
                requester_avatar: f.profiles?.avatar_url || null,
            }));

            setFantasies(fantasiesWithNames);
        } catch (error) {
            console.error('Error fetching fantasies:', error);
        } finally {
            setLoading(false);
        }
    }, [couple?.id]);

    const checkUpdates = useCallback(async () => {
        await fetchFantasies();
    }, [fetchFantasies]);

    // Channel Ref for broadcasting
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!couple?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        // Fetch immediately
        fetchFantasies();

        const channelName = `partner-fantasy-${couple.id}`;

        // Set up realtime subscription + Broadcast listener
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'fantasy_bucket_list',
                    filter: `couple_id=eq.${couple.id}`  // Efficient filtering
                },
                async () => {
                    // Trigger refresh on any change
                    checkUpdates();
                }
            )
            .on('broadcast', { event: 'fantasy_update' }, () => {
                checkUpdates();
            })
            .subscribe();

        channelRef.current = channel;

        // 30s polling fallback (reduced from 3s)
        const intervalId = setInterval(() => {
            fetchFantasies();
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
            channelRef.current = null;
        };
    }, [couple?.id, fetchFantasies, checkUpdates]);

    const addFantasy = async (text: string) => {
        if (!couple?.id || !userProfile?.id) return;

        const newFantasy = {
            couple_id: couple.id,
            requester_id: userProfile.id,
            fantasy_text: text,
            status: 'pending',
        };

        // Optimistic update with a stable temp ID based on content
        const tempId = `temp-${Date.now()}`;
        const optimisticFantasy: Fantasy = {
            ...newFantasy,
            id: tempId,
            requester_name: userProfile.first_name || 'You',
            requester_avatar: userProfile.avatar_url || null,
            created_at: new Date().toISOString(),
            responded_at: null,
            completed_at: null,
        } as Fantasy;

        setFantasies((prev) => [optimisticFantasy, ...prev]);

        try {
            const { data, error } = await db
                .from('fantasy_bucket_list')
                .insert(newFantasy)
                .select()
                .single();

            if (data) {

                if (channelRef.current) {
                    await channelRef.current.send({
                        type: 'broadcast',
                        event: 'fantasy_update',
                        payload: { action: 'add', id: data.id }
                    });
                }
            }

            if (error) {
                console.error('Insert error:', error);
                throw error;
            }

            // Silently update the ID without triggering animation
            setFantasies((prev) =>
                prev.map((f) =>
                    f.id === tempId
                        ? { ...f, id: data.id }
                        : f
                )
            );

            // Briefly ignore this fantasy in realtime to prevent double-add race condition
            ignoredFantasyIds.current.add(data.id);
            setTimeout(() => ignoredFantasyIds.current.delete(data.id), 2000);
        } catch (error) {
            console.error('Error adding fantasy:', error);
            // Revert optimistic update
            setFantasies((prev) => prev.filter((f) => f.id !== tempId));
        }
    };

    const approveFantasy = async (id: string) => {

        // Optimistic update
        setFantasies((prev) =>
            prev.map((f) =>
                f.id === id
                    ? { ...f, status: 'approved' as const, responded_at: new Date().toISOString() }
                    : f
            )
        );

        try {
            const { error } = await db
                .from('fantasy_bucket_list')
                .update({ status: 'approved', responded_at: new Date().toISOString() })
                .eq('id', id);

            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'fantasy_update',
                    payload: { action: 'approve', id: id }
                });
            }

            if (error) {
                console.error('Error approving fantasy (DB):', error);
                throw error;
            }

        } catch (error) {
            console.error('Error approving fantasy:', error);
            await fetchFantasies(); // Revert on error
        }
    };

    const vetoFantasy = async (id: string) => {

        // Optimistic update - remove from list
        const previousFantasies = fantasies;
        setFantasies((prev) => prev.filter((f) => f.id !== id));

        // Add to ignored list to prevent race condition with realtime
        ignoredFantasyIds.current.add(id);

        try {
            const { error } = await db.from('fantasy_bucket_list').delete().eq('id', id);

            if (error) {
                console.error('Error vetoing fantasy (DB):', error);
                throw error;
            }


            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'fantasy_update',
                    payload: { action: 'veto', id: id }
                });
            }
        } catch (error) {
            console.error('Error vetoing fantasy:', error);
            setFantasies(previousFantasies); // Revert on error
        }
    };

    const deleteFantasy = async (id: string) => {

        // Same as veto - removes the fantasy
        const previousFantasies = fantasies;
        setFantasies((prev) => prev.filter((f) => f.id !== id));

        // Add to ignored list to prevent race condition with realtime
        ignoredFantasyIds.current.add(id);

        try {
            const { error } = await db.from('fantasy_bucket_list').delete().eq('id', id);

            if (error) {
                console.error('Error deleting fantasy (DB):', error);
                throw error;
            }


            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'fantasy_update',
                    payload: { action: 'delete', id: id }
                });
            }
        } catch (error) {
            console.error('Error deleting fantasy:', error);
            setFantasies(previousFantasies); // Revert on error
        }
    };

    const completeFantasy = async (id: string) => {

        // Optimistic update
        setFantasies((prev) =>
            prev.map((f) =>
                f.id === id
                    ? { ...f, status: 'completed' as const, completed_at: new Date().toISOString() }
                    : f
            )
        );

        try {
            const { error } = await db
                .from('fantasy_bucket_list')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                console.error('Error completing fantasy (DB):', error);
                throw error;
            }

            // Award 5 love action points for completing a fantasy
            if (couple?.id) {
                await supabase.rpc('add_love_action_points', {
                    p_couple_id: couple.id,
                    p_points: 5
                });

            }



            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'fantasy_update',
                    payload: { action: 'complete', id: id }
                });
            }
        } catch (error) {
            console.error('Error completing fantasy:', error);
            await fetchFantasies(); // Revert on error
        }
    };

    const isRequester = (fantasy: Fantasy) => {
        return fantasy.requester_id === userProfile?.id;
    };

    const pendingCount = fantasies.filter((f) => f.status === 'pending').length;
    const approvedCount = fantasies.filter((f) => f.status === 'approved').length;
    const completedCount = fantasies.filter((f) => f.status === 'completed').length;

    const value = {
        fantasies,
        pendingCount,
        approvedCount,
        completedCount,
        loading,
        addFantasy,
        approveFantasy,
        vetoFantasy,
        deleteFantasy,
        completeFantasy,
        isRequester,
    };

    return (
        <FantasyBucketListContext.Provider value={value}>
            {children}
        </FantasyBucketListContext.Provider>
    );
}

export function useFantasyBucketListContext() {
    const context = useContext(FantasyBucketListContext);
    if (context === undefined) {
        throw new Error('useFantasyBucketListContext must be used within a FantasyBucketListProvider');
    }
    return context;
}

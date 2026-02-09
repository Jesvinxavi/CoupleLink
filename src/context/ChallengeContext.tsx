import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCoupleData } from '@/hooks/useCoupleData';
import type { Challenge } from '@/types/challenge';
import { formatTime, getWeekNumber, getDateRange, getPeriodKey } from '@/utils/dateUtils';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export type ChallengeStatus = 'locked' | 'active' | 'completed' | 'skipped' | 'waiting_for_partner' | 'pending_agreement';

export interface PoolStatusItem {
    total: number;
    shown: number;
    allShown: boolean;
}

export interface PoolStatus {
    daily: PoolStatusItem;
    weekly: PoolStatusItem;
    monthly: PoolStatusItem;
}



export interface ChallengeState {
    daily: Challenge | null;
    weekly: Challenge | null;
    monthly: Challenge | null;

    dailyTimeLeft: string;
    weeklyTimeLeft: string;
    monthlyTimeLeft: string;
    dailyTimeUrgent: boolean;
    weeklyTimeUrgent: boolean;
    monthlyTimeUrgent: boolean;

    // Derived Statuses
    dailyStatus: ChallengeStatus;
    weeklyStatus: ChallengeStatus;
    monthlyStatus: ChallengeStatus;

    // Raw Data (exposed for specific UI needs if any)
    myDailyMemory: any;
    myWeeklyMemory: any;
    myMonthlyMemory: any;
    partnerDailyMemory: any;
    partnerWeeklyMemory: any;
    partnerMonthlyMemory: any;

    history: Array<{ id: string; title: string; date: string; type: 'daily' | 'weekly' | 'monthly'; metadata?: any }>;
    completeChallenge: (type: 'daily' | 'weekly' | 'monthly', file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => Promise<void>;
    undoChallenge: (type: 'daily' | 'weekly' | 'monthly') => Promise<void>;
    skipChallenge: (type: 'daily' | 'weekly' | 'monthly') => Promise<void>;
    loadingPartner: boolean;
    winnerAgreement: {
        daily: 'agreed' | 'disagreed' | 'pending' | 'none';
        weekly: 'agreed' | 'disagreed' | 'pending' | 'none';
        monthly: 'agreed' | 'disagreed' | 'pending' | 'none';
    };
    markChallengeConfettiSeen: (memoryId: string) => Promise<void>;
    couple: any;
    refreshCoupleData: () => Promise<void>;
    loadingChallenges: boolean;

    // Pool status for "all shown" UI
    poolStatus: PoolStatus | null;
    resetCycle: (type: 'daily' | 'weekly' | 'monthly') => Promise<void>;

    // Operation states
    isCompleting: boolean;
    isUndoing: boolean;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const ChallengeContext = createContext<ChallengeState | null>(null);

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export const useChallengeContext = () => {
    const context = useContext(ChallengeContext);
    if (!context) {
        throw new Error('useChallengeContext must be used within a ChallengeProvider');
    }
    return context;
};

interface ChallengeProviderProps {
    children: ReactNode;
}

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export const ChallengeProvider = ({ children }: ChallengeProviderProps) => {
    // Raw State
    const [myMemories, setMyMemories] = useState<any[]>([]);
    const [partnerMemories, setPartnerMemories] = useState<any[]>([]);
    const [history, setHistory] = useState<Array<{ id: string; title: string; date: string; type: 'daily' | 'weekly' | 'monthly'; metadata?: any }>>([]);
    const [loadingPartner, setLoadingPartner] = useState(true);
    const [loadingChallenges, setLoadingChallenges] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isUndoing, setIsUndoing] = useState(false);
    const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);

    const [winnerAgreement, setWinnerAgreement] = useState<{
        daily: 'agreed' | 'disagreed' | 'pending' | 'none';
        weekly: 'agreed' | 'disagreed' | 'pending' | 'none';
        monthly: 'agreed' | 'disagreed' | 'pending' | 'none';
    }>({ daily: 'none', weekly: 'none', monthly: 'none' });

    const [timeLeft, setTimeLeft] = useState({
        daily: '',
        weekly: '',
        monthly: '',
        dailyUrgent: false,
        weeklyUrgent: false,
        monthlyUrgent: false
    });

    // State for active challenges
    const [daily, setDaily] = useState<Challenge | null>(null);
    const [weekly, setWeekly] = useState<Challenge | null>(null);
    const [monthly, setMonthly] = useState<Challenge | null>(null);

    // Context Hooks
    const { couple, currentUser, userProfile, refreshCoupleData } = useCoupleData();

    // Refs for Robustness
    // Track recently deleted IDs to prevent "zombie" state from replication lag
    const recentlyDeletedIds = useRef<Set<string>>(new Set());

    // Cleanup deleted IDs after 5 seconds
    const addToRecentlyDeleted = useCallback((id: string) => {
        recentlyDeletedIds.current.add(id);
        setTimeout(() => {
            recentlyDeletedIds.current.delete(id);
        }, 5000);
    }, []);

    // Load History from LocalStorage (Optimistic/Offline support)
    useEffect(() => {
        const h = localStorage.getItem('challenge_history');
        if (h) {
            const parsedHistory = JSON.parse(h);
            setHistory(parsedHistory);

            const rehydratedMemories = parsedHistory.map((h: any) => ({
                id: h.id,
                title: h.title,
                created_at: h.date,
                type: 'challenge',
                metadata: h.metadata || {}
            }));
            setMyMemories(rehydratedMemories);
        }
    }, []);

    // Fetch Active Challenges from DB
    useEffect(() => {
        if (!currentUser) return;

        if (!couple) {
            setLoadingChallenges(false);
            return;
        }

        const fetchChallenges = async () => {
            const stopPerf = logger.perf("ChallengeContext", "fetchChallenges")
            try {
                // Parallel fetch for active challenges
                const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
                    supabase.rpc('get_active_challenge' as any, { couple_id_input: couple.id, frequency_input: 'daily' }) as any,
                    supabase.rpc('get_active_challenge' as any, { couple_id_input: couple.id, frequency_input: 'weekly' }) as any,
                    supabase.rpc('get_active_challenge' as any, { couple_id_input: couple.id, frequency_input: 'monthly' }) as any
                ]);

                if (dailyRes.data && dailyRes.data.success && dailyRes.data.data) {
                    const d = dailyRes.data.data;
                    setDaily({
                        id: d.id,
                        type: 'daily',
                        title: d.content?.title || d.content?.question || 'Daily Challenge',
                        description: d.content?.description || 'Complete the daily challenge!',
                        durationMinutes: d.content?.durationMinutes || 0,
                        category: d.category,
                        isCompetition: d.content?.isCompetition || false
                    });
                } else {
                    setDaily(null);
                }

                if (weeklyRes.data && weeklyRes.data.success && weeklyRes.data.data) {
                    const w = weeklyRes.data.data;
                    setWeekly({
                        id: w.id,
                        type: 'weekly',
                        title: w.content?.title || 'Weekly Challenge',
                        description: w.content?.description || 'Complete the weekly challenge!',
                        durationMinutes: w.content?.durationMinutes || 0,
                        category: w.category,
                        isCompetition: w.content?.isCompetition || false
                    });
                } else {
                    setWeekly(null);
                }

                if (monthlyRes.data && monthlyRes.data.success && monthlyRes.data.data) {
                    const m = monthlyRes.data.data;
                    setMonthly({
                        id: m.id,
                        type: 'monthly',
                        title: m.content?.title || 'Monthly Challenge',
                        description: m.content?.description || 'Complete the monthly challenge!',
                        durationMinutes: m.content?.durationMinutes || 0,
                        category: m.category,
                        isCompetition: m.content?.isCompetition || false
                    });
                } else {
                    setMonthly(null);
                }

                // Fetch pool status for "all shown" UI
                const { data: poolData } = await (supabase.rpc as any)('get_challenge_pool_status', { couple_id_input: couple.id });
                if (poolData?.success && poolData.data) {
                    setPoolStatus(poolData.data as PoolStatus);
                }

            } catch (error) {
                logger.error('ChallengeContext', 'Error fetching active challenges', error);
            } finally {
                setLoadingChallenges(false);
                stopPerf()
            }
        };

        fetchChallenges();
    }, [couple, currentUser]);

    // Run backfill and expiry check on mount
    useEffect(() => {
        if (!couple?.id) return;

        import('../utils/challengeHistory').then(({ checkExpiredChallenges, backfillChallengeHistoryFromMemories }) => {
            // Backfill historical data if needed
            backfillChallengeHistoryFromMemories(couple.id);
            // Check for expired challenges
            checkExpiredChallenges(couple.id);
        });
    }, [couple?.id]);

    // Seen Count Logic + Challenge History Tracking
    const seenUpdateRef = useRef<{ daily: string | null, weekly: string | null, monthly: string | null }>({ daily: null, weekly: null, monthly: null });

    useEffect(() => {
        if (!couple) return;

        const updateSeen = async () => {
            const stats = (couple.challenge_stats as any) || {};
            const updates: any = {};
            let needsUpdate = false;
            const historyInserts: Array<{ couple_id: string; challenge_type: 'daily' | 'weekly' | 'monthly'; activity_id: string; period_key: string }> = [];

            const checkType = async (type: 'daily' | 'weekly' | 'monthly', currentChallenge: Challenge | null, seedDateStr: string) => {
                if (!currentChallenge) return;

                if (seenUpdateRef.current[type] === seedDateStr) return;

                const typeStats = stats[type] || { count: 0, last_seen: null };

                const lastSeen = typeStats.last_seen ? new Date(typeStats.last_seen) : null;
                const now = new Date();

                let isNew = false;
                if (!lastSeen) isNew = true;
                else {
                    if (type === 'daily') {
                        isNew = lastSeen.toDateString() !== now.toDateString();
                    } else if (type === 'weekly') {
                        const lastWeek = getWeekNumber(lastSeen);
                        const currentWeek = getWeekNumber(now);
                        isNew = lastWeek !== currentWeek || lastSeen.getFullYear() !== now.getFullYear();
                    } else {
                        isNew = lastSeen.getMonth() !== now.getMonth() || lastSeen.getFullYear() !== now.getFullYear();
                    }
                }

                if (isNew) {
                    updates[type] = {
                        count: (typeStats.count || 0) + 1,
                        last_seen: now.toISOString()
                    };
                    needsUpdate = true;
                    seenUpdateRef.current[type] = seedDateStr;

                    // Queue for challenge_history tracking
                    historyInserts.push({
                        couple_id: couple.id,
                        challenge_type: type as 'daily' | 'weekly' | 'monthly',
                        activity_id: currentChallenge.id,
                        period_key: getPeriodKey(type, now)
                    });
                }
            };

            await checkType('daily', daily, new Date().toDateString());
            await checkType('weekly', weekly, `W${getWeekNumber(new Date())} `);
            await checkType('monthly', monthly, `M${new Date().getMonth()} `);

            // Update legacy challenge_stats (for backwards compatibility)
            if (needsUpdate) {
                const newStats = { ...stats, ...updates };
                await supabase.from('couples').update({ challenge_stats: newStats }).eq('id', couple.id);
            }

            // Insert into challenge_history (upsert to handle conflicts)
            if (historyInserts.length > 0) {
                for (const insert of historyInserts) {
                    await supabase
                        .from('challenge_history')
                        .upsert(insert, { onConflict: 'couple_id,challenge_type,period_key', ignoreDuplicates: true });
                }
            }
        };

        updateSeen();
    }, [couple, daily, weekly, monthly]);


    // Helper to find relevant memory
    const findMemory = (memories: any[], challenge: Challenge | null, type: 'daily' | 'weekly' | 'monthly') => {
        if (!challenge) return null;
        const { start, end } = getDateRange(type);
        return memories.find((m: any) =>
            m.title === challenge.title &&
            m.created_at >= start &&
            m.created_at <= end
        ) || null;
    };

    // Derived Memories
    const myDailyMemory = findMemory(myMemories, daily, 'daily');
    const myWeeklyMemory = findMemory(myMemories, weekly, 'weekly');
    const myMonthlyMemory = findMemory(myMemories, monthly, 'monthly');

    const partnerDailyMemory = findMemory(partnerMemories, daily, 'daily');
    const partnerWeeklyMemory = findMemory(partnerMemories, weekly, 'weekly');
    const partnerMonthlyMemory = findMemory(partnerMemories, monthly, 'monthly');

    // Status Derivation Helper
    const deriveStatus = (myMem: any, partnerMem: any, challenge: Challenge | null, agreement: 'agreed' | 'disagreed' | 'pending' | 'none'): ChallengeStatus => {
        const mySkipped = myMem?.metadata?.skipped;
        const partnerSkipped = partnerMem?.metadata?.skipped;

        if (mySkipped || partnerSkipped) return 'skipped';

        // If I completed it...
        if (myMem) {
            // ...and partner didn't -> Waiting for partner
            if (!partnerMem) return 'waiting_for_partner';

            // ...and partner did:
            // If it's a competition and we haven't agreed -> Pending/Waiting
            if (challenge?.isCompetition && agreement !== 'agreed') {
                return 'pending_agreement';
            }

            // Otherwise, we're both done and agreed (or non-comp)
            return 'completed';
        }

        // I haven't completed it, so it's active
        return 'active';
    };

    const dailyStatus = deriveStatus(myDailyMemory, partnerDailyMemory, daily, winnerAgreement.daily);
    const weeklyStatus = deriveStatus(myWeeklyMemory, partnerWeeklyMemory, weekly, winnerAgreement.weekly);
    const monthlyStatus = deriveStatus(myMonthlyMemory, partnerMonthlyMemory, monthly, winnerAgreement.monthly);

    // Check Partner Completion & Sync My Memories
    const checkPartnerCompletion = useCallback(async () => {
        if (!currentUser) return;

        if (!couple) {
            setLoadingPartner(false);
            return;
        }

        let partnerId: string | null = couple.user_one_id === currentUser.id ? couple.user_two_id : couple.user_one_id;
        if (partnerId === currentUser.id) partnerId = null;

        try {
            const partnerQuery = partnerId
                ? supabase
                    .from('memories')
                    .select('title, created_at, metadata')
                    .eq('couple_id', couple.id)
                    .eq('uploader_id', partnerId)
                    .eq('type', 'challenge')
                : Promise.resolve({ data: [], error: null });

            const myQuery = supabase
                .from('memories')
                .select('id, title, created_at, metadata')
                .eq('couple_id', couple.id)
                .eq('uploader_id', currentUser.id)
                .eq('type', 'challenge');

            // Parallel Execution
            const [{ data: pMemories, error: pError }, { data: mMemories, error: mError }] = await Promise.all([partnerQuery, myQuery]);

            if (pError) throw pError;
            if (mError) throw mError;

            // Set Partner Memories
            setPartnerMemories(pMemories || []);

            // Set My Memories with Zombie Protection
            setMyMemories(prev => {
                const newMemories = mMemories || [];

                // Filter out zombies (items we know we just deleted but DB still returned)
                const safeNewMemories = newMemories.filter(m => !recentlyDeletedIds.current.has(m.id));

                // Preserve optimistic updates (temp ids) if not yet present in fetched data
                const optimisticMemories = prev.filter(m => m.id.toString().startsWith('temp-'));
                const combined = [...safeNewMemories];

                optimisticMemories.forEach(opt => {
                    const exists = safeNewMemories.some(real =>
                        real.title === opt.title &&
                        (real.metadata as any)?.challenge_type === opt.metadata?.challenge_type
                    );
                    if (!exists) {
                        combined.push(opt);
                    }
                });

                return combined;
            });

            if (mMemories) {
                // Authoritative Sync: Rebuild history from DB to ensure consistency (handles deletions/desyncs)
                // Also filter zombies here
                const safeHistoryMemories = mMemories.filter(m => !recentlyDeletedIds.current.has(m.id));

                const dbHistory = safeHistoryMemories.map((mem: any) => ({
                    id: mem.id,
                    title: mem.title,
                    date: mem.created_at,
                    type: mem.metadata?.challenge_type || 'daily',
                    metadata: mem.metadata
                }));

                // Sort by date descending
                dbHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setHistory(dbHistory);
                localStorage.setItem('challenge_history', JSON.stringify(dbHistory));
            }

        } catch (err) {
            logger.error('ChallengeContext', 'Error checking partner completion', err);
        } finally {
            setLoadingPartner(false);
        }
    }, [couple, currentUser]);

    // Channel Ref to allow sending broadcasts
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!couple) return;

        // Fetch immediately
        checkPartnerCompletion();

        // Setup Channel
        const channelName = `partner-challenges-${couple.id}`;
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        let debounceTimer: ReturnType<typeof setTimeout>;

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
                    // Replication Lag Protection:
                    // If we receive a DELETE event for my own memory, track it!
                    // Though usually we initiate the delete, sometimes it might come from another device
                    if (payload.eventType === 'DELETE' && payload.old && (payload.old as any).uploader_id === currentUser?.id) {
                        addToRecentlyDeleted((payload.old as any).id);
                    }

                    // Debounce the refresh to prevent "flash" from double events
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        checkPartnerCompletion();
                    }, 500);
                }
            )
            .on('broadcast', { event: 'challenge_update' }, () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    checkPartnerCompletion();
                }, 500);
            })
            .subscribe(() => {
                //
            });

        // 30s polling fallback for reliability
        const pollingId: ReturnType<typeof setInterval> = setInterval(() => {
            checkPartnerCompletion();
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollingId);
            clearTimeout(debounceTimer);
            channelRef.current = null;
        };

    }, [couple, checkPartnerCompletion, currentUser, addToRecentlyDeleted]);

    // Agreement Logic
    useEffect(() => {
        const calculateAgreement = (challenge: Challenge | null, myMem: any, partnerMem: any) => {
            if (!challenge || !challenge.isCompetition) return 'none';
            if (!myMem && !partnerMem) return 'none';
            if (myMem && !partnerMem) {
                return 'pending';
            }
            if (!myMem || !partnerMem) return 'pending';

            const mySelection = myMem.metadata?.winner_selection;
            const partnerSelection = partnerMem.metadata?.winner_selection;

            if (!mySelection && !partnerSelection) return 'agreed';
            if (!mySelection || !partnerSelection) return 'pending';

            if (mySelection === 'tie' && partnerSelection === 'tie') return 'agreed';
            if (mySelection === 'me' && partnerSelection === 'partner') return 'agreed';
            if (mySelection === 'partner' && partnerSelection === 'me') return 'agreed';

            return 'disagreed';
        };

        setWinnerAgreement({
            daily: calculateAgreement(daily, myDailyMemory, partnerDailyMemory),
            weekly: calculateAgreement(weekly, myWeeklyMemory, partnerWeeklyMemory),
            monthly: calculateAgreement(monthly, myMonthlyMemory, partnerMonthlyMemory)
        });

    }, [
        daily, weekly, monthly,
        myDailyMemory, myWeeklyMemory, myMonthlyMemory,
        partnerDailyMemory, partnerWeeklyMemory, partnerMonthlyMemory
    ]);


    const markChallengeConfettiSeen = useCallback(async (challengeId: string) => {
        if (!couple?.id || !userProfile?.id) return;

        try {
            const { data: latestCouple } = await supabase
                .from('couples')
                .select('challenge_stats')
                .eq('id', couple.id)
                .single();

            if (!latestCouple) return;

            const stats = (latestCouple.challenge_stats as any) || {};
            const celebrated = stats.celebrated_history || {};
            const challengedCelebratedUsers = celebrated[challengeId] || [];

            if (challengedCelebratedUsers.includes(userProfile.id)) return;

            const newCelebratedUsers = [...challengedCelebratedUsers, userProfile.id];
            const newStats = {
                ...stats,
                celebrated_history: {
                    ...celebrated,
                    [challengeId]: newCelebratedUsers
                }
            };

            await supabase
                .from('couples')
                .update({ challenge_stats: newStats })
                .eq('id', couple.id);

        } catch (e) {
            logger.error('ChallengeContext', 'Error marking confetti seen', e);
        }
    }, [couple?.id, userProfile?.id]);

    const completeChallenge = async (type: 'daily' | 'weekly' | 'monthly', file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => {
        if (isCompleting) return;
        setIsCompleting(true);

        const challenge = type === 'daily' ? daily : type === 'weekly' ? weekly : monthly;
        if (!challenge) {
            setIsCompleting(false);
            return;
        }

        const existingMemory = findMemory(myMemories, challenge, type);

        try {
            if (existingMemory) {
                // UPDATE existing memory
                const updatedMetadata = {
                    ...existingMemory.metadata,
                    ...(winnerSelection ? { winner_selection: winnerSelection } : {}),
                    is_competition: !!challenge.isCompetition
                };

                // Optimistic update
                const updatedMemories = myMemories.map(m => m.id === existingMemory.id ? { ...m, metadata: updatedMetadata } : m);
                setMyMemories(updatedMemories);

                // Update History
                const updatedHistory = history.map(h => h.id === existingMemory.id ? { ...h, metadata: updatedMetadata } : h);
                setHistory(updatedHistory);
                localStorage.setItem('challenge_history', JSON.stringify(updatedHistory));

                if (couple && currentUser) {
                    const { error } = await supabase.from('memories')
                        .update({ metadata: updatedMetadata })
                        .eq('id', existingMemory.id);
                    if (error) throw error;
                }
            } else {
                // INSERT new memory - Optimistic
                const tempId = 'temp-' + Date.now();
                const newEntry = {
                    id: tempId,
                    title: challenge.title,
                    date: new Date().toISOString(),
                    type,
                    metadata: { winner_selection: winnerSelection }
                };

                const updatedHistory = [newEntry, ...history];
                setHistory(updatedHistory);
                localStorage.setItem('challenge_history', JSON.stringify(updatedHistory));

                setMyMemories(prev => [...prev, { ...newEntry, created_at: newEntry.date }]);

                if (couple && currentUser) {
                    let mediaUrl: string | null = null;
                    let uploadedFilePath: string | null = null;

                    if (file) {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${couple.id}/challenges/${Date.now()}.${fileExt}`;
                        uploadedFilePath = fileName; // Track for cleanup on failure

                        const { error: uploadError } = await supabase.storage.from('memories').upload(fileName, file);
                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(fileName);
                        mediaUrl = publicUrl;
                    }

                    const partnerMem = type === 'daily' ? partnerDailyMemory : type === 'weekly' ? partnerWeeklyMemory : partnerMonthlyMemory;
                    const isPartnerDone = !!partnerMem;

                    const metadata = {
                        ...(winnerSelection ? { winner_selection: winnerSelection } : {}),
                        ...(isPartnerDone ? { confetti_shown: true } : {}),
                        challenge_type: type,
                        frequency: type,
                        is_competition: !!challenge.isCompetition,
                        completed_count: isPartnerDone ? 2 : 1
                    };

                    const { error: dbError } = await supabase.from('memories').insert({
                        couple_id: couple.id,
                        uploader_id: currentUser.id,
                        type: 'challenge',
                        title: challenge.title,
                        challenge_id: challenge.id,
                        caption: challenge.description,
                        media_url: mediaUrl,
                        created_at: new Date().toISOString(),
                        metadata
                    }).select();

                    if (dbError) {
                        // Rollback upload if DB failed
                        if (uploadedFilePath) {
                            await supabase.storage.from('memories').remove([uploadedFilePath]);
                        }
                        throw dbError;
                    }

                    // Broadcast update to partner
                    if (channelRef.current) {
                        await channelRef.current.send({
                            type: 'broadcast',
                            event: 'challenge_update',
                            payload: { type: type, action: 'complete', timestamp: Date.now() }
                        });
                    }

                    // Update challenge_history to mark as completed or partially_completed
                    const isFullyCompleted = !!partnerMem;
                    const status = isFullyCompleted ? 'completed' : 'partially_completed' as const;
                    const periodKey = getPeriodKey(type, new Date());

                    await supabase
                        .from('challenge_history')
                        .upsert({
                            couple_id: couple.id,
                            challenge_type: type,
                            activity_id: challenge.id,
                            period_key: periodKey,
                            status: status,
                            completed_at: isFullyCompleted ? new Date().toISOString() : null
                        }, { onConflict: 'couple_id,challenge_type,period_key' });

                    // Immediately check partner status in case we missed an event
                    checkPartnerCompletion();
                }
            }
        } catch (error) {
            logger.error('ChallengeContext', 'Error saving challenge', error);
            // Rollback optimistic update
            // Ideally we'd remove the temp memory here if it was a new insert
            checkPartnerCompletion(); // Force re-sync
        } finally {
            setIsCompleting(false);
        }
    };

    const undoChallenge = async (type: 'daily' | 'weekly' | 'monthly') => {
        if (isUndoing) return;
        setIsUndoing(true);

        const challenge = type === 'daily' ? daily : type === 'weekly' ? weekly : monthly;
        if (!challenge) {
            setIsUndoing(false);
            return;
        }

        const { start, end } = getDateRange(type);

        // Find memories to delete to track them
        const memoriesToDelete = myMemories.filter(m =>
            m.title === challenge.title &&
            m.created_at >= start &&
            m.created_at <= end
        );

        // ZOMBIE PROTECTION: Add to recently deleted immediately
        memoriesToDelete.forEach(m => addToRecentlyDeleted(m.id));

        // Optimistic UI Update - Remove immediately
        const updatedHistory = history.filter(h => !(h.title === challenge.title && h.type === type));
        setHistory(updatedHistory);
        localStorage.setItem('challenge_history', JSON.stringify(updatedHistory));

        setMyMemories(prev => prev.filter(m => !(
            m.title === challenge.title &&
            m.created_at >= start &&
            m.created_at <= end
        )));

        if (couple && currentUser) {
            try {
                const myMem = type === 'daily' ? myDailyMemory : type === 'weekly' ? myWeeklyMemory : myMonthlyMemory;
                const partnerMem = type === 'daily' ? partnerDailyMemory : type === 'weekly' ? partnerWeeklyMemory : partnerMonthlyMemory;

                const isSkipped = myMem?.metadata?.skipped || partnerMem?.metadata?.skipped;

                if (isSkipped) {
                    window.dispatchEvent(new CustomEvent('couplelink:expect-refund'));

                    await supabase.rpc('unskip_challenge' as any, {
                        p_couple_id: couple.id,
                        p_title: challenge.title,
                        p_type: type,
                        p_start_date: start,
                        p_end_date: end
                    });
                } else {
                    const { data: memories } = await supabase.from('memories').select('id, media_url').eq('couple_id', couple.id).eq('uploader_id', currentUser.id).eq('type', 'challenge').eq('title', challenge.title).gte('created_at', start).lte('created_at', end);

                    if (memories?.length) {
                        for (const m of memories) {
                            if (m.media_url) {
                                const path = m.media_url.split('/memories/')[1];
                                if (path) await supabase.storage.from('memories').remove([path]);
                            }
                        }
                        await supabase.from('memories').delete().in('id', memories.map(m => m.id));
                    }
                }

                // Handle challenge_history status reversal
                const isPartnerStillDone = !!partnerMem;
                const periodKey = getPeriodKey(type, new Date());

                if (isPartnerStillDone) {
                    // Revert to partially_completed because partner is still done
                    await supabase
                        .from('challenge_history')
                        .update({
                            status: 'partially_completed' as const,
                            completed_at: null
                        })
                        .eq('couple_id', couple.id)
                        .eq('challenge_type', type)
                        .eq('period_key', periodKey);
                } else {
                    // Revert to shown (or remove) because nobody is done anymore
                    await supabase
                        .from('challenge_history')
                        .update({
                            status: 'shown' as const,
                            completed_at: null
                        })
                        .eq('couple_id', couple.id)
                        .eq('challenge_type', type)
                        .eq('period_key', periodKey);
                }

                if (channelRef.current) {
                    await channelRef.current.send({
                        type: 'broadcast',
                        event: 'challenge_update',
                        payload: { type: type, action: 'undo', timestamp: Date.now() }
                    });

                    await channelRef.current.send({
                        type: 'broadcast',
                        event: 'token_refund',
                        payload: { timestamp: Date.now() }
                    });
                }

                // Allow some time for propagation before verifying
                setTimeout(checkPartnerCompletion, 500);

            } catch (error) {
                logger.error('ChallengeContext', 'Error undoing challenge', error);
                // On error, we should probably re-fetch to restore state if it failed
                checkPartnerCompletion();
            } finally {
                setIsUndoing(false);
            }
        } else {
            setIsUndoing(false);
        }
    };

    const skipChallenge = async (type: 'daily' | 'weekly' | 'monthly') => {
        if (!couple || !currentUser) return;
        const challenge = type === 'daily' ? daily : type === 'weekly' ? weekly : monthly;
        if (!challenge) return;

        try {
            const { data: success } = await supabase.rpc('use_rain_check_token' as any, { p_couple_id: couple.id });
            if (!success) return;

            const newEntry = {
                id: 'skipped-' + Date.now(),
                title: challenge.title,
                date: new Date().toISOString(),
                type,
                metadata: { skipped: true }
            };
            const updatedHistory = [newEntry, ...history];
            setHistory(updatedHistory);
            localStorage.setItem('challenge_history', JSON.stringify(updatedHistory));

            setMyMemories(prev => [...prev, { ...newEntry, created_at: newEntry.date }]);

            await supabase.from('memories').insert({
                couple_id: couple.id,
                uploader_id: currentUser.id,
                type: 'challenge',
                title: challenge.title,
                caption: 'Skipped with Rain Check Token',
                created_at: new Date().toISOString(),
                metadata: { skipped: true, challenge_type: type }
            });

        } catch (error) {
            logger.error('ChallengeContext', 'Error skipping challenge', error);
            checkPartnerCompletion();
        }
    };

    // Reset challenge cycle (clears cooloff for a frequency)
    const resetCycle = async (type: 'daily' | 'weekly' | 'monthly') => {
        logger.debug('ChallengeContext', 'resetCycle started', { type });
        if (!couple) {
            logger.error('ChallengeContext', 'resetCycle aborted: no couple found');
            return;
        }

        try {
            logger.debug('ChallengeContext', 'Calling reset_challenge_cycle RPC');
            const { data, error } = await (supabase.rpc as any)('reset_challenge_cycle', {
                couple_id_input: couple.id,
                frequency_input: type
            });

            if (error) {
                logger.error('ChallengeContext', 'resetCycle RPC error', error);
            }

            logger.debug('ChallengeContext', 'resetCycle RPC response', data);

            if (data?.success) {
                logger.debug('ChallengeContext', 'resetCycle succeeded. Fetching pool status');
                // Refetch pool status
                const { data: poolData, error: poolError } = await (supabase.rpc as any)('get_challenge_pool_status', { couple_id_input: couple.id });

                if (poolError) {
                    logger.error('ChallengeContext', 'resetCycle pool status error', poolError);
                }
                logger.debug('ChallengeContext', 'resetCycle new pool status', poolData);

                if (poolData?.success && poolData.data) {
                    setPoolStatus(poolData.data as PoolStatus);
                }
                // Trigger refetch of challenges by refreshing couple data
                logger.debug('ChallengeContext', 'resetCycle refreshing couple data');
                await refreshCoupleData();
                logger.debug('ChallengeContext', 'resetCycle refresh complete');
            } else {
                logger.warn('ChallengeContext', 'resetCycle backend reported failure', data);
            }
        } catch (error) {
            logger.error('ChallengeContext', 'resetCycle exception', error);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const endOfDay = new Date(now); endOfDay.setUTCHours(23, 59, 59, 999);
            const diffDaily = endOfDay.getTime() - now.getTime();

            const endOfWeek = new Date(now);
            const day = endOfWeek.getUTCDay();
            const diffToSunday = day === 0 ? 0 : 7 - day;
            endOfWeek.setUTCDate(now.getUTCDate() + diffToSunday);
            endOfWeek.setUTCHours(23, 59, 59, 999);
            const diffWeekly = endOfWeek.getTime() - now.getTime();

            const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            const diffMonthly = endOfMonth.getTime() - now.getTime();

            setTimeLeft({
                daily: formatTime(diffDaily),
                weekly: formatTime(diffWeekly),
                monthly: formatTime(diffMonthly),
                dailyUrgent: diffDaily < 3600000,
                weeklyUrgent: diffWeekly < 86400000,
                monthlyUrgent: diffMonthly < 172800000
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const value = useMemo(() => ({
        daily,
        weekly,
        monthly,
        dailyTimeLeft: timeLeft.daily,
        weeklyTimeLeft: timeLeft.weekly,
        monthlyTimeLeft: timeLeft.monthly,
        dailyTimeUrgent: timeLeft.dailyUrgent,
        weeklyTimeUrgent: timeLeft.weeklyUrgent,
        monthlyTimeUrgent: timeLeft.monthlyUrgent,
        dailyStatus,
        weeklyStatus,
        monthlyStatus,
        myDailyMemory,
        myWeeklyMemory,
        myMonthlyMemory,
        partnerDailyMemory,
        partnerWeeklyMemory,
        partnerMonthlyMemory,
        history,
        completeChallenge,
        undoChallenge,
        skipChallenge,
        loadingPartner,
        winnerAgreement,
        markChallengeConfettiSeen,
        couple,
        refreshCoupleData,
        loadingChallenges,
        poolStatus,
        resetCycle,
        isCompleting,
        isUndoing
    }), [
        daily,
        weekly,
        monthly,
        timeLeft.daily,
        timeLeft.weekly,
        timeLeft.monthly,
        timeLeft.dailyUrgent,
        timeLeft.weeklyUrgent,
        timeLeft.monthlyUrgent,
        dailyStatus,
        weeklyStatus,
        monthlyStatus,
        myDailyMemory,
        myWeeklyMemory,
        myMonthlyMemory,
        partnerDailyMemory,
        partnerWeeklyMemory,
        partnerMonthlyMemory,
        history,
        completeChallenge,
        undoChallenge,
        skipChallenge,
        loadingPartner,
        winnerAgreement,
        markChallengeConfettiSeen,
        couple,
        refreshCoupleData,
        loadingChallenges,
        poolStatus,
        resetCycle,
        isCompleting,
        isUndoing
    ]);

    return (
        <ChallengeContext.Provider value={value}>
            {children}
        </ChallengeContext.Provider>
    );
};

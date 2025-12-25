import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCoupleData } from './useCoupleData';
import type { Challenge } from '../types/challenge';


import { formatTime, getWeekNumber, getDateRange } from '../utils/dateUtils';


export type ChallengeStatus = 'locked' | 'active' | 'completed' | 'skipped' | 'waiting_for_partner' | 'pending_agreement';

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
    completeChallenge: (type: 'daily' | 'weekly' | 'monthly', file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => void;
    undoChallenge: (type: 'daily' | 'weekly' | 'monthly') => void;
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
}

export const useChallenges = (): ChallengeState => {
    // Raw State
    const [myMemories, setMyMemories] = useState<any[]>([]);
    const [partnerMemories, setPartnerMemories] = useState<any[]>([]);
    const [history, setHistory] = useState<Array<{ id: string; title: string; date: string; type: 'daily' | 'weekly' | 'monthly'; metadata?: any }>>([]);
    const [loadingPartner, setLoadingPartner] = useState(true);
    const [loadingChallenges, setLoadingChallenges] = useState(true);
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

    const { couple, currentUser, userProfile, refreshCoupleData } = useCoupleData();

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

    // Selection Logic (Deterministic based on date - UTC)
    // Filter out completed challenges


    // Fetch Active Challenges from DB
    useEffect(() => {
        if (!couple || !currentUser) return;

        const fetchChallenges = async () => {
            try {
                // Fetch Daily Challenge
                const { data: dailyData, error: dailyError } = await supabase.rpc('get_active_challenge' as any, {
                    couple_id_input: couple.id,
                    frequency_input: 'daily'
                }) as any;

                if (dailyError) throw dailyError;
                if (dailyData && dailyData.success) {
                    setDaily({
                        id: dailyData.data.id,
                        type: 'daily',
                        title: dailyData.data.title,
                        description: dailyData.data.description,
                        durationMinutes: dailyData.data.durationMinutes,
                        category: dailyData.data.category,
                        isCompetition: dailyData.data.isCompetition
                    });
                }

                // Fetch Weekly Challenge
                const { data: weeklyData, error: weeklyError } = await supabase.rpc('get_active_challenge' as any, {
                    couple_id_input: couple.id,
                    frequency_input: 'weekly'
                }) as any;

                if (weeklyError) throw weeklyError;
                if (weeklyData && weeklyData.success) {
                    setWeekly({
                        id: weeklyData.data.id,
                        type: 'weekly',
                        title: weeklyData.data.title,
                        description: weeklyData.data.description,
                        durationMinutes: weeklyData.data.durationMinutes,
                        category: weeklyData.data.category,
                        isCompetition: weeklyData.data.isCompetition
                    });
                }

                // Fetch Monthly Challenge
                const { data: monthlyData, error: monthlyError } = await supabase.rpc('get_active_challenge' as any, {
                    couple_id_input: couple.id,
                    frequency_input: 'monthly'
                }) as any;

                if (monthlyError) throw monthlyError;
                if (monthlyData && monthlyData.success) {
                    setMonthly({
                        id: monthlyData.data.id,
                        type: 'monthly',
                        title: monthlyData.data.title,
                        description: monthlyData.data.description,
                        durationMinutes: monthlyData.data.durationMinutes,
                        category: monthlyData.data.category,
                        isCompetition: monthlyData.data.isCompetition
                    });
                }

            } catch (error) {
                console.error('Error fetching active challenges:', error);
            } finally {
                setLoadingChallenges(false);
            }
        };

        fetchChallenges();
    }, [couple, currentUser]);

    // Seen Count Logic
    const seenUpdateRef = useRef<{ daily: string | null, weekly: string | null, monthly: string | null }>({ daily: null, weekly: null, monthly: null });

    useEffect(() => {
        if (!couple || !couple.challenge_stats) return;

        const updateSeen = async () => {
            const stats = (couple.challenge_stats as any) || {};
            const updates: any = {};
            let needsUpdate = false;

            const checkType = (type: 'daily' | 'weekly' | 'monthly', currentChallenge: Challenge | null, seedDateStr: string) => {
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
                }
            };

            checkType('daily', daily, new Date().toDateString());
            checkType('weekly', weekly, `W${getWeekNumber(new Date())} `);
            checkType('monthly', monthly, `M${new Date().getMonth()} `);

            if (needsUpdate) {
                const newStats = { ...stats, ...updates };
                await supabase.from('couples').update({ challenge_stats: newStats }).eq('id', couple.id);
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

    useEffect(() => {
    }, [myDailyMemory, partnerDailyMemory]);

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
        if (!couple || !currentUser) return;

        let partnerId: string | null = couple.user_one_id === currentUser.id ? couple.user_two_id : couple.user_one_id;
        if (partnerId === currentUser.id) partnerId = null;

        if (!partnerId) {
            setLoadingPartner(false);
            return;
        }

        try {
            const { data: pMemories, error } = await supabase
                .from('memories')
                .select('title, created_at, metadata')
                .eq('couple_id', couple.id)
                .eq('uploader_id', partnerId)
                .eq('type', 'challenge');

            if (error) throw error;
            setPartnerMemories(pMemories || []);

            const { data: mMemories, error: myError } = await supabase
                .from('memories')
                .select('id, title, created_at, metadata')
                .eq('couple_id', couple.id)
                .eq('uploader_id', currentUser.id)
                .eq('type', 'challenge');

            if (myError) throw myError;

            setMyMemories(prev => {
                const newMemories = mMemories || [];

                // Preserve optimistic updates (temp ids) if not yet present in fetched data
                const optimisticMemories = prev.filter(m => m.id.toString().startsWith('temp-'));

                const combined = [...newMemories];

                optimisticMemories.forEach(opt => {
                    // Check if this optimistic memory is already represented in the new data (by title and approximate time)
                    // We assume title + type is unique enough for the active window
                    const exists = newMemories.some(real =>
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
                const dbHistory = mMemories.map((mem: any) => ({
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
            console.error('Error checking partner completion:', err);
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
                    // Handle DELETE events
                    if (payload.eventType === 'DELETE') {
                        checkPartnerCompletion();
                        return;
                    }

                    const record = (payload.new || payload.old) as any;
                    if (record?.type === 'challenge') {
                        checkPartnerCompletion();
                    }
                }
            )
            .on('broadcast', { event: 'challenge_update' }, () => {
                checkPartnerCompletion();
            })
            .subscribe(() => {
                //
            });

        // 30s polling fallback for reliability
        const pollingId = setInterval(() => {
            checkPartnerCompletion();
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollingId);
            channelRef.current = null;
        };

    }, [couple, checkPartnerCompletion]);

    // Agreement Logic
    useEffect(() => {
        const calculateAgreement = (challenge: Challenge | null, myMem: any, partnerMem: any) => {
            if (!challenge || !challenge.isCompetition) return 'none';
            if (!myMem && !partnerMem) return 'none';
            if (myMem && !partnerMem) {
                return 'pending'; // Changed from 'waiting_for_partner' to 'pending' to match existing logic
            }
            if (!myMem || !partnerMem) return 'pending';

            const mySelection = myMem.metadata?.winner_selection;
            const partnerSelection = partnerMem.metadata?.winner_selection;

            if (!mySelection && !partnerSelection) return 'agreed'; // Both completed without selection (shouldn't happen for comp)
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
            // 1. Fetch latest couple data to get current stats (concurrency safe-ish)
            const { data: latestCouple } = await supabase
                .from('couples')
                .select('challenge_stats')
                .eq('id', couple.id)
                .single();

            if (!latestCouple) return;

            const stats = (latestCouple.challenge_stats as any) || {};
            const celebrated = stats.celebrated_history || {};
            const challengedCelebratedUsers = celebrated[challengeId] || [];

            // 2. If already celebrated by me, do nothing
            if (challengedCelebratedUsers.includes(userProfile.id)) return;

            // 3. Add me to the list
            const newCelebratedUsers = [...challengedCelebratedUsers, userProfile.id];
            const newStats = {
                ...stats,
                celebrated_history: {
                    ...celebrated,
                    [challengeId]: newCelebratedUsers
                }
            };

            // 4. Update DB
            await supabase
                .from('couples')
                .update({ challenge_stats: newStats })
                .eq('id', couple.id);

            // Optimistic update if needed, but context subscription handles it usually.
            // But we might want to force a refresh if the context doesn't pick it up fast enough?
            // Realtime usually handles it.

        } catch (e) {
            console.error('Error marking confetti seen:', e);
        }
    }, [couple?.id, userProfile?.id]);

    const completeChallenge = async (type: 'daily' | 'weekly' | 'monthly', file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => {
        const challenge = type === 'daily' ? daily : type === 'weekly' ? weekly : monthly;
        if (!challenge) return;


        const existingMemory = findMemory(myMemories, challenge, type);

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
                try {
                    const { error } = await supabase.from('memories')
                        .update({ metadata: updatedMetadata })
                        .eq('id', existingMemory.id);
                    if (error) throw error;
                } catch (error) {
                    console.error('Error updating challenge:', error);
                }
            }
        } else {
            // INSERT new memory
            const newEntry = {
                id: 'temp-' + Date.now(),
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
                try {
                    let mediaUrl: string | null = null;
                    // console.log('Starting completion. File:', file ? file.name : 'None');

                    if (file) {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${couple.id}/challenges/${Date.now()}.${fileExt}`;

                        const { error: uploadError } = await supabase.storage.from('memories').upload(fileName, file);
                        if (uploadError) {
                            console.error('Upload Error:', uploadError);
                            throw uploadError;
                        }

                        const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(fileName);
                        mediaUrl = publicUrl;
                    }

                    const partnerMem = type === 'daily' ? partnerDailyMemory : type === 'weekly' ? partnerWeeklyMemory : partnerMonthlyMemory;
                    const isPartnerDone = !!partnerMem;

                    const metadata = {
                        ...(winnerSelection ? { winner_selection: winnerSelection } : {}),
                        ...(isPartnerDone ? { confetti_shown: true } : {}),
                        challenge_type: type,
                        is_competition: !!challenge.isCompetition
                    };

                    const { error: dbError } = await supabase.from('memories').insert({
                        couple_id: couple.id,
                        uploader_id: currentUser.id,
                        type: 'challenge',
                        title: challenge.title,
                        challenge_id: challenge.id, // Add challenge_id
                        caption: challenge.description,
                        media_url: mediaUrl,
                        created_at: new Date().toISOString(),
                        metadata
                    }).select();

                    if (dbError) {
                        console.error('DB Insert Error:', dbError);
                        throw dbError;
                    }
                    // console.log('Memory inserted successfully:', insertedMemory);

                    // Broadcast update to partner
                    if (channelRef.current) {
                        await channelRef.current.send({
                            type: 'broadcast',
                            event: 'challenge_update',
                            payload: { type: type, action: 'complete', timestamp: Date.now() }
                        });
                    }

                    // Immediately check partner status in case we missed an event
                    checkPartnerCompletion();

                } catch (error) {
                    console.error('Error saving challenge:', error);
                }
            }
        }
    };

    const undoChallenge = async (type: 'daily' | 'weekly' | 'monthly') => {
        const challenge = type === 'daily' ? daily : type === 'weekly' ? weekly : monthly;
        if (!challenge) return;

        const updatedHistory = history.filter(h => !(h.title === challenge.title && h.type === type));
        setHistory(updatedHistory);
        localStorage.setItem('challenge_history', JSON.stringify(updatedHistory));

        const { start, end } = getDateRange(type);
        setMyMemories(prev => prev.filter(m => !(
            m.title === challenge.title &&
            m.created_at >= start &&
            m.created_at <= end
        )));

        if (couple && currentUser) {
            try {
                const { start, end } = getDateRange(type);
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

                // Broadcast the update to the partner
                if (channelRef.current) {
                    await channelRef.current.send({
                        type: 'broadcast',
                        event: 'challenge_update',
                        payload: { type: type, action: 'undo', timestamp: Date.now() }
                    });

                    // ALSO Broadcast a refund event so the partner doesn't get a "Token Earned" modal
                    await channelRef.current.send({
                        type: 'broadcast',
                        event: 'token_refund',
                        payload: { timestamp: Date.now() }
                    });
                }

                // Refresh my own state cleanly from DB as well
                checkPartnerCompletion();

            } catch (error) {
                console.error('Error undoing challenge:', error);
            }
        }
    };

    const skipChallenge = async (type: 'daily' | 'weekly' | 'monthly') => {
        if (!couple || !currentUser) return;
        const challenge = type === 'daily' ? daily : type === 'weekly' ? weekly : monthly;
        if (!challenge) return;

        try {
            const { data: success } = await supabase.rpc('use_rain_check_token' as any, { p_couple_id: couple.id });
            if (!success) return;

            // Note: refreshCoupleData() removed - CoupleContext realtime will automatically
            // update the couple state when rain_check_tokens changes in the database

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
            console.error('Error skipping:', error);
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

    return {
        daily,
        weekly,
        monthly,
        dailyTimeLeft: timeLeft.daily, weeklyTimeLeft: timeLeft.weekly, monthlyTimeLeft: timeLeft.monthly,
        dailyTimeUrgent: timeLeft.dailyUrgent, weeklyTimeUrgent: timeLeft.weeklyUrgent, monthlyTimeUrgent: timeLeft.monthlyUrgent,

        dailyStatus, weeklyStatus, monthlyStatus,

        myDailyMemory, myWeeklyMemory, myMonthlyMemory,
        partnerDailyMemory, partnerWeeklyMemory, partnerMonthlyMemory,

        history,
        completeChallenge, undoChallenge, skipChallenge,
        loadingPartner, winnerAgreement,
        markChallengeConfettiSeen,
        couple, refreshCoupleData,
        loadingChallenges
    };
};



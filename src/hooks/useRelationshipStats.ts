import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { useCoupleData } from '@/hooks/useCoupleData'

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface JournalEntry {
    uploader_id: string;
    created_at: string;
}

interface UserAnswer {
    activity_id: string;
    created_at: string;
    user_id: string;
}

interface ChallengeMemory {
    metadata: {
        challenge_type?: 'daily' | 'weekly' | 'monthly' | 'question';
        skipped?: boolean;
        winner_selection?: 'me' | 'partner' | 'tie';
    } | null;
    created_at: string;
    uploader_id: string;
    title: string;
}

interface ChallengeHistoryEntry {
    challenge_type: string;
    status: string;
    shown_at: string;
}

interface LocationData {
    id: string;
    location: string | null;
    country: string | null;
    event_date?: string;
}

export interface RelationshipStats {
    daysTogether: number
    currentStreak: number
    totalLovePoints: number
    totalMemories: number
    totalJournalEntries: number
    journalByPerson: { name: string; value: number; avatar_url: string | null }[]
    challengeCompletion: {
        questions: { completed: number; possible: number; percentage: number }
        daily: { completed: number; possible: number; percentage: number }
        weekly: { completed: number; possible: number; percentage: number }
        monthly: { completed: number; possible: number; percentage: number }
    }
    challengeCompletion90: {
        questions: { completed: number; possible: number; percentage: number }
        daily: { completed: number; possible: number; percentage: number }
        weekly: { completed: number; possible: number; percentage: number }
        monthly: { completed: number; possible: number; percentage: number }
    }
    travelStats: {
        placesVisited: number;
        countriesVisited: number;
        topLocation: string;
        visitedCountries: string[]; // List of unique country names
    }
    funStats: {
        mostActiveDay: string
        timeOfDay: string
    }
    activityBreakdown: { name: string; value: number }[]
    leaderboard: {
        myScore: number
        partnerScore: number
        myWins: number
        partnerWins: number
        ties: number
    }
    lovePointsBreakdown: {
        dailyChallenges: number
        weeklyChallenges: number
        monthlyChallenges: number
        dailyQuestions: number
        positionsCompleted: number
        fantasiesCompleted: number
    }
    loading: boolean
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useRelationshipStats() {
    const { couple, userProfile, partner } = useCoupleData()
    const [stats, setStats] = useState<RelationshipStats | null>(null)
    const [loading, setLoading] = useState(true)
    const hasLoadedRef = useRef(false)

    const fetchStats = useCallback(async () => {
        if (!couple || !userProfile) return
        const stopPerf = logger.perf('useRelationshipStats', 'fetchStats')

        try {
            if (!hasLoadedRef.current) setLoading(true)

            // 1. Basic Stats
            const daysTogether = couple.anniversary_date
                ? Math.floor((new Date().getTime() - new Date(couple.anniversary_date).getTime()) / (1000 * 60 * 60 * 24))
                : 0

            // 2. Parallel queries (reduce total latency)
            const [
                journalRes,
                answersRes,
                challengeRes,
                positionsRes,
                fantasiesRes,
                historyRes,
                memoriesRes,
                eventsRes,
                stickyNotesRes,
                totalMemoriesRes,
            ] = await Promise.all([
                supabase
                    .from('memories')
                    .select('uploader_id, created_at')
                    .eq('couple_id', couple.id)
                    .eq('type', 'journal'),
                supabase
                    .from('user_answers')
                    .select('activity_id, created_at, user_id')
                    .eq('couple_id', couple.id),
                supabase
                    .from('memories')
                    .select('metadata, created_at, uploader_id, title')
                    .eq('couple_id', couple.id)
                    .eq('type', 'challenge'),
                supabase
                    .from('completed_positions')
                    .select('id', { count: 'exact', head: true })
                    .eq('couple_id', couple.id),
                supabase
                    .from('fantasy_bucket_list')
                    .select('id', { count: 'exact', head: true })
                    .eq('couple_id', couple.id)
                    .eq('status', 'completed'),
                supabase
                    .from('challenge_history')
                    .select('challenge_type, status, shown_at')
                    .eq('couple_id', couple.id),
                supabase
                    .from('memories')
                    .select('id, location, country')
                    .eq('couple_id', couple.id),
                supabase
                    .from('calendar_events')
                    .select('id, location, country, event_date')
                    .eq('couple_id', couple.id),
                supabase
                    .from('memories')
                    .select('id')
                    .eq('couple_id', couple.id)
                    .eq('type', 'sticky_note'),
                supabase
                    .from('memories')
                    .select('id', { count: 'exact', head: true })
                    .eq('couple_id', couple.id)
                    .neq('type', 'journal'),
            ])

            if (journalRes.error) throw journalRes.error
            if (answersRes.error) throw answersRes.error
            if (challengeRes.error) throw challengeRes.error
            if (positionsRes.error) throw positionsRes.error
            if (fantasiesRes.error) throw fantasiesRes.error
            if (historyRes.error) throw historyRes.error
            if (memoriesRes.error) throw memoriesRes.error
            if (eventsRes.error) throw eventsRes.error
            if (stickyNotesRes.error) throw stickyNotesRes.error
            if (totalMemoriesRes.error) throw totalMemoriesRes.error

            const journalEntries = journalRes.data as JournalEntry[] | null
            const userAnswers = answersRes.data as UserAnswer[] | null
            const challengeMemories = challengeRes.data as ChallengeMemory[] | null
            const positionsCompletedCount = positionsRes.count || 0
            const fantasiesCompletedCount = fantasiesRes.count || 0
            const challengeHistory = historyRes.data as ChallengeHistoryEntry[] | null
            const memories = memoriesRes.data as LocationData[] | null
            const events = eventsRes.data as LocationData[] | null
            const stickyNotes = stickyNotesRes.data
            const totalMemories = totalMemoriesRes.count || 0

            const myJournalCount = journalEntries?.filter(e => e.uploader_id === userProfile.id).length || 0
            const partnerJournalCount = journalEntries?.filter(e => e.uploader_id !== userProfile.id).length || 0

            const journalByPerson = [
                { name: 'You', value: myJournalCount, avatar_url: userProfile.avatar_url },
                { name: partner?.first_name || 'Partner', value: partnerJournalCount, avatar_url: partner?.avatar_url || null }
            ]

            // Calculate Active Days (days with any answer or challenge memory)
            const activeDates = new Set<string>()
            userAnswers?.forEach(a => activeDates.add(new Date(a.created_at).toDateString()))
            challengeMemories?.forEach(m => activeDates.add(new Date(m.created_at).toDateString()))
            const activeDaysCount = Math.max(1, activeDates.size)

            // Count unique questions answered
            const uniqueQuestionsAnswered = new Set(userAnswers?.map(a => a.activity_id)).size
            const possibleQuestions = activeDaysCount // Using active days as proxy for seen questions

            let completedDaily = 0
            let completedWeekly = 0
            let completedMonthly = 0

            // 90 Day Window Stats
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const ninetyDaysAgoTime = ninetyDaysAgo.getTime();

            let completedDaily90 = 0
            let completedWeekly90 = 0
            let completedMonthly90 = 0

            // Re-calculate unique questions for 90 days
            const uniqueQuestionsAnswered90 = new Set(
                userAnswers?.filter(a => new Date(a.created_at).getTime() > ninetyDaysAgoTime)
                    .map(a => a.activity_id)
            ).size

            // Leaderboard Stats Calculation
            let myScore = 0
            let partnerScore = 0
            let myWins = 0
            let partnerWins = 0
            let ties = 0

            // Group memories by title to find pairs
            const memoriesByTitle = new Map<string, ChallengeMemory[]>();
            challengeMemories?.forEach(m => {
                if (!memoriesByTitle.has(m.title)) {
                    memoriesByTitle.set(m.title, []);
                }
                memoriesByTitle.get(m.title)?.push(m);
            });

            memoriesByTitle.forEach((mems) => {
                // We expect at most 2 memories (one per user) for a given challenge title in the active period
                // But since we fetch all history, we might have multiple.
                // We should sort by date and take the latest pair or iterate through pairs.
                // For simplicity, let's assume unique titles for now or just process the latest pair.

                // Actually, let's just process all pairs we can find.
                // A better approach: Iterate through unique titles. For each title, check if there is a pair of memories
                // that are "agreed".

                const myMem = mems.find(m => m.uploader_id === userProfile.id);
                const partnerMem = mems.find(m => m.uploader_id !== userProfile.id);

                // Don't count skipped challenges for mastery or leaderboard
                if (myMem?.metadata?.skipped || partnerMem?.metadata?.skipped) return;

                if (myMem && partnerMem) {
                    const type = myMem.metadata?.challenge_type || 'daily';
                    const memDate = new Date(myMem.created_at).getTime();
                    const isRecent = memDate > ninetyDaysAgoTime;

                    if (type === 'daily') {
                        completedDaily++;
                        if (isRecent) completedDaily90++;
                    }
                    if (type === 'weekly') {
                        completedWeekly++;
                        if (isRecent) completedWeekly90++;
                    }
                    if (type === 'monthly') {
                        completedMonthly++;
                        if (isRecent) completedMonthly90++;
                    }
                }

                if (myMem && partnerMem) {
                    const mySelection = myMem.metadata?.winner_selection;
                    const partnerSelection = partnerMem.metadata?.winner_selection;

                    if (mySelection && partnerSelection) {
                        let agreed = false;
                        if (mySelection === 'tie' && partnerSelection === 'tie') agreed = true;
                        if (mySelection === 'me' && partnerSelection === 'partner') agreed = true;
                        if (mySelection === 'partner' && partnerSelection === 'me') agreed = true;

                        if (agreed) {
                            if (mySelection === 'tie') {
                                myScore += 1;
                                partnerScore += 1;
                                ties++;
                            } else if (mySelection === 'me') {
                                myScore += 2;
                                myWins++;
                            } else if (mySelection === 'partner') {
                                partnerScore += 2;
                                partnerWins++;
                            }
                        }
                    }
                }
            });

            // Calculate All-Time stats from challenge_history
            const historyByType = {
                daily: { possible: 0, completed: 0 },
                weekly: { possible: 0, completed: 0 },
                monthly: { possible: 0, completed: 0 },
                question: { possible: 0, completed: 0 }
            };

            if (challengeHistory) {
                challengeHistory.forEach(entry => {
                    const type = entry.challenge_type as 'daily' | 'weekly' | 'monthly' | 'question';
                    if (historyByType[type]) {
                        historyByType[type].possible++;
                        if (entry.status === 'completed') {
                            historyByType[type].completed++;
                        }
                    }
                });
            }

            // For All-Time: derived strictly from tracking history
            const possibleDaily = historyByType.daily.possible;
            const possibleWeekly = historyByType.weekly.possible;
            const possibleMonthly = historyByType.monthly.possible;
            // Use history for questions if available, fallback to legacy possibleQuestions
            const possibleQuestionsFromHistory = historyByType.question.possible > 0 ? historyByType.question.possible : possibleQuestions;

            const challengeCompletion = {
                questions: {
                    completed: historyByType.question.completed > 0 ? historyByType.question.completed : uniqueQuestionsAnswered,
                    possible: Math.max(uniqueQuestionsAnswered, possibleQuestionsFromHistory),
                    percentage: possibleQuestionsFromHistory > 0 ? Math.min(100, Math.round(((historyByType.question.completed > 0 ? historyByType.question.completed : uniqueQuestionsAnswered) / possibleQuestionsFromHistory) * 100)) : 0
                },
                daily: { completed: completedDaily, possible: Math.max(completedDaily, possibleDaily), percentage: possibleDaily > 0 ? Math.min(100, Math.round((completedDaily / possibleDaily) * 100)) : 0 },
                weekly: { completed: completedWeekly, possible: Math.max(completedWeekly, possibleWeekly), percentage: possibleWeekly > 0 ? Math.min(100, Math.round((completedWeekly / possibleWeekly) * 100)) : 0 },
                monthly: { completed: completedMonthly, possible: Math.max(completedMonthly, possibleMonthly), percentage: possibleMonthly > 0 ? Math.min(100, Math.round((completedMonthly / possibleMonthly) * 100)) : 0 }
            }

            // 90 Day Logic - Use challenge_history filtered by date
            const coupleCreatedAt = couple.created_at;
            const daysSinceStart = coupleCreatedAt
                ? Math.floor((new Date().getTime() - new Date(coupleCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
                : daysTogether;

            const windowDays = Math.min(90, Math.max(1, daysSinceStart));

            // Calculate 90-day stats from challenge_history
            const history90ByType = {
                daily: { possible: 0, completed: 0 },
                weekly: { possible: 0, completed: 0 },
                monthly: { possible: 0, completed: 0 },
                question: { possible: 0, completed: 0 }
            };

            if (challengeHistory) {
                challengeHistory.forEach(entry => {
                    const type = entry.challenge_type as 'daily' | 'weekly' | 'monthly' | 'question';
                    const shownAt = new Date(entry.shown_at);
                    if (shownAt.getTime() > ninetyDaysAgoTime && history90ByType[type]) {
                        history90ByType[type].possible++;
                        if (entry.status === 'completed') {
                            history90ByType[type].completed++;
                        }
                    }
                });
            }

            // For 90-day: derived strictly from tracking history
            const possibleDaily90 = history90ByType.daily.possible;
            const possibleWeekly90 = history90ByType.weekly.possible;
            const possibleMonthly90 = history90ByType.monthly.possible;
            // Use history for questions if available, fallback to calendar-based
            const possibleQuestions90FromHistory = history90ByType.question.possible > 0 ? history90ByType.question.possible : windowDays;

            const challengeCompletion90 = {
                questions: {
                    completed: history90ByType.question.completed > 0 ? history90ByType.question.completed : uniqueQuestionsAnswered90,
                    possible: Math.max(uniqueQuestionsAnswered90, possibleQuestions90FromHistory),
                    percentage: possibleQuestions90FromHistory > 0 ? Math.min(100, Math.round(((history90ByType.question.completed > 0 ? history90ByType.question.completed : uniqueQuestionsAnswered90) / possibleQuestions90FromHistory) * 100)) : 0
                },
                daily: { completed: completedDaily90, possible: Math.max(completedDaily90, possibleDaily90), percentage: possibleDaily90 > 0 ? Math.min(100, Math.round((completedDaily90 / possibleDaily90) * 100)) : 0 },
                weekly: { completed: completedWeekly90, possible: Math.max(completedWeekly90, possibleWeekly90), percentage: possibleWeekly90 > 0 ? Math.min(100, Math.round((completedWeekly90 / possibleWeekly90) * 100)) : 0 },
                monthly: { completed: completedMonthly90, possible: Math.max(completedMonthly90, possibleMonthly90), percentage: possibleMonthly90 > 0 ? Math.min(100, Math.round((completedMonthly90 / possibleMonthly90) * 100)) : 0 }
            }

            // 4. Travel Stats (Enhanced)
            const memoryLocations = (memories || [])
                .filter(m => m.location?.trim())
                .map(m => ({ location: m.location!.trim(), country: m.country, id: m.id, type: 'memory' }));

            const eventLocations = (events || [])
                .filter(e => {
                    const hasLocation = e.location?.trim();
                    const isPast = e.event_date ? new Date(e.event_date).getTime() < new Date().getTime() : false;
                    return hasLocation && isPast;
                })
                .map(e => ({ location: e.location!.trim(), country: e.country, id: e.id, type: 'event' }));

            const allLocations = [...memoryLocations, ...eventLocations];

            // 1. Calculate Places Visited (Cities/Venues) - Normalized to lowercase for better grouping
            const normalizedPlaces = allLocations.map(l => l.location.toLowerCase().trim());
            const uniquePlaces = new Set(normalizedPlaces);
            const placesVisited = uniquePlaces.size;

            // 2. Calculate Unique Countries
            const rawCountries = allLocations.map(l => l.country);
            const validCountries = rawCountries.filter((c): c is string => !!c && !!c.trim());
            const uniqueCountries = new Set(validCountries);
            const countriesVisited = uniqueCountries.size;

            // 3. Find Top Location (City level)
            const locationCounts: Record<string, number> = {};
            // Store display format mapping
            const displayNames: Record<string, string> = {};

            allLocations.forEach(l => {
                const normalizedLoc = l.location.toLowerCase().trim();
                locationCounts[normalizedLoc] = (locationCounts[normalizedLoc] || 0) + 1;
                // Keep the last seen display format (or first, doesn't matter much, last is fresher)
                if (!displayNames[normalizedLoc]) {
                    displayNames[normalizedLoc] = l.location.trim();
                }
            });

            let topLocation = 'None yet';
            let maxCount = 0;
            Object.entries(locationCounts).forEach(([loc, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topLocation = displayNames[loc] || loc; // Use the pretty version
                }
            });

            // --- BACKFILL LOGIC (Background) ---
            // Find items with location but NO country
            const itemsToBackfill = allLocations.filter(l => !l.country && l.location);
            if (itemsToBackfill.length > 0) {
                // Run asynchronously, don't block stats
                (async () => {
                    // Process a small batch to avoid rate limits (Nominatim is loose but polite is 1/s)
                    // We'll do 3 items per load to be safe and progressive
                    const batch = itemsToBackfill.slice(0, 3);
                    if (batch.length > 0) {
                        try {
                            const { resolveCountry } = await import('@/utils/geocoding');

                            for (const item of batch) {
                                const result = await resolveCountry(item.location);

                                if (result && result.country) {
                                    const table = item.type === 'memory' ? 'memories' : 'calendar_events';
                                    await supabase
                                        .from(table)
                                        .update({ country: result.country })
                                        .eq('id', item.id);

                                    // Polite delay
                                    await new Promise(r => setTimeout(r, 1100));
                                }
                            }
                        } catch (err) {
                            logger.error('useRelationshipStats', 'Travel stats backfill error', err);
                        }
                    }
                })();
            }

            const allTimestamps = [
                ...(journalEntries?.map(j => j.created_at) || []),
                ...(challengeMemories?.map(c => c.created_at) || [])
            ]

            const dayCounts = [0, 0, 0, 0, 0, 0, 0]
            const hourCounts = Array(24).fill(0)

            allTimestamps.forEach(ts => {
                const d = new Date(ts)
                dayCounts[d.getDay()]++
                hourCounts[d.getHours()]++
            })

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const mostActiveDayIndex = dayCounts.indexOf(Math.max(...dayCounts))
            const mostActiveDay = allTimestamps.length > 0 ? days[mostActiveDayIndex] : "TBD"

            const morning = hourCounts.slice(5, 12).reduce((a, b) => a + b, 0)
            const afternoon = hourCounts.slice(12, 18).reduce((a, b) => a + b, 0)
            const evening = hourCounts.slice(18, 23).concat(hourCounts.slice(0, 5)).reduce((a, b) => a + b, 0)

            let timeOfDay = "Balanced"
            if (morning > afternoon && morning > evening) timeOfDay = "Early Bird"
            else if (afternoon > morning && afternoon > evening) timeOfDay = "Afternoon Achiever"
            else if (evening > morning && evening > afternoon) timeOfDay = "Night Owl"
            if (allTimestamps.length === 0) timeOfDay = "TBD"

            // 6. Activity Breakdown (Real Data)
            const totalQuestions = uniqueQuestionsAnswered || 0;
            const totalChallenges = (completedDaily || 0) + (completedWeekly || 0) + (completedMonthly || 0);
            // Count past events as "Dates"
            const totalDates = events?.filter(e => e.event_date && new Date(e.event_date).getTime() < new Date().getTime()).length || 0;
            const totalJournal = journalEntries?.length || 0;

            // Count sticky notes (Notes)
            const totalNotes = stickyNotes?.length || 0;

            const rawActivityBreakdown = [
                { name: 'Deep Questions', value: totalQuestions },
                { name: 'Challenges', value: totalChallenges },
                { name: 'Dates', value: totalDates },
                { name: 'Journaling', value: totalJournal },
                { name: 'Notes', value: totalNotes },
            ]

            // Filter out categories with 0 value
            const activityBreakdown = rawActivityBreakdown.filter(item => item.value > 0)

            // Calculate completed questions (where both partners answered)
            const answersByActivity = new Map<string, Set<string>>();
            userAnswers?.forEach(a => {
                if (!answersByActivity.has(a.activity_id)) {
                    answersByActivity.set(a.activity_id, new Set());
                }
                if (a.user_id) {
                    answersByActivity.get(a.activity_id)!.add(a.user_id);
                }
            });
            const completedQuestionsCount = Array.from(answersByActivity.values()).filter(users => users.size >= 2).length;

            setStats({
                daysTogether,
                currentStreak: couple.current_streak || 0,
                totalMemories: totalMemories || 0,
                totalJournalEntries: journalEntries?.length || 0,
                journalByPerson,
                challengeCompletion,
                challengeCompletion90,
                leaderboard: { myScore, partnerScore, myWins, partnerWins, ties },
                totalLovePoints: couple.total_love_points || 0,
                travelStats: { placesVisited, countriesVisited, topLocation, visitedCountries: Array.from(uniqueCountries) },
                funStats: { mostActiveDay, timeOfDay },
                activityBreakdown,
                lovePointsBreakdown: {
                    dailyChallenges: completedDaily,
                    weeklyChallenges: completedWeekly,
                    monthlyChallenges: completedMonthly,
                    dailyQuestions: completedQuestionsCount,
                    positionsCompleted: positionsCompletedCount || 0,
                    fantasiesCompleted: fantasiesCompletedCount || 0,
                },
                loading: false
            })

        } catch (error) {
            logger.error('useRelationshipStats', 'Error fetching stats', error)
        } finally {
            setLoading(false)
            hasLoadedRef.current = true
            stopPerf()
        }
    }, [couple, userProfile, partner])

    useEffect(() => {
        if (couple && userProfile) {
            fetchStats()
        }
    }, [couple, userProfile, fetchStats])

    return { stats, loading, refreshStats: fetchStats }
}

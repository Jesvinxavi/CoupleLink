import Sidebar from "../components/Sidebar"
import { useCoupleData } from "../hooks/useCoupleData"

import { useStreak } from "../hooks/useStreak"
import { PartnerTile } from "../components/dashboard/PartnerTile"
import { PartnerNoteTile } from "../components/dashboard/PartnerNoteTile"
import { ChallengeSummaryTile } from "../components/dashboard/ChallengeSummaryTile"
import { QuickActionsTile } from "../components/dashboard/QuickActionsTile"
import { StreakBrokenModal } from "../components/dashboard/StreakBrokenModal"

import { StatOfTheDayTile } from "../components/dashboard/StatOfTheDayTile"
import { useRelationshipStats } from "../hooks/useRelationshipStats"
import { useChallenges } from "../hooks/useChallenges"
import { OnThisDayTile } from "../components/dashboard/OnThisDayTile"
import { StreakStatsTile } from "../components/dashboard/StreakStatsTile"
import { MilestoneTrackerTile } from "../components/dashboard/MilestoneTrackerTile"
import { SexplorationSummaryTile } from "../components/dashboard/SexplorationSummaryTile"
import { ChallengesTile } from "../components/dashboard/ChallengesTile"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { FoundArchivedSpaceModal } from "../components/ui/FoundArchivedSpaceModal"
import { PaywallModal } from "../components/ui/PaywallModal"
import { STORAGE_KEYS } from "../lib/constants"

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function Dashboard() {
    const { couple, partner, userProfile, loading } = useCoupleData()
    const { stats: relationshipStats, loading: statsLoading } = useRelationshipStats()
    const challenges = useChallenges()

    const {
        streakBroken,
        previousStreak,
        handleCloseStreakBroken,
        restoreStreak,
    } = useStreak()

    // Archive Restore State
    const [foundArchiveStats, setFoundArchiveStats] = useState<any>(null)
    const [foundArchiveId, setFoundArchiveId] = useState<string | null>(null)
    const [showArchiveModal, setShowArchiveModal] = useState(false)
    const [showPaywall, setShowPaywall] = useState(false)
    const [restoreLoading, setRestoreLoading] = useState(false)
    // const location = useLocation(); // Unused

    const checkArchivedSpace = async () => {
        // Only check if we are in a couple
        if (!couple || !userProfile?.couple_id) return;

        try {
            const { data, error } = await supabase.rpc('check_existing_archive_for_pair');
            if (error) throw error;

            if (data?.found) {
                setFoundArchiveStats(data.stats);
                setFoundArchiveId(data.archived_couple_id);
                // Also store expires_at properly (add it to stats or separate state? stats is simpler)
                setFoundArchiveStats(() => ({ ...data.stats, expires_at: (data as any).expires_at }));

                // Check if user has already dismissed it? 
                // For now, always show on load if found, as per requirement "pops up for both users when they first load"
                const dismissedId = sessionStorage.getItem(STORAGE_KEYS.DISMISSED_RESTORE_MODAL);

                if (dismissedId !== data.archived_couple_id) {
                    setShowArchiveModal(true);
                }
            } else {
                // Not found (maybe already restored or expired). Clear the dismissed flag so it doesn't persist inappropriately.
                // Useful if we just restored: Found becomes false.
                sessionStorage.removeItem(STORAGE_KEYS.DISMISSED_RESTORE_MODAL);
                // Dispatch event explicitly so Sidebar knows to check again and hide the pill
                window.dispatchEvent(new Event('restore_modal_dismissed'));

                setShowArchiveModal(false);
            }
        } catch (err) {
            console.error('Error checking archive:', err);
        }
    };

    // Effect to close modal if we detect we are joined to the very archive we found
    useEffect(() => {
        if (couple?.id && foundArchiveId && couple.id === foundArchiveId) {
            setShowArchiveModal(false);
            sessionStorage.removeItem('dismissed_restore_modal');
        }
    }, [couple?.id, foundArchiveId]);

    const handleRestoreArchive = async () => {
        if (!foundArchiveId) return;

        // Premium Check
        if (!userProfile?.is_premium) {
            setShowPaywall(true);
            return;
        }

        if (!foundArchiveId) {
            console.error('[DEBUG-RESTORE-ACTION] No foundArchiveId available');
            return;
        }

        setRestoreLoading(true); // Changed from setRestoring to setRestoreLoading
        try {
            console.log('[DEBUG-RESTORE-ACTION] Attempting restore with ID:', foundArchiveId);

            // Arguments must match the SQL function signature exactly
            const { data, error } = await supabase.rpc('restore_archived_and_delete_current', {
                archived_id: foundArchiveId
            });

            if (error) {
                console.error('[DEBUG-RESTORE-ACTION] RPC Error:', JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('[DEBUG-RESTORE-ACTION] Restore successful. RPC returned:', data);

            // Clear any dismissal flags
            sessionStorage.removeItem(STORAGE_KEYS.DISMISSED_RESTORE_MODAL);

            window.location.reload(); // Hard reload is safest to reset all state for the new couple ID

        } catch (err: any) {
            console.error('[DEBUG-RESTORE] Restore failed:', err);
            alert("Failed to restore: " + err.message);
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleDismissRestore = () => {
        setShowArchiveModal(false);
        if (foundArchiveId) {
            sessionStorage.setItem(STORAGE_KEYS.DISMISSED_RESTORE_MODAL, foundArchiveId);
        }
        // Trigger sidebar update? Sidebar needs to know.
        // We can use a custom event or context. simpler: sessionStorage is checked by Sidebar? 
        // Or we pass a signal. For now, just close. Sidebar "pill" logic is next task.
        window.dispatchEvent(new Event('restore_modal_dismissed'));
    };

    useEffect(() => {
        const handleOpenRequest = () => setShowArchiveModal(true);
        window.addEventListener('request_open_restore_modal', handleOpenRequest);
        return () => window.removeEventListener('request_open_restore_modal', handleOpenRequest);
    }, []);

    useEffect(() => {
        // Only run check if we have a couple ID and stats aren't loading
        if (couple?.id && !statsLoading) {
            checkArchivedSpace();
        }
    }, [couple?.id, statsLoading]); // Run when couple or stats loading changes


    if (!loading && (!couple || !userProfile?.couple_id)) {
        return (
            <>
                <Sidebar />
                <div className="pt-14 md:ml-[250px] md:pt-0">
                    <main className="p-8">
                        <div className="flex max-w-7xl flex-col mx-auto h-[80vh] justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-2">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-heading-dark">
                                        Welcome Back{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}
                                    </h1>
                                    <p className="text-body-soft text-lg max-w-md mx-auto">
                                        You are currently not in a space. Create one to invite your partner or join an existing one.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                                    <ChallengesTile
                                        dailyStatus={challenges.dailyStatus}
                                        dailyTimeLeft={challenges.dailyTimeLeft}
                                        dailyTimeUrgent={challenges.dailyTimeUrgent}
                                        daily={challenges.daily}
                                        weeklyStatus={challenges.weeklyStatus}
                                        weeklyTimeLeft={challenges.weeklyTimeLeft}
                                        weeklyTimeUrgent={challenges.weeklyTimeUrgent}
                                        weekly={challenges.weekly}
                                        monthlyStatus={challenges.monthlyStatus}
                                        monthlyTimeLeft={challenges.monthlyTimeLeft}
                                        monthlyTimeUrgent={challenges.monthlyTimeUrgent}
                                        monthly={challenges.monthly}
                                        myDailyMemory={challenges.myDailyMemory}
                                        myWeeklyMemory={challenges.myWeeklyMemory}
                                        myMonthlyMemory={challenges.myMonthlyMemory}
                                        partnerDailyMemory={challenges.partnerDailyMemory}
                                        partnerWeeklyMemory={challenges.partnerWeeklyMemory}
                                        partnerMonthlyMemory={challenges.partnerMonthlyMemory}
                                        markChallengeConfettiSeen={challenges.markChallengeConfettiSeen}
                                        completeChallenge={challenges.completeChallenge}
                                        undoChallenge={challenges.undoChallenge}
                                        skipChallenge={challenges.skipChallenge}
                                        loadingPartner={challenges.loadingPartner}
                                        winnerAgreement={challenges.winnerAgreement}
                                        couple={couple}
                                        userProfile={userProfile}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </main>
                </div>
            </>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="pt-14 md:ml-[250px] md:pt-0">
                <main className="p-4 md:p-8">
                    <div className="flex max-w-7xl flex-col mx-auto">
                        {/* Header */}
                        <motion.header
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between pt-4 md:pt-8 pb-6"
                        >
                            <h1 className="text-[1.75rem] md:text-3xl font-bold tracking-tight text-heading-dark">
                                Welcome Back{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}
                            </h1>
                        </motion.header>

                        {loading || statsLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
                            </div>
                        ) : (
                            /* Tiles Grid */
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6"
                            >
                                {/* Row 1: Partner | Streak | Journal/Note */}
                                <motion.div variants={item} className="md:col-span-4 h-full flex flex-col gap-4">
                                    <PartnerTile partner={partner} />
                                    <PartnerNoteTile partner={partner} />
                                </motion.div>
                                <motion.div variants={item} className="md:col-span-4 h-full">
                                    <StreakStatsTile
                                        currentStreak={couple?.current_streak ?? 0}
                                        longestStreak={couple?.longest_streak ?? 0}
                                    />
                                </motion.div>
                                <motion.div variants={item} className="md:col-span-4 h-full">
                                    <QuickActionsTile />
                                </motion.div>

                                {/* Row 2: Challenge Summary | Milestone */}
                                <motion.div variants={item} className="md:col-span-4 h-full">
                                    <ChallengeSummaryTile />
                                </motion.div>
                                <motion.div variants={item} className="md:col-span-8 h-full">
                                    <MilestoneTrackerTile />
                                </motion.div>

                                {/* Row 4: Stat of the Day | On This Day | Sexploration Summary */}
                                <motion.div variants={item} className="md:col-span-4 h-full">
                                    <StatOfTheDayTile stats={relationshipStats} />
                                </motion.div>
                                <motion.div variants={item} className="md:col-span-4 h-full">
                                    <OnThisDayTile />
                                </motion.div>
                                {couple?.spicy_mode && (
                                    <motion.div variants={item} className="md:col-span-4 h-full">
                                        <SexplorationSummaryTile />
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modals */}
            <StreakBrokenModal
                isOpen={streakBroken}
                onClose={handleCloseStreakBroken}
                onRestore={restoreStreak}
                tokensAvailable={couple?.rain_check_tokens ?? 0}
                previousStreak={previousStreak}
            />

            <FoundArchivedSpaceModal
                isOpen={showArchiveModal}
                stats={foundArchiveStats}
                onRestore={handleRestoreArchive}
                onDismiss={handleDismissRestore}
                loading={restoreLoading}
            />

            <PaywallModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                onUpgradeSuccess={() => {
                    // Auto-retry restore logic?
                    setShowPaywall(false);
                    handleRestoreArchive();
                }}
            />


        </>
    )
}

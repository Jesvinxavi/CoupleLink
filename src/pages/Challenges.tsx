import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import { useCoupleData } from "../hooks/useCoupleData"
import { useDailyChallenge } from "../hooks/useDailyChallenge"
import { useChallenges } from "../hooks/useChallenges"
import { useStreak } from "../hooks/useStreak"
import { ChallengeCard } from "../components/dashboard/ChallengeCard"
import { ChallengesTile } from "../components/dashboard/ChallengesTile"

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function Challenges() {
    const { couple, partner, userProfile, loading } = useCoupleData()
    const {
        activity,
        userAnswer,
        partnerAnswer,
        submitAnswer,
        markAnswerSeen,
        loading: challengeLoading
    } = useDailyChallenge(couple?.id ?? null)

    const challengesData = useChallenges()
    const { loadingChallenges } = challengesData

    const {
        checkStreakUpdate,
        addPoints
    } = useStreak()

    // Calculate notification state
    const isNewPartnerAnswer = !!(
        partnerAnswer &&
        partnerAnswer.answer_text && // Ensure it's a real answer
        (!userProfile?.last_seen_daily_question_at ||
            new Date(partnerAnswer.created_at!) > new Date(userProfile.last_seen_daily_question_at))
    );

    const handleSubmitAnswer = async (answer: string) => {
        await submitAnswer(answer)

        // If partner has already answered, this completes the daily question requirement
        // Award 1 point for both answering
        if (partnerAnswer) {
            await addPoints(1)
        }

        // Check if this completes the streak for the day
        await checkStreakUpdate()
    }

    const [forceLoading, setForceLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setForceLoading(false)
        }, 250)
        return () => clearTimeout(timer)
    }, [])

    return (
        <>
            <Sidebar />
            <div className="pt-14 md:ml-[250px] md:pt-0 min-h-screen bg-background">
                <main className="p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <motion.header
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-4 md:pt-8 mb-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-2xl">emoji_events</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Challenges</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Earn points and connect</p>
                                </div>
                            </div>
                        </motion.header>

                        {loading || forceLoading || loadingChallenges ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
                            </div>
                        ) : (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="flex flex-col gap-6"
                            >
                                {/* Today's Question - Full Width */}
                                <motion.div variants={item} className="w-full">
                                    <ChallengeCard
                                        activity={activity}
                                        userAnswer={userAnswer}
                                        partnerAnswer={partnerAnswer}
                                        onSubmit={handleSubmitAnswer}
                                        onMarkSeen={markAnswerSeen}
                                        isNewAnswer={isNewPartnerAnswer}
                                        loading={challengeLoading}
                                        partnerName={partner?.first_name || 'Partner'}
                                    />
                                </motion.div>

                                {/* Challenges Grid/List */}
                                <motion.div variants={item} className="w-full">
                                    <ChallengesTile {...challengesData} userProfile={userProfile} couple={couple} />
                                </motion.div>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}

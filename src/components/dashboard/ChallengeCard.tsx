// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { memo, useEffect, useState, type FormEvent } from "react"
import confetti from "canvas-confetti"
import { Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Database } from "@/lib/database.types"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
type Activity = Database["public"]["Tables"]["activities"]["Row"]
type UserAnswer = Database["public"]["Tables"]["user_answers"]["Row"]

interface ChallengeCardProps {
    activity: Activity | null
    userAnswer: UserAnswer | null
    partnerAnswer: UserAnswer | null
    onSubmit: (answer: string) => Promise<void>
    onMarkSeen?: () => Promise<void>
    isNewAnswer?: boolean
    loading: boolean
}

interface ChallengeContent {
    question: string
    options?: string[]
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
const ChallengeCard = memo(function ChallengeCard({
    activity,
    userAnswer,
    partnerAnswer,
    onSubmit,
    onMarkSeen,
    isNewAnswer,
    loading,
    partnerName = "Partner"
}: ChallengeCardProps & { partnerName?: string }) {
    const [answer, setAnswer] = useState("")
    const [submitting, setSubmitting] = useState(false)

    // Effect to mark as seen when revealed
    useEffect(() => {
        if (userAnswer && partnerAnswer && isNewAnswer && onMarkSeen) {
            // If both answered, it's revealed. If it's new, mark it seen!
            onMarkSeen()
        }
    }, [userAnswer, partnerAnswer, isNewAnswer, onMarkSeen])

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (loading) {
        // ... (rest of the file)
        return (
            <Card className="w-full h-64 animate-pulse bg-gray-100 dark:bg-gray-800 border-none rounded-3xl">
                <CardContent className="flex items-center justify-center h-full">
                    <span className="text-gray-400">Loading challenge...</span>
                </CardContent>
            </Card>
        )
    }

    if (!activity) {
        return (
            <Card className="w-full bg-white border-dashed border-2 border-gray-200 rounded-3xl shadow-sm">
                <CardContent className="flex items-center justify-center h-40">
                    <span className="text-gray-500">No active challenge for today.</span>
                </CardContent>
            </Card>
        )
    }

    const content = activity.content as unknown as ChallengeContent
    const hasUserAnswered = !!userAnswer
    const hasPartnerAnswered = !!partnerAnswer
    const isRevealed = hasUserAnswered && hasPartnerAnswered

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!answer.trim()) return

        setSubmitting(true)
        try {
            await onSubmit(answer)
            // If partner has already answered, this submission unlocks the card!
            if (partnerAnswer) {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ["#FF69B4", "#FFD700", "#FF4500"] // Celebration colors
                })
            }
        } finally {
            setSubmitting(false)
        }
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <Card className="w-full overflow-hidden border-none shadow-sm bg-white rounded-3xl h-full">
            <CardContent className="p-6">
                {/* Header Section */}
                <div className="mb-6">
                    <span className="text-xs font-bold tracking-wide text-rose-500 uppercase mb-1 block">
                        Today's Question
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                        {content.question}
                    </h2>
                </div>

                {/* Two Column Layout - Always 2 columns now */}
                <div className="grid grid-cols-2 gap-3">
                    {/* My Answer Section */}
                    <div className="flex flex-col">
                        <h3 className="text-[10px] md:text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">My Answer</h3>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 min-h-[80px] relative transition-all md:hover:shadow-md">
                            {hasUserAnswered ? (
                                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium break-words">
                                    {userAnswer.answer_text}
                                </p>
                            ) : (
                                <form onSubmit={handleSubmit} className="h-full flex flex-col">
                                    <textarea
                                        placeholder="Type answer..."
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        className="w-full flex-1 bg-transparent border-none focus:ring-0 resize-none text-gray-800 dark:text-gray-200 text-sm placeholder:text-gray-400 p-0 mb-1 leading-tight"
                                        disabled={submitting}
                                    />
                                    <div className="flex justify-end mt-auto">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="bg-rose-500 md:hover:bg-rose-600 text-white rounded-full px-3 h-7 text-[10px] font-bold"
                                            disabled={submitting || !answer.trim()}
                                        >
                                            {submitting ? "..." : "Send"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Partner's Answer Section */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <h3 className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide">Partner's Answer</h3>
                            {isNewAnswer && (
                                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
                                    New!
                                </span>
                            )}
                        </div>
                        <div className={`flex-1 rounded-xl p-3 min-h-[80px] flex items-center justify-center text-center relative transition-all md:hover:shadow-md ${isNewAnswer ? 'bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-200 dark:ring-rose-800' : 'bg-gray-50 dark:bg-gray-900'
                            }`}>
                            {isRevealed ? (
                                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium text-left w-full self-start break-words">
                                    {partnerAnswer.answer_text}
                                </p>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 gap-1.5">
                                    <Lock className="w-4 h-4 mb-0.5" />
                                    <p className="text-[10px] font-medium leading-tight max-w-[120px]">
                                        {hasPartnerAnswered
                                            ? `${partnerName} has answered! Answer to reveal.`
                                            : `Waiting for ${partnerName}...`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
})

export { ChallengeCard }

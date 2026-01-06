import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import type { Challenge } from "../../types/challenge"
import { X, Trophy, AlertTriangle, Clock, Timer, CheckCircle, Upload, AlertOctagon, RotateCcw, RefreshCw, Sparkles, PartyPopper } from "lucide-react"

interface ChallengeModalProps {
    isOpen: boolean
    onClose: () => void
    challenge?: Challenge | null
    timeLeft: string
    isUrgent: boolean
    isCompleted: boolean
    isPartnerCompleted?: boolean
    onComplete: (file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => void
    onUndo: () => void
    onSkip: () => void
    rainCheckTokens: number
    type: 'daily' | 'weekly' | 'monthly'
    winnerAgreement?: 'agreed' | 'disagreed' | 'pending' | 'none'
    isSkipped?: boolean
    initialSelection?: 'me' | 'partner' | 'tie'
    // New props for All Explored state
    isAllExplored?: boolean
    onReset?: () => void
    onUpgrade?: () => void
}

export function ChallengeOverlay({
    isOpen,
    onClose,
    challenge,
    timeLeft,
    isUrgent,
    isCompleted,
    isPartnerCompleted,
    onComplete,
    onUndo,
    onSkip,
    rainCheckTokens,
    winnerAgreement,
    type,
    isSkipped,
    initialSelection,
    isAllExplored,
    onReset,
    onUpgrade
}: ChallengeModalProps) {
    const [evidence, setEvidence] = useState<File | null>(null)
    const [winnerSelection, setWinnerSelection] = useState<'me' | 'partner' | 'tie' | null>(initialSelection || null)

    const isEvidenceMandatory = type === 'weekly' || type === 'monthly';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEvidence(e.target.files[0])
        }
    }

    // Robust Body Lock
    useEffect(() => {
        if (!isOpen) return;

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        return () => {
            const topStyle = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(topStyle || '0') * -1);
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                        style={{ touchAction: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    />

                    {/* Slide-up Panel */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
                        className="fixed inset-x-0 bottom-0 z-[61] outline-none overflow-hidden"
                        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        {/* The Skirt */}
                        <div
                            className="absolute top-full inset-x-0 h-[100vh] bg-white dark:bg-gray-900"
                            style={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        />

                        {/* Inner Content Container */}
                        <div className="flex flex-col w-full bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 rounded-t-[32px] overflow-hidden max-h-[90vh]">

                            {/* Header */}
                            <div className="flex flex-col px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                            <Trophy className="w-4 h-4 text-rose-500" />
                                        </div>
                                        <span className="text-sm font-bold text-rose-500 uppercase tracking-wider">{type} Challenge</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -mr-2"
                                    >
                                        <X className="w-6 h-6 text-gray-500" />
                                    </Button>
                                </div>

                            </div>

                            {/* Scrollable Content */}
                            <div
                                className="flex-1 overflow-y-auto px-6 pt-2 pb-6 scroll-smooth"
                                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                                onTouchMove={(e) => e.stopPropagation()}
                            >
                                {/* All Explored State */}
                                {isAllExplored ? (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                                            <PartyPopper className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            All {type.charAt(0).toUpperCase() + type.slice(1)} Challenges Explored!
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed max-w-[300px] mb-8">
                                            You've seen every {type} challenge we have. Reset the cycle to start fresh, or upgrade for more content!
                                        </p>

                                        <div className="w-full space-y-3">
                                            <Button
                                                onClick={() => {
                                                    onReset?.()
                                                    onClose()
                                                }}
                                                variant="outline"
                                                className="w-full h-14 text-lg font-bold rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                                            >
                                                <RefreshCw className="w-5 h-5 mr-2" />
                                                Reset Cycle
                                            </Button>

                                            <Button
                                                onClick={() => {
                                                    onUpgrade?.()
                                                    onClose()
                                                }}
                                                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800 text-white shadow-lg shadow-purple-500/20"
                                            >
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Get Premium
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                                            {challenge?.title}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                                            {challenge?.description}
                                        </p>

                                        {/* Meta Info */}
                                        <div className="flex flex-wrap gap-3 mb-6">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                                                <Timer className="w-4 h-4" />
                                                {challenge?.durationMinutes} mins
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300 capitalize">
                                                <span className="material-symbols-outlined text-sm">category</span>
                                                {challenge?.category}
                                            </div>
                                            {!isCompleted && !isSkipped && (
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    <Clock className="w-4 h-4" />
                                                    {timeLeft}
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Messages */}
                                        {!isCompleted && !isSkipped && isPartnerCompleted && (
                                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-3 border border-blue-100 dark:border-blue-800">
                                                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Partner has completed this challenge!</p>
                                            </div>
                                        )}

                                        {winnerAgreement === 'disagreed' && (
                                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-800">
                                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                                    Winner disagreement! Please verify who won.
                                                </p>
                                            </div>
                                        )}

                                        {winnerAgreement === 'pending' && isCompleted && (
                                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center gap-3 border border-yellow-100 dark:border-yellow-800">
                                                <Clock className="w-5 h-5 text-yellow-500 shrink-0" />
                                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Waiting for partner confirmation...</p>
                                            </div>
                                        )}

                                        {/* Winner Selection */}
                                        {((!isCompleted && !isSkipped) || winnerAgreement === 'disagreed') && challenge?.isCompetition && (
                                            <div className="mb-6 space-y-3">
                                                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                                                    Who won this challenge?
                                                </label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['me', 'partner', 'tie'].map((opt) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setWinnerSelection(opt as any)}
                                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all capitalize ${winnerSelection === opt
                                                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Evidence Upload */}
                                        {!isCompleted && !isSkipped && winnerAgreement !== 'disagreed' && (
                                            <div className="mb-6 space-y-3">
                                                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                                                    Upload Evidence {isEvidenceMandatory && <span className="text-red-500">*</span>}
                                                </label>
                                                <div className="flex items-center justify-center w-full">
                                                    <label htmlFor="evidence-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-2xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                                            {evidence ? (
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-full">{evidence.name}</p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload photo evidence</p>
                                                                </>
                                                            )}
                                                        </div>
                                                        <input
                                                            id="evidence-file"
                                                            type="file"
                                                            className="hidden"
                                                            onChange={handleFileChange}
                                                            accept="image/*"
                                                        />
                                                    </label>
                                                </div>
                                                {isEvidenceMandatory && !evidence && (
                                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                                        <AlertOctagon className="w-3 h-3" />
                                                        Photo evidence is required
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="h-8" />
                                    </>
                                )}
                            </div>

                            {/* Footer Actions - Only show when not AllExplored */}
                            {!isAllExplored && (
                                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky bottom-0 z-20 space-y-3">
                                    {/* Action Button */}
                                    {(isCompleted && !challenge?.isCompetition) ||
                                        (isCompleted && challenge?.isCompetition && winnerAgreement !== 'disagreed') ||
                                        isSkipped ? (
                                        <Button
                                            onClick={() => {
                                                onUndo()
                                                onClose()
                                            }}
                                            variant="outline"
                                            className="w-full h-14 text-lg font-bold rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                                        >
                                            <RotateCcw className="w-5 h-5 mr-2" />
                                            {isSkipped ? 'Unskip' : 'Undo Completion'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => {
                                                onComplete(evidence, winnerSelection || undefined)
                                                onClose()
                                            }}
                                            disabled={(challenge?.isCompetition && !winnerSelection) || (isEvidenceMandatory && !evidence && winnerAgreement !== 'disagreed')}
                                            className="w-full h-14 text-lg font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 disabled:shadow-none disabled:opacity-50"
                                        >
                                            {challenge?.isCompetition && winnerAgreement === 'disagreed' ? 'Update Winner' : 'Complete Challenge'}
                                        </Button>
                                    )}

                                    {/* Rain Check / Skip */}
                                    {!isCompleted && !isSkipped && (
                                        <Button
                                            onClick={() => {
                                                if (rainCheckTokens > 0) {
                                                    onSkip()
                                                    onClose()
                                                }
                                            }}
                                            disabled={rainCheckTokens <= 0}
                                            variant="ghost"
                                            className={`w-full h-12 rounded-xl border border-transparent ${rainCheckTokens > 0 ? 'text-purple-600 hover:bg-purple-50' : 'text-gray-400'}`}
                                        >
                                            {rainCheckTokens > 0 ? (
                                                <>
                                                    <span className="material-symbols-outlined mr-2 text-lg">umbrella</span>
                                                    Use Rain Check (Skip)
                                                </>
                                            ) : (
                                                "No Rain Checks Available"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

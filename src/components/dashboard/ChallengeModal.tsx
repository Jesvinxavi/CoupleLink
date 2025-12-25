import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import type { Challenge } from "../../types/challenge"

interface ChallengeModalProps {
    isOpen: boolean
    onClose: () => void
    challenge: Challenge
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
}

export function ChallengeModal({
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
    initialSelection
}: ChallengeModalProps) {
    const [evidence, setEvidence] = useState<File | null>(null)
    const [winnerSelection, setWinnerSelection] = useState<'me' | 'partner' | 'tie' | null>(initialSelection || null)

    const isEvidenceMandatory = type === 'weekly' || type === 'monthly';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEvidence(e.target.files[0])
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90%] sm:max-w-[425px] rounded-xl">
                <DialogHeader className="text-left">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold text-heading-dark">{challenge.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base text-body-soft mt-2 text-left">
                        {challenge.description}
                    </DialogDescription>

                    {/* Partner Completed Message */}
                    {!isCompleted && !isSkipped && isPartnerCompleted && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500 text-sm">check_circle</span>
                            <p className="text-xs font-medium text-blue-700">Partner has completed this challenge!</p>
                        </div>
                    )}

                    {/* Disagreement Warning */}
                    {winnerAgreement === 'disagreed' && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 border border-red-100">
                            <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
                            <p className="text-xs font-medium text-red-700">You and your partner disagreed on the winner. Please discuss and update!</p>
                        </div>
                    )}

                    {/* Pending Agreement Message */}
                    {winnerAgreement === 'pending' && isCompleted && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-lg flex items-center gap-2 border border-yellow-100">
                            <span className="material-symbols-outlined text-yellow-500 text-sm">hourglass_empty</span>
                            <p className="text-xs font-medium text-yellow-700">Waiting for partner to confirm the winner...</p>
                        </div>
                    )}
                </DialogHeader>

                <div className="py-4">
                    <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-body-soft">timer</span>
                            <span className="text-sm font-medium text-heading-dark">
                                Estimated time: {challenge.durationMinutes} mins
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-body-soft">category</span>
                            <span className="text-sm font-medium text-heading-dark capitalize">
                                {challenge.category}
                            </span>
                        </div>
                    </div>

                    {/* Winner Selection for Competitions */}
                    {((!isCompleted && !isSkipped) || winnerAgreement === 'disagreed') && challenge.isCompetition && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-heading-dark mb-3">
                                Who won this challenge?
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setWinnerSelection('me')}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${winnerSelection === 'me'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-body-soft border-gray-200 hover:border-gray-900/50'
                                        }`}
                                >
                                    Me
                                </button>
                                <button
                                    onClick={() => setWinnerSelection('partner')}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${winnerSelection === 'partner'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-body-soft border-gray-200 hover:border-gray-900/50'
                                        }`}
                                >
                                    Partner
                                </button>
                                <button
                                    onClick={() => setWinnerSelection('tie')}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${winnerSelection === 'tie'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-body-soft border-gray-200 hover:border-gray-900/50'
                                        }`}
                                >
                                    Tie
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Evidence Upload */}
                    {!isCompleted && !isSkipped && winnerAgreement !== 'disagreed' && (
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-heading-dark mb-2">
                                Upload Evidence {isEvidenceMandatory ? <span className="text-red-500">*</span> : '(Optional)'}
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {evidence ? (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                <p className="text-sm text-gray-500">{evidence.name}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-gray-400 text-3xl mb-2">cloud_upload</span>
                                                <p className="text-sm text-gray-500">Click to upload photo</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        id="dropzone-file"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </label>
                            </div>
                            {isEvidenceMandatory && !evidence && (
                                <p className="text-xs text-red-500 mt-1">Photo evidence is required for this challenge.</p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-end gap-2 flex-col sm:flex-row">
                    {!isCompleted && !isSkipped && (
                        <Button
                            onClick={() => {
                                onSkip()
                                onClose()
                            }}
                            variant="outline"
                            disabled={rainCheckTokens <= 0}
                            className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700 border-transparent"
                        >
                            <span className="material-symbols-outlined mr-2 text-lg">confirmation_number</span>
                            Use Rain Check
                        </Button>
                    )}

                    {(isCompleted && !challenge.isCompetition) || (isCompleted && challenge.isCompetition && winnerAgreement === 'agreed') || isSkipped ? (
                        <Button
                            onClick={() => {
                                onUndo()
                                onClose()
                            }}
                            variant="outline"
                            className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                        >
                            <span className="material-symbols-outlined mr-2 text-lg">undo</span>
                            {isSkipped ? 'Unskip' : 'Uncomplete'}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => {
                                onComplete(evidence, winnerSelection || undefined)
                                onClose()
                            }}
                            disabled={(challenge.isCompetition && !winnerSelection) || (isEvidenceMandatory && !evidence && winnerAgreement !== 'disagreed')}
                            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {challenge.isCompetition && winnerAgreement === 'disagreed' ? 'Update Selection' : 'Complete Challenge'}
                        </Button>
                    )}
                </DialogFooter>
                {!isCompleted && !isSkipped && (
                    <div className={`text-sm font-medium text-center ${isUrgent ? 'text-gray-900' : 'text-body-soft'}`}>
                        {timeLeft}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

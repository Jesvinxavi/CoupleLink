// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface StreakBrokenModalProps {
    isOpen: boolean
    onClose: () => void
    onRestore: () => void
    tokensAvailable: number
    previousStreak: number
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function StreakBrokenModal({ isOpen, onClose, onRestore, tokensAvailable, previousStreak }: StreakBrokenModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent overlayClassName="!z-[100]" className="!z-[100] sm:max-w-md rounded-3xl">
                <DialogHeader className="text-center items-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-gray-900">
                            heart_broken
                        </span>
                    </div>
                    <DialogTitle className="text-xl font-bold text-heading-dark">
                        Streak Broken!
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2 text-body-soft">
                        {tokensAvailable > 0 ? (
                            <>
                                You missed a day and lost your {previousStreak} day streak.
                                <br />
                                <span className="font-medium text-heading-dark mt-2 block">
                                    Use a Rain Check token to restore it?
                                </span>
                            </>
                        ) : (
                            <>
                                You missed a day and lost your {previousStreak} day streak.
                                <br />
                                Stay consistent to earn Rain Check tokens and protect your streak next time!
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col sm:justify-center gap-2 mt-4">
                    {tokensAvailable > 0 ? (
                        <>
                            <Button
                                onClick={onRestore}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full h-12"
                            >
                                <span className="material-symbols-outlined mr-2 text-lg">umbrella</span>
                                Use Rain Check ({tokensAvailable} left)
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full text-body-soft hover:text-heading-dark rounded-full"
                            >
                                No, start over
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={onClose}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full h-12"
                        >
                            Start Fresh
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

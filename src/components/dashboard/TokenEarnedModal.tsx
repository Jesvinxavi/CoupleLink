// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { INTERVALS } from "@/lib/constants"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface TokenEarnedModalProps {
    isOpen: boolean
    onClose: () => void
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function TokenEarnedModal({ isOpen, onClose }: TokenEarnedModalProps) {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose()
            }, INTERVALS.ANIMATION_LONG)
            return () => clearTimeout(timer)
        }
    }, [isOpen, onClose])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                overlayClassName=""
                className="sm:max-w-sm rounded-3xl border-none bg-transparent shadow-none p-0 flex flex-col items-center justify-center"
            >
                <div className="sr-only">
                    <p>You have earned a Rain Check token! Use it to skip a challenge or save your streak.</p>
                </div>
                <div className="relative flex flex-col items-center animate-in zoom-in duration-300" style={{ perspective: '1000px' }}>
                    {/* Spinning Coin Container */}
                    <div className="relative h-32 w-32 mb-8 animate-flip preserve-3d">
                        <div className="absolute inset-0 rounded-full bg-yellow-400 border-4 border-yellow-500 shadow-lg flex items-center justify-center backface-visible">
                            <div className="h-24 w-24 rounded-full border-2 border-yellow-300 flex items-center justify-center bg-yellow-400">
                                <span className="material-symbols-outlined text-5xl text-white drop-shadow-md">
                                    umbrella
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-4 duration-500 delay-150">
                        <p className="font-bold text-heading-dark text-lg text-center">
                            You've earned a Rain Check!
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

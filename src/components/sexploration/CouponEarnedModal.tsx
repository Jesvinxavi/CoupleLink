// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { Coupon } from "@/components/sexploration/Coupon"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface CouponEarnedModalProps {
    isOpen: boolean
    onClose: () => void
    onCollect: () => void
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function CouponEarnedModal({
    isOpen,
    onClose,
    onCollect
}: CouponEarnedModalProps) {
    useEffect(() => {
        if (isOpen) {
            // Trigger confetti
            const duration = 3 * 1000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 }

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min
            }

            const interval: ReturnType<typeof setInterval> = setInterval(() => {
                const timeLeft = animationEnd - Date.now()

                if (timeLeft <= 0) {
                    return clearInterval(interval)
                }

                const particleCount = 50 * (timeLeft / duration)

                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                })
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                })
            }, 250)

            return () => clearInterval(interval)
        }
    }, [isOpen])

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (!isOpen) return null

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-lg">
                        You've Earned a Coupon!
                    </h1>

                    {/* Bouncing Coupon */}
                    <motion.div
                        className="w-[400px] mb-8"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Coupon
                            title="Free Reign"
                            description="Redeem this for any pleasure of your choice! You have complete control."
                            isPreview={true}
                        />
                    </motion.div>

                    {/* Button */}
                    <button
                        onClick={onCollect}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-pink-500/40 transform transition-all hover:scale-105 active:scale-95 text-lg"
                    >
                        Select Coupon
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

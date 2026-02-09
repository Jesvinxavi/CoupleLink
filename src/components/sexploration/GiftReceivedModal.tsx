// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { motion, AnimatePresence } from "framer-motion"
import { type Coupon as CouponType } from "@/hooks/useCoupons"
import { Coupon } from "@/components/sexploration/Coupon"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface GiftReceivedModalProps {
    isOpen: boolean
    onClose: () => void
    coupon: CouponType
    onAccept?: () => void
    onSelectCoupon?: () => void // For Free Reign gifts
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function GiftReceivedModal({
    isOpen,
    onClose,
    coupon,
    onAccept,
    onSelectCoupon
}: GiftReceivedModalProps) {
    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (!isOpen || !coupon) return null

    const isFreeReign = coupon.title === "Free Reign" || coupon.title === "Free Reign Coupon"

    const handleAction = () => {
        if (isFreeReign && onSelectCoupon) {
            onSelectCoupon()
        } else if (onAccept) {
            onAccept()
        } else {
            onClose()
        }
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
                {/* Backdrop - only clickable for Free Reign gifts */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={isFreeReign ? onClose : undefined}
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
                        You've Been Gifted!
                    </h1>

                    {/* Bouncing Coupon - shows the actual gifted coupon */}
                    <motion.div
                        className="w-[400px] mb-8"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Coupon
                            title={coupon.title}
                            description={coupon.description}
                            isPreview={true}
                            isGift={true}
                        />
                    </motion.div>

                    {/* Button - different text based on coupon type */}
                    <button
                        onClick={handleAction}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-pink-500/40 transform transition-all hover:scale-105 active:scale-95 text-lg"
                    >
                        {isFreeReign ? "Select Coupon" : "Add to Wallet"}
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

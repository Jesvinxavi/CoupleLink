import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCoupons } from '../../hooks/useCoupons';
import { useCoupleContext } from '../../context/CoupleContext';
import { useSexplorationModals } from '../../context/SexplorationModalContext';

// import { GiftReceivedModal } from './GiftReceivedModal';
import { CouponEarnedModal } from './CouponEarnedModal';
import { CouponCollectionModal } from './CouponCollectionModal';
import { GiftCouponOverlay } from './GiftCouponOverlay';
import { Ticket, Gift, Wallet, PartyPopper } from 'lucide-react';

interface PleasureCouponsTileProps {
    initialOpenWallet?: boolean;
}

export function PleasureCouponsTile({ initialOpenWallet = false }: PleasureCouponsTileProps) {
    const { coupons, refreshCoupons, claimCoupon } = useCoupons();
    const { userProfile } = useCoupleContext();
    const { openWallet } = useSexplorationModals();

    // Modal States
    const [showEarnedModal, setShowEarnedModal] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);

    // Handle initial open wallet via effect if needed, or simple redirect if it was a prop used for deep linking
    if (initialOpenWallet) {
        // Since we changed to a page, we might want to redirect immediately if this prop is true
        // But for now let's just ignore it as it looks like it was for the modal
    }

    // Realtime subscription moved to CouponsContext for robust syncing and polling
    // No local subscription needed here anymore

    // Get stats
    const activeCoupons = coupons.filter(c =>
        (c.status === 'active' || !c.status) &&
        (!c.redeemed_at)
    );
    const activeCount = activeCoupons.length;
    const unclaimedCoupons = (userProfile as any)?.unclaimed_vouchers || 0;

    return (
        <>
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all h-full flex flex-col justify-between"
                whileHover={{ scale: 1.01 }}
            >
                {/* Header - Consistent with other tiles */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-pink-500 bg-pink-100 dark:bg-pink-900/30 w-10 h-10 flex items-center justify-center rounded-xl">
                        <Ticket className="w-5 h-5" />
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-sm">
                        Pleasure Coupons
                    </span>
                </div>

                {/* Body - Side by Side Action Buttons */}
                <div className="flex gap-3 flex-1">
                    {/* Wallet Button */}
                    <button
                        onClick={openWallet}
                        className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/10 hover:border-pink-200 dark:hover:border-pink-900/30 transition-all group"
                    >
                        <div className="mb-2 relative">
                            <Wallet className="w-6 h-6 text-gray-400 group-hover:text-pink-500 transition-colors" />
                            {activeCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                                </span>
                            )}
                        </div>
                        <span className="font-bold text-gray-700 dark:text-white text-sm">Your Wallet</span>
                        <span className="text-xs text-gray-400 mt-0.5">{activeCount} Active</span>
                    </button>

                    {/* Gift / Claim Button */}
                    {unclaimedCoupons > 0 ? (
                        <button
                            onClick={() => setShowEarnedModal(true)}
                            className="flex-1 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 flex flex-col items-center justify-center text-center text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.02] transition-all"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                                className="mb-2"
                            >
                                <PartyPopper className="w-6 h-6" />
                            </motion.div>
                            <span className="font-bold text-sm">Claim Reward</span>
                            <span className="text-pink-100 text-xs mt-0.5">{unclaimedCoupons} Pending</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowGiftModal(true)}
                            className="flex-1 bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all group"
                        >
                            <Gift className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-gray-800 dark:text-white text-sm">Send Gift</span>
                            <span className="text-xs text-rose-400/80 dark:text-rose-300/60 mt-0.5">Surprise Partner</span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Modals */}
            <CouponEarnedModal
                isOpen={showEarnedModal}
                onClose={async () => {
                    // User tapped backdrop - save as Free Reign coupon
                    try {
                        await claimCoupon({
                            id: 'free-reign-earned',
                            title: 'Free Reign',
                            description: 'Redeem this for any pleasure of your choice! You have complete control.',
                            category: 'fun',
                            intensity: 1,
                            icon: null
                        });
                        refreshCoupons();
                    } catch (err) {
                        console.error('Failed to create Free Reign coupon:', err);
                    }
                    setShowEarnedModal(false);
                }}
                onCollect={() => {
                    // Select Coupon button - open collection modal
                    setShowEarnedModal(false);
                    setShowCollectionModal(true);
                }}
            />

            <CouponCollectionModal
                isOpen={showCollectionModal}
                onClose={() => setShowCollectionModal(false)}
                onClaimSuccess={() => {
                    // Optional: Show success toast or re-open earned modal if more vouchers
                    // For now just close
                }}
            />

            <GiftCouponOverlay
                isOpen={showGiftModal}
                onClose={() => setShowGiftModal(false)}
                onGiftSuccess={() => {
                    // Refresh logic if needed
                }}
            />
        </>
    );
}

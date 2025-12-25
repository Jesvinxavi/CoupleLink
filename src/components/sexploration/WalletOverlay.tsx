import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Ticket, Zap, Frown, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useCoupons, type Coupon as CouponType } from '../../hooks/useCoupons';
import { Coupon } from './Coupon';
import { GiftReceivedModal } from './GiftReceivedModal';
import { CouponCollectionModal } from './CouponCollectionModal';

interface WalletOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WalletOverlay({ isOpen, onClose }: WalletOverlayProps) {
    const { coupons, activateCoupon, refreshCoupons } = useCoupons();
    const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');

    // Modal/Action states
    const [viewingGift, setViewingGift] = useState<CouponType | null>(null);
    const [convertingCoupon, setConvertingCoupon] = useState<CouponType | null>(null);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null);
    const [isActivating, setIsActivating] = useState(false);

    // Filter coupons
    const activatedCoupons = coupons.filter(c =>
        !!c.activated_at &&
        !c.redeemed_at &&
        (!c.expires_at || new Date(c.expires_at) > new Date())
    );

    const availableCoupons = coupons.filter(c =>
        !c.activated_at &&
        !c.redeemed_at &&
        (c.status === 'active' || !c.status)
    );

    const handleCouponClick = (coupon: CouponType) => {
        if (selectedCoupon?.id === coupon.id) {
            setSelectedCoupon(null);
        } else {
            setSelectedCoupon(coupon);
        }
    };

    const handleActivate = async (coupon: CouponType) => {
        setIsActivating(true);
        try {
            await activateCoupon(coupon.id);
            setSelectedCoupon(null);
            // Switch to active tab to show the newly activated coupon
            setActiveTab('active');
        } finally {
            setIsActivating(false);
        }
    };

    const handleConvert = (coupon: CouponType) => {
        setConvertingCoupon(coupon);
        setSelectedCoupon(null);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={onClose}
                        />

                        {/* Slide-up Panel */}
                        <motion.div
                            layout
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}

                            className="fixed inset-x-0 bottom-0 z-50 bg-rose-50 dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[calc(100dvh-70px)] flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-white dark:bg-gray-800 rounded-t-3xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                                        <Wallet className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Wallet</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage your coupons</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </Button>
                            </div>

                            {/* Tabs */}
                            <div className="px-6 pt-4 pb-2 bg-rose-50 dark:bg-gray-900 shrink-0">
                                <div className="flex p-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => setActiveTab('available')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'available'
                                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Ticket className="w-4 h-4" />
                                        Available
                                        <span className="bg-rose-200 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-[10px] px-1.5 py-0.5 rounded-md ml-1">
                                            {availableCoupons.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('active')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'active'
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Zap className="w-4 h-4" />
                                        Active
                                        <span className="bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] px-1.5 py-0.5 rounded-md ml-1">
                                            {activatedCoupons.length}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'available' ? (
                                        <motion.div
                                            key="available"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                                        >
                                            {availableCoupons.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                                                    {availableCoupons.map(coupon => {
                                                        const isSelected = selectedCoupon?.id === coupon.id;
                                                        const isFreeReign = coupon.title === 'Free Reign' || coupon.title === 'Free Reign Coupon';

                                                        return (
                                                            <div
                                                                key={coupon.id}
                                                                onClick={() => handleCouponClick(coupon)}
                                                                className="relative cursor-pointer transition-transform active:scale-[0.98] group"
                                                            >
                                                                {/* Selection Glow */}
                                                                {isSelected && (
                                                                    <div className="absolute -inset-1 bg-pink-500 rounded-2xl blur-sm opacity-40 animate-pulse" />
                                                                )}

                                                                {/* Coupon */}
                                                                <div className="relative h-full">
                                                                    <Coupon
                                                                        title={coupon.title}
                                                                        description={coupon.description}
                                                                        isGift={!!coupon.is_gift}
                                                                        isPreview={true}
                                                                        onViewGift={() => setViewingGift(coupon)}
                                                                    />

                                                                    {/* Overlay Button when selected */}
                                                                    {isSelected && (
                                                                        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/10 rounded-xl backdrop-blur-[1px]">
                                                                            <Button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (isFreeReign) {
                                                                                        handleConvert(coupon);
                                                                                    } else {
                                                                                        handleActivate(coupon);
                                                                                    }
                                                                                }}
                                                                                disabled={isActivating}
                                                                                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-6 py-4 rounded-xl shadow-xl shadow-pink-500/30 text-base transform hover:scale-105 transition-all"
                                                                            >
                                                                                {isActivating ? (
                                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                                ) : (
                                                                                    isFreeReign ? 'Select Reward' : 'Activate Now'
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <EmptyState
                                                    icon={<Frown className="w-8 h-8 text-gray-400" />}
                                                    title="No available coupons"
                                                    description="Earn points by completing challenges to unlock new coupons and spicy rewards!"
                                                />
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="active"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                                        >
                                            {activatedCoupons.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                                                    {activatedCoupons.map(coupon => (
                                                        <div key={coupon.id} className="h-full">
                                                            <Coupon
                                                                title={coupon.title}
                                                                description={coupon.description}
                                                                activatedAt={coupon.activated_at}
                                                                expiresAt={coupon.expires_at}
                                                                isGift={!!coupon.is_gift}
                                                                onViewGift={() => setViewingGift(coupon)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <EmptyState
                                                    icon={<Zap className="w-8 h-8 text-gray-400" />}
                                                    title="No active coupons"
                                                    description="Activate a coupon from the Available tab to start using it!"
                                                />
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Nested Modals */}
            {viewingGift && (
                <GiftReceivedModal
                    isOpen={!!viewingGift}
                    onClose={() => setViewingGift(null)}
                    coupon={viewingGift}
                />
            )}

            <CouponCollectionModal
                isOpen={!!convertingCoupon}
                onClose={() => setConvertingCoupon(null)}
                onClaimSuccess={() => {
                    refreshCoupons();
                    setConvertingCoupon(null);
                    // Switch to active if they just converted? or maybe standard earned modal handling
                }}
                mode="convert"
                targetCouponId={convertingCoupon?.id}
            />
        </>
    );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                {icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {description}
            </p>
        </div>
    );
}

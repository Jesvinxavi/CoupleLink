/* eslint-disable react-refresh/only-export-components, react-hooks/purity */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFantasyBucketList } from '@/hooks/useFantasyBucketList';
import { useSexploration } from '@/hooks/useSexploration';
import { WalletOverlay } from '@/components/sexploration/WalletOverlay';
import { PositionsOverlay } from '@/components/sexploration/PositionsOverlay';
import { FantasyBucketListOverlay } from '@/components/sexploration/FantasyBucketListOverlay';
import { GiftCouponOverlay } from '@/components/sexploration/GiftCouponOverlay';
import { useCoupleData } from '@/hooks/useCoupleData';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface SexplorationModalContextType {
    openWallet: () => void;
    openPositions: () => void;
    openFantasies: () => void;
    openGiftCoupon: () => void;
    isFantasyOpen: boolean;
    isFantasyFocused: boolean;
    setFantasyFocused: (focused: boolean) => void;
    isAnyOverlayOpen: boolean;
    lastSeenFantasyPending: number;
    lastSeenFantasyApproved: number;
    lastSeenFantasyCompleted: number;
    lastSeenCoupons: number;
    markFantasiesSeen: (status: 'pending' | 'approved' | 'completed') => void;

    // Sexploration Data Sharing
    completedPositions: string[];
    togglePositionComplete: (id: string) => Promise<void>;
    isPositionCompleted: (id: string) => boolean;
    isExplorationLoading: boolean;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const SexplorationModalContext = createContext<SexplorationModalContextType | null>(null);

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useSexplorationModals() {
    const context = useContext(SexplorationModalContext);
    if (!context) {
        throw new Error('useSexplorationModals must be used within SexplorationModalProvider');
    }
    return context;
}

interface SexplorationModalProviderProps {
    children: ReactNode;
}

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export function SexplorationModalProvider({ children }: SexplorationModalProviderProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Modal states
    const [showWallet, setShowWallet] = useState(false);
    const [showPositions, setShowPositions] = useState(false);
    const [showFantasies, setShowFantasies] = useState(false);
    const [showGiftCoupon, setShowGiftCoupon] = useState(false);
    const [isFantasyFocused, setFantasyFocused] = useState(false);

    // Seen States (from userProfile)
    const { userProfile, refreshCoupleData } = useCoupleData();

    // Fallback to Date.now() if not loaded yet, or 0 if null, but we'll handle checks gracefully
    const lastSeenFantasyPending = useMemo(() => userProfile?.last_seen_fantasy_pending
        ? new Date(userProfile.last_seen_fantasy_pending).getTime()
        : Date.now(), [userProfile?.last_seen_fantasy_pending]);

    const lastSeenFantasyApproved = useMemo(() => userProfile?.last_seen_fantasy_approved
        ? new Date(userProfile.last_seen_fantasy_approved).getTime()
        : Date.now(), [userProfile?.last_seen_fantasy_approved]);

    const lastSeenFantasyCompleted = useMemo(() => userProfile?.last_seen_fantasy_completed
        ? new Date(userProfile.last_seen_fantasy_completed).getTime()
        : Date.now(), [userProfile?.last_seen_fantasy_completed]);

    const lastSeenCoupons = useMemo(() => userProfile?.last_seen_coupons
        ? new Date(userProfile.last_seen_coupons).getTime()
        : Date.now(), [userProfile?.last_seen_coupons]);

    const markFantasiesSeen = useCallback(async (status: 'pending' | 'approved' | 'completed') => {
        if (!userProfile?.id) return;
        try {
            const now = new Date().toISOString();
            const column = status === 'pending' ? 'last_seen_fantasy_pending'
                : status === 'approved' ? 'last_seen_fantasy_approved'
                    : 'last_seen_fantasy_completed';

            await supabase
                .from('profiles')
                .update({ [column]: now } as Record<string, string>)
                .eq('id', userProfile.id);
            // Silent refresh
            refreshCoupleData(true);
        } catch (error) {
            logger.error('SexplorationModalContext', `Error updating ${status} last seen`, error);
        }
    }, [userProfile?.id, refreshCoupleData]);

    const updateLastSeenCoupons = useCallback(async () => {
        if (!userProfile?.id) return;
        try {
            const now = new Date().toISOString();
            await supabase
                .from('profiles')
                .update({ last_seen_coupons: now })
                .eq('id', userProfile.id);
            refreshCoupleData(true);
        } catch (error) {
            logger.error('SexplorationModalContext', 'Error updating last_seen_coupons', error);
        }
    }, [userProfile?.id, refreshCoupleData]);

    // Data for modals
    const { isPositionCompleted, togglePositionComplete, completedPositions, loading: explorationLoading } = useSexploration();
    const {
        fantasies,
        pendingCount,
        approvedCount,
        completedCount,
        loading: fantasyLoading,
        addFantasy,
        approveFantasy,
        vetoFantasy,
        deleteFantasy,
        completeFantasy,
        isRequester
    } = useFantasyBucketList();

    // Open modal and navigate to sexploration
    const openWithNavigation = useCallback((openFn: () => void) => {
        openFn();
        // Navigate after modal opens (while backdrop is blurring)
        setTimeout(() => {
            if (location.pathname !== '/sexploration') {
                navigate('/sexploration', { replace: true });
            }
        }, 100);
    }, [location.pathname, navigate]);

    const openWallet = useCallback(() => openWithNavigation(() => {
        setShowWallet(true);
        updateLastSeenCoupons();
    }), [openWithNavigation, updateLastSeenCoupons]);
    const openPositions = useCallback(() => openWithNavigation(() => setShowPositions(true)), [openWithNavigation]);
    const openFantasies = useCallback(() => openWithNavigation(() => {
        setShowFantasies(true);
        // Do NOT update timestamps here anymore; handled in Overlay tabs
    }), [openWithNavigation]);
    const openGiftCoupon = useCallback(() => openWithNavigation(() => {
        setShowGiftCoupon(true);
        // Maybe treat opening gift coupon as seeing coupons too? Or separate? 
        // User asked for "Vouchers available", which usually implies the Wallet. 
        // I'll stick to Wallet for now.
    }), [openWithNavigation]);

    const handleWalletClose = useCallback(() => setShowWallet(false), []);
    const handlePositionsClose = useCallback(() => setShowPositions(false), []);
    const handleFantasiesClose = useCallback(() => setShowFantasies(false), []);
    const handleGiftCouponClose = useCallback(() => setShowGiftCoupon(false), []);

    const isAnyOverlayOpen = showWallet || showPositions || showFantasies || showGiftCoupon;

    const contextValue = useMemo(() => ({
        openWallet,
        openPositions,
        openFantasies,
        openGiftCoupon,
        isFantasyOpen: showFantasies,
        isFantasyFocused,
        setFantasyFocused,
        isAnyOverlayOpen,
        lastSeenFantasyPending,
        lastSeenFantasyApproved,
        lastSeenFantasyCompleted,
        lastSeenCoupons,
        markFantasiesSeen,
        completedPositions,
        togglePositionComplete,
        isPositionCompleted,
        isExplorationLoading: explorationLoading
    }), [
        openWallet,
        openPositions,
        openFantasies,
        openGiftCoupon,
        showFantasies,
        isFantasyFocused,
        setFantasyFocused,
        isAnyOverlayOpen,
        lastSeenFantasyPending,
        lastSeenFantasyApproved,
        lastSeenFantasyCompleted,
        lastSeenCoupons,
        markFantasiesSeen,
        completedPositions,
        togglePositionComplete,
        isPositionCompleted,
        explorationLoading
    ]);

    return (
        <SexplorationModalContext.Provider value={contextValue}>
            {children}

            {/* Global Modals - persist across page navigation */}
            <WalletOverlay
                isOpen={showWallet}
                onClose={handleWalletClose}
            />

            <PositionsOverlay
                isOpen={showPositions}
                onClose={handlePositionsClose}
                isPositionCompleted={isPositionCompleted}
                togglePositionComplete={togglePositionComplete}
            />

            <FantasyBucketListOverlay
                isOpen={showFantasies}
                onClose={handleFantasiesClose}
                fantasies={fantasies}
                pendingCount={pendingCount}
                approvedCount={approvedCount}
                completedCount={completedCount}
                loading={fantasyLoading}
                addFantasy={addFantasy}
                approveFantasy={approveFantasy}
                vetoFantasy={vetoFantasy}
                deleteFantasy={deleteFantasy}
                completeFantasy={completeFantasy}
                isRequester={isRequester}
                onFocusChange={setFantasyFocused}
            />

            <GiftCouponOverlay
                isOpen={showGiftCoupon}
                onClose={handleGiftCouponClose}
                onGiftSuccess={() => {
                    // Optional: Refresh logic could go here if needed globally
                }}
            />
        </SexplorationModalContext.Provider>
    );
}

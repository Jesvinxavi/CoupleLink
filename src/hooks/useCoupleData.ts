import { useMemo } from 'react';
import { useCoupleContext } from '@/context/CoupleContext';
import { useAuth } from '@/context/AuthContext';

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
// Thin wrapper around CoupleContext with auth user included.
export const useCoupleData = () => {
    const { couple, partner, userProfile, loading, error, refreshCoupleData } = useCoupleContext();
    const { user: currentUser } = useAuth();

    return useMemo(() => ({
        couple,
        partner,
        userProfile,
        currentUser,
        loading,
        error,
        refreshCoupleData
    }), [couple, partner, userProfile, currentUser, loading, error, refreshCoupleData]);
};

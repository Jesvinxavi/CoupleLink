import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { STORAGE_KEYS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { useAuth } from './AuthContext';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
type Profile = Database['public']['Tables']['profiles']['Row'];

type CoupleData = Database['public']['Tables']['couples']['Row'];

interface CoupleContextType {
    couple: CoupleData | null;
    partner: Profile | null;
    userProfile: Profile | null;
    loading: boolean;
    error: string | null;
    refreshCoupleData: (silent?: boolean) => Promise<void>;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const PROFILE_FIELDS = [
    'id',
    'first_name',
    'last_name',
    'avatar_url',
    'birth_date',
    'timezone',
    'couple_id',
    'is_premium',
    'onboarding_completed',
    'notification_preferences',
    'competition_points',
    'unclaimed_vouchers',
    'last_seen_daily_question_at',
    'last_seen_rain_check_tokens',
    'last_seen_fantasies',
    'last_seen_fantasy_pending',
    'last_seen_fantasy_approved',
    'last_seen_fantasy_completed',
    'last_seen_coupons'
].join(', ');

const COUPLE_FIELDS = [
    'id',
    'invite_code',
    'user_one_id',
    'user_two_id',
    'status',
    'spicy_mode',
    'anniversary_date',
    'archived_at',
    'created_at',
    'current_streak',
    'longest_streak',
    'previous_streak',
    'daily_question_date',
    'daily_question_id',
    'last_activity_date',
    'rain_check_tokens',
    'total_love_points',
    'action_points',
    'challenge_stats'
].join(', ');

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export const CoupleProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const [couple, setCouple] = useState<CoupleData | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [partner, setPartner] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Refs to access latest state inside useEffect closures without re-subscribing
    const coupleRef = useRef<CoupleData | null>(null);
    const userProfileRef = useRef<Profile | null>(null);

    // Keep refs in sync
    useEffect(() => {
        coupleRef.current = couple;
        userProfileRef.current = userProfile;
    }, [couple, userProfile]);

    const fetchCoupleData = useCallback(async (silent = false) => {
        // Wait for auth to finish loading before deciding there's no user
        if (authLoading) {
            return;
        }

        if (!user) {
            setLoading(false);
            setCouple(null); // Ensure cleared
            return;
        }

        try {
            if (!silent) setLoading(true);
            // Parallel fetch for better performance
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(PROFILE_FIELDS)
                .eq('id', user.id)
                .single();

            if (profileError) {
                throw profileError;
            }
            setUserProfile(profileData);
            userProfileRef.current = profileData; // Update ref

            // Fetch couple data
            let coupleData: CoupleData | null = null;

            // STRATEGY 1: Trust the profile's couple_id if it exists
            if (profileData.couple_id) {
                const { data: specificCouple, error: specificError } = await supabase
                    .from('couples')
                    .select(COUPLE_FIELDS)
                    .eq('id', profileData.couple_id)
                    .eq('status', 'active') // Only fetch if active
                    .single();

                if (!specificError) {
                    coupleData = specificCouple;
                }
            }

            if (!coupleData) {
                setCouple(null);
                setPartner(null);
                coupleRef.current = null;
            } else {
                setCouple(coupleData as CoupleData);
                coupleRef.current = coupleData as CoupleData;

                // Fetch partner data
                const partnerId = coupleData.user_one_id === user.id ? coupleData.user_two_id : coupleData.user_one_id;
                if (partnerId) {
                    const { data: partnerData, error: partnerError } = await supabase
                        .from('profiles')
                        .select(PROFILE_FIELDS)
                        .eq('id', partnerId)
                        .single();

                    if (partnerError) throw partnerError;
                    setPartner(partnerData);
                } else {
                    setPartner(null);
                }
            }
        } catch (err: any) {
            logger.error('CoupleContext', 'Error fetching couple data', err);
            setError(err?.message || 'Failed to fetch couple data');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user, authLoading]);

    const refreshCoupleData = useCallback(async (silent = false) => {
        await fetchCoupleData(silent);
    }, [fetchCoupleData]);


    useEffect(() => {
        if (authLoading || !user) {
            return;
        }

        // Initial fetch
        fetchCoupleData();

        // Subscribe to Realtime changes for MY profile
        const profileChannel = supabase
            .channel(`profile_changes:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    const newProfile = payload.new as Profile;
                    // const oldProfile = payload.old as Profile;

                    if (newProfile) {
                        const currentRefId = userProfileRef.current?.couple_id;
                        // Check comparison logic...

                        // Update ref immediately to new state
                        setUserProfile(newProfile);
                        userProfileRef.current = newProfile;

                        // Check if couple_id changed (Unpair, Join, Restore)
                        if (newProfile.couple_id !== currentRefId) {
                            if (newProfile.couple_id === null) {
                                // Passive Unpair specific handling
                                setCouple(null);
                                setPartner(null);

                                sessionStorage.removeItem(STORAGE_KEYS.DISMISSED_RESTORE_MODAL);

                                // Force navigation
                                navigate('/dashboard');

                                // Also refresh just to be safe/clean
                                refreshCoupleData();
                            } else {
                                // Standard update (e.g. restore or join)
                                refreshCoupleData(true); // Silent update
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
        };
    }, [user?.id, authLoading, fetchCoupleData, refreshCoupleData, navigate]);

    // Subscribe to Realtime changes for the active couple only
    useEffect(() => {
        if (!couple?.id || !user) return;

        const couplesChannel = supabase
            .channel(`couple_data_changes:${couple.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'couples',
                    filter: `id=eq.${couple.id}`
                },
                (payload) => {
                    const currentCouple = coupleRef.current;
                    const newCouple = payload.new as CoupleData;

                    // Handle Soft Delete (Archived) as effectively deleted for the active dashboard
                    if (newCouple && newCouple.status === 'archived') {
                        if (currentCouple?.id === newCouple.id) {
                            setCouple(null);
                            setPartner(null);
                            // Force local profile update to reflect single status immediately
                            setUserProfile(prev => prev ? { ...prev, couple_id: null } : null);
                            refreshCoupleData(true); // Silent update
                        }
                        return;
                    }

                    if (newCouple && newCouple.id === currentCouple?.id) {
                        setCouple(newCouple);

                        // Check if partner just joined (user_two_id changed from null to something)
                        if (currentCouple?.user_two_id === null && newCouple.user_two_id !== null) {
                            refreshCoupleData(true);
                        }
                    } else if (payload.eventType === 'DELETE') {
                        if (payload.old && payload.old.id === currentCouple?.id) {
                            setCouple(null);
                            setPartner(null);
                            refreshCoupleData(true);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(couplesChannel);
        };
    }, [couple?.id, user, refreshCoupleData]);

    const contextValue = useMemo(
        () => ({ couple, partner, userProfile, loading, error, refreshCoupleData }),
        [couple, partner, userProfile, loading, error, refreshCoupleData]
    );

    return (
        <CoupleContext.Provider value={contextValue}>
            {children}
        </CoupleContext.Provider>
    );
};

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export const useCoupleContext = () => {
    const context = useContext(CoupleContext);
    if (context === undefined) {
        throw new Error('useCoupleContext must be used within a CoupleProvider');
    }
    return context;
};

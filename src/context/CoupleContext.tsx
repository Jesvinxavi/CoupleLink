import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Database } from '../types/supabase';
import { STORAGE_KEYS } from '../lib/constants';

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

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

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
                .select('*')
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
                    .select('*')
                    .eq('id', profileData.couple_id)
                    .eq('status', 'active') // Only fetch if active
                    .single();

                if (!specificError) {
                    coupleData = specificCouple;
                } else {
                    // console.warn('fetchCoupleData: Profile has couple_id but fetch active couple failed:', specificError.message);
                }
            } else {
                // console.log('fetchCoupleData: No couple_id in profile.');
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
                        .select('*')
                        .eq('id', partnerId)
                        .single();

                    if (partnerError) throw partnerError;
                    setPartner(partnerData);
                } else {
                    setPartner(null);
                }
            }
        } catch (err: any) {
            console.error('Error fetching couple data:', err);
            setError(err.message);
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

        // Subscribe to Realtime changes for couples
        const couplesChannel = supabase
            .channel('couple_data_changes_global')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'couples'
                },
                (payload) => {
                    const currentCouple = coupleRef.current; // Use ref
                    // console.log('couplesChannel: Received payload', payload);

                    const newCouple = payload.new as CoupleData;

                    // Handle Soft Delete (Archived) as effectively deleted for the active dashboard
                    if (newCouple && newCouple.status === 'archived') {
                        if (currentCouple?.id === newCouple.id) {
                            setCouple(null);
                            setPartner(null);
                            // Force local profile update to reflect single status immediately
                            setUserProfile(prev => prev ? { ...prev, couple_id: null } : null);
                            // Refresh logic
                            refreshCoupleData(true); // Silent update
                        }
                        return; // Stop processing
                    }

                    if (newCouple && (newCouple.user_one_id === user.id || newCouple.user_two_id === user.id)) {
                        setCouple(newCouple);
                    } else if (payload.eventType === 'DELETE') {
                        // Check if the deleted couple IS our couple
                        if (payload.old && payload.old.id === currentCouple?.id) {
                            setCouple(null);
                            setPartner(null);
                            // Do not manually nullify userProfile.couple_id, as it might have been reassigned (Restore flow)
                            // refreshCoupleData will fetch the true state of the profile.
                            refreshCoupleData(true); // Silent update
                        }
                    }
                }
            )
            .subscribe((status) => {
                // console.log('couplesChannel status:', status);
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to couple changes');
                }
            });

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
                    // console.log('profileChannel: Received payload', payload);
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
            .subscribe((_status, _err) => {
                // console.log(`profileChannel status for ${user.id}:`, status, err);
            });

        return () => {
            supabase.removeChannel(couplesChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [user?.id, authLoading]);

    return (
        <CoupleContext.Provider value={{ couple, partner, userProfile, loading, error, refreshCoupleData }}>
            {children}
        </CoupleContext.Provider>
    );
};

export const useCoupleContext = () => {
    const context = useContext(CoupleContext);
    if (context === undefined) {
        throw new Error('useCoupleContext must be used within a CoupleProvider');
    }
    return context;
};

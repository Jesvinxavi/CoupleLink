import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCoupleData } from '@/hooks/useCoupleData';
import { type Coupon, type CouponTemplate } from '@/hooks/useCoupons';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface CouponsContextType {
    coupons: Coupon[];
    templates: CouponTemplate[];
    loading: boolean;
    error: string | null;
    createCoupon: (title: string, description: string, assignedTo?: string) => Promise<Coupon>;
    claimCoupon: (template: CouponTemplate) => Promise<Coupon>;
    giftCoupon: (
        recipientId: string,
        type: 'specific' | 'random' | 'create',
        template?: CouponTemplate,
        customData?: { title: string; description: string }
    ) => Promise<Coupon | undefined>;
    activateCoupon: (id: string) => Promise<Coupon>;
    redeemCoupon: (id: string) => Promise<Coupon>;
    updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<Coupon>;
    acknowledgeCoupon: (id: string) => Promise<Coupon>;
    refreshCoupons: () => Promise<void>;
    fetchTemplates: () => Promise<void>;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const CouponsContext = createContext<CouponsContextType | undefined>(undefined);

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export function CouponsProvider({ children }: { children: ReactNode }) {
    const { couple, userProfile, loading: coupleLoading, refreshCoupleData } = useCoupleData();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [templates, setTemplates] = useState<CouponTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Track gift IDs we've already processed to prevent duplicates
    const processedGiftIds = useRef<Set<string>>(new Set());
    const hasLoaded = useRef(false);

    const fetchCoupons = useCallback(async () => {
        if (!couple?.id || !userProfile?.id) return;

        try {
            // Only set loading on initial fetch if empty, to avoid flickering
            if (!hasLoaded.current) setLoading(true);

            const { data, error } = await supabase
                .from('coupons')
                .select([
                    'id',
                    'couple_id',
                    'assigned_to',
                    'title',
                    'description',
                    'category',
                    'template_id',
                    'status',
                    'is_redeemed',
                    'redeemed_at',
                    'created_at',
                    'expires_at',
                    'activated_at',
                    'is_gift',
                    'gifted_by',
                    'gift_message',
                    'acknowledged_at'
                ].join(', '))
                .eq('assigned_to', userProfile.id) // Only show my coupons
                .eq('couple_id', couple.id) // Strict Scope: Only this couple
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Cast the data to match our Coupon interface since Supabase types might be loose on status string
            const typedCoupons = (data || []).map(item => {
                const anyItem = item as any;
                return {
                    ...anyItem,
                    status: (anyItem.status as 'active' | 'redeemed') || 'active'
                };
            });

            setCoupons(typedCoupons);
            hasLoaded.current = true;
        } catch (err: any) {
            logger.error('CouponsContext', 'Error fetching coupons', err);
            setError(err?.message || 'Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    }, [couple?.id, userProfile?.id]);

    const fetchTemplates = useCallback(async () => {
        try {
            const { data, error } = await (supabase
                .from('coupon_templates' as any)
                .select([
                    'id',
                    'created_at',
                    'title',
                    'description',
                    'category',
                    'intensity',
                    'icon'
                ].join(', ')) as any)
                .order('intensity', { ascending: true });

            if (error) throw error;

            setTemplates((data || []) as any as CouponTemplate[]);
        } catch (err: any) {
            logger.error('CouponsContext', 'Error fetching templates', err);
        }
    }, []);

    const checkGifts = useCallback(async () => {
        if (!couple?.id || !userProfile?.id) return;

        // Fetch coupons to check for new gifts
        // In a more optimized version, we might just query for new gifts specifically
        // But re-fetching coupons is safe and robust
        await fetchCoupons();

        // Note: The actual modal trigger logic is in PleasureCouponsTile, which watches 'coupons'
        // So just updating 'coupons' via fetchCoupons is sufficient.

    }, [couple?.id, userProfile?.id, fetchCoupons]);

    // Channel Ref to allow sending broadcasts
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!couple?.id || !userProfile?.id) {
            setLoading(false);
            return;
        }

        // Fetch immediately
        fetchCoupons().then(() => {
            // Initialize processed gift IDs after fetch completes
            setCoupons(prev => {
                prev.filter(c => c.is_gift).forEach(c => processedGiftIds.current.add(c.id));
                return prev;
            });
        });
        fetchTemplates();

        // Use a shared channel for the couple so we can broadcast functionality
        const channelName = `partner-coupons-${couple.id}`;

        // Realtime subscription specifically for gift detection
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'coupons',
                    filter: `assigned_to=eq.${userProfile.id}&couple_id=eq.${couple.id}`
                },
                () => {
                    checkGifts();
                }
            )
            .on('broadcast', { event: 'coupon_gift' }, () => {
                checkGifts();
            })
            .subscribe();

        channelRef.current = channel;

        // 30s polling fallback (reduced from 3s)
        const intervalId = setInterval(() => {
            checkGifts();
        }, 30000);

        // Window focus listener for immediate update when returning to app
        const handleFocus = () => {
            checkGifts();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
            channelRef.current = null;
            window.removeEventListener('focus', handleFocus);
        };
    }, [couple?.id, userProfile?.id, fetchCoupons, fetchTemplates, checkGifts]);

    const createCoupon = useCallback(async (title: string, description: string, assignedTo?: string) => {
        if (!couple?.id) throw new Error('No couple found');

        try {
            const { data, error } = await (supabase
                .from('coupons' as any)
                .insert([
                    {
                        couple_id: couple.id,
                        title,
                        description,
                        assigned_to: assignedTo || null,
                        status: 'active',
                        is_gift: false
                    }
                ]) as any)
                .select()
                .single();

            if (error) throw error;
            const anyData = data as any;
            const newCoupon = { ...anyData, status: anyData.status || 'active' };
            setCoupons(prevCoupons => [newCoupon, ...prevCoupons]);
            return newCoupon;
        } catch (err: any) {
            logger.error('CouponsContext', 'Error creating coupon', err);
            throw err;
        }
    }, [couple?.id]);

    const claimCoupon = useCallback(async (template: CouponTemplate) => {
        if (!couple?.id || !userProfile?.id) throw new Error('No user profile');

        try {
            // 1. Create the coupon
            const { data: couponData, error: couponError } = await (supabase
                .from('coupons' as any)
                .insert([{
                    couple_id: couple.id,
                    title: template.title,
                    description: template.description,
                    template_id: template.id,
                    assigned_to: userProfile.id,
                    status: 'active',
                    is_gift: false
                }]) as any)
                .select()
                .single();

            if (couponError) throw couponError;

            // 2. Decrement unclaimed vouchers
            const profile = userProfile as any;
            if (profile.unclaimed_vouchers && profile.unclaimed_vouchers > 0) {
                await (supabase
                    .from('profiles' as any)
                    .update({ unclaimed_vouchers: profile.unclaimed_vouchers - 1 }) as any)
                    .eq('id', userProfile.id);

                refreshCoupleData(); // Refresh to get updated voucher count
            }

            const anyCouponData = couponData as any;
            const newCoupon = { ...anyCouponData, status: anyCouponData.status || 'active' };
            setCoupons(prevCoupons => [newCoupon, ...prevCoupons]);
            return newCoupon;
        } catch (err: any) {
            logger.error('CouponsContext', 'Error claiming coupon', err);
            throw err;
        }
    }, [couple?.id, userProfile, refreshCoupleData]);

    const giftCoupon = useCallback(async (
        recipientId: string,
        type: 'specific' | 'random' | 'create',
        template?: CouponTemplate,
        customData?: { title: string; description: string }
    ) => {
        if (!couple?.id || !userProfile?.id) return;

        try {
            let couponPayload: any = {
                couple_id: couple.id,
                assigned_to: recipientId,
                gifted_by: userProfile.id,
                is_gift: true,
                status: 'active',
                gift_message: "A gift for you!"
            };

            if (type === 'specific' && template) {
                couponPayload.title = template.title;
                couponPayload.description = template.description;
                couponPayload.template_id = template.id;
            } else if (type === 'create' && customData) {
                couponPayload.title = customData.title;
                couponPayload.description = customData.description;
            } else if (type === 'random') {
                const randomIndex = Math.floor(Math.random() * templates.length);
                const randomTemplate = templates[randomIndex];
                couponPayload.title = randomTemplate.title;
                couponPayload.description = randomTemplate.description;
                couponPayload.template_id = randomTemplate.id;
            }

            const { data, error } = await (supabase
                .from('coupons' as any)
                .insert([couponPayload]) as any)
                .select()
                .single();

            if (error) throw error;

            const now = Date.now();


            const anyData = data as any;
            const newCoupon: Coupon = {
                ...anyData,
                status: (anyData.status as 'active' | 'redeemed') || 'active'
            };

            // Send broadcast to partner using existing channel
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'coupon_gift',
                    payload: { giftId: anyData.id, sentAt: now }
                });
            } else {
                logger.warn('CouponsContext', 'No channelRef available to broadcast');
            }

            // Note: We don't add to *our* list because we gifted it to partner
            // But if we wanted to show 'Sent Gifts', we would need a different list.
            // For now, no local state update needed for gifter, but receiver will get it via polling.

            return newCoupon;

        } catch (err: any) {
            logger.error('CouponsContext', 'Error gifting coupon', err);
            throw err;
        }
    }, [couple?.id, userProfile, templates]);

    const activateCoupon = useCallback(async (id: string) => {
        try {
            const now = new Date();
            const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

            const { data, error } = await (supabase
                .from('coupons' as any)
                .update({
                    activated_at: now.toISOString(),
                    expires_at: expires.toISOString()
                }) as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const anyData = data as any;
            const updatedCoupon = { ...anyData, status: anyData.status || 'active' };
            setCoupons(prevCoupons => prevCoupons.map(c => c.id === id ? updatedCoupon : c));
            return updatedCoupon;
        } catch (err: any) {
            logger.error('CouponsContext', 'Error activating coupon', err);
            throw err;
        }
    }, []);

    const redeemCoupon = useCallback(async (id: string) => {
        try {
            const { data, error } = await (supabase
                .from('coupons' as any)
                .update({
                    status: 'redeemed',
                    redeemed_at: new Date().toISOString()
                }) as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const anyData = data as any;
            const updatedCoupon = { ...anyData, status: anyData.status || 'active' };
            setCoupons(prevCoupons => prevCoupons.map(c => c.id === id ? updatedCoupon : c));
            return updatedCoupon;
        } catch (err: any) {
            logger.error('CouponsContext', 'Error redeeming coupon', err);
            throw err;
        }
    }, []);

    const updateCoupon = useCallback(async (id: string, updates: Partial<Coupon>) => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .update(updates as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const anyData = data as any;
            const updatedCoupon = { ...anyData, status: anyData.status || 'active' };
            setCoupons(prevCoupons => prevCoupons.map(c => c.id === id ? updatedCoupon : c));
            return updatedCoupon;
        } catch (err: any) {
            logger.error('CouponsContext', 'Error updating coupon', err);
            throw err;
        }
    }, []);

    const acknowledgeCoupon = useCallback(async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .update({ acknowledged_at: new Date().toISOString() } as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const anyData = data as any;
            const updatedCoupon = { ...anyData, status: anyData.status || 'active' };
            setCoupons(prevCoupons => prevCoupons.map(c => c.id === id ? updatedCoupon : c));
            return updatedCoupon;
        } catch (err: any) {
            logger.error('CouponsContext', 'Error acknowledging coupon', err);
            throw err;
        }
    }, []);

    const value = useMemo(() => ({
        coupons,
        templates,
        loading: loading || coupleLoading,
        error,
        createCoupon,
        claimCoupon,
        giftCoupon,
        activateCoupon,
        redeemCoupon,
        updateCoupon,
        acknowledgeCoupon,
        refreshCoupons: fetchCoupons,
        fetchTemplates
    }), [
        coupons,
        templates,
        loading,
        coupleLoading,
        error,
        createCoupon,
        claimCoupon,
        giftCoupon,
        activateCoupon,
        redeemCoupon,
        updateCoupon,
        acknowledgeCoupon,
        fetchCoupons,
        fetchTemplates
    ]);

    return (
        <CouponsContext.Provider value={value}>
            {children}
        </CouponsContext.Provider>
    );
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useCouponsContext() {
    const context = useContext(CouponsContext);
    if (context === undefined) {
        throw new Error('useCouponsContext must be used within a CouponsProvider');
    }
    return context;
}

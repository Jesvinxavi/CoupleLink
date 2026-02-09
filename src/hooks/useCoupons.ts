import { useCouponsContext } from '@/context/CouponsContext';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export interface CouponTemplate {
    id: string;
    title: string;
    description: string;
    category: 'romantic' | 'spicy' | 'service' | 'fun';
    intensity: number;
    icon: string | null;
}

export interface Coupon {
    id: string;
    couple_id: string;
    title: string;
    description: string | null;
    assigned_to: string | null;
    status: 'active' | 'redeemed';
    created_at: string;
    redeemed_at: string | null;
    template_id?: string;
    gifted_by?: string;
    gift_message?: string;
    is_gift?: boolean;
    activated_at?: string;
    expires_at?: string;
    acknowledged_at?: string;
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
// Thin wrapper around CouponsContext to keep imports stable.
export function useCoupons() {
    return useCouponsContext();
}

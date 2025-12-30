import { useEffect } from 'react';
import { useCoupons } from '../hooks/useCoupons';
import { useCoupleData } from '../hooks/useCoupleData';
import { GiftReceivedModal } from './sexploration/GiftReceivedModal';
import { useGlobalModalQueue } from '../context/GlobalModalQueueContext';

export function GlobalCouponListener() {
    const { coupons, refreshCoupons, acknowledgeCoupon } = useCoupons();
    const { userProfile } = useCoupleData();
    const { enqueueModal, ackModal, currentModal } = useGlobalModalQueue();

    const receivedCoupon = currentModal?.type === 'gift' ? currentModal.data.coupon : null;

    // Check for pending gift coupons on mount/coupons update
    useEffect(() => {
        if (!userProfile?.id || !coupons.length) return;

        // Find any gift coupons that haven't been acknowledged
        const pendingGifts = coupons.filter(c =>
            c.assigned_to === userProfile.id && // It's for me
            !c.acknowledged_at && // I haven't seen it
            c.is_gift === true // It was a gift
        );

        if (pendingGifts.length > 0) {
            enqueueModal('gift', { coupon: pendingGifts[0] });
        }

    }, [coupons, userProfile?.id, enqueueModal]);

    // When modal opens/closes, handle side effects
    useEffect(() => {
        const handleAck = async () => {
            if (receivedCoupon) {
                // Determine if this is a "Free Reign" coupon (which is actually a voucher)
                // In our system, real "coupons" are vouchers.
                // The Coupon type has a title or code we can check, or just assume all gifts need ack.
                await acknowledgeCoupon(receivedCoupon.id).catch(() => { });
                refreshCoupons();

            }
        };

        if (receivedCoupon) {
            handleAck();
        }
    }, [receivedCoupon, acknowledgeCoupon, refreshCoupons]);

    const handleValidClose = () => {
        ackModal('gift');
    };

    /* 
       Note: We removed CouponCollectionModal logic from here as it seems handled elsewhere 
       or was mixed up with simple gift receiving. 
       If we need to restore conversion logic, we can add it back, but the request focused on the queue.
       The original code had logic for `conversionTargetId` and `showCollectionModal`.
       Given the user's request, we prioritize the queue for the "Gift Received" aspect.
    */

    return (
        <GiftReceivedModal
            isOpen={!!receivedCoupon}
            onClose={handleValidClose}
            coupon={receivedCoupon}
        />
    );
}

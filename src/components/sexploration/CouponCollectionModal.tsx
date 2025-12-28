import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoupons, type CouponTemplate } from '../../hooks/useCoupons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Gift, Loader2, CheckCircle, Send } from 'lucide-react';
import { Coupon } from './Coupon';

interface CouponCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClaimSuccess: () => void;
    mode?: 'claim' | 'convert';
    targetCouponId?: string;
}

export const CouponCollectionModal: React.FC<CouponCollectionModalProps> = ({
    isOpen,
    onClose,
    onClaimSuccess,
    mode = 'claim',
    targetCouponId
}) => {
    const { templates, coupons, fetchTemplates, claimCoupon, updateCoupon } = useCoupons();
    const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            setSelectedTemplate(null);
        }
    }, [isOpen]);

    // Filter out coupons already in the user's wallet
    // Filter out coupons already in the user's wallet
    let availableTemplates = templates.filter(t => {
        const hasCoupon = coupons.some(c => c.template_id === t.id && c.id !== targetCouponId);
        return !hasCoupon;
    });

    // If the user has collected ALL coupons (availableTemplates is empty), 
    // reset the list to show ALL templates so they can pick duplicates/refill.
    if (availableTemplates.length === 0 && templates.length > 0) {
        availableTemplates = templates;
    }

    const handleTemplateSelect = (template: CouponTemplate) => {
        setSelectedTemplate(template);
    };

    const handleAction = async () => {
        if (!selectedTemplate) return;

        setIsClaiming(true);
        try {
            if (mode === 'convert' && targetCouponId) {
                await updateCoupon(targetCouponId, {
                    title: selectedTemplate.title,
                    description: selectedTemplate.description,
                    template_id: selectedTemplate.id
                });
            } else {
                await claimCoupon(selectedTemplate);
            }
            onClaimSuccess();
            onClose();
            setSelectedTemplate(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[85vh] p-0 gap-0 bg-rose-50 dark:bg-gray-900 border-none">

                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl font-serif font-bold text-gray-900 dark:text-white">
                        <Gift className="w-5 h-5 text-pink-500" />
                        Select Coupon
                    </DialogTitle>
                </DialogHeader>

                {/* Body - Scrollable coupon list */}
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4 pt-3"
                    >
                        <AnimatePresence mode="popLayout">
                            {availableTemplates.map(t => (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => handleTemplateSelect(t)}
                                    className="cursor-pointer transition-transform active:scale-[0.98] group"
                                >
                                    <div className="relative">
                                        {/* Selection Glow / Indicator */}
                                        {selectedTemplate?.id === t.id && (
                                            <div className="absolute -inset-1 bg-pink-500 rounded-xl blur-sm opacity-60 animate-pulse" />
                                        )}

                                        {/* Actual Coupon */}
                                        <div className="relative transform transition-all group-hover:scale-[1.01]">
                                            <Coupon
                                                title={t.title}
                                                description={t.description || t.category}
                                                isPreview={true}
                                            />
                                        </div>

                                        {/* Selected Overlay Checkmark */}
                                        {selectedTemplate?.id === t.id && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-pink-600 text-white rounded-full p-2 shadow-lg z-20 scale-110">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {availableTemplates.length === 0 && (
                            <div className="text-center py-10 opacity-60">
                                <p>No coupons available.</p>
                                <p className="text-sm">You already have all available coupons in your wallet!</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Footer with Send Button */}
                <div className="p-5 pt-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                    <Button
                        disabled={isClaiming || !selectedTemplate}
                        onClick={handleAction}
                        className={`w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/25 text-lg transition-all active:scale-[0.98] ${!selectedTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isClaiming ? <Loader2 className="animate-spin" /> : (
                            <span className="flex items-center gap-2">
                                {mode === 'convert' ? 'Convert Coupon' : 'Add to Wallet'}
                                <Send className="w-5 h-5" />
                            </span>
                        )}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};

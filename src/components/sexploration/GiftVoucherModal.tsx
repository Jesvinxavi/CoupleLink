import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoupons, type CouponTemplate } from '../../hooks/useCoupons';
import { useCoupleContext } from '../../context/CoupleContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Gift, Shuffle, PenTool, Globe, ArrowLeft, Loader2, Send, CheckCircle, ChevronRight } from 'lucide-react';
import { Coupon } from './Coupon';

interface GiftVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGiftSuccess: () => void;
}

export const GiftVoucherModal: React.FC<GiftVoucherModalProps> = ({
    isOpen,
    onClose,
    onGiftSuccess
}) => {
    const { templates, giftCoupon, fetchTemplates } = useCoupons();
    const { partner } = useCoupleContext();

    // Steps: 'main' (select type + send simple), 'template-select' (specific), 'create-custom' (custom)
    const [step, setStep] = useState<'main' | 'template-select' | 'create-custom'>('main');

    // For 'main' selection
    const [selectedType, setSelectedType] = useState<'specific' | 'random' | 'create' | 'free_reign' | null>(null);

    // For specific flow
    const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null);

    // For custom flow
    const [customData, setCustomData] = useState({ title: '', description: '' });

    const [isSending, setIsSending] = useState(false);

    // Initial fetch if needed
    React.useEffect(() => {
        if (isOpen && templates.length === 0) {
            fetchTemplates();
        }
    }, [isOpen]);

    const reset = () => {
        setStep('main');
        setSelectedType(null);
        setSelectedTemplate(null);
        setCustomData({ title: '', description: '' });
    };

    const handleClose = () => {
        onClose();
        setTimeout(reset, 300);
    };

    const handleTypeSelect = (type: 'specific' | 'random' | 'create' | 'free_reign') => {
        // Toggle if already selected, or select new
        if (selectedType === type) {
            // Optional: deselect? No, just keep selected.
            return;
        }
        setSelectedType(type);
    };

    // Main "Action" handler from the footer
    const handleContinueOrSend = async () => {
        if (!selectedType) return;

        if (selectedType === 'specific') {
            setStep('template-select');
        } else if (selectedType === 'create') {
            setStep('create-custom');
        } else {
            // Immediate Send for Random & Free Reign
            await executeSend();
        }
    };

    const executeSend = async () => {
        console.log('[GiftVoucherModal] executeSend called', { partnerId: partner?.id, selectedType, selectedTemplate });
        if (!partner?.id || !selectedType) {
            console.error('[GiftVoucherModal] Missing partner or selectedType', { partnerId: partner?.id, selectedType });
            return;
        }
        setIsSending(true);

        try {
            let result;
            if (selectedType === 'specific' && selectedTemplate) {
                console.log('[GiftVoucherModal] Sending specific coupon');
                result = await giftCoupon(partner.id, 'specific', selectedTemplate);
            } else if (selectedType === 'random') {
                console.log('[GiftVoucherModal] Sending random coupon');
                result = await giftCoupon(partner.id, 'random');
            } else if (selectedType === 'create') {
                console.log('[GiftVoucherModal] Sending custom coupon', customData);
                result = await giftCoupon(partner.id, 'create', undefined, customData);
            } else if (selectedType === 'free_reign') {
                console.log('[GiftVoucherModal] Sending free reign coupon');
                result = await giftCoupon(partner.id, 'create', undefined, {
                    title: "Free Reign",
                    description: "Redeem this for any pleasure of your choice! You have complete control."
                });
            }
            console.log('[GiftVoucherModal] giftCoupon result:', result);

            if (result) {
                onGiftSuccess();
                handleClose();
            } else {
                console.error('[GiftVoucherModal] giftCoupon returned undefined - check if couple/userProfile is loaded');
            }
        } catch (error) {
            console.error('[GiftVoucherModal] Error sending gift:', error);
        } finally {
            setIsSending(false);
        }
    };

    // For specific template selection
    const handleTemplateSelect = (t: CouponTemplate) => {
        setSelectedTemplate(t);
        // We could move to a confirmation, but let's just create a state where we "Selected" it and verify?
        // Actually, user flow for specific: Select Type -> Continue -> Select Coupon -> Send? 
        // Or Select Coupon -> Confirm modal?
        // Let's make clicking a template show a "Send this coupon?" prompt or just send immediately?
        // User asked: "modal should not say select template it should say select coupon. the coupons that show up in this modal... fancy... "
        // Let's assume clicking a coupon in the list asks for confirmation or sends it. 
        // To be safe and UI-friendly: Clicking selects it, and a "Send Gift" button appears (like main screen).
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[85vh] p-0 gap-0 bg-rose-50 dark:bg-gray-900 border-none"
            >

                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <div className="flex items-center gap-2">
                        {step !== 'main' && (
                            <button
                                onClick={() => {
                                    if (step === 'template-select' || step === 'create-custom') setStep('main');
                                }}
                                className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                        <DialogTitle className="flex items-center gap-2 text-xl font-serif font-bold text-gray-900 dark:text-white">
                            <Gift className="w-5 h-5 text-pink-500" />
                            {step === 'template-select' ? 'Select Coupon' : 'Gift a Coupon'}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-0">
                    <AnimatePresence mode="wait">
                        {step === 'main' && (
                            <motion.div
                                key="main"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="grid grid-cols-1 gap-3"
                            >
                                <OptionCard
                                    icon={Gift}
                                    title="Choose Specific Coupon"
                                    description="Pick a specific pleasure from the collection."
                                    selected={selectedType === 'specific'}
                                    onClick={() => handleTypeSelect('specific')}
                                />
                                <OptionCard
                                    icon={Shuffle}
                                    title="Random Surprise"
                                    description="Send a random coupon to add some mystery."
                                    selected={selectedType === 'random'}
                                    onClick={() => handleTypeSelect('random')}
                                />
                                <OptionCard
                                    icon={PenTool}
                                    title="Create Custom"
                                    description="Write your own special coupon title and rules."
                                    selected={selectedType === 'create'}
                                    onClick={() => handleTypeSelect('create')}
                                />
                                <OptionCard
                                    icon={Globe}
                                    title="Free Reign"
                                    description="Give them the power to choose anything they want."
                                    selected={selectedType === 'free_reign'}
                                    onClick={() => handleTypeSelect('free_reign')}
                                />
                            </motion.div>
                        )}

                        {step === 'template-select' && (
                            <motion.div
                                key="templates"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4 pt-3"
                            >
                                {/* We can reuse the Coupon component for the list items to make them look fancy */}
                                {templates.map(t => (
                                    <div key={t.id} onClick={() => handleTemplateSelect(t)} className="cursor-pointer transition-transform active:scale-[0.98] group">
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
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {step === 'create-custom' && (
                            <motion.div
                                key="custom"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 pt-4"
                            >
                                {/* Live Preview */}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Live Preview</p>
                                    <Coupon
                                        title={customData.title || "Coupon Title"}
                                        description={customData.description || "Description will appear here..."}
                                        isPreview={true}
                                        isGift={true}
                                    />
                                </div>

                                <div className="space-y-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Customize Coupon</h3>
                                        <p className="text-xs text-gray-500 mt-1">Enter details below to update the coupon preview.</p>
                                    </div>
                                    <Input
                                        value={customData.title}
                                        onChange={e => setCustomData({ ...customData, title: e.target.value })}
                                        placeholder="Enter Title (e.g. Massage Night)"
                                        className="text-lg font-medium border-gray-200 dark:border-gray-700 h-9"
                                    />
                                    <Textarea
                                        value={customData.description}
                                        onChange={e => setCustomData({ ...customData, description: e.target.value })}
                                        placeholder="How does it work? (Optional)"
                                        className="min-h-[100px] border-gray-200 dark:border-gray-700 resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Action Button - Static Position */}
                {/* Only render if there's an action available to prevent empty footer space */}
                {((step === 'main' && selectedType) ||
                    (step === 'template-select') ||
                    (step === 'create-custom' && customData.title)
                ) && (
                        <div className="p-5 pt-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                            {step === 'main' && selectedType && (
                                <Button
                                    disabled={isSending}
                                    onClick={handleContinueOrSend}
                                    className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/25 text-lg transition-all active:scale-[0.98]"
                                >
                                    {isSending ? <Loader2 className="animate-spin" /> : (
                                        (selectedType === 'random' || selectedType === 'free_reign')
                                            ? <span className="flex items-center gap-2">Send Gift <Send className="w-5 h-5" /></span>
                                            : <span className="flex items-center gap-2">Continue <ChevronRight className="w-5 h-5" /></span>
                                    )}
                                </Button>
                            )}

                            {step === 'template-select' && (
                                <Button
                                    disabled={isSending || !selectedTemplate}
                                    onClick={executeSend} // Send Specific
                                    className={`w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/25 text-lg transition-all active:scale-[0.98] ${!selectedTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSending ? <Loader2 className="animate-spin" /> : (
                                        <span className="flex items-center gap-2">Send Gift <Send className="w-5 h-5" /></span>
                                    )}
                                </Button>
                            )}

                            {step === 'create-custom' && customData.title && (
                                <Button
                                    disabled={isSending || !customData.title}
                                    onClick={executeSend} // Send Custom
                                    className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/25 text-lg transition-all active:scale-[0.98]"
                                >
                                    {isSending ? <Loader2 className="animate-spin" /> : (
                                        <span className="flex items-center gap-2">Send Gift <Send className="w-5 h-5" /></span>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

            </DialogContent>
        </Dialog>
    );
};

const OptionCard = ({ icon: Icon, title, description, selected, onClick }: { icon: any; title: string; description: string; selected?: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group w-full ${selected
            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-md transform scale-[1.02]'
            : 'border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-pink-200 dark:hover:border-gray-600'
            }`}
    >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-pink-500 text-white' : 'bg-pink-100 dark:bg-pink-900/40 text-pink-500 group-hover:bg-pink-500 group-hover:text-white'
            }`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h3 className={`font-bold text-base ${selected ? 'text-pink-600 dark:text-pink-300' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight mt-1">{description}</p>
        </div>
        {selected && (
            <div className="ml-auto text-pink-500 animate-in fade-in zoom-in">
                <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                </div>
            </div>
        )}
    </button>
);

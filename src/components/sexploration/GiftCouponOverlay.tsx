import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoupons, type CouponTemplate } from '../../hooks/useCoupons';
import { useCoupleContext } from '../../context/CoupleContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Gift, Shuffle, PenTool, Globe, ArrowLeft, Loader2, Send, CheckCircle, ChevronRight, X } from 'lucide-react';
import { Coupon } from './Coupon';

interface GiftCouponOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onGiftSuccess: () => void;
}

export const GiftCouponOverlay: React.FC<GiftCouponOverlayProps> = ({
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
    useEffect(() => {
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
        setTimeout(reset, 500); // Wait for animation
    };

    const handleTypeSelect = (type: 'specific' | 'random' | 'create' | 'free_reign') => {
        if (selectedType === type) return;
        setSelectedType(type);
    };



    const executeSend = async () => {
        if (!partner?.id || !selectedType) return;
        setIsSending(true);

        try {
            let result;
            if (selectedType === 'specific' && selectedTemplate) {
                result = await giftCoupon(partner.id, 'specific', selectedTemplate);
            } else if (selectedType === 'random') {
                result = await giftCoupon(partner.id, 'random');
            } else if (selectedType === 'create') {
                result = await giftCoupon(partner.id, 'create', undefined, customData);
            } else if (selectedType === 'free_reign') {
                result = await giftCoupon(partner.id, 'create', undefined, {
                    title: "Free Reign",
                    description: "Redeem this for any pleasure of your choice! You have complete control."
                });
            }

            if (result) {
                onGiftSuccess();
                handleClose();
            }
        } catch (error) {
            console.error('[GiftCouponOverlay] Error sending gift:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleTemplateSelect = (t: CouponTemplate) => {
        setSelectedTemplate(t);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Slide-up Overlay */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
                        className="fixed inset-x-0 bottom-0 z-[61] h-auto max-h-[calc(100dvh-70px)] bg-rose-50 dark:bg-gray-900 rounded-t-3xl shadow-xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-rose-100 dark:border-gray-800 shrink-0">
                            <div className="flex items-center gap-3">
                                {step !== 'main' && (
                                    <button
                                        onClick={() => {
                                            if (step === 'template-select' || step === 'create-custom') setStep('main');
                                        }}
                                        className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                                    </button>
                                )}
                                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                    <Gift className="w-5 h-5 text-rose-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {step === 'template-select' ? 'Select Coupon' : 'Gift a Coupon'}
                                </h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <AnimatePresence mode="wait">
                                {step === 'main' && (
                                    <motion.div
                                        key="main"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
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
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4 max-w-2xl mx-auto"
                                    >
                                        <div className="grid grid-cols-1 gap-4">
                                            {templates.map(t => (
                                                <div key={t.id} onClick={() => handleTemplateSelect(t)} className="cursor-pointer transition-transform active:scale-[0.98] group">
                                                    <div className="relative">
                                                        {selectedTemplate?.id === t.id && (
                                                            <div className="absolute -inset-1 bg-pink-500 rounded-xl blur-sm opacity-60 animate-pulse" />
                                                        )}
                                                        <div className="relative transform transition-all group-hover:scale-[1.01]">
                                                            <Coupon
                                                                title={t.title}
                                                                description={t.description || t.category}
                                                                isPreview={true}
                                                            />
                                                        </div>
                                                        {selectedTemplate?.id === t.id && (
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-pink-600 text-white rounded-full p-2 shadow-lg z-20 scale-110">
                                                                <CheckCircle className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'create-custom' && (
                                    <motion.div
                                        key="custom"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6 max-w-xl mx-auto"
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Live Preview</p>
                                            <Coupon
                                                title={customData.title || "Coupon Title"}
                                                description={customData.description || "Description will appear here..."}
                                                isPreview={true}
                                                isGift={true}
                                            />
                                        </div>

                                        <div className="space-y-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-rose-100 dark:border-gray-700">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">Customize Coupon</h3>
                                                <p className="text-xs text-gray-500 mt-1">Enter details below to update the coupon preview.</p>
                                            </div>
                                            <Input
                                                value={customData.title}
                                                onChange={e => setCustomData({ ...customData, title: e.target.value })}
                                                placeholder="Enter Title (e.g. Massage Night)"
                                                className="text-lg font-medium border-gray-200 dark:border-gray-700"
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

                        {/* Footer - Floating Card Style */}
                        <AnimatePresence>
                            {((step === 'main' && selectedType) ||
                                (step === 'template-select') ||
                                (step === 'create-custom' && customData.title)
                            ) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="w-full px-6 pb-6 pt-0 shrink-0 z-20"
                                    >
                                        <div className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-rose-100 dark:border-gray-700">
                                            <Button
                                                disabled={isSending || (step === 'template-select' && !selectedTemplate)}
                                                onClick={step === 'main' && selectedType === 'specific' ? () => setStep('template-select') :
                                                    step === 'main' && selectedType === 'create' ? () => setStep('create-custom') :
                                                        executeSend}
                                                className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-md shadow-pink-500/20 text-lg transition-all active:scale-[0.98]"
                                            >
                                                {isSending ? <Loader2 className="animate-spin" /> : (
                                                    (step === 'main' && (selectedType === 'random' || selectedType === 'free_reign')) ||
                                                        step === 'template-select' || step === 'create-custom'
                                                        ? <span className="flex items-center gap-2">Send Gift <Send className="w-5 h-5" /></span>
                                                        : <span className="flex items-center gap-2">Continue <ChevronRight className="w-5 h-5" /></span>
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
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

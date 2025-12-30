import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoupons, type CouponTemplate } from '../../hooks/useCoupons';
import { useCoupleContext } from '../../context/CoupleContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Gift, Shuffle, PenTool, Globe, ArrowLeft, Loader2, Send, CheckCircle, X } from 'lucide-react';
import { Coupon } from './Coupon';

interface GiftCouponOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onGiftSuccess: () => void;
    onFocusChange?: (isFocused: boolean) => void;
}

export const GiftCouponOverlay: React.FC<GiftCouponOverlayProps> = ({
    isOpen,
    onClose,
    onGiftSuccess,
    onFocusChange
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

    // Mobile Viewport Logic
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Combined body lock + viewport resize handler (matches FantasyBucketListOverlay)
    useEffect(() => {
        if (!isOpen) return;

        // Robust Body Lock (save scroll position)
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Handle Visual Viewport for mobile keyboard
        const handleVisualResize = () => {
            // Only update if focus is within this overlay
            const activeEl = document.activeElement;
            const isActiveInOverlay = overlayRef.current?.contains(activeEl);
            const isTextInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

            // Exclude input types that don't trigger keyboard
            const nonKeyboardInputTypes = ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'file'];
            const isNonKeyboardInput = activeEl?.tagName === 'INPUT' &&
                nonKeyboardInputTypes.includes((activeEl as HTMLInputElement).type);

            // Only update if a keyboard-triggering text input in our overlay is focused
            if (!isActiveInOverlay || !isTextInput || isNonKeyboardInput) {
                return;
            }

            if (window.visualViewport) {
                setViewportStyle({
                    height: window.visualViewport.height,
                    top: window.visualViewport.offsetTop
                });
            }
        };

        window.visualViewport?.addEventListener('resize', handleVisualResize);
        window.visualViewport?.addEventListener('scroll', handleVisualResize);
        handleVisualResize();

        return () => {
            const topStyle = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';

            // Restore scroll position
            window.scrollTo(0, parseInt(topStyle || '0') * -1);

            window.visualViewport?.removeEventListener('resize', handleVisualResize);
            window.visualViewport?.removeEventListener('scroll', handleVisualResize);
        };
    }, [isOpen]); // Only depends on isOpen

    // Initial fetch if needed
    useEffect(() => {
        if (isOpen && templates.length === 0) {
            fetchTemplates();
        }
    }, [isOpen]);

    const handleOverlayFocus = (e: React.FocusEvent) => {
        const target = e.target as HTMLElement;
        const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        // Exclude input types that don't trigger keyboard
        const nonKeyboardInputTypes = ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'file'];
        const isNonKeyboardInput = target.tagName === 'INPUT' && nonKeyboardInputTypes.includes((target as HTMLInputElement).type);

        // Skip if not a text input or if it's a non-keyboard input type
        if (!isTextInput || isNonKeyboardInput) {
            return;
        }

        if (overlayRef.current && window.visualViewport) {
            // Measure-Lock-Animate pattern
            const rect = overlayRef.current.getBoundingClientRect();
            setViewportStyle({ height: rect.height, top: rect.top });
            setIsFocused(true);
            if (onFocusChange) onFocusChange(true);

            // Animate to target visual viewport in next frame
            requestAnimationFrame(() => {
                setViewportStyle({
                    height: window.visualViewport!.height,
                    top: window.visualViewport!.offsetTop
                });
            });
        } else {
            setIsFocused(true);
            if (onFocusChange) onFocusChange(true);
        }

        // Smart scroll - only if not fully visible
        setTimeout(() => {
            const scrollContainer = overlayRef.current?.querySelector('.flex-1.overflow-y-auto');
            if (scrollContainer && target) {
                const targetRect = target.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();

                const isFullyVisible =
                    targetRect.top >= containerRect.top &&
                    targetRect.bottom <= containerRect.bottom;

                if (!isFullyVisible) {
                    const targetTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
                    scrollContainer.scrollTo({
                        top: Math.max(0, targetTop - 20), // 20px padding from top
                        behavior: 'smooth'
                    });
                }
            }
        }, 350);
    };

    const handleOverlayBlur = (e: React.FocusEvent) => {
        const relatedTarget = e.relatedTarget as Node | null;
        const isStillInOverlay = overlayRef.current?.contains(relatedTarget);

        if (isStillInOverlay) return;

        setIsFocused(false);
        if (onFocusChange) onFocusChange(false);
        setViewportStyle(undefined);
    };

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
                        style={{ touchAction: 'none' }}
                    />

                    {/* Slide-up Overlay */}
                    <motion.div
                        ref={overlayRef}
                        initial={{ y: "100%" }}
                        animate={{
                            y: 0,
                            height: isFocused && viewportStyle ? viewportStyle.height : 'auto',
                            top: isFocused && viewportStyle ? viewportStyle.top : 'auto'
                        }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
                        onFocus={handleOverlayFocus}
                        onBlur={handleOverlayBlur}
                        className="fixed inset-x-0 bottom-0 z-[61] outline-none"
                        style={{
                            maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)'
                        }}
                    >
                        {/* The Skirt */}
                        <div className="absolute top-full inset-x-0 h-[100vh] bg-rose-50 dark:bg-gray-900" />

                        {/* Inner Content Container */}
                        <div
                            className={`flex flex-col w-full overflow-hidden bg-rose-50 dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 rounded-t-[32px] transition-all duration-300 ${isFocused ? 'h-full' : ''}`}
                            style={{
                                maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)'
                            }}
                        >
                            {/* Header */}
                            <div className="shrink-0 z-10 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-rose-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        {step !== 'main' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setStep('main');
                                                    setSelectedType(null);
                                                    setSelectedTemplate(null);
                                                }}
                                                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </Button>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                                                <Gift className="text-white w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send a Gift</h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Surprise your partner</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClose}
                                        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth overscroll-contain">
                                <AnimatePresence mode="wait">
                                    {step === 'main' && (
                                        <motion.div
                                            key="main"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="p-6 space-y-4"
                                        >
                                            {/* Type Selection Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => {
                                                        handleTypeSelect('specific');
                                                        setStep('template-select');
                                                    }}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'specific'
                                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                                                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm'
                                                        }`}
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                        <Gift className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">Specific</div>
                                                        <div className="text-xs text-gray-500 mt-1">Choose a specific coupon</div>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => handleTypeSelect('random')}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'random'
                                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-purple-200 dark:hover:border-purple-800 shadow-sm'
                                                        }`}
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                                        <Shuffle className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">Random</div>
                                                        <div className="text-xs text-gray-500 mt-1">Send a mystery coupon</div>
                                                    </div>
                                                    {selectedType === 'random' && (
                                                        <div className="absolute top-2 right-2 text-purple-500">
                                                            <CheckCircle className="w-5 h-5 fill-current" />
                                                        </div>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        handleTypeSelect('create');
                                                        setStep('create-custom');
                                                    }}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'create'
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm'
                                                        }`}
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <PenTool className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">Custom</div>
                                                        <div className="text-xs text-gray-500 mt-1">Create your own coupon</div>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => handleTypeSelect('free_reign')}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'free_reign'
                                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-amber-200 dark:hover:border-amber-800 shadow-sm'
                                                        }`}
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                                        <Globe className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">Free Reign</div>
                                                        <div className="text-xs text-gray-500 mt-1">Partner's choice</div>
                                                    </div>
                                                    {selectedType === 'free_reign' && (
                                                        <div className="absolute top-2 right-2 text-amber-500">
                                                            <CheckCircle className="w-5 h-5 fill-current" />
                                                        </div>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Action Button (For immediate sends like Random/Free Reign) */}
                                            {(selectedType === 'random' || selectedType === 'free_reign') && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="sticky bottom-0 pt-4"
                                                >
                                                    <Button
                                                        className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25"
                                                        onClick={executeSend}
                                                        disabled={isSending}
                                                    >
                                                        {isSending ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                Sending Gift...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="w-5 h-5 mr-2" />
                                                                Send Gift Now
                                                            </>
                                                        )}
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}

                                    {step === 'template-select' && (
                                        <motion.div
                                            key="templates"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="p-6 space-y-4"
                                        >
                                            <div className="grid gap-4">
                                                {templates.map(template => (
                                                    <div
                                                        key={template.id}
                                                        onClick={() => handleTemplateSelect(template)}
                                                        className={`cursor-pointer transition-all transform hover:scale-[1.02] ${selectedTemplate?.id === template.id ? 'ring-2 ring-rose-500 rounded-xl' : ''}`}
                                                    >
                                                        <Coupon
                                                            title={template.title}
                                                            description={template.description}
                                                            isGift={false}
                                                            isPreview={true} // View only mode
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {selectedTemplate && (
                                                <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-rose-50 via-rose-50 to-transparent dark:from-gray-900 dark:via-gray-900 pb-4">
                                                    <Button
                                                        className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25"
                                                        onClick={executeSend}
                                                        disabled={isSending}
                                                    >
                                                        {isSending ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="w-5 h-5 mr-2" />
                                                                Send This Coupon
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {step === 'create-custom' && (
                                        <motion.div
                                            key="custom"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="p-6 space-y-6"
                                        >
                                            {/* Preview - Moved to Top */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview</label>
                                                <div className="transform scale-95 origin-top-left w-full">
                                                    <Coupon
                                                        title={customData.title || "Back Massage"}
                                                        description={customData.description || "Valid for 30 minutes of relaxation"}
                                                        isPreview={true}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                                    <Input
                                                        placeholder="e.g. Back Massage"
                                                        value={customData.title}
                                                        onChange={(e) => setCustomData(prev => ({ ...prev, title: e.target.value }))}
                                                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                                    <Textarea
                                                        placeholder="What does this coupon grant?"
                                                        value={customData.description}
                                                        onChange={(e) => setCustomData(prev => ({ ...prev, description: e.target.value }))}
                                                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 min-h-[100px]"
                                                    />
                                                </div>
                                            </div>

                                            {!isFocused && ( // Hide footer when focused
                                                <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-rose-50 via-rose-50 to-transparent dark:from-gray-900 dark:via-gray-900 pb-4">
                                                    <Button
                                                        className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25"
                                                        onClick={executeSend}
                                                        disabled={isSending || !customData.title || !customData.description}
                                                    >
                                                        {isSending ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="w-5 h-5 mr-2" />
                                                                Create & Send
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

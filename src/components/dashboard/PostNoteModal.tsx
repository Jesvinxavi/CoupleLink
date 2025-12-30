import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "../ui/button";
import { Loader2, Send, X, StickyNote } from "lucide-react";
import { useCoupleData } from '../../hooks/useCoupleData';
import { usePartnerNotes } from '../../hooks/usePartnerNotes';

interface PostNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFocusChange?: (isFocused: boolean) => void;
}

export function PostNoteModal({ isOpen, onClose, onFocusChange }: PostNoteModalProps) {
    const { couple, partner } = useCoupleData();
    const { sendNote } = usePartnerNotes();
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);

    // Mobile Viewport Logic
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);

    // Combined body lock + viewport resize handler
    useEffect(() => {
        if (!isOpen) return;

        // Robust Body Lock
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

            // Only update if a keyboard-triggering text input in our overlay is focused
            if (!isActiveInOverlay || !isTextInput) {
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
            window.scrollTo(0, parseInt(topStyle || '0') * -1);

            window.visualViewport?.removeEventListener('resize', handleVisualResize);
            window.visualViewport?.removeEventListener('scroll', handleVisualResize);

            // Reset focus state on close
            if (onFocusChange) onFocusChange(false);
        };
    }, [isOpen]);

    const handleOverlayFocus = (e: React.FocusEvent) => {
        const target = e.target as HTMLElement;
        const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        if (!isTextInput) return;

        if (overlayRef.current && window.visualViewport) {
            // Measure-Lock-Animate pattern
            const rect = overlayRef.current.getBoundingClientRect();
            setViewportStyle({ height: rect.height, top: rect.top });
            setIsFocused(true);
            if (onFocusChange) onFocusChange(true);

            requestAnimationFrame(() => {
                setViewportStyle({
                    height: window.visualViewport!.height,
                    top: window.visualViewport!.offsetTop
                });
            });
        } else {
            // Fallback for environments without visualViewport (or desktop testing)
            setIsFocused(true);
            if (onFocusChange) onFocusChange(true);
        }
    };

    const handleOverlayBlur = (e: React.FocusEvent) => {
        if (overlayRef.current?.contains(e.relatedTarget as Node)) return;
        setIsFocused(false);
        if (onFocusChange) onFocusChange(false);
        setViewportStyle(undefined);
    };

    const handleSend = async () => {
        if (!note.trim() || !couple) return;

        setSending(true);
        try {
            await sendNote(note);
            setNote("");
            onClose();
        } catch (error) {
            console.error("Error sending note:", error);
        } finally {
            setSending(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                        style={{ touchAction: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    />

                    {/* Slide-up Panel */}
                    <motion.div
                        ref={overlayRef}
                        initial={{ y: "100%" }}
                        animate={{
                            y: 0,
                            height: isFocused && viewportStyle ? viewportStyle.height : 'auto',
                            top: isFocused && viewportStyle ? viewportStyle.top : 'auto'
                        }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 35, stiffness: 150, mass: 1 }}
                        onFocus={handleOverlayFocus}
                        onBlur={handleOverlayBlur}
                        className="fixed inset-x-0 bottom-0 z-[51] outline-none overflow-hidden"
                        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        {/* The Skirt */}
                        <div
                            className="absolute top-full inset-x-0 h-[100vh] bg-rose-50 dark:bg-gray-900"
                            style={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        />

                        {/* Inner Content Container - Standard Overlay Look */}
                        <div
                            className="flex flex-col w-full bg-rose-50 dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 rounded-t-[32px] overflow-hidden"
                            style={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        >

                            {/* Distinct Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                        <StickyNote className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave a Note</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Brighten {partner?.first_name || 'your partner'}'s day with a note
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div
                                className="p-6 flex flex-col flex-1 bg-rose-50 dark:bg-gray-900 overflow-hidden"
                                style={{ touchAction: 'none' }}
                                onTouchMove={(e) => e.preventDefault()}
                            >

                                {/* Yellow Sticky Note Card - Embedded */}
                                <div
                                    className="bg-[#FEF9C3] dark:bg-yellow-900/20 border-t-8 border-t-yellow-200/50 border-x border-b-4 border-r-4 border-b-black/20 border-r-black/20 dark:border-t-yellow-900/40 dark:border-b-black/40 dark:border-r-black/40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-sm p-6 transform rotate-1 hover:rotate-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] will-change-transform"
                                    style={{ touchAction: 'none' }}
                                    onTouchMove={(e) => e.preventDefault()}
                                >

                                    {/* Note Header (Visual only since real header is above) */}
                                    <div className="mb-4">
                                        <h3 className="text-yellow-900 dark:text-yellow-100 font-handwriting text-2xl font-bold">Note</h3>
                                    </div>

                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Write something sweet..."
                                        className="w-full h-40 bg-transparent border-none resize-none focus:ring-0 text-gray-800 dark:text-gray-200 placeholder:text-yellow-700/50 dark:placeholder:text-yellow-500/50 font-handwriting text-xl leading-relaxed p-0 mb-2 overflow-hidden"
                                        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                                        onTouchStart={(e) => e.preventDefault()}
                                        onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onWheel={(e) => e.preventDefault()}
                                        autoFocus
                                    />

                                    {/* Inline Footer Action */}
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            onClick={handleSend}
                                            disabled={!note.trim() || sending}
                                            className="bg-gray-900 hover:bg-gray-800 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white rounded-full px-6 shadow-sm hover:shadow-md transition-all h-10"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Send <Send className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

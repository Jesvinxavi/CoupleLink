import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

import { ConfirmationModal } from '../ui/ConfirmationModal';
import { Calendar, MapPin, Image as ImageIcon, X, Loader2, Trash2 } from 'lucide-react';
import type { JournalEntry } from '../../context/JournalContext';

interface CreateJournalOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; location: string; country?: string; date: string; text: string; selectedFiles: File[]; existingMediaUrls: string[] }) => Promise<void>;
    onDelete: () => Promise<void>;
    initialEntry?: JournalEntry | null;
    isSubmitting: boolean;
    isDeleting: boolean;
    onFocusChange?: (isFocused: boolean) => void;
}

export function CreateJournalOverlay({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    initialEntry,
    isSubmitting,
    isDeleting,
    onFocusChange
}: CreateJournalOverlayProps) {
    // Form State
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [text, setText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    // Mobile Viewport Logic
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);


    // Generic Focus Handler (Measure-Lock-Animate)
    const handleOverlayFocus = (e: React.FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        // Exclude input types that don't trigger keyboard (date, time, etc.)
        const nonKeyboardInputTypes = ['date', 'time', 'datetime-local', 'month', 'week', 'color'];
        const isNonKeyboardInput = target.tagName === 'INPUT' && nonKeyboardInputTypes.includes(target.type);



        // Skip if not a text input or if it's a non-keyboard input type
        if (!isTextInput || isNonKeyboardInput) {

            return;
        }

        if (overlayRef.current && window.visualViewport) {
            // 1. Measure current 'unfocused' position
            const rect = overlayRef.current.getBoundingClientRect();


            // 2. Lock it immediately to this position (prevent jump)
            setViewportStyle({
                height: rect.height,
                top: rect.top
            });


            // 3. Set focused state
            setIsFocused(true);
            if (onFocusChange) onFocusChange(true);


            // 4. Animate to target visual viewport in next frame
            requestAnimationFrame(() => {
                const vvHeight = window.visualViewport!.height;
                const vvTop = window.visualViewport!.offsetTop;

                setViewportStyle({
                    height: vvHeight,
                    top: vvTop
                });
            });
        } else {

            setIsFocused(true);
            if (onFocusChange) onFocusChange(true);
        }
    };

    const handleOverlayBlur = (e: React.FocusEvent) => {
        const relatedTarget = e.relatedTarget as Node | null;
        const isStillInOverlay = overlayRef.current?.contains(relatedTarget);



        // Check if the new focus is still within the overlay
        if (isStillInOverlay) {

            return;
        }


        setIsFocused(false);
        if (onFocusChange) onFocusChange(false);
        setViewportStyle(undefined); // Clear viewport style on blur to reset

    };

    // Combined body lock + viewport resize handler (matches FantasyBucketListOverlay)
    useEffect(() => {
        if (isOpen) {


            // Robust Body Lock (save scroll position)
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';


            // Handle Visual Viewport for mobile keyboard
            const handleResize = () => {
                // Only update if focus is within this overlay
                const activeEl = document.activeElement;
                const isActiveInOverlay = overlayRef.current?.contains(activeEl);
                const isTextInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';



                // Only update if a text input in our overlay is focused
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

            window.visualViewport?.addEventListener('resize', handleResize);
            window.visualViewport?.addEventListener('scroll', handleResize);
            handleResize(); // Initial check

            return () => {

                const topStyle = document.body.style.top;
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                // Restore scroll position
                window.scrollTo(0, parseInt(topStyle || '0') * -1);


                window.visualViewport?.removeEventListener('resize', handleResize);
                window.visualViewport?.removeEventListener('scroll', handleResize);
            };
        }
    }, [isOpen]); // Only depends on isOpen, like Fantasy

    // Initialize from initialEntry
    useEffect(() => {
        if (isOpen) {
            if (initialEntry) {
                setTitle(initialEntry.title || '');
                setLocation(initialEntry.location || '');
                setDate(new Date(initialEntry.created_at).toISOString().split('T')[0]);
                setText(initialEntry.caption || '');
                setExistingMediaUrls(initialEntry.media_urls || []);
            } else {
                // Reset defaults for new entry
                setTitle('');
                setLocation('');
                setDate(new Date().toISOString().split('T')[0]);
                setText('');
                setExistingMediaUrls([]);
            }
            setSelectedFiles([]);
            setPreviewUrls([]);
        }
    }, [isOpen, initialEntry]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);

            // Create previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const removeExistingFile = (index: number) => {
        setExistingMediaUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Resolve country if location is provided
        let country = null;
        if (location.trim()) {
            try {
                const { resolveCountry } = await import('../../utils/geocoding');
                const result = await resolveCountry(location);
                if (result) country = result.country;
            } catch (e) {
                console.error("Failed to resolve country", e);
            }
        }

        onSubmit({
            title,
            location,
            country: country || undefined, // Add country to the data
            date,
            text,
            selectedFiles,
            existingMediaUrls
        });
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target;

        // Wait for keyboard animation to complete, then check if scroll is needed
        const scrollToInputIfNeeded = () => {
            // Get the scrollable container
            const scrollContainer = overlayRef.current?.querySelector('.flex-1.overflow-y-auto');
            if (scrollContainer && target) {
                // Calculate the target's position relative to the scroll container
                const targetRect = target.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();

                // Check if the input is already fully visible
                const isFullyVisible =
                    targetRect.top >= containerRect.top &&
                    targetRect.bottom <= containerRect.bottom;

                // Only scroll if input is not fully visible
                if (!isFullyVisible) {
                    // Scroll the input to a consistent position (near top of visible area with padding)
                    const targetTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
                    const scrollTarget = targetTop - 20; // 20px padding from top

                    scrollContainer.scrollTo({
                        top: Math.max(0, scrollTarget),
                        behavior: 'smooth'
                    });
                }
            }
        };

        // Wait for keyboard to fully appear
        setTimeout(scrollToInputIfNeeded, 350);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                        style={{ touchAction: 'none' }}
                    />

                    {/* Slide-up Overlay */}
                    <motion.div
                        ref={overlayRef}
                        initial={{ y: '100%' }}
                        animate={{
                            y: 0,
                            height: isFocused && viewportStyle ? viewportStyle.height : 'auto',
                            top: isFocused && viewportStyle ? viewportStyle.top : 'auto'
                        }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
                        onFocus={handleOverlayFocus}
                        onBlur={handleOverlayBlur}
                        className="fixed inset-x-0 bottom-0 z-[61] outline-none"
                        style={{
                            maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)'
                        }}
                    >
                        {/* The Skirt - synced background extension matching footer */}
                        <div className="absolute top-full inset-x-0 h-[100vh] bg-white dark:bg-gray-900" />

                        {/* Inner Content Container */}
                        <div
                            className={`flex flex-col w-full overflow-hidden bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 rounded-t-[32px] transition-all duration-300 ${isFocused ? 'h-full' : ''}`}
                            style={{
                                maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)'
                            }}
                        >
                            {/* Header */}
                            <div className="shrink-0 z-10 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {initialEntry ? 'Edit Post' : 'Add Post'}
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth overscroll-contain">
                                {/* Date Picker */}
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <div className="flex gap-2 relative">
                                        <Input
                                            id="date"
                                            type="text"
                                            readOnly
                                            value={date ? date.split('-').reverse().join('-') : ''}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="flex-1 pointer-events-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                        <div className="relative">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-10 px-0 shrink-0 text-gray-500 hover:text-rose-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                            >
                                                <Calendar className="w-4 h-4" />
                                            </Button>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-none"
                                                title="Select date"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="Give your memory a title..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onFocus={handleInputFocus}
                                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>

                                {/* Location */}
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="location">Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="location"
                                            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                            placeholder="Where did this happen?"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            onFocus={handleInputFocus}
                                        />
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div className="grid w-full items-center gap-2">
                                    <Label>Photos</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Existing Images */}
                                        {existingMediaUrls.map((url, idx) => (
                                            <div key={`existing-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden group shadow-sm">
                                                <img src={url} alt="Existing" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeExistingFile(idx)}
                                                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* New Previews */}
                                        {previewUrls.map((url, idx) => (
                                            <div key={`new-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden group shadow-sm">
                                                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileSelect}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Text Entry */}
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="text">Journal Entry</Label>
                                    <Textarea
                                        id="text"
                                        placeholder="Share your thoughts..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        onFocus={handleInputFocus}
                                        className="min-h-[150px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none p-4 leading-relaxed"
                                    />
                                </div>

                            </div>

                            {/* Sticky Footer - Only when NOT focused */}
                            {!isFocused && (
                                <div className="p-4 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-4 safe-area-bottom">
                                    <div className="flex gap-3">
                                        {initialEntry && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => setIsDeleteAlertOpen(true)}
                                                className="px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !text.trim() || !title.trim() || !date}
                                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white h-12 rounded-xl font-bold font-sans"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    {initialEntry ? 'Saving...' : 'Posting...'}
                                                </>
                                            ) : (initialEntry ? 'Save Changes' : 'Post')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Delete Confirmation */}
                    <ConfirmationModal
                        isOpen={isDeleteAlertOpen}
                        onClose={() => setIsDeleteAlertOpen(false)}
                        onConfirm={onDelete}
                        title="Delete Memory?"
                        description="Are you sure you want to delete this memory? This action cannot be undone."
                        variant="destructive"
                        confirmText="Delete"
                        loading={isDeleting}
                    />
                </>
            )}
        </AnimatePresence>
    );
}

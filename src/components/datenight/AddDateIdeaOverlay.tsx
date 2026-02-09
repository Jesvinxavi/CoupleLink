// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useRef, useEffect, type FocusEvent, type ChangeEvent, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Plus, Upload, CheckSquare, Trash2, Image as ImageIcon, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useAuth } from "@/context/AuthContext"
import type { DateIdeaItem } from "@/types/datenight"
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll"

interface AddDateIdeaOverlayProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    coupleId: string
    initialData?: DateIdeaItem | null
    onFocusChange?: (isFocused: boolean) => void
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function AddDateIdeaOverlay({ isOpen, onClose, onSuccess, coupleId, initialData, onFocusChange }: AddDateIdeaOverlayProps) {
    useLockBodyScroll(isOpen)

    const { user } = useAuth()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Initialize state with initialData if present
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");

    // Parse duration string "2 Hours" -> value: "2", unit: "Hours"
    const parseDuration = (durStr: string) => {
        if (!durStr) return { value: "", unit: "Hours" };
        const parts = durStr.split(' ');
        return {
            value: parts[0] || "",
            unit: parts[1] || "Hours"
        };
    };

    const initialDuration = parseDuration(initialData?.duration || "");
    const [durationValue, setDurationValue] = useState(initialDuration.value);
    const [durationUnit, setDurationUnit] = useState(initialDuration.unit);

    const [cost, setCost] = useState(initialData?.cost || "");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
    const [checklistItems, setChecklistItems] = useState<string[]>(initialData?.checklist || []);
    const [newItem, setNewItem] = useState("");
    const [isChecklistExpanded, setIsChecklistExpanded] = useState(!!initialData?.checklist?.length);

    // ═══════════════════════════════════════
    // REFS
    // ═══════════════════════════════════════
    const fileInputRef = useRef<HTMLInputElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    // Mobile Viewport Logic
    const [isFocused, setIsFocused] = useState(false);
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    // Viewport resize handler (matches FantasyBucketListOverlay)
    useEffect(() => {
        if (!isOpen) return;

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
            window.visualViewport?.removeEventListener('resize', handleVisualResize);
            window.visualViewport?.removeEventListener('scroll', handleVisualResize);
        };
    }, [isOpen]); // Only depends on isOpen

    useEffect(() => {
        return () => {
            if (file && previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [file, previewUrl])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleOverlayFocus = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        // Exclude input types that don't trigger keyboard (date, time, file, etc.)
        const nonKeyboardInputTypes = ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'file'];
        const isNonKeyboardInput = target.tagName === 'INPUT' && nonKeyboardInputTypes.includes(target.type);

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
                        top: Math.max(0, targetTop - 20),
                        behavior: 'smooth'
                    });
                }
            }
        }, 350);
    };

    const handleOverlayBlur = (e: FocusEvent) => {
        const relatedTarget = e.relatedTarget as Node | null;
        const isStillInOverlay = overlayRef.current?.contains(relatedTarget);

        if (isStillInOverlay) return;

        setIsFocused(false);
        if (onFocusChange) onFocusChange(false);
        setViewportStyle(undefined);
    };

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            const dur = parseDuration(initialData.duration);
            setDurationValue(dur.value);
            setDurationUnit(dur.unit);
            setCost(initialData.cost || "");
            setPreviewUrl(initialData.imageUrl);
            setFile(null);
            setChecklistItems(initialData.checklist || []);
            setIsChecklistExpanded(!!initialData.checklist?.length);
            setNewItem("");
            setErrorMessage(null);
        } else if (isOpen && !initialData) {
            resetForm();
        }
    }, [isOpen, initialData]);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (file && previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleAddChecklistItem = () => {
        if (newItem.trim()) {
            setChecklistItems([...checklistItems, newItem.trim()]);
            setNewItem("");
        }
    };

    const handleRemoveChecklistItem = (index: number) => {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDurationValue("");
        setDurationUnit("Hours");
        setCost("");
        setFile(null);
        setPreviewUrl(null);
        setChecklistItems([]);
        setNewItem("");
        setErrorMessage(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !coupleId) return;

        try {
            setLoading(true);
            setErrorMessage(null);
            let imageUrl = previewUrl; // Default to existing URL

            // Upload new image if selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${coupleId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('date_images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('date_images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;

                // CLEANUP: Delete old image if it exists and is being replaced
                if (initialData?.imageUrl && initialData.imageUrl !== imageUrl) {
                    const oldUrl = initialData.imageUrl;
                    // Check if it's a storage URL (simple check)
                    if (oldUrl.includes('/date_images/')) {
                        const path = oldUrl.split('/date_images/')[1];
                        if (path) {

                            const { error: deleteError } = await supabase.storage
                                .from('date_images')
                                .remove([path]);

                            if (deleteError) {
                                logger.warn("AddDateIdeaOverlay", "Error deleting old date image", deleteError);
                                // Non-blocking
                            }
                        }
                    }
                }
            }

            const dateData = {
                couple_id: coupleId,
                title,
                description,
                duration: `${durationValue} ${durationUnit}`,
                cost,
                image_url: imageUrl,
                checklist: checklistItems
            };

            let error;

            if (initialData?.id) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('user_dates')
                    .update(dateData)
                    .eq('id', initialData.id);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('user_dates')
                    .insert(dateData);
                error = insertError;
            }

            if (error) throw error;

            onSuccess();
            handleClose();
        } catch (error) {
            logger.error("AddDateIdeaOverlay", "Error saving date", error);
            setErrorMessage("Failed to save date. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (!isOpen) return null;

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
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
                        onClick={handleClose}
                        style={{ touchAction: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    />

                    {/* Slide-up Overlay */}
                    <motion.div
                        ref={overlayRef}
                        onFocus={handleOverlayFocus}
                        onBlur={handleOverlayBlur}
                        initial={{ y: '100%' }}
                        animate={{
                            y: 0,
                            height: isFocused && viewportStyle ? viewportStyle.height : 'auto',
                            top: isFocused && viewportStyle ? viewportStyle.top : 'auto'
                        }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
                        className="fixed inset-x-0 bottom-0 z-[61] outline-none overflow-hidden"
                        style={{
                            maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)',
                            touchAction: 'none',
                            overscrollBehavior: 'none'
                        }}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        {/* The Skirt */}
                        <div
                            className="absolute top-full inset-x-0 h-[100vh] bg-white dark:bg-gray-900"
                            style={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        />

                        {/* Inner Content Container */}
                        <div
                            className={`flex flex-col w-full overflow-hidden bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 rounded-t-[32px] transition-all duration-300 ${isFocused ? 'h-full' : ''}`}
                            style={{ maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)' }}
                        >
                            {/* Header */}
                            <div className="shrink-0 z-10 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {initialData ? "Edit Date Idea" : "Add New Date Idea"}
                                    </h2>
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
                            <div
                                className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth"
                                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                                onTouchMove={(e) => e.stopPropagation()}
                            >
                                <form id="date-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Picnic in the Park"
                                            required
                                            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe what you'll be doing..."
                                            required
                                            className="min-h-[100px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="duration">Approx. Duration</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="duration"
                                                    type="number"
                                                    min="0"
                                                    value={durationValue}
                                                    onChange={(e) => setDurationValue(e.target.value)}
                                                    placeholder="1"
                                                    required
                                                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-1 no-spinner text-base md:text-sm"
                                                />
                                                <div className="relative w-[110px]">
                                                    <select
                                                        value={durationUnit}
                                                        onChange={(e) => setDurationUnit(e.target.value)}
                                                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-white dark:bg-gray-700"
                                                    >
                                                        <option value="Minutes">Minutes</option>
                                                        <option value="Hours">Hours</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cost">Estimated Cost</Label>
                                            <div className="relative">
                                                <select
                                                    id="cost"
                                                    value={cost}
                                                    onChange={(e) => setCost(e.target.value)}
                                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-white dark:bg-gray-700"
                                                    required
                                                >
                                                    <option value="" disabled>Select cost...</option>
                                                    <option value="Free">Free</option>
                                                    <option value="$">$ (Cheap)</option>
                                                    <option value="$$">$$ (Moderate)</option>
                                                    <option value="$$$">$$$ (Expensive)</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1">
                                            Cover Image <span className="text-red-500">*</span>
                                        </Label>
                                        <div
                                            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-48 relative overflow-hidden group mt-2"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {previewUrl ? (
                                                <>
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover rounded-lg"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white font-medium flex items-center gap-2">
                                                            <Upload className="w-4 h-4" /> Change Image
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center text-gray-500">
                                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm font-medium">Click to upload image</p>
                                                    <p className="text-xs mt-1 text-gray-400">PNG, JPG up to 5MB</p>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                                            className="flex items-center justify-between w-full text-left bg-gray-50 dark:bg-gray-800 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                                                <CheckSquare className="w-4 h-4" /> Checklist (Optional)
                                            </Label>
                                            {isChecklistExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                        </button>

                                        {isChecklistExpanded && (
                                            <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newItem}
                                                        onChange={(e) => setNewItem(e.target.value)}
                                                        placeholder="Add item needed (e.g. Blanket, Wine)"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddChecklistItem();
                                                            }
                                                        }}
                                                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={handleAddChecklistItem}
                                                        variant="outline"
                                                        size="icon"
                                                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {checklistItems.length > 0 && (
                                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-2">
                                                        {checklistItems.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800 group"
                                                            >
                                                                <li className="flex items-center gap-2 text-sm list-none">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                    {item}
                                                                </li>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveChecklistItem(index)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {errorMessage && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                                            {errorMessage}
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Sticky Footer */}
                            <div className={`p-4 pt-2 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom ${isFocused ? 'hidden' : ''}`}>
                                <Button
                                    type="submit"
                                    form="date-form"
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white h-12 rounded-xl font-bold font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading || !title || !description || !durationValue || !cost || (!file && !previewUrl)}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {initialData ? "Saving..." : "Creating..."}
                                        </>
                                    ) : (
                                        initialData ? "Save Changes" : "Create Date"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

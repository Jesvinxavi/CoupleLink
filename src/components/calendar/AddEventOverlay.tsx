
// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect, useRef, type FocusEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Plus, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { logger } from '@/lib/logger';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import type { CalendarEvent } from '@/types/calendar';

export type { CalendarEvent };

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
type RecurrenceType = 'none' | 'monthly' | 'six_months' | 'yearly';

interface AddEventOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    eventToEdit?: CalendarEvent | null;
    initialValues?: Partial<CalendarEvent>;
    onSave: (event: CalendarEvent) => Promise<void>;
    onDelete: (eventId: string) => Promise<void>;
    onFocusChange?: (isFocused: boolean) => void;
}

interface Category {
    id: string;
    name: string;
    color: string;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Date Night', color: '#e11d48' },
    { id: '2', name: 'Trip', color: '#3b82f6' },
    { id: '3', name: 'Birthday', color: '#f59e0b' },
    { id: '4', name: 'Milestone', color: '#8b5cf6' },
    { id: '5', name: 'Work', color: '#64748b' },
    { id: '6', name: 'Social', color: '#10b981' },
    { id: '7', name: 'Anniversary', color: '#ec4899' },
];

const COLOR_PRESETS = [
    '#e11d48', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#84cc16', // Lime
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
];

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function AddEventOverlay({ isOpen, onClose, selectedDate, eventToEdit, initialValues, onSave, onDelete, onFocusChange }: AddEventOverlayProps) {
    useLockBodyScroll(isOpen);

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [title, setTitle] = useState('');
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORIES[0].id);
    const [selectedColor, setSelectedColor] = useState(DEFAULT_CATEGORIES[0].color);

    const [startDate, setStartDate] = useState(format(selectedDate, 'yyyy-MM-dd'));
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [endDate, setEndDate] = useState(format(selectedDate, 'yyyy-MM-dd'));

    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Color change confirmation
    const [pendingColor, setPendingColor] = useState<string | null>(null);
    const [showColorConfirm, setShowColorConfirm] = useState(false);


    // Color Picker State
    const [pickerState, setPickerState] = useState<{
        isOpen: boolean;
        type: 'main' | 'new'; // 'main' for category select, 'new' for add category
        anchorRect: DOMRect | null;
    }>({ isOpen: false, type: 'main', anchorRect: null });

    // ═══════════════════════════════════════
    // REFS
    // ═══════════════════════════════════════
    const mainColorBtnRef = useRef<HTMLButtonElement>(null);
    const newCategoryColorBtnRef = useRef<HTMLButtonElement>(null);

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Add Category
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PRESETS[0]);



    // Mobile Viewport Logic
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);

    const toDateInputValue = (value?: string | Date | null) => {
        if (!value) return null;
        const parsed = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        return format(parsed, 'yyyy-MM-dd');
    };

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
            const nonKeyboardInputTypes = ['date', 'time', 'datetime-local', 'month', 'week', 'color'];
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
        if (isOpen) {
            setErrorMessage(null);
            if (eventToEdit) {
                setTitle(eventToEdit.title);
                const normalizedStart = toDateInputValue(eventToEdit.event_date) || format(selectedDate, 'yyyy-MM-dd');
                setStartDate(normalizedStart);
                if (eventToEdit.end_date) {
                    setIsMultiDay(true);
                    setEndDate(toDateInputValue(eventToEdit.end_date) || normalizedStart);
                } else {
                    setIsMultiDay(false);
                    setEndDate(normalizedStart);
                }
                setLocation(eventToEdit.location || '');
                setDescription(eventToEdit.description || '');
                setRecurrence((eventToEdit.recurrence as RecurrenceType) || 'none');

                // Find or create category
                const existingCategory = categories.find(c => c.name === eventToEdit.category);
                if (existingCategory) {
                    setSelectedCategoryId(existingCategory.id);
                    setSelectedColor(eventToEdit.color);
                } else {
                    setSelectedColor(eventToEdit.color);
                }
            } else {
                // Reset form for new event
                setTitle(initialValues?.title || '');
                const initialStart = toDateInputValue(initialValues?.event_date) || format(selectedDate, 'yyyy-MM-dd');
                const initialEnd = toDateInputValue(initialValues?.end_date) || initialStart;
                setStartDate(initialStart);
                setEndDate(initialEnd);
                setIsMultiDay(!!initialValues?.end_date);
                setLocation(initialValues?.location || '');
                setDescription(initialValues?.description || '');
                setRecurrence((initialValues?.recurrence as RecurrenceType) || 'none');

                if (initialValues?.category) {
                    const category = categories.find(c => c.name === initialValues.category);
                    if (category) {
                        setSelectedCategoryId(category.id);
                        setSelectedColor(initialValues.color || category.color);
                    } else {
                        setSelectedCategoryId(DEFAULT_CATEGORIES[0].id);
                        setSelectedColor(initialValues.color || DEFAULT_CATEGORIES[0].color);
                    }
                } else {
                    setSelectedCategoryId(DEFAULT_CATEGORIES[0].id);
                    setSelectedColor(DEFAULT_CATEGORIES[0].color);
                }
            }
        }
    }, [isOpen, eventToEdit, selectedDate, initialValues, categories]);

    useEffect(() => {
        if (!eventToEdit) {
            const category = categories.find(c => c.id === selectedCategoryId);
            if (category) {
                setSelectedColor(category.color);
            }
        }
    }, [selectedCategoryId, categories, eventToEdit]);

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleOverlayFocus = (e: FocusEvent) => {
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
                    targetRect.top >= containerRect.top + 10 &&
                    targetRect.bottom <= containerRect.bottom - 10;

                if (!isFullyVisible) {
                    // For textareas/larger inputs, scroll more to give breathing room
                    const isTextarea = target.tagName === 'TEXTAREA';
                    const padding = isTextarea ? 40 : 20; // More padding for textareas

                    const targetTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
                    scrollContainer.scrollTo({
                        top: Math.max(0, targetTop - padding),
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

    const handleColorSelect = (color: string) => {
        if (pickerState.type === 'main') {
            setPendingColor(color);
            setShowColorConfirm(true);
        } else {
            setNewCategoryColor(color);
        }
        setPickerState(prev => ({ ...prev, isOpen: false }));
    };

    const openColorPicker = (type: 'main' | 'new', ref: RefObject<HTMLButtonElement | null>) => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPickerState({
                isOpen: true,
                type,
                anchorRect: rect
            });
        }
    };

    const confirmColorChange = () => {
        if (pendingColor) {
            setSelectedColor(pendingColor);
            setCategories(prev => prev.map(c =>
                c.id === selectedCategoryId ? { ...c, color: pendingColor } : c
            ));
        }
        setPendingColor(null);
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const newCategory: Category = {
            id: Math.random().toString(36).substr(2, 9),
            name: newCategoryName,
            color: newCategoryColor
        };
        setCategories([...categories, newCategory]);
        setSelectedCategoryId(newCategory.id);
        setIsAddingCategory(false);
        setNewCategoryName('');
    };

    const handleSubmit = async () => {
        if (!title.trim() || !startDate) return;

        setIsSubmitting(true);
        setErrorMessage(null);
        try {
            const categoryName = categories.find(c => c.id === selectedCategoryId)?.name || 'Event';

            // Resolve Country
            let country = null;
            if (location?.trim()) {
                try {
                    const { resolveCountry } = await import('@/utils/geocoding');
                    const result = await resolveCountry(location);
                    if (result) country = result.country;
                } catch (e) {
                    logger.warn('AddEventOverlay', 'Failed to resolve country', { error: e, location });
                }
            }

            await onSave({
                id: eventToEdit?.id,
                title,
                event_date: startDate,
                end_date: isMultiDay ? endDate : null,
                category: categoryName,
                color: selectedColor,
                location: location || null,
                country: country || null,
                description: description || null,
                recurrence
            });
            onClose();
        } catch (error) {
            logger.error('AddEventOverlay', 'Error saving event', error);
            setErrorMessage('Failed to save event. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!eventToEdit?.id) return;
        setIsDeleting(true);
        try {
            await onDelete(eventToEdit.id);
            setErrorMessage(null);
        } catch (error) {
            logger.error('AddEventOverlay', 'Error deleting event', error);
            setErrorMessage('Failed to delete event. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const isFormValid = title.trim() !== '' && startDate !== '' && (!isMultiDay || endDate !== '');



    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (!isOpen) return null;

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <>
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
                                            {eventToEdit ? 'Edit Event' : 'Add Event'}
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
                                <div
                                    className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth"
                                    style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                                    onTouchMove={(e) => e.stopPropagation()}
                                >
                                    {/* Title */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Event Title</Label>
                                        <input
                                            id="title"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                            placeholder="Event Title"
                                            required
                                        />
                                    </div>

                                    {/* Category & Color */}
                                    <div className="grid gap-2">
                                        <div className="flex justify-between items-center h-8">
                                            <Label>Category</Label>
                                            {!isAddingCategory ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsAddingCategory(true)}
                                                    className="h-7 text-xs text-gray-900 px-2 hover:bg-transparent md:hover:bg-accent md:hover:text-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Category
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => setIsAddingCategory(false)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs px-2 hover:bg-transparent md:hover:bg-accent md:hover:text-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={handleAddCategory}
                                                        size="sm"
                                                        className="h-7 text-xs bg-gray-900 text-white px-3 hover:bg-gray-900 md:hover:bg-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {isAddingCategory ? (
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="New Category Name"
                                                    className="flex-1 px-3 py-2 h-11 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                                />
                                                <button
                                                    ref={newCategoryColorBtnRef}
                                                    type="button"
                                                    onClick={() => openColorPicker('new', newCategoryColorBtnRef)}
                                                    className="w-11 h-11 rounded-md border border-gray-200 dark:border-gray-700 flex-shrink-0 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-500/50 input-button"
                                                    style={{ backgroundColor: newCategoryColor }}
                                                    title="Select Color"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={selectedCategoryId}
                                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                                    className="flex h-11 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {categories.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>

                                                <div className="relative">
                                                    <button
                                                        ref={mainColorBtnRef}
                                                        type="button"
                                                        onClick={() => openColorPicker('main', mainColorBtnRef)}
                                                        className="w-11 h-11 rounded-md border border-input flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                        style={{ backgroundColor: selectedColor }}
                                                        title="Change Color"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date Selection */}
                                    <div className="grid gap-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Date</Label>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="multi-day" className="text-xs text-gray-500 font-normal cursor-pointer">Multiple Days?</Label>
                                                <Switch
                                                    id="multi-day"
                                                    checked={isMultiDay}
                                                    onCheckedChange={setIsMultiDay}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-3">
                                            {/* Start Date */}
                                            <div className="flex gap-2 relative">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={startDate ? startDate.split('-').reverse().join('-') : ''}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50 pointer-events-none"
                                                />
                                                <div className="relative">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 w-11 shrink-0 p-0 text-gray-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-rose-500"
                                                    >
                                                        <CalendarIcon className="w-5 h-5" />
                                                    </Button>
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-none"
                                                        title="Select date"
                                                    />
                                                </div>
                                            </div>

                                            {/* End Date (Animated) */}
                                            {isMultiDay && (
                                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 relative">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={endDate ? endDate.split('-').reverse().join('-') : ''}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50 pointer-events-none"
                                                    />
                                                    <div className="relative">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-11 w-11 shrink-0 p-0 text-gray-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-rose-500"
                                                        >
                                                            <CalendarIcon className="w-5 h-5" />
                                                        </Button>
                                                        <input
                                                            type="date"
                                                            value={endDate}
                                                            onChange={(e) => setEndDate(e.target.value)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-none"
                                                            title="Select date"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recurrence */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="recurrence">Repeat</Label>
                                        <select
                                            id="recurrence"
                                            value={recurrence}
                                            onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                                            className="flex h-11 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="none">Does not repeat</option>
                                            <option value="monthly">Every month</option>
                                            <option value="six_months">Every 6 months</option>
                                            <option value="yearly">Every year</option>
                                        </select>
                                    </div>

                                    {/* Location */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="location">Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="location"
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                                placeholder="Location (Optional)"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-h-[100px] resize-none"
                                            placeholder="Notes (Optional)"
                                        />
                                    </div>

                                    {errorMessage && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                                            {errorMessage}
                                        </div>
                                    )}
                                </div>

                                {/* Sticky Footer */}
                                <div className={`p-4 pt-2 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom ${isFocused ? 'hidden' : ''}`}>
                                    <div className="flex justify-between items-center gap-3">
                                        {eventToEdit ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        ) : (
                                            <div />
                                        )}
                                        <Button
                                            className="flex-1 max-w-[200px] h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold"
                                            disabled={!isFormValid || isSubmitting}
                                            onClick={handleSubmit}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (eventToEdit ? 'Save Changes' : 'Add Event')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <ConfirmationModal
                            isOpen={showColorConfirm}
                            onClose={() => setShowColorConfirm(false)}
                            onConfirm={confirmColorChange}
                            title="Change Category Color"
                            description={`Are you sure you want to change the default color for ${categories.find(c => c.id === selectedCategoryId)?.name} ? `}
                            confirmText="Change Color"
                        />

                        <ConfirmationModal
                            isOpen={showDeleteConfirm}
                            onClose={() => setShowDeleteConfirm(false)}
                            onConfirm={handleDelete}
                            title="Delete Event?"
                            description="Are you sure you want to delete this event? This action cannot be undone."
                            variant="destructive"
                            confirmText="Delete"
                            loading={isDeleting}
                        />
                    </>
                )}
            </AnimatePresence >

            {/* Portal Color Picker */}
            {
                pickerState.isOpen && pickerState.anchorRect && createPortal(
                    <>
                        <div
                            className="fixed inset-0 z-[70]"
                            onClick={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
                        />
                        <div
                            className="fixed z-[71] p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-[180px] animate-in fade-in zoom-in-95 duration-200"
                            style={{
                                top: Math.min(window.innerHeight - 200, (pickerState.anchorRect?.bottom || 0) + 8),
                                left: Math.min(window.innerWidth - 190, Math.max(10, (pickerState.anchorRect?.left || 0) - 130 + (pickerState.anchorRect?.width || 0)))
                            }}
                        >
                            <div className="grid grid-cols-4 gap-2">
                                {COLOR_PRESETS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorSelect(color)}
                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${(pickerState.type === 'main' ? selectedColor : newCategoryColor) === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </>,
                    document.body
                )
            }
        </>
    );
}

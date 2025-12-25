import { useState, useEffect } from 'react';
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
}

export function CreateJournalOverlay({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    initialEntry,
    isSubmitting,
    isDeleting
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

    useEffect(() => {
        if (isOpen) {
            // Lock body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed'; // Required for iOS
            document.body.style.width = '100%';

            // Handle Visual Viewport for mobile keyboard
            const handleResize = () => {
                if (window.visualViewport) {
                    setViewportStyle({
                        height: window.visualViewport.height,
                        top: window.visualViewport.offsetTop
                    });
                }
            };

            window.visualViewport?.addEventListener('resize', handleResize);
            window.visualViewport?.addEventListener('scroll', handleResize);

            // Initial set
            handleResize();

            return () => {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                window.visualViewport?.removeEventListener('resize', handleResize);
                window.visualViewport?.removeEventListener('scroll', handleResize);
            };
        }
    }, [isOpen]);

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
        // Wait for keyboard to slide up
        setTimeout(() => {
            e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
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
                    />

                    {/* Slide-up Overlay */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
                        // Force height/top to match viewport to snap to visible area
                        style={viewportStyle ? {
                            height: `${viewportStyle.height}px`,
                            top: `${viewportStyle.top}px`
                        } : { height: 'auto' }}
                        className={`fixed inset-x-0 z-[61] bg-white dark:bg-gray-900 rounded-t-3xl shadow-xl flex flex-col overflow-hidden ${viewportStyle ? '' : 'bottom-0'}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
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

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

                        {/* Footer */}
                        <div className="p-4 pt-2 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
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

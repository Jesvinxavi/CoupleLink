import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Book, MapPin, Pencil, Search } from 'lucide-react';
import { DateBadge } from '../ui/DateBadge';
import { ImageCarousel } from '../ui/ImageCarousel';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { CreateJournalOverlay } from './CreateJournalOverlay';
import { UserAvatar } from '../ui/UserAvatar';

export interface JournalEntry {
    id: string;
    caption: string | null;
    created_at: string;
    uploader_id: string | null;
    title: string | null;
    location: string | null;
    country: string | null;
    media_urls: string[] | null;
    profiles?: {
        first_name: string | null;
        avatar_url: string | null;
    };
    reactions?: {
        id: string;
        emoji: string;
        user_id: string;
    }[];
}

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '😢', '👏'];

export function JournalFeed() {
    const { couple, currentUser } = useCoupleData();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reaction State
    const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null); // Entry ID
    const [showAllEmojis, setShowAllEmojis] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const fetchEntries = async () => {
        if (!couple) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('memories')
                .select(`
                    *,
                    profiles:uploader_id (
                        first_name,
                        avatar_url
                    ),
                    reactions:journal_reactions (
                        id,
                        emoji,
                        user_id
                    )
                `)
                .eq('couple_id', couple.id)
                .eq('type', 'journal')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data as any);
        } catch (err) {
            console.error('Error fetching journal entries:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [couple]);

    // Check for action=new_post in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'new_post') {
            setIsDialogOpen(true);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowReactionPicker(null);
                setShowAllEmojis(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    const handleEdit = (entry: JournalEntry) => {
        setEditingId(entry.id);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setIsDialogOpen(false);
    };

    const handleSaveEntry = async (data: { title: string; location: string; date: string; text: string; selectedFiles: File[]; existingMediaUrls: string[] }) => {
        const { title, location, date, text, selectedFiles, existingMediaUrls } = data;

        if (!text.trim() || !title.trim() || !date) return;
        if (!couple) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            let uploadedUrls: string[] = [];

            // Upload new images
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${couple.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('memories')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('memories')
                        .getPublicUrl(filePath);

                    uploadedUrls.push(publicUrl);
                }
            }

            const finalMediaUrls = [...existingMediaUrls, ...uploadedUrls];

            if (editingId) {
                // Update existing entry
                const { error } = await supabase
                    .from('memories')
                    .update({
                        caption: text,
                        title: title || null,
                        location: location || null,
                        media_urls: finalMediaUrls.length > 0 ? finalMediaUrls : null,
                        created_at: new Date(date).toISOString()
                    })
                    .eq('id', editingId);

                if (error) throw error;
            } else {
                // Insert new entry
                const { error } = await supabase
                    .from('memories')
                    .insert({
                        couple_id: couple.id,
                        uploader_id: user.id,
                        type: 'journal',
                        caption: text,
                        title: title || null,
                        location: location || null,
                        media_urls: finalMediaUrls.length > 0 ? finalMediaUrls : null,
                        created_at: new Date(date).toISOString()
                    });

                if (error) throw error;
            }

            resetForm();
            fetchEntries();

        } catch (err) {
            console.error('Error saving post:', err);
            alert('Failed to save post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleDelete = async () => {
        if (!editingId || !couple) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('memories')
                .delete()
                .eq('id', editingId);

            if (error) throw error;

            setIsDeleteAlertOpen(false);
            resetForm();
            fetchEntries();
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTouchStart = (entryId: string) => {
        if (navigator.vibrate) navigator.vibrate(50);
        const timer = setTimeout(() => {
            setShowReactionPicker(entryId);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500); // 500ms long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleReaction = async (entryId: string, emoji: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if user already reacted with this emoji
            const existingReaction = entries
                .find(e => e.id === entryId)
                ?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

            if (existingReaction) {
                // Remove reaction
                await (supabase as any)
                    .from('journal_reactions')
                    .delete()
                    .eq('id', existingReaction.id);
            } else {
                // Add reaction
                await (supabase as any)
                    .from('journal_reactions')
                    .insert({
                        memory_id: entryId,
                        user_id: user.id,
                        emoji
                    });
            }

            setShowReactionPicker(null);
            setShowAllEmojis(false);
            fetchEntries(); // Refresh to show updated reactions
        } catch (err) {
            console.error('Error handling reaction:', err);
        }
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Wait for keyboard to slide up to prevent layout jumps/overscroll
        setTimeout(() => {
            e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
    };

    return (
        <div className="space-y-8">
            {/* Focus Mode Overlay */}
            <AnimatePresence>
                {showReactionPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => {
                            setShowReactionPicker(null);
                            setShowAllEmojis(false);
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Search and Create Post */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search Your Feed..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={handleInputFocus}
                        className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                </div>
                <Button
                    className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
                    onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4" />
                    New Post
                </Button>

                <CreateJournalOverlay
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={async (data) => {
                        // Map internal form data to state
                        // Ideally we refactor handle submit to accept args, 
                        // but sticking to state updates to minimize code changes rapidly

                        // We need to set state and then call submit, BUT handleSubmit uses state.
                        // Better to refactor handleSubmit to accept data, or update state here and rely on logic?
                        // Let's refactor handleSubmit to optionally accept data or use state?
                        // Actually, 'CreateJournalOverlay' handles the UI, but we need to pass the "execute" logic.

                        // Let's modify handleSubmit to generic function that takes values
                        await handleSaveEntry(data);
                    }}
                    onDelete={handleDelete}
                    initialEntry={editingId ? entries.find(e => e.id === editingId) : null}
                    isSubmitting={isSubmitting}
                    isDeleting={isDeleting}
                />



                {/* Delete Confirmation Dialog */}
                <ConfirmationModal
                    isOpen={isDeleteAlertOpen}
                    onClose={() => setIsDeleteAlertOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Post?"
                    description="Are you sure you want to delete this memory? This action cannot be undone."
                    variant="destructive"
                    confirmText="Delete"
                    loading={isDeleting}
                />
            </div>

            {/* Feed */}
            {
                loading ? (
                    <div className="space-y-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-16 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                                </div>
                                <div className="flex-1 h-40 bg-gray-200 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 shadow-none">
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <Book className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No journal entries yet</h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                Be the first to write something special for your partner.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {(() => {
                            const filteredEntries = entries.filter(entry =>
                                !searchQuery || (entry.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                            );

                            let lastMonthYear = '';

                            return filteredEntries.map((entry) => {
                                const date = new Date(entry.created_at);
                                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                                const showSeparator = monthYear !== lastMonthYear;
                                if (showSeparator) {
                                    lastMonthYear = monthYear;
                                }

                                return (
                                    <div key={entry.id} className="space-y-2">
                                        {showSeparator && (
                                            <div className="flex items-center gap-4 pt-4 first:pt-0">
                                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {monthYear}
                                                </h2>
                                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                                            </div>
                                        )}

                                        <div className={`relative group transition-all duration-300 ${showReactionPicker === entry.id ? 'z-50 scale-105' : ''}`}>
                                            {/* Reactions Display */}
                                            {entry.reactions && entry.reactions.length > 0 && (
                                                <div className="absolute -top-3 -right-3 z-30 pointer-events-none drop-shadow-lg">
                                                    {Array.from(new Set(entry.reactions.map(r => r.emoji))).map((emoji, idx) => (
                                                        <div key={idx} className="text-5xl transform rotate-12">
                                                            {emoji}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div
                                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative"
                                                onTouchStart={() => handleTouchStart(entry.id)}
                                                onTouchEnd={handleTouchEnd}
                                                onMouseDown={() => handleTouchStart(entry.id)}
                                                onMouseUp={handleTouchEnd}
                                                onMouseLeave={handleTouchEnd}
                                            >


                                                <div className="p-5 space-y-2">
                                                    {/* Header: Date | Avatar | Title */}
                                                    {/* Header: Date | Avatar Row -> Title Row */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <DateBadge
                                                                date={new Date(entry.created_at)}
                                                                className="w-10 h-11 shrink-0 scale-90 origin-left"
                                                            />

                                                            <UserAvatar
                                                                user={entry.profiles}
                                                                className="h-10 w-10 shadow-sm border border-gray-100 dark:border-gray-700"
                                                            />
                                                            {entry.location && (
                                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <span className="truncate max-w-[150px]">{entry.location}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 w-full">
                                                            {entry.title ? (
                                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight break-words">
                                                                    {entry.title}
                                                                </h3>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Untitled Memory</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Caption */}
                                                    {entry.caption && (
                                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                            {entry.caption}
                                                        </p>
                                                    )}

                                                    {/* Image Carousel - Moved Below Text */}
                                                    {entry.media_urls && entry.media_urls.length > 0 && (
                                                        <div className="w-full mt-4">
                                                            <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm">
                                                                <ImageCarousel
                                                                    images={entry.media_urls}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reaction Picker Popover */}
                                            <AnimatePresence>
                                                {showReactionPicker === entry.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-100%" }}
                                                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-120%" }}
                                                        exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-100%" }}
                                                        className="absolute top-0 left-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50"
                                                        ref={pickerRef}
                                                    >
                                                        {!showAllEmojis ? (
                                                            <div className="flex gap-2 items-center">
                                                                {EMOJI_OPTIONS.map((emoji) => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleReaction(entry.id, emoji);
                                                                        }}
                                                                        className={`w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-110 ${entry.reactions?.some(r => r.emoji === emoji && r.user_id === currentUser?.id)
                                                                            ? 'bg-rose-100 dark:bg-rose-900/50 ring-2 ring-rose-500'
                                                                            : ''
                                                                            }`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                                <button
                                                                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowAllEmojis(true);
                                                                    }}
                                                                >
                                                                    <Plus className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        handleEdit(entry);
                                                                    }}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-5 gap-2 p-1 max-h-48 overflow-y-auto w-64 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                                                {[...EMOJI_OPTIONS, '🥰', '😍', '😘', '🤗', '🤩', '🥳', '😎', '🥺', '😭', '😤', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji) => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleReaction(entry.id, emoji);
                                                                        }}
                                                                        className={`w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-110 ${entry.reactions?.some(r => r.emoji === emoji && r.user_id === currentUser?.id)
                                                                            ? 'bg-rose-100 dark:bg-rose-900/50 ring-2 ring-rose-500'
                                                                            : ''
                                                                            }`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )
            }
        </div >
    );
}


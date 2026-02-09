import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCoupleData } from '@/hooks/useCoupleData';
import { logger } from '@/lib/logger';
import { useJournalContext, type JournalEntry } from './JournalContext';
import { CreateJournalOverlay } from '@/components/journal/CreateJournalOverlay';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface JournalModalContextType {
    openNewPost: () => void;
    openEditPost: (entry: JournalEntry) => void;
    isOverlayOpen: boolean;
    isOverlayFocused: boolean;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const JournalModalContext = createContext<JournalModalContextType | null>(null);

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useJournalModals() {
    const context = useContext(JournalModalContext);
    if (!context) {
        throw new Error('useJournalModals must be used within JournalModalProvider');
    }
    return context;
}

interface JournalModalProviderProps {
    children: ReactNode;
}

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export function JournalModalProvider({ children }: JournalModalProviderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { couple } = useCoupleData();
    const { saveEntry, deleteEntry } = useJournalContext();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isOverlayFocused, setIsOverlayFocused] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Open modal and navigate to journal
    const openWithNavigation = useCallback((openFn: () => void) => {
        openFn();
        // Navigate after modal opens
        setTimeout(() => {
            if (location.pathname !== '/journal') {
                navigate('/journal', { replace: true });
            }
        }, 100);
    }, [location.pathname, navigate]);

    const openNewPost = useCallback(() => {
        setEditingEntry(null);
        openWithNavigation(() => setIsDialogOpen(true));
    }, [openWithNavigation]);

    const openEditPost = useCallback((entry: JournalEntry) => {
        setEditingEntry(entry);
        setIsDialogOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsDialogOpen(false);
        setEditingEntry(null);
    }, []);

    const handleSubmit = useCallback(async (data: any) => {
        if (!couple) return;
        setIsSubmitting(true);
        try {
            await saveEntry(data, editingEntry?.id);
            handleClose();
        } catch (error) {
            logger.error('JournalModalContext', 'Error saving journal entry', error);
            alert('Failed to save post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [couple, saveEntry, editingEntry?.id, handleClose]);

    const handleDelete = useCallback(async () => {
        if (!editingEntry) return;
        setIsDeleting(true);
        try {
            await deleteEntry(editingEntry.id);
            handleClose();
        } catch (error) {
            logger.error('JournalModalContext', 'Error deleting journal entry', error);
            alert('Failed to delete post. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    }, [editingEntry, deleteEntry, handleClose]);

    const contextValue = useMemo(() => ({
        openNewPost,
        openEditPost,
        isOverlayOpen: isDialogOpen,
        isOverlayFocused
    }), [openNewPost, openEditPost, isDialogOpen, isOverlayFocused]);

    return (
        <JournalModalContext.Provider value={contextValue}>
            {children}
            <CreateJournalOverlay
                isOpen={isDialogOpen}
                onClose={handleClose}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                initialEntry={editingEntry}
                isSubmitting={isSubmitting}
                isDeleting={isDeleting}
                onFocusChange={setIsOverlayFocused}
            />
        </JournalModalContext.Provider>
    );
}

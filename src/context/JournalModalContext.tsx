import { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCoupleData } from '../hooks/useCoupleData';
import { useJournalEntry } from '../hooks/useJournalEntry';
import { CreateJournalOverlay } from '../components/journal/CreateJournalOverlay'; // Adjust path if needed
import type { JournalEntry } from '../components/journal/JournalFeed';

interface JournalModalContextType {
    openNewPost: () => void;
    openEditPost: (entry: JournalEntry) => void;
    journalVersion: number;
}

const JournalModalContext = createContext<JournalModalContextType | null>(null);

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

export function JournalModalProvider({ children }: JournalModalProviderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { couple } = useCoupleData();
    const { saveJournalEntry, deleteJournalEntry } = useJournalEntry();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [journalVersion, setJournalVersion] = useState(0);

    // Open modal and navigate to journal
    const openWithNavigation = (openFn: () => void) => {
        openFn();
        // Navigate after modal opens
        setTimeout(() => {
            if (location.pathname !== '/journal') {
                navigate('/journal', { replace: true });
            }
        }, 100);
    };

    const openNewPost = () => {
        setEditingEntry(null);
        openWithNavigation(() => setIsDialogOpen(true));
    };

    const openEditPost = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setIsDialogOpen(true); // Edit is usually done on the page itself, but good to have capability
    };

    const handleClose = () => {
        setIsDialogOpen(false);
        setEditingEntry(null);
    };

    const handleSubmit = async (data: any) => {
        if (!couple) return;
        setIsSubmitting(true);
        try {
            await saveJournalEntry(data, couple, editingEntry?.id);
            setJournalVersion(v => v + 1);
            handleClose();
        } catch (error) {
            console.error('Error saving journal entry:', error);
            alert('Failed to save post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingEntry) return;
        setIsDeleting(true);
        try {
            await deleteJournalEntry(editingEntry.id);
            setJournalVersion(v => v + 1);
            handleClose(); // Close the edit/post modal
            // If there was a confirmation modal, it should be handled by the overlay or separately. 
            // CreateJournalOverlay has 'onDelete'.
        } catch (error) {
            console.error('Error deleting journal entry:', error);
            alert('Failed to delete post. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <JournalModalContext.Provider value={{ openNewPost, openEditPost, journalVersion }}>
            {children}
            <CreateJournalOverlay
                isOpen={isDialogOpen}
                onClose={handleClose}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                initialEntry={editingEntry}
                isSubmitting={isSubmitting}
                isDeleting={isDeleting}
            />
        </JournalModalContext.Provider>
    );
}

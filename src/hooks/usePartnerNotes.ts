import { usePartnerNotesContext } from '@/context/PartnerNotesContext';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
// Export Note type so components don't break
export type { Note } from '@/context/PartnerNotesContext';

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
// Thin wrapper around PartnerNotesContext to keep imports stable.
export const usePartnerNotes = () => {
    return usePartnerNotesContext();
};

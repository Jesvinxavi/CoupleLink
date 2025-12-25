import { usePartnerNotesContext } from '../context/PartnerNotesContext';

// Export Note type so components don't break
export type { Note } from '../context/PartnerNotesContext';

export const usePartnerNotes = () => {
    return usePartnerNotesContext();
};

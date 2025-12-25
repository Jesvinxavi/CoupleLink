import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, Send } from "lucide-react";
import { useCoupleData } from '../../hooks/useCoupleData';
import { usePartnerNotes } from '../../hooks/usePartnerNotes';

interface PostNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PostNoteModal({ isOpen, onClose }: PostNoteModalProps) {
    const { couple } = useCoupleData();
    const { sendNote } = usePartnerNotes();
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[85vw] max-w-md bg-[#FEF9C3] border-none border-t-8 border-yellow-200/50 shadow-xl p-0 overflow-hidden rounded-sm">
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-yellow-900 font-handwriting text-2xl">Leave a Note</DialogTitle>
                    </DialogHeader>

                    <div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Write something sweet..."
                            className="w-full h-40 bg-transparent border-none resize-none focus:ring-0 text-gray-800 placeholder:text-yellow-700/50 font-handwriting text-xl leading-relaxed p-0 min-h-[150px] overscroll-contain border-gray-200 dark:border-gray-700 focus:border-rose-500"
                        />

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={handleSend}
                                disabled={!note.trim() || sending}
                                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 shadow-sm hover:shadow-md transition-all"
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
            </DialogContent>
        </Dialog>
    );
}

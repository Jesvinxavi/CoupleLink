// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog"
import { Button } from "./button"
import { History, Image as ImageIcon, BookHeart, Clock, AlertTriangle } from "lucide-react"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface FoundArchivedSpaceModalProps {
    isOpen: boolean
    stats: {
        photo_count: number
        journal_count: number
        duration_days: number
        expires_at?: string | null
    } | null
    onRestore: () => void
    onDismiss: () => void
    loading: boolean
    error?: string | null
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function FoundArchivedSpaceModal({
    isOpen,
    stats,
    onRestore,
    onDismiss,
    loading,
    error
}: FoundArchivedSpaceModalProps) {
    if (!stats) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onDismiss()}>
            <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-500" />
                        Found Shared History!
                    </DialogTitle>
                    <DialogDescription>
                        We noticed you and your partner have a previous space. Would you like to restore it?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-4 py-6">
                    <div className="flex flex-col items-center justify-center p-3 bg-orange-50 rounded-lg text-center gap-1 border border-orange-100">
                        <Clock className="w-5 h-5 text-orange-500 mb-1" />
                        <span className="font-bold text-lg text-orange-700">{stats.duration_days}</span>
                        <span className="text-xs text-orange-600/80">Days Together</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center gap-1 border border-blue-100">
                        <ImageIcon className="w-5 h-5 text-blue-500 mb-1" />
                        <span className="font-bold text-lg text-blue-700">{stats.photo_count}</span>
                        <span className="text-xs text-blue-600/80">Photos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-pink-50 rounded-lg text-center gap-1 border border-pink-100">
                        <BookHeart className="w-5 h-5 text-pink-500 mb-1" />
                        <span className="font-bold text-lg text-pink-700">{stats.journal_count}</span>
                        <span className="text-xs text-pink-600/80">Memories</span>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-medium">Warning</p>
                        <p>{stats.expires_at
                            ? `This history will be permanently deleted in ${Math.max(0, Math.ceil((new Date(stats.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days if not restored.`
                            : "This history will be permanently deleted in 7 days if not restored."
                        }</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <DialogFooter className="flex-col gap-2 sm:gap-0">
                    <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => onDismiss()}
                            disabled={loading}
                            className="w-full sm:w-auto text-gray-500"
                        >
                            Maybe Later
                        </Button>
                        <Button
                            onClick={() => onRestore()}
                            disabled={loading}
                            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                        >
                            {loading ? "Restoring..." : "Restore Old Space"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

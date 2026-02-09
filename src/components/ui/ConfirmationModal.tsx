// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    loading?: boolean
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    loading = false,
}: ConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[425px] rounded-xl sm:rounded-lg" hideClose={true}>
                <DialogHeader className="text-left">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        className={variant === 'default' ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

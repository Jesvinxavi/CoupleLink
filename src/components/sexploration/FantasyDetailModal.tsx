import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import type { Fantasy } from '../../hooks/useFantasyBucketList';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';

interface FantasyDetailModalProps {
    fantasy: Fantasy | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string) => Promise<void>;
    onVeto: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onComplete: (id: string) => Promise<void>;
    isRequester: (fantasy: Fantasy) => boolean;
}

export function FantasyDetailModal({
    fantasy,
    isOpen,
    onClose,
    onApprove,
    onVeto,
    onDelete,
    onComplete,
    isRequester
}: FantasyDetailModalProps) {
    if (!fantasy) return null;

    const isMyRequest = isRequester(fantasy);
    const isPending = fantasy.status === 'pending';
    const isApproved = fantasy.status === 'approved';
    const isCompleted = fantasy.status === 'completed';

    const handleApprove = () => {
        onApprove(fantasy.id); // Fire and forget - optimistic update handles UI
        onClose();
    };

    const handleVeto = () => {
        onVeto(fantasy.id); // Fire and forget
        onClose();
    };

    const handleDelete = () => {
        onDelete(fantasy.id); // Fire and forget
        onClose();
    };

    const handleComplete = () => {
        onComplete(fantasy.id); // Fire and forget
        onClose();
    };

    // Determine status badge and text box colors
    const getStatusBadge = () => {
        if (isCompleted) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    <span className="material-symbols-outlined text-xs">task_alt</span>
                    Completed
                </span>
            );
        }
        if (isApproved) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Approved
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <span className="material-symbols-outlined text-xs animate-pulse">pending</span>
                Pending
            </span>
        );
    };

    const getTextBoxStyles = () => {
        if (isCompleted) {
            return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
        }
        if (isApproved) {
            return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
        }
        return 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[85vw] max-w-md rounded-3xl overflow-hidden bg-rose-50 dark:bg-gray-900 border-none shadow-2xl p-0" hideClose={true}>
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <DialogTitle className="text-lg">Fantasy Request</DialogTitle>
                        {getStatusBadge()}
                    </div>
                </DialogHeader>

                <div className="px-6">
                    <div className="space-y-5 mt-4">
                        {/* Requester Info with Avatar */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3"
                        >
                            <Avatar className="w-12 h-12 border-2 border-rose-200 dark:border-gray-700">
                                <AvatarImage src={fantasy.requester_avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600">
                                    {fantasy.requester_name?.charAt(0)?.toUpperCase() || 'P'}
                                </AvatarFallback>
                            </Avatar>
                            <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {fantasy.requester_name}
                                </span>{' '}
                                would like to...
                            </p>
                        </motion.div>

                        {/* Fantasy Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`p-5 rounded-2xl ${getTextBoxStyles()}`}
                        >
                            <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                                {fantasy.fantasy_text}
                            </p>
                        </motion.div>

                        {/* Completion Date for completed fantasies */}
                        {isCompleted && fantasy.completed_at && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-sm text-gray-500"
                            >
                                <span className="material-symbols-outlined text-blue-500 text-sm mr-1 align-middle">celebration</span>
                                Completed on {format(new Date(fantasy.completed_at), 'dd-MM-yyyy')}
                            </motion.div>
                        )}

                        {/* Actions */}
                        {isPending ? (
                            isMyRequest ? (
                                /* Requester sees delete button */
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="pt-2"
                                >
                                    <Button
                                        onClick={handleDelete}
                                        className="w-full py-5 text-base bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl border-none shadow-none"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Request
                                    </Button>
                                </motion.div>
                            ) : (
                                /* Recipient sees approve/veto buttons */
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex gap-3"
                                >
                                    <Button
                                        onClick={handleVeto}
                                        className="flex-1 py-6 text-base bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl border-none shadow-none"
                                    >
                                        <X className="w-5 h-5 mr-2" />
                                        Veto
                                    </Button>
                                    <Button
                                        onClick={handleApprove}
                                        className="flex-1 py-6 text-lg bg-green-500 hover:bg-green-600 text-white rounded-xl"
                                    >
                                        <span className="material-symbols-outlined mr-2">check</span>
                                        Approve
                                    </Button>
                                </motion.div>
                            )
                        ) : isApproved ? (
                            /* Both users see Mark as Completed button for approved fantasies */
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Button
                                    onClick={handleComplete}
                                    className="w-full py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
                                >
                                    <span className="material-symbols-outlined mr-2">add_task</span>
                                    Mark as Completed
                                </Button>
                                <p className="text-center text-xs text-gray-400 mt-2">
                                    Completing earns +5 Love Points!
                                </p>
                            </motion.div>
                        ) : null}
                    </div>
                </div>
                <div className="h-3" /> {/* Bottom spacer */}
            </DialogContent>
        </Dialog>
    );
}

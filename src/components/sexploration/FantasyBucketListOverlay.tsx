import { useState, useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Fantasy } from '../../hooks/useFantasyBucketList';
import { FantasyDetailModal } from './FantasyDetailModal';
import { X, Loader2 } from 'lucide-react';

interface FantasyBucketListOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    fantasies: Fantasy[];
    pendingCount: number;
    approvedCount: number;
    completedCount: number;
    loading: boolean;
    addFantasy: (text: string) => Promise<void>;
    approveFantasy: (id: string) => Promise<void>;
    vetoFantasy: (id: string) => Promise<void>;
    deleteFantasy: (id: string) => Promise<void>;
    completeFantasy: (id: string) => Promise<void>;
    isRequester: (fantasy: Fantasy) => boolean;
}

export function FantasyBucketListOverlay({
    isOpen,
    onClose,
    fantasies,
    pendingCount,
    approvedCount,
    completedCount,
    loading,
    addFantasy,
    approveFantasy,
    vetoFantasy,
    deleteFantasy,
    completeFantasy,
    isRequester
}: FantasyBucketListOverlayProps) {
    const [inputText, setInputText] = useState('');
    const [selectedFantasy, setSelectedFantasy] = useState<Fantasy | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'completed'>('approved');
    const [slideDirection, setSlideDirection] = useState(1); // 1 = right, -1 = left
    const inputRef = useRef<HTMLInputElement>(null);

    // Tab order: approved (0), pending (1), completed (2)
    const tabOrder = { approved: 0, pending: 1, completed: 2 };

    const handleTabChange = (newTab: 'approved' | 'pending' | 'completed') => {
        if (newTab === activeTab) return;
        // Set direction based on tab order
        setSlideDirection(tabOrder[newTab] > tabOrder[activeTab] ? 1 : -1);
        setActiveTab(newTab);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isSending) return;

        setIsSending(true);
        setSlideDirection(1); // Moving to pending (right)
        setActiveTab('pending');
        await addFantasy(inputText.trim());
        setInputText('');
        setIsSending(false);
        inputRef.current?.focus();
    };

    const filteredFantasies = fantasies.filter(f => f.status === activeTab);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={onClose}
                        />

                        {/* Slide-up Panel */}
                        <motion.div
                            layout
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
                            className="fixed inset-x-0 bottom-0 z-50 bg-rose-50 dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[calc(100dvh-70px)] flex flex-col"
                        >
                            {/* Header */}
                            <div className="shrink-0 z-10">
                                {/* Title Section - White */}
                                <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-t-3xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                <span className="material-symbols-outlined text-white">auto_awesome</span>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fantasy Bucket List</h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Dream together, achieve together</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={onClose}
                                            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Tabs Section - Pink (matches body) */}
                                <div className="px-6 pt-6 pb-2 bg-rose-50 dark:bg-gray-900 flex justify-center">
                                    <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-full p-1 w-fit min-w-[280px]">
                                        {/* Sliding background */}
                                        <motion.div
                                            className="absolute inset-y-1 w-[calc(33.33%-4px)] rounded-full bg-white dark:bg-gray-600 shadow-sm"
                                            initial={false}
                                            animate={{
                                                x: activeTab === 'approved'
                                                    ? 4
                                                    : activeTab === 'pending'
                                                        ? 'calc(100% + 4px)'
                                                        : 'calc(200% + 4px)',
                                            }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                        <button
                                            onClick={() => handleTabChange('approved')}
                                            className={`relative z-10 flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'approved'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                {approvedCount}
                                            </span>
                                            <span>Approved</span>
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('pending')}
                                            className={`relative z-10 flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'pending'
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                {pendingCount}
                                            </span>
                                            <span>Pending</span>
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('completed')}
                                            className={`relative z-10 flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'completed'
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                {completedCount}
                                            </span>
                                            <span>Completed</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto min-h-0 bg-rose-50 dark:bg-gray-900">
                                {/* Inner wrapper for layout animation */}
                                <motion.div
                                    layout
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    className="p-6 pb-20" // Extra padding at bottom for content
                                >
                                    <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
                                        <motion.div
                                            key={activeTab}
                                            custom={slideDirection}
                                            initial={{ opacity: 0, x: -slideDirection * 100 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: slideDirection * 100 }}
                                            transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
                                            className="space-y-3"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center py-12">
                                                    <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                                                </div>
                                            ) : filteredFantasies.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
                                                        {activeTab === 'pending' ? 'lightbulb' : activeTab === 'approved' ? 'check_circle' : 'task_alt'}
                                                    </span>
                                                    <p className="text-gray-500">
                                                        {activeTab === 'pending'
                                                            ? 'No pending fantasies'
                                                            : activeTab === 'approved'
                                                                ? 'No approved fantasies yet'
                                                                : 'No completed fantasies yet'}
                                                    </p>
                                                    {activeTab === 'pending' && (
                                                        <p className="text-gray-400 text-sm">Request one below!</p>
                                                    )}
                                                </div>
                                            ) : (
                                                filteredFantasies.map((fantasy, index) => (
                                                    <motion.button
                                                        key={fantasy.id}
                                                        initial={index === 0 && fantasy.id.startsWith('temp-') ? { opacity: 0, y: -20 } : false}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        onClick={() => setSelectedFantasy(fantasy)}
                                                        className={`w-full text-left p-4 rounded-2xl transition-all shadow-sm ${fantasy.status === 'approved'
                                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                                                            : fantasy.status === 'completed'
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                                                                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="text-gray-800 dark:text-gray-200 line-clamp-2 font-medium">
                                                                    {fantasy.fantasy_text}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {fantasy.status === 'approved' || fantasy.status === 'completed' ? 'Suggested by' : 'Requested by'} {fantasy.requester_name}
                                                                </p>
                                                            </div>
                                                            <span className="material-symbols-outlined text-lg text-gray-300">
                                                                arrow_forward_ios
                                                            </span>
                                                        </div>
                                                    </motion.button>
                                                ))
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>
                            </div>

                            {/* Floating Footer Input */}
                            <div className="p-4 pt-0 pb-8 bg-transparent shrink-0 safe-area-bottom">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg border border-gray-100 dark:border-gray-700">
                                    <form onSubmit={handleSubmit} className="flex gap-2">
                                        <Input
                                            ref={inputRef}
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Describe your fantasy..."
                                            className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 focus:border-rose-400 focus:ring-rose-400"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={!inputText.trim() || isSending}
                                            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 whitespace-nowrap shadow-md shadow-rose-500/20"
                                        >
                                            {isSending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-lg mr-1">send</span>
                                                    Request
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <FantasyDetailModal
                fantasy={selectedFantasy}
                isOpen={!!selectedFantasy}
                onClose={() => setSelectedFantasy(null)}
                onApprove={approveFantasy}
                onVeto={vetoFantasy}
                onDelete={deleteFantasy}
                onComplete={completeFantasy}
                isRequester={isRequester}
            />
        </>
    );
}

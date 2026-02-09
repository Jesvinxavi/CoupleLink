// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgradeSuccess: () => void;
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function PaywallModal({ isOpen, onClose, onUpgradeSuccess }: PaywallModalProps) {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // Mock RPC call
            const { error } = await supabase.rpc('upgrade_to_premium');
            if (error) throw error;

            onUpgradeSuccess();
            // Don't close immediately, let the parent handle it or user see success? 
            // Logic: Upgrade success, close paywall, parent might auto-trigger restore or user clicks restore again.
            onClose();
        } catch (err) {
            logger.error('PaywallModal', 'Upgrade failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 border-none text-white p-0 overflow-hidden gap-0">
                <div className="p-6 pb-0">
                    <DialogHeader className="space-y-4 items-center">
                        <div className="bg-white/10 p-4 rounded-full w-fit mb-2 animate-pulse">
                            <Lock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-center text-white">
                            Unlock CoupleLink Plus
                        </DialogTitle>
                        <DialogDescription className="text-center text-indigo-100 max-w-[280px]">
                            Restore your shared history and keep your memories alive.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-6">
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="bg-green-500/20 p-2 rounded-full ring-1 ring-green-500/50">
                                <Check className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="font-medium text-white text-sm">Restore unlimited Photos, Journals & Memories</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="bg-green-500/20 p-2 rounded-full ring-1 ring-green-500/50">
                                <Check className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="font-medium text-white text-sm">Access AI Love Coach</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="bg-green-500/20 p-2 rounded-full ring-1 ring-green-500/50">
                                <Check className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="font-medium text-white text-sm">Unlock Pleasure Coupons & Collections</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="bg-green-500/20 p-2 rounded-full ring-1 ring-green-500/50">
                                <Check className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="font-medium text-white text-sm">Access Expanded Questions & Challenges</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-3 sm:gap-0 bg-black/20 p-6 pt-4">
                    <Button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold h-12 text-lg border-0 shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? "Processing..." : "Unlock Now for $4.99"}
                    </Button>
                    <p className="text-xs text-center text-indigo-300/60 mt-2 font-medium">
                        One-time payment • Lifetime access • Secure processing
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

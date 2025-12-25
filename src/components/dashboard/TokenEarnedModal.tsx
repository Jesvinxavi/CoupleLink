import { useEffect } from "react";
import { Dialog, DialogContent } from "../ui/dialog";

interface TokenEarnedModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TokenEarnedModal({ isOpen, onClose }: TokenEarnedModalProps) {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                overlayClassName="!z-[100]"
                className="!z-[100] sm:max-w-sm rounded-3xl border-none bg-transparent shadow-none p-0 flex flex-col items-center justify-center"
            >
                <div className="relative flex flex-col items-center animate-in zoom-in duration-300">
                    {/* Spinning Coin Container */}
                    <div className="relative h-32 w-32 mb-8 animate-[spin_3s_linear_infinite]">
                        <div className="absolute inset-0 rounded-full bg-yellow-400 border-4 border-yellow-500 shadow-lg flex items-center justify-center">
                            <div className="h-24 w-24 rounded-full border-2 border-yellow-300 flex items-center justify-center bg-yellow-400">
                                <span className="material-symbols-outlined text-5xl text-white drop-shadow-md">
                                    umbrella
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-4 duration-500 delay-150">
                        <p className="font-bold text-heading-dark text-lg text-center">
                            You've earned a Rain Check!
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Clock, ChevronRight, ChevronLeft, CheckSquare, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { DateIdeaItem } from "@/types/datenight"

// ═══════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════
function InteractiveChecklist({ items }: { items: string[] }) {
    const [checkedState, setCheckedState] = useState<{ [key: number]: boolean }>({})

    const toggleItem = (index: number) => {
        setCheckedState(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    return (
        <ul className="space-y-2">
            {items.map((checkItem, idx) => (
                <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                    onClick={() => toggleItem(idx)}
                >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checkedState[idx] ? "bg-rose-500 border-rose-500" : "border-gray-400 bg-white dark:bg-gray-700"}`}>
                        {checkedState[idx] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={checkedState[idx] ? "line-through text-gray-400" : ""}>{checkItem}</span>
                </li>
            ))}
        </ul>
    )
}

interface DateIdeaModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    items: DateIdeaItem[]
    onEdit?: (item: DateIdeaItem) => void
    showNavigation?: boolean
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function DateIdeaModal({ isOpen, onClose, title, description, items, onEdit, showNavigation = true }: DateIdeaModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    const nextCard = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length)
    }

    const prevCard = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-none w-screen h-screen p-0 bg-transparent border-none flex flex-col items-center justify-center shadow-none"
                overlayClassName="bg-black/10 backdrop-blur-sm"
                hideClose={true}
            >
                <div className="sr-only">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description || "Explore date night options"}</DialogDescription>
                </div>

                <div className="fixed top-16 right-6 z-50 flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md w-10 h-10"
                    >
                        <X className="w-6 h-6" strokeWidth={3} />
                    </Button>
                </div>

                <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 w-full">
                    <div className="relative w-full max-w-[300px] aspect-[9/16] max-h-[70vh]">
                        <AnimatePresence mode="popLayout">
                            {items.map((item, index) => {
                                // Calculate offset for stacked effect
                                const offset = (index - currentIndex + items.length) % items.length;
                                const isCurrent = offset === 0;
                                const isNext = offset === 1;
                                const isPrev = offset === items.length - 1;

                                // Only render current, next, and previous for performance/visuals
                                if (!isCurrent && !isNext && !isPrev && items.length > 2) return null;

                                let zIndex = 0;
                                let scale = 0.9;
                                let x = 0;
                                let opacity = 0;
                                let rotate = 0;

                                if (isCurrent) {
                                    zIndex = 10
                                    scale = 1
                                    opacity = 1
                                } else if (isNext) {
                                    zIndex = 5
                                    scale = 0.95
                                    x = 20
                                    rotate = 5
                                    opacity = 0.5
                                } else if (isPrev) {
                                    zIndex = 5
                                    scale = 0.95
                                    x = -20
                                    rotate = -5
                                    opacity = 0.5
                                }

                                return (
                                    <motion.div
                                        key={item.title + index}
                                        className="absolute inset-0 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{
                                            opacity,
                                            scale,
                                            x: isCurrent ? 0 : x,
                                            rotate: isCurrent ? 0 : rotate,
                                            zIndex
                                        }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        drag={isCurrent ? "x" : false}
                                        dragConstraints={{ left: 0, right: 0 }}
                                        onDragEnd={(_, { offset }) => {
                                            const swipe = offset.x;

                                            if (swipe < -100) {
                                                nextCard()
                                            } else if (swipe > 100) {
                                                prevCard()
                                            }
                                        }}
                                    >
                                        <div className="h-[40%] relative shrink-0">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.cost && (
                                                        <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-medium">
                                                            {item.cost}
                                                        </span>
                                                    )}
                                                    {item.duration && (
                                                        <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-medium">
                                                            <Clock className="w-3 h-3" />
                                                            {item.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.title}</h3>
                                                {onEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            onClose()
                                                            onEdit(item)
                                                        }}
                                                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 shrink-0"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {item.description}
                                                </p>

                                                {item.checklist && item.checklist.length > 0 && (
                                                    <div className="mt-4">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                            <CheckSquare className="w-4 h-4" />
                                                            Checklist
                                                        </h4>
                                                        <InteractiveChecklist items={item.checklist} />
                                                    </div>
                                                )}
                                            </div>

                                            {item.link && (
                                                <Button
                                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white gap-2 mt-6 h-10 text-sm shrink-0"
                                                    onClick={() => window.open(item.link, "_blank")}
                                                >
                                                    {item.buttonText || "Explore Inside"}
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>

                        {/* Navigation Arrows */}
                        {showNavigation && items.length > 1 && (
                            <>
                                <button
                                    onClick={prevCard}
                                    className="absolute left-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-colors z-20"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextCard}
                                    className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-colors z-20"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}

// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect, memo } from "react"
import { PenLine, StickyNote } from "lucide-react"
import { useJournalModals } from "@/context/JournalModalContext"
import { PostNoteOverlay } from "@/components/dashboard/PostNoteOverlay"

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const JOURNAL_PROMPTS = [
    "how you're feeling",
    "a happy memory",
    "something you're grateful for",
    "your dreams",
    "what you love about them",
    "your day today"
]

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface QuickActionsTileProps {
    onFocusChange?: (isFocused: boolean) => void
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export const QuickActionsTile = memo(function QuickActionsTile({ onFocusChange }: QuickActionsTileProps) {
    // const navigate = useNavigate(); // Removed unused
    const { openNewPost } = useJournalModals()
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
    const [prompt, setPrompt] = useState(JOURNAL_PROMPTS[0])

    useEffect(() => {
        // Rotate prompt every time component mounts or randomly
        const randomPrompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrompt(randomPrompt)
    }, [])

    const handleJournalClick = () => {
        openNewPost()
    }

    return (
        <>
            <div className="rounded-2xl bg-white p-4 shadow-sm h-full flex gap-3">
                {/* Journal Button (50% width) */}
                <button
                    onClick={handleJournalClick}
                    className="flex-1 bg-rose-50 md:hover:bg-rose-100 active:bg-rose-100 rounded-xl p-4 flex flex-col justify-between text-left transition-colors group relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-rose-500 md:group-hover:scale-110 group-active:scale-110 transition-transform">
                                <PenLine className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-bold text-heading-dark md:group-hover:text-rose-700 group-active:text-rose-700 transition-colors">Journal</h3>
                        </div>
                        <p className="text-xs text-gray-500 md:group-hover:text-rose-600/80 group-active:text-rose-600/80 transition-colors line-clamp-2 text-center">
                            Write about <span className="font-medium">{prompt}</span>...
                        </p>
                    </div>

                    {/* Decorative background element */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-200/30 rounded-full blur-2xl md:group-hover:bg-rose-200/50 group-active:bg-rose-200/50 transition-colors" />
                </button>

                {/* Post Note Button (50% width) */}
                <button
                    onClick={() => setIsNoteModalOpen(true)}
                    className="flex-1 bg-yellow-50 md:hover:bg-yellow-100 active:bg-yellow-100 rounded-xl p-4 flex flex-col justify-between text-left transition-colors group relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-yellow-600 md:group-hover:scale-110 group-active:scale-110 transition-transform">
                                <StickyNote className="w-4 h-4" />
                            </div>
                            <h3 className="text-lg font-bold text-heading-dark md:group-hover:text-yellow-800 group-active:text-yellow-800 transition-colors">Post Note</h3>
                        </div>
                        <p className="text-xs text-gray-500 md:group-hover:text-yellow-700/80 group-active:text-yellow-700/80 transition-colors text-center">
                            Leave a sticky
                        </p>
                    </div>

                    {/* Decorative background element */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-200/30 rounded-full blur-xl md:group-hover:bg-yellow-200/50 group-active:bg-yellow-200/50 transition-colors" />
                </button>
            </div>

            <PostNoteOverlay
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onFocusChange={onFocusChange}
            />
        </>
    )
})

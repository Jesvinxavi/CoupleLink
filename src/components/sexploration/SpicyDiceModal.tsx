// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles } from "lucide-react"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface SpicyDiceModalProps {
    isOpen: boolean
    onClose: () => void
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const ACTIONS = ["Kiss", "Massage", "Tease", "Nibble", "Lick", "Caress"]
const BODY_PARTS = ["Neck", "Inner Thigh", "Ear", "Lips", "Chest", "Back"]

// Corrected face rotations - maps array index to the rotation needed to show that face
// Face positions on dice cube:
// Index 0: Front face   → rotateX(0) rotateY(0)
// Index 1: Back face    → rotateY(180)
// Index 2: Left face    → rotateY(90) - rotate cube RIGHT to see left face
// Index 3: Right face   → rotateY(-90) - rotate cube LEFT to see right face
// Index 4: Bottom face  → rotateX(90) - tilt cube UP to see bottom face
// Index 5: Top face     → rotateX(-90) - tilt cube DOWN to see top face
const FACE_ROTATIONS = [
    { x: 0, y: 0 },       // Front (index 0)
    { x: 0, y: 180 },     // Back (index 1)
    { x: 0, y: 90 },      // Left (index 2)
    { x: 0, y: -90 },     // Right (index 3)
    { x: -90, y: 0 },     // Bottom (index 4) - Fixed: rotateX(-90) brings bottom to front
    { x: 90, y: 0 }       // Top (index 5) - Fixed: rotateX(90) brings top to front
]

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function SpicyDiceModal({ isOpen, onClose }: SpicyDiceModalProps) {
    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [isRolling, setIsRolling] = useState(false)
    const [result, setResult] = useState<{ action: string; bodyPart: string } | null>(null)
    const [showResult, setShowResult] = useState(false)

    // ═══════════════════════════════════════
    // REFS
    // ═══════════════════════════════════════
    const actionDiceRef = useRef<HTMLDivElement>(null)
    const bodyDiceRef = useRef<HTMLDivElement>(null)
    const rollTimeoutRef = useRef<number | null>(null)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResult(null)
            setIsRolling(false)
            setShowResult(false)
        }

        return () => {
            if (rollTimeoutRef.current) {
                window.clearTimeout(rollTimeoutRef.current)
                rollTimeoutRef.current = null
            }
        }
    }, [isOpen])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleRoll = useCallback(() => {
        if (isRolling) return

        setIsRolling(true)
        setResult(null)
        setShowResult(false)

        // Haptic feedback for start
        if (navigator.vibrate) navigator.vibrate(50)

        // Pick random results
        const actionIndex = Math.floor(Math.random() * ACTIONS.length)
        const bodyIndex = Math.floor(Math.random() * BODY_PARTS.length)

        const actionRot = FACE_ROTATIONS[actionIndex]
        const bodyRot = FACE_ROTATIONS[bodyIndex]

        // Add extra full rotations for dramatic effect (4-6 full spins)
        const extraSpins = 4 + Math.floor(Math.random() * 3)
        const extraX = extraSpins * 360
        const extraY = extraSpins * 360

        // Different spin directions for variety
        const directionX = Math.random() > 0.5 ? 1 : -1
        const directionY = Math.random() > 0.5 ? 1 : -1

        if (actionDiceRef.current) {
            actionDiceRef.current.style.transition = "transform 2.5s cubic-bezier(0.15, 0.8, 0.2, 1)"
            actionDiceRef.current.style.transform = `rotateX(${actionRot.x + extraX * directionX}deg) rotateY(${actionRot.y + extraY * directionY}deg)`
        }
        if (bodyDiceRef.current) {
            bodyDiceRef.current.style.transition = "transform 2.5s cubic-bezier(0.15, 0.8, 0.2, 1)"
            bodyDiceRef.current.style.transform = `rotateX(${bodyRot.x + extraX * -directionX}deg) rotateY(${bodyRot.y + extraY * -directionY}deg)`
        }

        if (rollTimeoutRef.current) {
            window.clearTimeout(rollTimeoutRef.current)
        }

        rollTimeoutRef.current = window.setTimeout(() => {
            setResult({
                action: ACTIONS[actionIndex],
                bodyPart: BODY_PARTS[bodyIndex]
            })
            setIsRolling(false)
            setShowResult(true)

            // Success haptic
            if (navigator.vibrate) navigator.vibrate([50, 30, 80])
        }, 2500)
    }, [isRolling])

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                hideClose={true}
                className="max-w-md rounded-3xl border-0 p-0 overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
                }}
            >
                {/* Ambient glow effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
                </div>

                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition-colors z-50"
                >
                    <X className="w-5 h-5 text-white/70" />
                </button>

                <DialogHeader className="p-6 pb-2 relative z-10">
                    <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-rose-400" />
                        <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300 bg-clip-text text-transparent">
                            Spicy Dice
                        </span>
                        <Sparkles className="w-5 h-5 text-pink-400" />
                    </DialogTitle>
                    <p className="text-center text-white/50 text-sm mt-1">Roll to reveal your challenge</p>
                </DialogHeader>

                <div className="flex flex-col items-center px-6 pb-6 pt-4 min-h-[380px] relative">
                    {/* Rolling Surface */}
                    <div className="relative w-full flex justify-center items-center py-8">
                        {/* Felt table surface effect */}
                        <div
                            className="absolute inset-x-4 h-44 rounded-2xl"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(139, 69, 89, 0.3) 0%, rgba(30, 20, 30, 0.6) 70%, transparent 100%)',
                                boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.5)'
                            }}
                        />

                        {/* Dice Container */}
                        <div className="flex gap-12 relative z-10" style={{ perspective: '800px' }}>
                            {/* Action Dice */}
                            <div className="dice-scene">
                                <div
                                    className="dice-cube"
                                    ref={actionDiceRef}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <DiceFace3D
                                        content={ACTIONS[0]}
                                        position="front"
                                        variant="action"
                                    />
                                    <DiceFace3D
                                        content={ACTIONS[1]}
                                        position="back"
                                        variant="action"
                                    />
                                    <DiceFace3D
                                        content={ACTIONS[2]}
                                        position="left"
                                        variant="action"
                                    />
                                    <DiceFace3D
                                        content={ACTIONS[3]}
                                        position="right"
                                        variant="action"
                                    />
                                    <DiceFace3D
                                        content={ACTIONS[4]}
                                        position="bottom"
                                        variant="action"
                                    />
                                    <DiceFace3D
                                        content={ACTIONS[5]}
                                        position="top"
                                        variant="action"
                                    />
                                </div>
                            </div>

                            {/* Body Part Dice */}
                            <div className="dice-scene">
                                <div
                                    className="dice-cube"
                                    ref={bodyDiceRef}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <DiceFace3D
                                        content={BODY_PARTS[0]}
                                        position="front"
                                        variant="body"
                                    />
                                    <DiceFace3D
                                        content={BODY_PARTS[1]}
                                        position="back"
                                        variant="body"
                                    />
                                    <DiceFace3D
                                        content={BODY_PARTS[2]}
                                        position="left"
                                        variant="body"
                                    />
                                    <DiceFace3D
                                        content={BODY_PARTS[3]}
                                        position="right"
                                        variant="body"
                                    />
                                    <DiceFace3D
                                        content={BODY_PARTS[4]}
                                        position="bottom"
                                        variant="body"
                                    />
                                    <DiceFace3D
                                        content={BODY_PARTS[5]}
                                        position="top"
                                        variant="body"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dice shadows on surface */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-12 pointer-events-none">
                            <div
                                className="w-16 h-4 rounded-full opacity-40"
                                style={{
                                    background: 'radial-gradient(ellipse, rgba(0,0,0,0.8) 0%, transparent 70%)',
                                    filter: 'blur(4px)'
                                }}
                            />
                            <div
                                className="w-16 h-4 rounded-full opacity-40"
                                style={{
                                    background: 'radial-gradient(ellipse, rgba(0,0,0,0.8) 0%, transparent 70%)',
                                    filter: 'blur(4px)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Result Display */}
                    <AnimatePresence>
                        {showResult && result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                className="w-full mb-4"
                            >
                                <div
                                    className="relative overflow-hidden rounded-2xl p-4 text-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                                        border: '1px solid rgba(244, 63, 94, 0.3)',
                                        boxShadow: '0 4px 24px rgba(244, 63, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5" />
                                    <p className="relative text-xs uppercase tracking-widest text-rose-300/70 mb-1 font-medium">
                                        Your Challenge
                                    </p>
                                    <p className="relative text-xl font-bold text-white">
                                        <span className="text-rose-400">{result.action}</span>
                                        <span className="text-white/60 mx-2">the</span>
                                        <span className="text-pink-400">{result.bodyPart}</span>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Roll Button */}
                    <motion.div
                        className="w-full mt-auto"
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={handleRoll}
                            disabled={isRolling}
                            className="w-full py-6 text-lg font-bold rounded-2xl text-white shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                            style={{
                                background: isRolling
                                    ? 'linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%)'
                                    : 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #f43f5e 100%)',
                                boxShadow: isRolling
                                    ? 'none'
                                    : '0 8px 32px rgba(244, 63, 94, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                            }}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isRolling ? (
                                    <>
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                            className="inline-block"
                                        >
                                            🎲
                                        </motion.span>
                                        Rolling...
                                    </>
                                ) : result ? (
                                    'Roll Again'
                                ) : (
                                    <>
                                        <span>🎲</span>
                                        Roll the Dice
                                    </>
                                )}
                            </span>
                            {!isRolling && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            )}
                        </Button>
                    </motion.div>
                </div>

                <style>{`
                    .dice-scene {
                        width: 80px;
                        height: 80px;
                        perspective: 800px;
                    }
                    
                    .dice-cube {
                        width: 100%;
                        height: 100%;
                        position: relative;
                        transform-style: preserve-3d;
                        transform: rotateX(-15deg) rotateY(15deg);
                        transition: transform 0.1s ease-out;
                    }
                    
                    .dice-face {
                        position: absolute;
                        width: 80px;
                        height: 80px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        font-weight: 700;
                        border-radius: 12px;
                        backface-visibility: hidden;
                        -webkit-backface-visibility: hidden;
                    }
                    
                    /* Action dice - Premium white with rose accents */
                    .dice-face-action {
                        background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%);
                        color: #e11d48;
                        border: 2px solid rgba(225, 29, 72, 0.2);
                        box-shadow: 
                            inset 0 2px 4px rgba(255,255,255,1),
                            inset 0 -2px 4px rgba(0,0,0,0.05),
                            0 4px 8px rgba(0,0,0,0.3);
                        text-shadow: 0 1px 2px rgba(225, 29, 72, 0.2);
                    }
                    
                    /* Body dice - Premium rose with depth */
                    .dice-face-body {
                        background: linear-gradient(145deg, #f43f5e 0%, #e11d48 50%, #be123c 100%);
                        color: #ffffff;
                        border: 2px solid rgba(255,255,255,0.2);
                        box-shadow: 
                            inset 0 2px 4px rgba(255,255,255,0.3),
                            inset 0 -2px 4px rgba(0,0,0,0.2),
                            0 4px 8px rgba(0,0,0,0.3);
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    }
                    
                    /* Face positions */
                    .dice-face-front {
                        transform: translateZ(40px);
                    }
                    
                    .dice-face-back {
                        transform: rotateY(180deg) translateZ(40px);
                    }
                    
                    .dice-face-left {
                        transform: rotateY(-90deg) translateZ(40px);
                    }
                    
                    .dice-face-right {
                        transform: rotateY(90deg) translateZ(40px);
                    }
                    
                    .dice-face-top {
                        transform: rotateX(-90deg) translateZ(40px);
                    }
                    
                    .dice-face-bottom {
                        transform: rotateX(90deg) translateZ(40px);
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}

interface DiceFace3DProps {
    content: string;
    position: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
    variant: 'action' | 'body';
}

function DiceFace3D({ content, position, variant }: DiceFace3DProps) {
    return (
        <div className={`dice-face dice-face-${variant} dice-face-${position}`}>
            <span className="px-1 text-center leading-tight">{content}</span>
        </div>
    );
}

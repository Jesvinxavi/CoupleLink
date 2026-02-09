// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { memo, useEffect, useState } from "react"
import { Gift, Clock, CheckCircle } from "lucide-react"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface CouponProps {
    title: string
    description: string | null
    isRedeemed?: boolean
    activatedAt?: string
    expiresAt?: string
    isGift?: boolean
    onActivate?: () => void
    onRedeem?: () => void
    onViewGift?: () => void
    onConvert?: () => void
    isPreview?: boolean // New prop for preview mode
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
const Coupon = memo(function Coupon({
    title,
    description,
    isRedeemed,
    activatedAt,
    expiresAt,
    isGift,
    onActivate,
    onViewGift: _onViewGift,
    onConvert,
    isPreview = false
}: CouponProps) {
    // Note: _onViewGift is received but not currently used in this design
    const [timeLeft, setTimeLeft] = useState<string | null>(null)

    useEffect(() => {
        if (!expiresAt || isRedeemed || isPreview) return

        const calculateTimeLeft = () => {
            const now = new Date().getTime()
            const expiration = new Date(expiresAt).getTime()
            const difference = expiration - now

            if (difference <= 0) {
                return "Expired"
            } else {
                const hours = Math.floor(difference / (1000 * 60 * 60))
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                return `${hours}h ${minutes}m`
            }
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined

        const tick = () => {
            const result = calculateTimeLeft()
            setTimeLeft(result)
            if (result === "Expired") return
            timeoutId = setTimeout(tick, 60000) // Update every minute
        }

        tick()

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }
    }, [expiresAt, isRedeemed, isPreview])

    // Ticket Style - Straight top/bottom, serrated sides with large center notch + smaller scallops
    // Square corners as per reference image

    const isActivated = !!activatedAt && !isRedeemed
    const isExpired = timeLeft === "Expired"

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <div className={`relative transition-all duration-200 group
            ${isRedeemed ? 'opacity-60 grayscale' : 'hover:scale-[1.02]'}
            ${isPreview ? 'pointer-events-none select-none' : ''}
        `}>
            {/* The Main Ticket Container (Masked) */}
            <div
                className={`
                    relative w-full h-[180px] flex flex-col items-center justify-center
                    ${isRedeemed
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-pink-200'
                    }
                `}
                style={{
                    // Ticket shape: straight top/bottom, serrated sides with semicircle cutouts
                    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180' preserveAspectRatio='none'%3E%3Cpath fill='white' fill-rule='evenodd' d='M0,0 L300,0 L300,180 L0,180 Z M0,30 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,58 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,108 a18,18 0 0,0 0,-36 a18,18 0 0,0 0,36 M0,136 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,164 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M300,30 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,58 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,108 a18,18 0 0,1 0,-36 a18,18 0 0,1 0,36 M300,136 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,164 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16'/%3E%3C/svg%3E")`,
                    maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180' preserveAspectRatio='none'%3E%3Cpath fill='white' fill-rule='evenodd' d='M0,0 L300,0 L300,180 L0,180 Z M0,30 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,58 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,108 a18,18 0 0,0 0,-36 a18,18 0 0,0 0,36 M0,136 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,164 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M300,30 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,58 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,108 a18,18 0 0,1 0,-36 a18,18 0 0,1 0,36 M300,136 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,164 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16'/%3E%3C/svg%3E")`,
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                    borderRadius: '0px'
                }}
            >
                {/* Layer 1 (z-10): Header Banner Background */}
                <div className={`
                    absolute top-3 left-7 right-7 z-10
                    h-[30px] border-b
                    ${isRedeemed ? 'bg-gray-200 border-gray-400' : 'bg-pink-100 border-red-600'}
                `} />

                {/* Layer 2 (z-20): Inner Red Box Outline */}
                <div className={`
                    absolute top-3 bottom-3 left-7 right-7 z-20
                    border border-red-600
                    ${isRedeemed ? 'border-gray-400 opacity-50' : ''}
                `} />

                {/* Layer 3 (z-30): Scattered Hearts - fewer but larger, faint pink */}
                {!isRedeemed && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
                        {/* Heart 1 - large, tilted left */}
                        <svg className="absolute w-12 h-12 text-pink-300" style={{ top: '10%', left: '8%', transform: 'rotate(-15deg)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {/* Heart 2 - large, tilted right */}
                        <svg className="absolute w-10 h-10 text-pink-300" style={{ top: '5%', right: '12%', transform: 'rotate(18deg)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {/* Heart 3 - large, bottom left */}
                        <svg className="absolute w-11 h-11 text-pink-300" style={{ top: '55%', left: '5%', transform: 'rotate(12deg)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {/* Heart 4 - large, bottom right */}
                        <svg className="absolute w-10 h-10 text-pink-300" style={{ top: '58%', right: '8%', transform: 'rotate(-20deg)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {/* Heart 5 - medium, right side middle */}
                        <svg className="absolute w-8 h-8 text-pink-300" style={{ top: '30%', right: '5%', transform: 'rotate(25deg)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {/* Heart 6 - bottom, slightly left of center */}
                        <svg className="absolute w-9 h-9 text-pink-300" style={{ top: '82%', left: '38%', transform: 'rotate(-10deg)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                )}

                {/* Layer 4 (z-40): All Text Content */}
                <div className={`
                    absolute top-3 ${isActivated ? 'bottom-3' : 'bottom-3'} left-7 right-7 z-40
                    flex flex-col overflow-hidden text-center
                    ${isRedeemed ? 'opacity-50' : ''}
                `}>
                    {/* Header Banner Text */}
                    <div className={`w-full py-1.5 flex items-center justify-center font-normal tracking-[0.25em] uppercase text-base
                        ${isRedeemed ? 'text-gray-400' : 'text-[#FF1744]'}
                    `}>
                        Pleasure Coupon
                    </div>

                    {/* Main Body */}
                    <div className="flex-1 px-3 pt-3 flex flex-col items-center justify-start gap-3">

                        <h3
                            className={`text-[1.6rem] leading-tight ${isRedeemed ? 'text-gray-400 line-through' : 'text-[#FF1744]'}`}
                            style={{ fontFamily: "'Shrikhand', cursive" }}
                        >
                            {title || "COUPON"}
                        </h3>

                        <p className={`text-[10px] leading-relaxed font-bold uppercase tracking-wide line-clamp-2 px-2 ${isRedeemed ? 'text-gray-400' : 'text-[#FF1744]'}`}>
                            {description || "VALID FOR ONE SPECIAL REQUEST"}
                        </p>
                    </div>

                    {/* Footer - only show when not activated and not in preview mode */}
                    {!isPreview && !isActivated && !isRedeemed && (
                        <div className="p-2 w-full border-t border-red-600 flex flex-col gap-1">
                            <div className="flex items-center justify-center">
                                {onConvert ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onConvert(); }}
                                        className="w-full flex justify-center items-center gap-1 bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-red-300"
                                    >
                                        Convert
                                    </button>
                                ) : (
                                    <button
                                        onClick={onActivate}
                                        disabled={isExpired}
                                        className="w-full bg-red-600 text-white hover:bg-red-700 text-xs font-black py-1 px-3 rounded uppercase tracking-wider transition-all shadow-md"
                                    >
                                        Activate
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Redeemed state */}
                    {!isPreview && isRedeemed && (
                        <div className="p-2 w-full border-t border-gray-400 flex items-center justify-center gap-1 text-gray-400 text-xs font-bold uppercase">
                            <CheckCircle className="w-3 h-3" />
                            Redeemed
                        </div>
                    )}
                </div>

                {/* Centered Timer Badge - positioned at bottom center, overlapping the red border */}
                {isActivated && timeLeft && !isPreview && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-1/4 z-50">
                        <div className="flex items-center gap-1.5 bg-pink-100 border border-red-600 text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeLeft}</span>
                        </div>
                    </div>
                )}

                {/* Gift Tag Badge (Floating) */}
                {isGift && !isRedeemed && (
                    <div className="absolute top-1 right-5 text-red-600 z-20">
                        <Gift className="w-4 h-4" />
                    </div>
                )}
            </div>
        </div>
    )
})

export { Coupon }

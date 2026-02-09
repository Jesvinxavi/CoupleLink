// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { memo, type ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface GameCardProps {
    title: string
    description: string
    icon: ReactNode
    color: string
    href: string
    locked?: boolean
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
const GameCard = memo(function GameCard({ title, description, icon, color, href, locked = false }: GameCardProps) {
    const Content = (
        <Card className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all group cursor-pointer ${locked ? "opacity-70" : ""}`}>
            <CardContent className="p-0">
                <div className={`h-24 ${color} flex items-center justify-center`}>
                    <div className="text-white transform group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                </div>
                <div className="p-5 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
                        {locked && <span className="material-symbols-outlined text-gray-400 text-sm">lock</span>}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                        {description}
                    </p>
                    <div className="flex items-center text-xs font-medium text-gray-900 dark:text-white group-hover:translate-x-1 transition-transform">
                        {locked ? "Unlock to Play" : "Play Now"}
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (locked) return Content

    return (
        <Link to={href} className="block">
            {Content}
        </Link>
    )
})

export { GameCard }
